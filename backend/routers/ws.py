"""
routers/ws.py — WebSocket endpoint: /ws/{lecture_id}

One persistent WebSocket per lecture session.

Message flow:
  Frontend → Backend:
    - Binary frames  : raw audio chunks → forwarded to Smallest.ai
    - JSON { type: "deep_research", selected_text, context }
    - JSON { type: "pause" }
    - JSON { type: "resume" }
    - JSON { type: "end_session" }

  Backend → Frontend:
    - transcript_interim
    - transcript_final
    - new_card
    - deep_research_start / deep_research_result
    - new_takeaway
    - summary_update
    - topic_update
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import AsyncSessionLocal
from models.lecture import Card, Lecture, Takeaway
from services.cache import drop_session_cache, get_session_cache
from services.smallest_service import close_session, get_or_create_session
from services.extractor import (
    analyze_utterance,
    generate_summary,
)
from services.gemini_info_service import auto_define_batch, deep_research

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

SUMMARY_INTERVAL_SECONDS = 60


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# DB helpers (use a fresh session per operation to avoid thread conflicts)
# ---------------------------------------------------------------------------

async def _save_card(
    lecture_id: str,
    card_type: str,
    term: str,
    content: str,
    citations: list,
    badge_type: str,
    timestamp_seconds: int,
) -> dict:
    async with AsyncSessionLocal() as db:
        card = Card(
            id=str(uuid.uuid4()),
            lecture_id=lecture_id,
            type=card_type,
            term=term,
            content=content,
            citations=citations,
            badge_type=badge_type,
            lecture_timestamp_seconds=timestamp_seconds,
            created_at=_now(),
        )
        db.add(card)
        await db.commit()
        await db.refresh(card)
        return {
            "id": card.id,
            "lecture_id": card.lecture_id,
            "type": card.type,
            "term": card.term,
            "content": card.content,
            "citations": card.citations or [],
            "badge_type": card.badge_type,
            "lecture_timestamp_seconds": card.lecture_timestamp_seconds,
            "created_at": card.created_at.isoformat(),
        }



async def _save_takeaway(lecture_id: str, text: str, timestamp_seconds: int) -> dict:
    async with AsyncSessionLocal() as db:
        takeaway = Takeaway(
            id=str(uuid.uuid4()),
            lecture_id=lecture_id,
            text=text,
            lecture_timestamp_seconds=timestamp_seconds,
            created_at=_now(),
        )
        db.add(takeaway)
        await db.commit()
        await db.refresh(takeaway)
        return {
            "id": takeaway.id,
            "lecture_id": takeaway.lecture_id,
            "text": takeaway.text,
            "lecture_timestamp_seconds": takeaway.lecture_timestamp_seconds,
            "created_at": takeaway.created_at.isoformat(),
        }


async def _save_transcript_chunk(lecture_id: str, transcript: str) -> None:
    """Update the running transcript in the DB."""
    async with AsyncSessionLocal() as db:
        from sqlalchemy import update
        await db.execute(
            update(Lecture)
            .where(Lecture.id == lecture_id)
            .values(transcript=transcript, updated_at=_now())
        )
        await db.commit()


async def _update_lecture_summary(lecture_id: str, summary: str) -> None:
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select, update

        await db.execute(
            update(Lecture)
            .where(Lecture.id == lecture_id)
            .values(summary=summary, updated_at=_now())
        )
        await db.commit()


async def _finalize_lecture(lecture_id: str, duration_seconds: int, summary: Optional[str], transcript: Optional[str]) -> None:
    async with AsyncSessionLocal() as db:
        from sqlalchemy import update

        values: dict = {
            "status": "completed",
            "duration_seconds": duration_seconds,
            "updated_at": _now()
        }
        if summary:
            values["summary"] = summary
        if transcript:
            values["transcript"] = transcript
            
        await db.execute(update(Lecture).where(Lecture.id == lecture_id).values(**values))
        await db.commit()


# ---------------------------------------------------------------------------
# WebSocket handler
# ---------------------------------------------------------------------------

@router.websocket("/ws/{lecture_id}")
async def websocket_endpoint(websocket: WebSocket, lecture_id: str):
    await websocket.accept()
    logger.info("[%s] WebSocket connected", lecture_id)

    loop = asyncio.get_event_loop()
    stt_session = get_or_create_session(lecture_id, loop)
    term_cache = get_session_cache(lecture_id)

    last_summary_time = time.time()
    session_active = True
    deep_research_cache: set[str] = set()  # track already-researched topics
    last_deep_research_time = 0.0

    async def send_json(payload: dict) -> None:
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Background task: drain interim queue → send to frontend
    # ------------------------------------------------------------------
    async def drain_interim():
        while session_active:
            try:
                item = await asyncio.wait_for(stt_session.interim_queue.get(), timeout=0.5)
                text, speaker, timestamp_seconds, is_final = item
                if is_final:
                    await send_json({
                        "type": "transcript_final",
                        "text": text,
                        "speaker": speaker,
                        "timestamp_seconds": timestamp_seconds,
                    })
                else:
                    await send_json({
                        "type": "transcript_interim",
                        "text": text,
                        "speaker": speaker,
                    })
            except asyncio.TimeoutError:
                continue
            except Exception as exc:
                logger.warning("[%s] drain_interim error: %s", lecture_id, exc)

    # ------------------------------------------------------------------
    # Background task: process finalized utterances through the pipeline
    # ------------------------------------------------------------------
    async def process_utterances():
        utterance_buffer: list[str] = []
        last_process_time = time.time()
        last_pipeline_time = 0.0    # last time we actually fired Gemini
        MIN_PIPELINE_INTERVAL = 20  # seconds between Gemini API calls
        retry_pending = False
        retry_after = 0.0           # earliest time we can retry

        async def _run_pipeline(utterance: str) -> bool:
            """Run single Gemini analysis and dispatch results."""
            nonlocal last_deep_research_time
            
            try:
                # 1. Single Gemini Call
                analysis = await analyze_utterance(utterance)
                if not analysis:
                    return False

                ts = stt_session.elapsed_seconds()
                context_tail = stt_session.get_context_tail(500)

                # 2. Process Topic (if significant)
                if analysis["topic"]:
                    await send_json({
                        "type": "topic_update",
                        "topic": analysis["topic"],
                        "emphasis_level": analysis["emphasis_level"],
                    })

                # 3. Process Takeaway
                if analysis["takeaway"]:
                    t_dict = await _save_takeaway(lecture_id, analysis["takeaway"], ts)
                    await send_json({"type": "new_takeaway", "takeaway": t_dict})

                # 4. Process Summary (Live Context)
                if analysis.get("summary"):
                    # We broadcast the live summary of the recent context
                    await send_json({"type": "summary_update", "summary": analysis["summary"]})
                    # Optionally save it to DB (overwriting previous live summary)
                    await _update_lecture_summary(lecture_id, analysis["summary"])

                # 5. Process Terms (Cards)
                terms = analysis["terms"]
                if terms:
                    # Filter for new terms only
                    new_term_strs = term_cache.filter_new([t["term"] for t in terms])
                    new_term_dicts = [t for t in terms if t["term"] in new_term_strs]

                    if new_term_dicts:
                        # Auto-define these new terms
                        results = await auto_define_batch(new_term_dicts, context_tail)
                        for res in results:
                            term_cache.put(res["term"], res)
                            card_dict = await _save_card(
                                lecture_id=lecture_id,
                                card_type="auto_define",
                                term=res["term"],
                                content=res["content"],
                                citations=res.get("citations", []),
                                badge_type=res.get("badge_type", "concept"),
                                timestamp_seconds=ts,
                            )
                            await send_json({"type": "new_card", "card": card_dict})

                # 5. Deep Research (throttled, using extracted topic/term)
                now = time.time()
                if now - last_deep_research_time >= 30:
                    # Build list of potential candidates to research, in priority order
                    candidates = []
                    
                    # Priority 1: High-emphasis topic
                    if analysis["topic"] and analysis["emphasis_level"] > 0.6:
                        candidates.append(analysis["topic"])
                    
                    # Priority 2: New technical terms (longest/most specific first)
                    if terms:
                        # sorted by length descending
                        sorted_terms = sorted([t["term"] for t in terms], key=len, reverse=True)
                        candidates.extend(sorted_terms)

                    # Find the first candidate that hasn't been researched yet
                    target = None
                    for c in candidates:
                        key = c.strip().lower()
                        if key not in deep_research_cache:
                            target = c
                            break
                    
                    if target:
                        last_deep_research_time = now
                        deep_research_cache.add(target.strip().lower())
                        
                        # Fire and forget (or await if we want to block pipeline)
                        res = await deep_research(target, context_tail)
                        if res:
                            dr_card = await _save_card(
                                lecture_id=lecture_id,
                                card_type="deep_research",
                                term=res["term"],
                                content=res["content"],
                                citations=res.get("citations", []),
                                badge_type="concept",
                                timestamp_seconds=ts,
                            )
                            await send_json({"type": "deep_research_result", "card": dr_card})

                return True

            except Exception as exc:
                logger.warning("[%s] Pipeline error: %s", lecture_id, exc)
                return False

        while session_active:
            try:
                utterance, speaker, timestamp_seconds = await asyncio.wait_for(
                    stt_session.utterance_queue.get(), timeout=1.0
                )
                if utterance.strip():
                    utterance_buffer.append(utterance)

            except asyncio.TimeoutError:
                pass
            except Exception as exc:
                logger.warning("[%s] utterance queue error: %s", lecture_id, exc)
                continue

            now = time.time()
            time_since_last = now - last_process_time
            time_since_pipeline = now - last_pipeline_time

            # Normal trigger: new content + 15s cooldown
            should_process = (
                len(utterance_buffer) > 0 and
                time_since_last >= MIN_PIPELINE_INTERVAL and
                time_since_pipeline >= MIN_PIPELINE_INTERVAL
            )

            # Retry trigger: previous attempt failed + 20s have passed
            should_retry = retry_pending and now >= retry_after

            if should_process or should_retry:
                # Always combine buffered utterances with the latest context
                combined = " ".join(utterance_buffer) if utterance_buffer else stt_session.get_context_tail(300)
                utterance_buffer.clear()
                last_process_time = now
                last_pipeline_time = now

                success = await _run_pipeline(combined)
                if not success:
                    retry_pending = True
                    retry_after = now + 20  # retry in 20 seconds
                    logger.info("[%s] Gemini failed — will retry in 20s", lecture_id)
                else:
                    retry_pending = False








    # ------------------------------------------------------------------
    # Background task: handle user-triggered deep research
    # ------------------------------------------------------------------
    async def handle_deep_research(selected_text: str, context: str):
        await send_json({"type": "deep_research_start", "selected_text": selected_text})
        try:
            result = await deep_research(selected_text, context)
            if result:
                card_dict = await _save_card(
                    lecture_id=lecture_id,
                    card_type="deep_research",
                    term=result["term"],
                    content=result["content"],
                    citations=result.get("citations", []),
                    badge_type=result.get("badge_type", "concept"),
                    timestamp_seconds=stt_session.elapsed_seconds(),
                )
                await send_json({"type": "deep_research_result", "card": card_dict})
        except Exception as exc:
            logger.error("[%s] Deep research error: %s", lecture_id, exc)

    # ------------------------------------------------------------------
    # Background task: periodic transcript save (every 3s)
    # ------------------------------------------------------------------
    async def periodic_transcript_save():
        while session_active:
            try:
                await asyncio.sleep(3)
                if stt_session.full_transcript:
                    await _save_transcript_chunk(lecture_id, stt_session.full_transcript)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("[%s] Transcript save error: %s", lecture_id, exc)

    # ------------------------------------------------------------------
    # Start background tasks
    # ------------------------------------------------------------------
    interim_task = asyncio.create_task(drain_interim())
    utterance_task = asyncio.create_task(process_utterances())
    transcript_save_task = asyncio.create_task(periodic_transcript_save())

    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError:
                # Can happen if connection is closed during receive
                break
            except Exception:
                # Other receive errors
                break

            # Binary audio frame
            if "bytes" in message and message["bytes"]:
                stt_session.send_audio(message["bytes"])
                continue

            # JSON control message
            if "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue

                msg_type = data.get("type")

                if msg_type == "pause":
                    stt_session.pause()

                elif msg_type == "resume":
                    stt_session.resume()

                elif msg_type == "deep_research":
                    selected_text = data.get("selected_text", "")
                    context = data.get("context", "")
                    if selected_text:
                        asyncio.create_task(handle_deep_research(selected_text, context))

                elif msg_type == "end_session":
                    # Finalize the lecture
                    duration = stt_session.elapsed_seconds()
                    final_summary = await generate_summary(stt_session.full_transcript)
                    # Pass full transcript to finalize
                    await _finalize_lecture(lecture_id, duration, final_summary, stt_session.full_transcript)
                    if final_summary:
                        await send_json({"type": "summary_update", "summary": final_summary})
                    break

    except WebSocketDisconnect:
        logger.info("[%s] WebSocket disconnected", lecture_id)
    except Exception as exc:
        logger.exception("[%s] WebSocket error: %s", lecture_id, exc)
    finally:
        session_active = False
        interim_task.cancel()
        utterance_task.cancel()
        transcript_save_task.cancel()
        
        # Ensure transcript is saved even on disconnect
        try:
            duration = stt_session.elapsed_seconds()
            await _finalize_lecture(lecture_id, duration, None, stt_session.full_transcript)
        except Exception as exc:
            logger.error("[%s] Failed to save transcript on exit: %s", lecture_id, exc)

        close_session(lecture_id)
        drop_session_cache(lecture_id)
        logger.info("[%s] Session cleaned up", lecture_id)
