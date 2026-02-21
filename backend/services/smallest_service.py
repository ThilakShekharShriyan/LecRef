"""
services/smallest_service.py - Smallest.ai Pulse streaming transcription per lecture session

Architecture:
  - A background thread runs an asyncio loop for the Smallest.ai WebSocket.
  - Audio chunks are queued from the FastAPI loop and streamed as binary frames.
  - Transcripts are pushed into asyncio queues for the WS handler to consume.
  - A rolling transcript buffer is maintained per session.
"""
from __future__ import annotations

import asyncio
import json
import logging
import queue
import threading
import time
from typing import Optional
from urllib.parse import urlencode

import websockets

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SmallestSession:
    """Manages one Smallest.ai streaming connection for a single lecture session."""

    BUFFER_MAX = 2000  # characters kept in rolling transcript buffer

    def __init__(self, lecture_id: str, loop: asyncio.AbstractEventLoop) -> None:
        self.lecture_id = lecture_id
        self._loop = loop

        # Queue items: (text, speaker, timestamp_seconds, is_final)
        self.interim_queue: asyncio.Queue[tuple[str, Optional[int], int, bool]] = asyncio.Queue()

        # Queue for finalized utterances only: (text, speaker, timestamp_seconds)
        self.utterance_queue: asyncio.Queue[tuple[str, Optional[int], int]] = asyncio.Queue()

        self._full_transcript: str = ""
        self._start_time: float = time.time()
        self._ready_event = threading.Event()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._paused = False
        self._audio_queue: queue.Queue[Optional[bytes]] = queue.Queue()

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    @property
    def full_transcript(self) -> str:
        return self._full_transcript

    def get_context_tail(self, chars: int = 200) -> str:
        return self._full_transcript[-chars:]

    def elapsed_seconds(self) -> int:
        return int(time.time() - self._start_time)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Spawn the Smallest.ai thread and wait until the connection is ready."""
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        self._ready_event.wait(timeout=10)

    def stop(self) -> None:
        """Signal the Smallest.ai thread to close and join it."""
        self._stop_event.set()
        self._audio_queue.put(None)
        if self._thread:
            self._thread.join(timeout=5)

    def pause(self) -> None:
        self._paused = True

    def resume(self) -> None:
        self._paused = False

    def send_audio(self, chunk: bytes) -> None:
        """Forward a raw audio chunk to Smallest.ai (no-op if paused or stopped)."""
        if self._paused or self._stop_event.is_set():
            return
        self._audio_queue.put(chunk)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _build_ws_url(self) -> str:
        params = {
            "language": settings.smallest_language,
            "encoding": settings.smallest_encoding,
            "sample_rate": str(settings.smallest_sample_rate),
            "word_timestamps": "true" if settings.smallest_word_timestamps else "false",
        }
        return f"{settings.smallest_ws_url}?{urlencode(params)}"

    def _run(self) -> None:
        try:
            asyncio.run(self._run_async())
        except Exception as exc:
            logger.exception("[%s] Smallest.ai thread error: %s", self.lecture_id, exc)
            self._ready_event.set()

    async def _run_async(self) -> None:
        if not settings.smallest_api_key:
            logger.error("Smallest.ai API key is missing. Set SMALLEST_API_KEY.")

        url = self._build_ws_url()
        headers = {"Authorization": f"Bearer {settings.smallest_api_key}"}

        try:
            async with websockets.connect(
                url,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=20,
                max_size=None,
            ) as websocket:
                logger.info("[%s] Smallest.ai connection opened", self.lecture_id)
                self._ready_event.set()

                sender_task = asyncio.create_task(self._sender(websocket))
                receiver_task = asyncio.create_task(self._receiver(websocket))

                done, pending = await asyncio.wait(
                    [sender_task, receiver_task],
                    return_when=asyncio.FIRST_COMPLETED,
                )

                for task in pending:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass

                for task in done:
                    exc = task.exception()
                    if exc:
                        logger.warning("[%s] Smallest.ai task error: %s", self.lecture_id, exc)

        except Exception as exc:
            logger.exception("[%s] Smallest.ai connection error: %s", self.lecture_id, exc)
            self._ready_event.set()

    async def _sender(self, websocket: websockets.WebSocketClientProtocol) -> None:
        loop = asyncio.get_running_loop()
        while not self._stop_event.is_set():
            chunk = await loop.run_in_executor(None, self._audio_queue.get)
            if chunk is None:
                await websocket.send(json.dumps({"type": "finalize"}))
                return
            try:
                await websocket.send(chunk)
            except Exception as exc:
                logger.warning("[%s] send_audio error: %s", self.lecture_id, exc)
                return

    async def _receiver(self, websocket: websockets.WebSocketClientProtocol) -> None:
        async for message in websocket:
            try:
                if isinstance(message, bytes):
                    message = message.decode("utf-8", errors="ignore")

                payload = json.loads(message)
                text = payload.get("transcript", "") or ""
                if not text:
                    continue

                is_final = bool(payload.get("is_final", True))
                timestamp_seconds = self.elapsed_seconds()
                speaker: Optional[int] = None

                if is_final:
                    if self._full_transcript:
                        self._full_transcript += " " + text
                    else:
                        self._full_transcript = text

                    self._loop.call_soon_threadsafe(
                        self.utterance_queue.put_nowait,
                        (text, speaker, timestamp_seconds),
                    )

                self._loop.call_soon_threadsafe(
                    self.interim_queue.put_nowait,
                    (text, speaker, timestamp_seconds, is_final),
                )

            except Exception as exc:
                logger.warning("[%s] Transcript handler error: %s", self.lecture_id, exc)


# ---------------------------------------------------------------------------
# Session registry — one SmallestSession per lecture_id
# ---------------------------------------------------------------------------

_sessions: dict[str, SmallestSession] = {}


def get_or_create_session(lecture_id: str, loop: asyncio.AbstractEventLoop) -> SmallestSession:
    if lecture_id not in _sessions:
        session = SmallestSession(lecture_id, loop)
        session.start()
        _sessions[lecture_id] = session
    return _sessions[lecture_id]


def get_session(lecture_id: str) -> Optional[SmallestSession]:
    return _sessions.get(lecture_id)


def close_session(lecture_id: str) -> None:
    session = _sessions.pop(lecture_id, None)
    if session:
        session.stop()
