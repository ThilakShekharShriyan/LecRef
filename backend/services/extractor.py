"""
services/extractor.py — Groq-powered term extraction and summary generation
Uses OpenAI SDK with Groq API base URL.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

from openai import AsyncOpenAI

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_MODEL = "llama-3.1-8b-instant"
_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=get_settings().groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


# ---------------------------------------------------------------------------
# Term extraction
# ---------------------------------------------------------------------------

_ANALYZE_PROMPT = """You are a lecture assistant analyzing the live transcript of a lecture.
The following is the FULL TRANSCRIPT so far.

Your task:
1. Identify the **current topic** being discussed at the very end of the transcript.
2. Extract 2-3 **current** key technical terms/concepts from the recent context (last few sentences) that need defining.
3. Determine the emphasis level of the current topic.
4. Extract a takeaway if the speaker just finished a key point.
5. Provide a **concise summary** of this specific segment (last ~15 sentences).

Return ONLY this JSON:
{{"terms": [{{"term": "...", "type": "concept"}}], "topic": "...", "emphasis_level": 0.7, "takeaway": "..." or null, "summary": "..."}}

Full Transcript:
{utterance}"""




async def analyze_utterance(utterance: str) -> dict:
    """
    Single Groq call that extracts terms, topic, emphasis level, and takeaway.
    Returns dict with keys: terms, topic, emphasis_level, takeaway.
    Returns empty defaults on failure.
    """
    default = {"terms": [], "topic": None, "emphasis_level": 0.5, "takeaway": None}
    if not utterance.strip():
        return default

    prompt = _ANALYZE_PROMPT.format(utterance=utterance[:1500])
    try:
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=512,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        
        # Safely convert emphasis_level with fallback
        emphasis = data.get("emphasis_level")
        try:
            emphasis_level = float(emphasis) if emphasis is not None else 0.5
        except (ValueError, TypeError):
            emphasis_level = 0.5
            
        return {
            "terms": [
                {"term": str(t.get("term", "")), "type": str(t.get("type", "concept"))}
                for t in data.get("terms", [])
                if t.get("term")
            ],
            "topic": data.get("topic") or None,
            "emphasis_level": emphasis_level,
            "takeaway": data.get("takeaway") or None,
            "summary": data.get("summary") or None,
        }
    except Exception as exc:
        logger.warning("analyze_utterance failed: %s", exc)
        raise  # re-raise so caller can detect failure for retry logic



# ---------------------------------------------------------------------------
# Rolling summary
# ---------------------------------------------------------------------------

_SUMMARY_PROMPT = """You are a lecture assistant. Produce a concise, 3-5 sentence summary \
of the following lecture transcript so far. Focus on the main topics covered.
Transcript:
{transcript}"""


async def generate_summary(transcript: str) -> Optional[str]:
    """Generate a rolling summary from the transcript buffer."""
    if not transcript.strip():
        return None
    prompt = _SUMMARY_PROMPT.format(transcript=transcript[-4000:])
    try:
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=256,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Summary generation failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Takeaway detection
# ---------------------------------------------------------------------------

_TAKEAWAY_PROMPT = """You are a lecture assistant. Determine if the following sentence \
contains a key takeaway or important point a student should remember.
If yes, return a single JSON object: {{"is_takeaway": true, "text": "<concise takeaway>"}}
If no, return: {{"is_takeaway": false}}
Sentence: {utterance}"""


async def detect_takeaway(utterance: str) -> Optional[str]:
    """Return a takeaway string if the utterance contains a key point, else None."""
    if not utterance.strip():
        return None
    prompt = _TAKEAWAY_PROMPT.format(utterance=utterance)
    try:
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=256,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        if isinstance(data, dict) and data.get("is_takeaway") and data.get("text"):
            return str(data["text"])
    except Exception as exc:
        logger.warning("Takeaway detection failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Topic detection
# ---------------------------------------------------------------------------

_TOPIC_PROMPT = """You are a lecture assistant. Given the following utterance, identify \
the main topic being discussed and estimate its emphasis level (0.0 = passing mention, \
1.0 = central focus).
Return JSON only: {{"topic": "...", "emphasis_level": 0.0}}
Utterance: {utterance}"""


async def detect_topic(utterance: str) -> Optional[dict]:
    """Return {topic, emphasis_level} or None."""
    if not utterance.strip():
        return None
    prompt = _TOPIC_PROMPT.format(utterance=utterance)
    try:
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=256,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        if isinstance(data, dict) and "topic" in data:
            # Safely convert emphasis_level with fallback
            emphasis = data.get("emphasis_level")
            try:
                emphasis_level = float(emphasis) if emphasis is not None else 0.5
            except (ValueError, TypeError):
                emphasis_level = 0.5
                
            return {
                "topic": str(data["topic"]),
                "emphasis_level": emphasis_level,
            }
    except Exception as exc:
        logger.warning("Topic detection failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Deep-research synthesis
# ---------------------------------------------------------------------------

_SYNTHESIS_PROMPT = """You are a research assistant. Using the following web search results, \
write a comprehensive, multi-paragraph explanation of "{term}" in the context of: "{context}".
Include key facts, definitions, and relevant details. Be thorough but clear.

Search results:
{snippets}"""


async def synthesize_deep_research(term: str, context: str, snippets: str) -> str:
    """Synthesize a multi-paragraph deep-research explanation using Groq."""
    prompt = _SYNTHESIS_PROMPT.format(term=term, context=context, snippets=snippets[:6000])
    try:
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Deep research synthesis failed: %s", exc)
        return f"Research synthesis unavailable for '{term}'."
