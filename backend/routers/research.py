"""
routers/research.py — POST /api/research/deep endpoint
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from models.events import CardOut, DeepResearchRequest
from models.lecture import Card, Lecture
from services.groq_info_service import deep_research

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/research", tags=["research"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.post("/deep", response_model=CardOut, status_code=201)
async def deep_research_endpoint(
    body: DeepResearchRequest, db: AsyncSession = Depends(get_db)
):
    """
    Fire Gemini deep research for a user-selected text, persist the card, and return it.
    """
    from sqlalchemy import select

    # Verify lecture exists
    result = await db.execute(select(Lecture).where(Lecture.id == body.lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    research_result = await deep_research(body.selected_text, body.context)
    if not research_result:
        raise HTTPException(status_code=502, detail="Deep research returned no results")

    card = Card(
        id=str(uuid.uuid4()),
        lecture_id=body.lecture_id,
        type="deep_research",
        term=research_result["term"],
        content=research_result["content"],
        citations=research_result.get("citations", []),
        badge_type=research_result.get("badge_type", "concept"),
        lecture_timestamp_seconds=0,
        created_at=_now(),
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)

    return CardOut.model_validate(card)
