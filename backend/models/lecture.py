"""
models/lecture.py — ORM models for lectures, cards, and takeaways
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Lecture
# ---------------------------------------------------------------------------

class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String, nullable=False, default="Untitled Lecture")
    status: Mapped[str] = mapped_column(
        Enum("idle", "active", "paused", "completed", name="lecture_status"),
        nullable=False,
        default="idle",
    )
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    cards: Mapped[list["Card"]] = relationship(
        "Card", back_populates="lecture", cascade="all, delete-orphan"
    )
    takeaways: Mapped[list["Takeaway"]] = relationship(
        "Takeaway", back_populates="lecture", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Card
# ---------------------------------------------------------------------------

class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    lecture_id: Mapped[str] = mapped_column(
        String, ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        Enum("auto_define", "deep_research", "concept", name="card_type"),
        nullable=False,
        default="auto_define",
    )
    term: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    citations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    badge_type: Mapped[str] = mapped_column(
        Enum("concept", "person", "event", "Research", name="badge_type"),
        nullable=False,
        default="concept",
    )
    lecture_timestamp_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    lecture: Mapped["Lecture"] = relationship("Lecture", back_populates="cards")


# ---------------------------------------------------------------------------
# Takeaway
# ---------------------------------------------------------------------------

class Takeaway(Base):
    __tablename__ = "takeaways"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    lecture_id: Mapped[str] = mapped_column(
        String, ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(String, nullable=False)
    lecture_timestamp_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    lecture: Mapped["Lecture"] = relationship("Lecture", back_populates="takeaways")
