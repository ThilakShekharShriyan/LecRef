"""
routers/tts.py - Text-to-Speech endpoint
"""
from __future__ import annotations

import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.tts_service import synthesize_speech

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tts", tags=["tts"])


class TTSRequest(BaseModel):
    text: str


@router.post("/synthesize", response_class=StreamingResponse)
async def tts_endpoint(body: TTSRequest):
    """
    Synthesize text to speech and return WAV audio stream.
    """
    logger.info(f"[TTS Router] /synthesize endpoint called with text length: {len(body.text) if body.text else 0}")
    
    if not body.text or not body.text.strip():
        logger.warning("[TTS Router] Empty text provided in request")
        return StreamingResponse(
            iter(b""),
            media_type="audio/wav",
            status_code=400,
        )

    logger.info(f"[TTS Router] Calling synthesize_speech service")
    audio_bytes = await synthesize_speech(body.text)
    
    if not audio_bytes:
        logger.error(f"[TTS Router] synthesize_speech returned None/empty")
        return StreamingResponse(
            iter(b""),
            media_type="audio/wav",
            status_code=500,
        )

    logger.info(f"[TTS Router] Returning audio response with {len(audio_bytes)} bytes")
    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=audio.wav"},
    )
