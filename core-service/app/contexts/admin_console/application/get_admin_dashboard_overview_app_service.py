from __future__ import annotations

from app.contexts.admin_console.application.dto.get_admin_dashboard_overview_dto import GetAdminDashboardOverviewResp
from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService


class GetAdminDashboardOverviewAppService:
    def __init__(self, query_service: AdminConsoleQueryService) -> None:
        self._query_service = query_service

    def execute(self) -> GetAdminDashboardOverviewResp:
        return GetAdminDashboardOverviewResp(**self._query_service.get_dashboard_overview())
