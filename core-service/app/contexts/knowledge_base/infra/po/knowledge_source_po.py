from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, TimestampMixin, uuid_pk


class KnowledgeSourcePO(Base, TimestampMixin):
    __tablename__ = "knowledge_sources"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    source_kind: Mapped[str] = mapped_column(String(64), nullable=False)
    domains: Mapped[list[str]] = mapped_column(JSON, default=list)
    scenes: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="enabled")
    source_uri: Mapped[str | None] = mapped_column(Text)
    sync_strategy: Mapped[str] = mapped_column(String(64), nullable=False, default="manual")
    content_config: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    notes: Mapped[str | None] = mapped_column(Text)
    updated_by: Mapped[str | None] = mapped_column(String(128))
