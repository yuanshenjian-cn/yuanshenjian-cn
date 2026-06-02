from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.contexts.article_analytics.infra.po.article_view_daily_stats_po import ArticleViewDailyStatsPO


class ArticleDailyStatsDAO:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_id(self, article_slug: str, stat_date: date) -> ArticleViewDailyStatsPO | None:
        return self._session.get(ArticleViewDailyStatsPO, {"article_slug": article_slug, "stat_date": stat_date})

    def add(self, stats_po: ArticleViewDailyStatsPO) -> None:
        self._session.add(stats_po)

    def flush(self) -> None:
        self._session.flush()

    def refresh(self, stats_po: ArticleViewDailyStatsPO) -> None:
        self._session.refresh(stats_po)

    def get_article_stats(self, article_slug: str) -> tuple[int, int]:
        rows = self._session.execute(
            select(
                func.coalesce(func.sum(ArticleViewDailyStatsPO.pv_count), 0),
                func.coalesce(func.sum(ArticleViewDailyStatsPO.uv_count), 0),
            ).where(ArticleViewDailyStatsPO.article_slug == article_slug)
        ).one()
        return int(rows[0]), int(rows[1])
