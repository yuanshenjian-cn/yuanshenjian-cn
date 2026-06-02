from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base, TimestampMixin, uuid_pk


class AIConversationPO(Base, TimestampMixin):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = uuid_pk()
    scene: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(32), nullable=False)
    visitor_id: Mapped[str | None] = mapped_column(String(36))
    user_id: Mapped[str | None] = mapped_column(String(36))
    article_slug: Mapped[str | None] = mapped_column(String(256))
    title: Mapped[str | None] = mapped_column(String(512))
