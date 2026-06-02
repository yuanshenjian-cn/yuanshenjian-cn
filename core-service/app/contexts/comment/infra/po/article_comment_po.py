from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, TimestampMixin, uuid_pk


class ArticleCommentPO(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[str] = uuid_pk()
    article_slug: Mapped[str] = mapped_column(String(256), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("comments.id"))
    actor_type: Mapped[str] = mapped_column(String(32), nullable=False)
    visitor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("visitors.id"))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    email_hash: Mapped[str | None] = mapped_column(String(128))
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    content_html: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    ai_moderation_recommended_status: Mapped[str | None] = mapped_column(String(32))
    ai_moderation_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    ai_moderation_labels: Mapped[list[str]] = mapped_column(JSON, default=list)
    ai_moderation_reason: Mapped[str | None] = mapped_column(Text)
    ip_hash: Mapped[str | None] = mapped_column(String(128))
    user_agent_hash: Mapped[str | None] = mapped_column(String(128))
    reviewed_by: Mapped[str | None] = mapped_column(String(128))
    review_note: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
