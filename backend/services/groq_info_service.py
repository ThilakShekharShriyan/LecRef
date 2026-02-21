"""
services/groq_info_service.py - Groq-powered definitions and deep research
Uses Groq API via OpenAI SDK compatibility layer
"""
from __future__ import annotations

import asyncio
import logging
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
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


_DEFINITION_PROMPT = """You are a lecture assistant. Define the term below in 1-3 clear sentences.
Use the lecture context only to disambiguate meaning. Avoid citations.

Term: {term}
Context: {context}
"""


_DEEP_RESEARCH_PROMPT = """You are a research assistant. Write a thorough, multi-paragraph explanation
of the topic below for a student. Use the lecture context only to disambiguate. Avoid citations.

Topic: {term}
Context: {context}
"""


async def auto_define(term: str, context_tail: str) -> Optional[dict]:
    """Return a Groq-generated definition card or None on failure."""
    logger.info(f"[Groq] auto_define called for term: '{term}'")
    if not term.strip():
        logger.warning("[Groq] Empty term provided to auto_define")
        return None

    prompt = _DEFINITION_PROMPT.format(term=term, context=context_tail[-200:])
    try:
        logger.debug(f"[Groq] Sending definition request to Groq for term: '{term}'")
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=256,
        )
        content = response.choices[0].message.content.strip()
        if not content:
            logger.warning(f"[Groq] Empty response from Groq for term: '{term}'")
            return None
        logger.info(f"[Groq] Successfully generated definition for term: '{term}' ({len(content)} chars)")
        return {
            "term": term,
            "content": content,
            "citations": [],
            "sources": [],
            "badge_type": "concept",
        }
    except Exception as exc:
        logger.error(f"[Groq] Definition failed for '{term}': {type(exc).__name__}: {str(exc)}", exc_info=True)
        return None


async def auto_define_batch(
    terms: list[dict],
    context_tail: str,
) -> list[dict]:
    """Run auto_define concurrently for all terms and return successful results."""

    async def _define_one(item: dict) -> Optional[dict]:
        result = await auto_define(item.get("term", ""), context_tail)
        if result:
            type_map = {"person": "person", "event": "event", "concept": "concept"}
            result["badge_type"] = type_map.get(item.get("type", "concept"), "concept")
        return result

    tasks = [_define_one(item) for item in terms]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if isinstance(r, dict)]


async def deep_research(term: str, context: str) -> Optional[dict]:
    """Return a Groq-generated deep research card or None on failure."""
    logger.info(f"[Groq] deep_research called for term: '{term}'")
    if not term.strip():
        logger.warning("[Groq] Empty term provided to deep_research")
        return None

    prompt = _DEEP_RESEARCH_PROMPT.format(term=term, context=context[:400])
    try:
        logger.debug(f"[Groq] Sending deep research request to Groq for term: '{term}'")
        response = await _get_client().chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        content = response.choices[0].message.content.strip()
        if not content:
            logger.warning(f"[Groq] Empty response from Groq for deep research: '{term}'")
            return None
        logger.info(f"[Groq] Successfully generated deep research for term: '{term}' ({len(content)} chars)")
        return {
            "term": term,
            "content": content,
            "citations": [],
            "sources": [],
            "badge_type": "concept",
        }
    except Exception as exc:
        logger.error(f"[Groq] Deep research failed for '{term}': {type(exc).__name__}: {str(exc)}", exc_info=True)
        return None
