from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date

from app.contexts.article_analytics.domain.article_daily_stats import ArticleDailyStats


class ArticleAnalyticsRepository(ABC):
    @abstractmethod
    async def has_viewed_article_on_date(self, article_slug: str, visitor_id: str | None, stat_date: date) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def add_view_event(
        self,
        article_slug: str,
        visitor_id: str | None,
        user_id: str | None,
        ip_hash: str | None,
        user_agent_hash: str | None,
        referrer_origin: str | None,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    async def get_daily_stats(self, article_slug: str, stat_date: date) -> ArticleDailyStats | None:
        raise NotImplementedError

    @abstractmethod
    async def save_daily_stats(self, stats: ArticleDailyStats) -> ArticleDailyStats:
        raise NotImplementedError

    @abstractmethod
    async def get_article_stats(self, article_slug: str) -> tuple[int, int]:
        raise NotImplementedError
