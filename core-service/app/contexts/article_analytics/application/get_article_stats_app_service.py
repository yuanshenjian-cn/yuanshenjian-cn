from __future__ import annotations

from app.contexts.article_analytics.application.dto.get_article_stats_dto import GetArticleStatsResp
from app.contexts.article_analytics.domain.article_analytics_repository import ArticleAnalyticsRepository


class GetArticleStatsAppService:
    def __init__(self, repository: ArticleAnalyticsRepository) -> None:
        self._repository = repository

    def execute(self, article_slug: str) -> GetArticleStatsResp:
        pv, uv = self._repository.get_article_stats(article_slug)
        return GetArticleStatsResp(article_slug=article_slug, pv=pv, uv=uv)
