from __future__ import annotations

from app.contexts.admin_console.application.dto.get_admin_ai_usage_overview_dto import GetAdminAIUsageOverviewResp
from app.contexts.admin_console.domain.admin_console_query_reader import AdminConsoleQueryReader


class GetAdminAIUsageOverviewAppService:
    def __init__(self, query_service: AdminConsoleQueryReader) -> None:
        self._query_service = query_service

    async def execute(self) -> GetAdminAIUsageOverviewResp:
        payload = await self._query_service.get_ai_usage_overview()
        items = payload.get("items")
        raw_total_requests = payload.get("total_requests")
        return GetAdminAIUsageOverviewResp(
            total_requests=raw_total_requests if isinstance(raw_total_requests, int) else 0,
            items=items if isinstance(items, list) else [],
        )
