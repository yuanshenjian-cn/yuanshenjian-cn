from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base


class ArticleViewDailyStatsPO(Base):
    __tablename__ = "article_view_daily_stats"

    article_slug: Mapped[str] = mapped_column(String(256), primary_key=True)
    stat_date: Mapped[date] = mapped_column(Date, primary_key=True)
    pv_count: Mapped[int] = mapped_column(Integer, default=0)
    uv_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
