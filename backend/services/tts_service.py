"""
services/tts_service.py - Smallest AI Text-to-Speech service
"""
from __future__ import annotations

import logging
from typing import Optional

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def synthesize_speech(text: str) -> Optional[bytes]:
    """
    Synthesize text to speech using Smallest AI's TTS API.
    Returns raw audio bytes (WAV format) or None on failure.
    """
    logger.info(f"[TTS] synthesize_speech called with text length: {len(text) if text else 0}")
    
    if not text or not text.strip():
        logger.warning("[TTS] Empty text provided for synthesis")
        return None

    if not settings.smallest_api_key:
        logger.error("[TTS] Smallest.ai API key is missing for TTS. Set SMALLEST_API_KEY.")
        return None

    try:
        logger.info(f"[TTS] Attempting synthesis with model='{settings.smallest_tts_model}', voice='{settings.smallest_tts_voice_id}'")
        
        from smallestai.waves import AsyncWavesClient

        async with AsyncWavesClient(api_key=settings.smallest_api_key) as client:
            logger.info("[TTS] AsyncWavesClient connected")
            
            audio_bytes = await client.synthesize(
                text,
                model=settings.smallest_tts_model,
                voice_id=settings.smallest_tts_voice_id,
                sample_rate=settings.smallest_tts_sample_rate,
                speed=settings.smallest_tts_speed,
                output_format="wav",
            )
            logger.info(f"[TTS] Synthesis successful, returned {len(audio_bytes)} bytes of audio")
            return audio_bytes
            
    except ImportError as e:
        logger.error(f"[TTS] smallestai SDK not installed. Run: pip install smallestai. Error: {e}")
        return None
    except Exception as exc:
        logger.error(f"[TTS] TTS synthesis failed: {type(exc).__name__}: {str(exc)}", exc_info=True)
        return None
