"""
services/cache.py — per-session LRU cache for already-seen terms
"""
from __future__ import annotations

import re
from collections import OrderedDict
from typing import Optional


class TermCache:
    """Thread-safe LRU cache keyed by normalised term string."""

    def __init__(self, maxsize: int = 512) -> None:
        self._cache: OrderedDict[str, dict] = OrderedDict()
        self._maxsize = maxsize

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalise(term: str) -> str:
        return re.sub(r"\s+", " ", term.strip().lower())

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def contains(self, term: str) -> bool:
        return self._normalise(term) in self._cache

    def get(self, term: str) -> Optional[dict]:
        key = self._normalise(term)
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        return None

    def put(self, term: str, value: dict) -> None:
        key = self._normalise(term)
        self._cache[key] = value
        self._cache.move_to_end(key)
        if len(self._cache) > self._maxsize:
            self._cache.popitem(last=False)

    def filter_new(self, terms: list[str]) -> list[str]:
        """Return only terms not yet in the cache."""
        return [t for t in terms if not self.contains(t)]


# ---------------------------------------------------------------------------
# Session-level registry — one TermCache per lecture_id
# ---------------------------------------------------------------------------

_session_caches: dict[str, TermCache] = {}


def get_session_cache(lecture_id: str) -> TermCache:
    if lecture_id not in _session_caches:
        _session_caches[lecture_id] = TermCache()
    return _session_caches[lecture_id]


def drop_session_cache(lecture_id: str) -> None:
    _session_caches.pop(lecture_id, None)
