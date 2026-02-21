"""
models/events.py — Pydantic schemas for WebSocket event payloads and REST I/O
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Citation
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    title: str
    url: str
    domain: str


# ---------------------------------------------------------------------------
# Card schemas
# ---------------------------------------------------------------------------

class CardOut(BaseModel):
    id: str
    lecture_id: str
    type: str
    term: str
    content: str
    citations: list[Citation] = []
    badge_type: str
    lecture_timestamp_seconds: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Takeaway schemas
# ---------------------------------------------------------------------------

class TakeawayOut(BaseModel):
    id: str
    lecture_id: str
    text: str
    lecture_timestamp_seconds: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Lecture schemas
# ---------------------------------------------------------------------------

class LectureCreate(BaseModel):
    title: str = "Untitled Lecture"


class LecturePatch(BaseModel):
    title: Optional[str] = None
    status: Optional[Literal["idle", "active", "paused", "completed"]] = None
    summary: Optional[str] = None
    duration_seconds: Optional[int] = None


class LectureOut(BaseModel):
    id: str
    title: str
    status: str
    summary: Optional[str]
    duration_seconds: int
    created_at: datetime
    updated_at: datetime
    card_count: int = 0

    model_config = {"from_attributes": True}


class LectureDetail(LectureOut):
    transcript: Optional[str] = None
    cards: list[CardOut] = []
    takeaways: list[TakeawayOut] = []


# ---------------------------------------------------------------------------
# Deep-research request
# ---------------------------------------------------------------------------

class DeepResearchRequest(BaseModel):
    lecture_id: str
    selected_text: str
    context: str = ""


# ---------------------------------------------------------------------------
# WebSocket event envelopes (backend → frontend)
# ---------------------------------------------------------------------------

class WsEvent(BaseModel):
    type: str
    data: Any = None


class TranscriptInterimEvent(BaseModel):
    type: Literal["transcript_interim"] = "transcript_interim"
    text: str
    speaker: Optional[int] = None


class TranscriptFinalEvent(BaseModel):
    type: Literal["transcript_final"] = "transcript_final"
    text: str
    speaker: Optional[int] = None
    timestamp_seconds: int


class NewCardEvent(BaseModel):
    type: Literal["new_card"] = "new_card"
    card: CardOut


class DeepResearchStartEvent(BaseModel):
    type: Literal["deep_research_start"] = "deep_research_start"
    selected_text: str


class DeepResearchResultEvent(BaseModel):
    type: Literal["deep_research_result"] = "deep_research_result"
    card: CardOut


class NewTakeawayEvent(BaseModel):
    type: Literal["new_takeaway"] = "new_takeaway"
    takeaway: TakeawayOut


class SummaryUpdateEvent(BaseModel):
    type: Literal["summary_update"] = "summary_update"
    summary: str


class TopicUpdateEvent(BaseModel):
    type: Literal["topic_update"] = "topic_update"
    topic: str
    emphasis_level: float = Field(ge=0.0, le=1.0)
