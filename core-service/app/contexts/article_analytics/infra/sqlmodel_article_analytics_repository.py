from __future__ import annotations

from datetime import date

from app.contexts.article_analytics.domain.article_analytics_repository import ArticleAnalyticsRepository
from app.contexts.article_analytics.domain.article_daily_stats import ArticleDailyStats
from app.contexts.article_analytics.infra.dao.article_daily_stats_dao import ArticleDailyStatsDAO
from app.contexts.article_analytics.infra.dao.article_view_event_dao import ArticleViewEventDAO
from app.contexts.article_analytics.infra.po.article_view_daily_stats_po import ArticleViewDailyStatsPO


class SQLModelArticleAnalyticsRepository(ArticleAnalyticsRepository):
    def __init__(self, event_dao: ArticleViewEventDAO, stats_dao: ArticleDailyStatsDAO) -> None:
        self._event_dao = event_dao
        self._stats_dao = stats_dao

    def has_viewed_article_on_date(self, article_slug: str, visitor_id: str | None, stat_date: date) -> bool:
        return self._event_dao.has_viewed_on_date(article_slug, visitor_id, stat_date)

    def add_view_event(
        self,
        article_slug: str,
        visitor_id: str | None,
        user_id: str | None,
        ip_hash: str | None,
        user_agent_hash: str | None,
        referrer_origin: str | None,
    ) -> None:
        self._event_dao.add(article_slug, visitor_id, user_id, ip_hash, user_agent_hash, referrer_origin)

    def get_daily_stats(self, article_slug: str, stat_date: date) -> ArticleDailyStats | None:
        stats_po = self._stats_dao.get_by_id(article_slug, stat_date)
        return None if stats_po is None else self._to_domain(stats_po)

    def save_daily_stats(self, stats: ArticleDailyStats) -> ArticleDailyStats:
        stats_po = self._stats_dao.get_by_id(stats.article_slug, stats.stat_date)
        if stats_po is None:
            stats_po = ArticleViewDailyStatsPO(
                article_slug=stats.article_slug,
                stat_date=stats.stat_date,
                pv_count=stats.pv_count,
                uv_count=stats.uv_count,
            )
            self._stats_dao.add(stats_po)
        else:
            stats_po.pv_count = stats.pv_count
            stats_po.uv_count = stats.uv_count
        self._stats_dao.flush()
        self._stats_dao.refresh(stats_po)
        return self._to_domain(stats_po)

    def get_article_stats(self, article_slug: str) -> tuple[int, int]:
        return self._stats_dao.get_article_stats(article_slug)

    def _to_domain(self, stats_po: ArticleViewDailyStatsPO) -> ArticleDailyStats:
        return ArticleDailyStats(
            article_slug=stats_po.article_slug,
            stat_date=stats_po.stat_date,
            pv_count=stats_po.pv_count,
            uv_count=stats_po.uv_count,
        )
