from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, uuid_pk


class RagQueryEventPO(Base):
    __tablename__ = "rag_query_events"

    id: Mapped[str] = uuid_pk()
    ai_request_event_id: Mapped[str | None] = mapped_column(String(36))
    query: Mapped[str] = mapped_column(Text, nullable=False)
    top_k: Mapped[int] = mapped_column(Integer, default=5)
    matched_chunk_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    max_score: Mapped[float | None] = mapped_column(Numeric(8, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
