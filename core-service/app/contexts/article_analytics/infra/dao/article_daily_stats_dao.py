from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.shared.infra.persistence.models import ArticleViewDailyStats


class ArticleDailyStatsDAO:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_id(self, article_slug: str, stat_date: date) -> ArticleViewDailyStats | None:
        return self._session.get(ArticleViewDailyStats, {"article_slug": article_slug, "stat_date": stat_date})

    def add(self, stats_po: ArticleViewDailyStats) -> None:
        self._session.add(stats_po)

    def flush(self) -> None:
        self._session.flush()

    def refresh(self, stats_po: ArticleViewDailyStats) -> None:
        self._session.refresh(stats_po)

    def get_article_stats(self, article_slug: str) -> tuple[int, int]:
        rows = self._session.execute(
            select(
                func.coalesce(func.sum(ArticleViewDailyStats.pv_count), 0),
                func.coalesce(func.sum(ArticleViewDailyStats.uv_count), 0),
            ).where(ArticleViewDailyStats.article_slug == article_slug)
        ).one()
        return int(rows[0]), int(rows[1])
