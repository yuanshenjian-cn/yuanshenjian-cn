from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, uuid_pk


class ArticleViewEventPO(Base):
    __tablename__ = "article_view_events"

    id: Mapped[str] = uuid_pk()
    article_slug: Mapped[str] = mapped_column(String(256), nullable=False)
    visitor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("visitors.id"))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    ip_hash: Mapped[str | None] = mapped_column(String(128))
    user_agent_hash: Mapped[str | None] = mapped_column(String(128))
    referrer_origin: Mapped[str | None] = mapped_column(Text)
    viewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
