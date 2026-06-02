from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, uuid_pk


class RagSyncRunPO(Base):
    __tablename__ = "rag_sync_runs"

    id: Mapped[str] = uuid_pk()
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    commit_sha: Mapped[str | None] = mapped_column(String(64))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    documents_seen: Mapped[int] = mapped_column(Integer, default=0)
    documents_upserted: Mapped[int] = mapped_column(Integer, default=0)
    chunks_upserted: Mapped[int] = mapped_column(Integer, default=0)
    chunks_deleted: Mapped[int] = mapped_column(Integer, default=0)
    embeddings_generated: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
