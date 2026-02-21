"""
services/gemini_info_service.py - Gemini-powered definitions and deep research
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

import google.genai as genai

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_MODEL = "gemini-flash-latest"
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
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
    """Return a Gemini-generated definition card or None on failure."""
    if not term.strip():
        return None

    prompt = _DEFINITION_PROMPT.format(term=term, context=context_tail[-200:])
    try:
        response = await _get_client().aio.models.generate_content(
            model=_MODEL,
            contents=prompt,
        )
        content = response.text.strip()
        if not content:
            return None
        return {
            "term": term,
            "content": content,
            "citations": [],
            "sources": [],
            "badge_type": "concept",
        }
    except Exception as exc:
        logger.warning("Gemini definition failed for '%s': %s", term, exc)
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
    """Return a Gemini-generated deep research card or None on failure."""
    if not term.strip():
        return None

    prompt = _DEEP_RESEARCH_PROMPT.format(term=term, context=context[:400])
    try:
        response = await _get_client().aio.models.generate_content(
            model=_MODEL,
            contents=prompt,
        )
        content = response.text.strip()
        if not content:
            return None
        return {
            "term": term,
            "content": content,
            "citations": [],
            "sources": [],
            "badge_type": "concept",
        }
    except Exception as exc:
        logger.warning("Gemini deep research failed for '%s': %s", term, exc)
        return None
