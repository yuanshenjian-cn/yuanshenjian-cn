from __future__ import annotations

from app.contexts.admin_console.application.dto.get_admin_dashboard_overview_dto import GetAdminDashboardOverviewResp
from app.contexts.admin_console.domain.admin_console_query_reader import AdminConsoleQueryReader


class GetAdminDashboardOverviewAppService:
    def __init__(self, query_service: AdminConsoleQueryReader) -> None:
        self._query_service = query_service

    async def execute(self) -> GetAdminDashboardOverviewResp:
        return GetAdminDashboardOverviewResp(**await self._query_service.get_dashboard_overview())
