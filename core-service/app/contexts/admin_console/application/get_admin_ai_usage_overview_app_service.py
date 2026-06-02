from __future__ import annotations

from app.contexts.admin_console.application.dto.get_admin_ai_usage_overview_dto import GetAdminAIUsageOverviewResp
from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService


class GetAdminAIUsageOverviewAppService:
    def __init__(self, query_service: AdminConsoleQueryService) -> None:
        self._query_service = query_service

    def execute(self) -> GetAdminAIUsageOverviewResp:
        payload = self._query_service.get_ai_usage_overview()
        items = payload.get("items")
        raw_total_requests = payload.get("total_requests")
        return GetAdminAIUsageOverviewResp(
            total_requests=raw_total_requests if isinstance(raw_total_requests, int) else 0,
            items=items if isinstance(items, list) else [],
        )
