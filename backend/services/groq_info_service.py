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
_SEARCH_MODEL = "groq/compound"  # Model with built-in web search
_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


# ============================================================================
# CONDENSED PROMPTS - Readable in < 1 minute
# ============================================================================

_DEFINITION_PROMPT = """Define this term in 1-3 sentences using the lecture context.

Term: {term}
Context: {context}

Brief definition only - no citations needed."""


_DEEP_RESEARCH_PROMPT = """Explain this topic concisely for a student. Keep it SHORT (max 150 words).

Topic: {term}
Lecture Context: {context}

Format your answer as:

**What it is:** Define in 1-2 sentences.

**Why it matters:** 1-2 sentences on relevance.

**Example:** One concrete real-world case.

That's it. Be concise."""


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
    """Deep research with web search using groq/compound model (fallback to llama).
    
    Returns dict with:
    - term: research topic
    - content: synthesized answer
    - citations: list of {title, url} formatted for display
    - sources: raw search results with relevance scores
    - badge_type: "research"
    """
    logger.info(f"[Groq] 🔍 deep_research starting for: '{term}'")
    if not term.strip():
        logger.warning("[Groq] Empty term provided to deep_research")
        return None

    prompt = _DEEP_RESEARCH_PROMPT.format(term=term, context=context[:400])
    
    # Try groq/compound first, fallback to regular model
    model_to_use = _SEARCH_MODEL
    search_params = {
        "model": model_to_use,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    
    # Only add search_settings if using groq/compound
    if model_to_use == _SEARCH_MODEL:
        try:
            search_params["search_settings"] = {
                "exclude_domains": ["twitter.com", "x.com", "instagram.com"]
            }
        except Exception:
            logger.debug("[Groq] search_settings not supported, will try without it")
            pass
    
    try:
        logger.debug(f"[Groq] Requesting {model_to_use} for: '{term}'")
        
        try:
            # Try with search settings first
            response = await _get_client().chat.completions.create(**search_params)
        except (TypeError, AttributeError) as e:
            # If search_settings isn't supported, try without it
            logger.warning(f"[Groq] search_settings not supported, falling back to standard model: {e}")
            search_params.pop("search_settings", None)
            search_params["model"] = _MODEL  # Use regular model instead
            response = await _get_client().chat.completions.create(**search_params)
        
        content = response.choices[0].message.content.strip()
        if not content:
            logger.warning(f"[Groq] Empty response from {search_params['model']} for: '{term}'")
            return None

        # Extract sources from web search (if available)
        sources = []
        citations = []
        
        if hasattr(response.choices[0].message, 'executed_tools') and response.choices[0].message.executed_tools:
            logger.debug(f"[Groq] Found {len(response.choices[0].message.executed_tools)} executed tools")
            for tool in response.choices[0].message.executed_tools:
                if hasattr(tool, 'search_results') and tool.search_results:
                    logger.info(f"[Groq] Extracted {len(tool.search_results)} search results")
                    for result in tool.search_results:
                        source = {
                            "url": result.get("url", ""),
                            "title": result.get("title", ""),
                            "snippet": result.get("content", ""),
                            "relevance": float(result.get("score", 0.0))
                        }
                        sources.append(source)
                        
                        # Format for citations display
                        if result.get("title") and result.get("url"):
                            citations.append({
                                "title": result.get("title"),
                                "url": result.get("url"),
                                "domain": result.get("url", "").split("/")[2] if result.get("url") else ""
                            })
        
        logger.info(f"[Groq] ✅ deep_research complete for '{term}': {len(content)} chars, {len(sources)} sources")
        
        return {
            "term": term,
            "content": content,
            "citations": citations[:5],  # Top 5 citations
            "sources": sources[:5],      # Top 5 sources with scores
            "badge_type": "Research",
        }
        
    except Exception as exc:
        logger.error(f"[Groq] ❌ deep_research failed for '{term}': {type(exc).__name__}: {str(exc)}", exc_info=True)
        return None
