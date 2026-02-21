"""
routers/lectures.py — REST CRUD for lectures, cards, and takeaways
"""
from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.database import get_db
from models.events import (
    CardOut,
    LectureCreate,
    LectureDetail,
    LectureOut,
    LecturePatch,
    TakeawayOut,
)
from models.lecture import Card, Lecture, Takeaway

router = APIRouter(prefix="/api/lectures", tags=["lectures"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _get_lecture_or_404(lecture_id: str, db: AsyncSession) -> Lecture:
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


# ---------------------------------------------------------------------------
# GET /api/lectures — list all
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[LectureOut])
async def list_lectures(db: AsyncSession = Depends(get_db)):
    # Count cards per lecture in a subquery
    card_count_sq = (
        select(Card.lecture_id, func.count(Card.id).label("cnt"))
        .group_by(Card.lecture_id)
        .subquery()
    )
    stmt = (
        select(Lecture, func.coalesce(card_count_sq.c.cnt, 0).label("card_count"))
        .outerjoin(card_count_sq, Lecture.id == card_count_sq.c.lecture_id)
        .order_by(Lecture.updated_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    out = []
    for lecture, card_count in rows:
        d = LectureOut.model_validate(lecture)
        d.card_count = card_count
        out.append(d)
    return out


# ---------------------------------------------------------------------------
# POST /api/lectures — create
# ---------------------------------------------------------------------------

@router.post("/", response_model=LectureOut, status_code=201)
async def create_lecture(body: LectureCreate, db: AsyncSession = Depends(get_db)):
    lecture = Lecture(title=body.title)
    db.add(lecture)
    await db.commit()
    await db.refresh(lecture)
    d = LectureOut.model_validate(lecture)
    d.card_count = 0
    return d


# ---------------------------------------------------------------------------
# GET /api/lectures/{id} — full detail
# ---------------------------------------------------------------------------

@router.get("/{lecture_id}", response_model=LectureDetail)
async def get_lecture(lecture_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Lecture)
        .where(Lecture.id == lecture_id)
        .options(selectinload(Lecture.cards), selectinload(Lecture.takeaways))
    )
    result = await db.execute(stmt)
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    d = LectureDetail.model_validate(lecture)
    d.card_count = len(lecture.cards)
    d.cards = [CardOut.model_validate(c) for c in lecture.cards]
    d.takeaways = [TakeawayOut.model_validate(t) for t in lecture.takeaways]
    return d


# ---------------------------------------------------------------------------
# PATCH /api/lectures/{id} — update
# ---------------------------------------------------------------------------

@router.patch("/{lecture_id}", response_model=LectureOut)
async def patch_lecture(
    lecture_id: str, body: LecturePatch, db: AsyncSession = Depends(get_db)
):
    lecture = await _get_lecture_or_404(lecture_id, db)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lecture, field, value)
    lecture.updated_at = _now()
    await db.commit()
    await db.refresh(lecture)
    d = LectureOut.model_validate(lecture)
    # Fetch card count separately
    cnt_result = await db.execute(
        select(func.count(Card.id)).where(Card.lecture_id == lecture_id)
    )
    d.card_count = cnt_result.scalar_one() or 0
    return d


# ---------------------------------------------------------------------------
# DELETE /api/lectures/{id} — soft delete (status = completed, or hard delete)
# ---------------------------------------------------------------------------

@router.delete("/{lecture_id}", status_code=204)
async def delete_lecture(lecture_id: str, db: AsyncSession = Depends(get_db)):
    lecture = await _get_lecture_or_404(lecture_id, db)
    await db.delete(lecture)
    await db.commit()


# ---------------------------------------------------------------------------
# GET /api/lectures/{id}/export — file download
# ---------------------------------------------------------------------------

@router.get("/{lecture_id}/export")
async def export_lecture(
    lecture_id: str,
    format: str = Query(default="json", pattern="^(json|markdown)$"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Lecture)
        .where(Lecture.id == lecture_id)
        .options(selectinload(Lecture.cards), selectinload(Lecture.takeaways))
    )
    result = await db.execute(stmt)
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    if format == "json":
        payload = LectureDetail.model_validate(lecture).model_dump(mode="json")
        payload["card_count"] = len(lecture.cards)
        payload["cards"] = [CardOut.model_validate(c).model_dump(mode="json") for c in lecture.cards]
        payload["takeaways"] = [TakeawayOut.model_validate(t).model_dump(mode="json") for t in lecture.takeaways]
        content = json.dumps(payload, indent=2, default=str)
        media_type = "application/json"
        filename = f"lecture_{lecture_id}.json"
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # Markdown export
    lines: list[str] = []
    lines.append(f"# {lecture.title}")
    lines.append(f"\n**Date:** {lecture.created_at.strftime('%Y-%m-%d %H:%M UTC')}")
    if lecture.summary:
        lines.append(f"\n## Summary\n\n{lecture.summary}")
    if lecture.takeaways:
        lines.append("\n## Key Takeaways\n")
        for t in lecture.takeaways:
            lines.append(f"- {t.text}")
    if lecture.cards:
        lines.append("\n## Cards\n")
        for card in lecture.cards:
            lines.append(f"### {card.term} `[{card.badge_type}]`\n")
            lines.append(card.content)
            if card.citations:
                lines.append("\n**Citations:**\n")
                for i, cit in enumerate(card.citations, 1):
                    lines.append(f"{i}. [{cit.get('title', cit.get('url', ''))}]({cit.get('url', '')})")
            lines.append("")

    content = "\n".join(lines)
    filename = f"lecture_{lecture_id}.md"
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
