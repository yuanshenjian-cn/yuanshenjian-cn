from __future__ import annotations

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, TimestampMixin, uuid_pk


class KnowledgeTermPO(Base, TimestampMixin):
    __tablename__ = "knowledge_terms"

    id: Mapped[str] = uuid_pk()
    term: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    aliases: Mapped[list[str]] = mapped_column(JSON, default=list)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    related_article_slugs: Mapped[list[str]] = mapped_column(JSON, default=list)
    references: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    domains: Mapped[list[str]] = mapped_column(JSON, default=list)
    scenes: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="enabled")
    notes: Mapped[str | None] = mapped_column(Text)
    updated_by: Mapped[str | None] = mapped_column(String(128))
