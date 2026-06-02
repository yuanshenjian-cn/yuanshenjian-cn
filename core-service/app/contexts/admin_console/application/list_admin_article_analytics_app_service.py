from __future__ import annotations

from app.contexts.admin_console.application.dto.list_admin_article_analytics_dto import (
    ListAdminArticleAnalyticsItemResp,
    ListAdminArticleAnalyticsResp,
)
from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService


class ListAdminArticleAnalyticsAppService:
    def __init__(self, query_service: AdminConsoleQueryService) -> None:
        self._query_service = query_service

    def execute(self) -> ListAdminArticleAnalyticsResp:
        items = [
            ListAdminArticleAnalyticsItemResp(
                article_slug=str(item["article_slug"]),
                pv=int(item["pv"]),
                uv=int(item["uv"]),
            )
            for item in self._query_service.list_article_analytics()
        ]
        return ListAdminArticleAnalyticsResp(items=items)
