from __future__ import annotations

from datetime import UTC, datetime

from app.contexts.article_analytics.application.dto.record_article_view_dto import RecordArticleViewReq, RecordArticleViewResp
from app.contexts.article_analytics.domain.article_analytics_repository import ArticleAnalyticsRepository
from app.contexts.article_analytics.domain.article_daily_stats import ArticleDailyStats


class RecordArticleViewAppService:
    def __init__(self, repository: ArticleAnalyticsRepository) -> None:
        self._repository = repository

    async def execute(self, req: RecordArticleViewReq) -> RecordArticleViewResp:
        today = datetime.now(UTC).date()
        existing = await self._repository.has_viewed_article_on_date(req.article_slug, req.actor.visitor_id, today)
        await self._repository.add_view_event(
            article_slug=req.article_slug,
            visitor_id=req.actor.visitor_id,
            user_id=req.actor.user_id,
            ip_hash=req.ip_hash,
            user_agent_hash=req.user_agent_hash,
            referrer_origin=req.referrer_origin,
        )
        stats = await self._repository.get_daily_stats(req.article_slug, today)
        if stats is None:
            stats = ArticleDailyStats(article_slug=req.article_slug, stat_date=today, pv_count=0, uv_count=0)
        stats.record_view(is_unique_visitor=not existing)
        saved = await self._repository.save_daily_stats(stats)
        return RecordArticleViewResp(article_slug=saved.article_slug, pv=saved.pv_count, uv=saved.uv_count)
