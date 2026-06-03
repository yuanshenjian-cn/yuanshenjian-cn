from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.admin_console.application.get_admin_ai_usage_overview_app_service import GetAdminAIUsageOverviewAppService
from app.contexts.admin_console.application.get_admin_dashboard_overview_app_service import GetAdminDashboardOverviewAppService
from app.contexts.admin_console.application.get_admin_system_status_app_service import GetAdminSystemStatusAppService
from app.contexts.admin_console.application.dto.get_admin_ai_usage_overview_dto import GetAdminAIUsageOverviewResp
from app.contexts.admin_console.application.dto.get_admin_dashboard_overview_dto import GetAdminDashboardOverviewResp
from app.contexts.admin_console.application.dto.get_admin_system_status_dto import GetAdminSystemStatusResp
from app.contexts.admin_console.application.dto.list_admin_article_analytics_dto import ListAdminArticleAnalyticsResp
from app.contexts.admin_console.application.list_admin_article_analytics_app_service import ListAdminArticleAnalyticsAppService
from app.contexts.admin_console.infra.admin_session_request_guard import AdminSessionRequestGuard
from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService
from app.contexts.admin_console.interface.admin_auth_router import get_admin_session_request_guard
from app.shared.infra.database import get_session

router = APIRouter(prefix="/api/v1/admin")


def build_get_admin_dashboard_overview_service(session: AsyncSession) -> GetAdminDashboardOverviewAppService:
    return GetAdminDashboardOverviewAppService(AdminConsoleQueryService(session))


def get_get_admin_dashboard_overview_service(session: AsyncSession = Depends(get_session)) -> GetAdminDashboardOverviewAppService:
    return build_get_admin_dashboard_overview_service(session)


def build_list_admin_article_analytics_service(session: AsyncSession) -> ListAdminArticleAnalyticsAppService:
    return ListAdminArticleAnalyticsAppService(AdminConsoleQueryService(session))


def get_list_admin_article_analytics_service(session: AsyncSession = Depends(get_session)) -> ListAdminArticleAnalyticsAppService:
    return build_list_admin_article_analytics_service(session)


def build_get_admin_ai_usage_overview_service(session: AsyncSession) -> GetAdminAIUsageOverviewAppService:
    return GetAdminAIUsageOverviewAppService(AdminConsoleQueryService(session))


def get_get_admin_ai_usage_overview_service(session: AsyncSession = Depends(get_session)) -> GetAdminAIUsageOverviewAppService:
    return build_get_admin_ai_usage_overview_service(session)


def build_get_admin_system_status_service(session: AsyncSession) -> GetAdminSystemStatusAppService:
    return GetAdminSystemStatusAppService(AdminConsoleQueryService(session))


def get_get_admin_system_status_service(session: AsyncSession = Depends(get_session)) -> GetAdminSystemStatusAppService:
    return build_get_admin_system_status_service(session)


@router.get("/analytics/overview", response_model=GetAdminDashboardOverviewResp)
async def get_admin_dashboard_overview(
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: GetAdminDashboardOverviewAppService = Depends(get_get_admin_dashboard_overview_service),
) -> GetAdminDashboardOverviewResp:
    await guard.require_admin(request)
    return await service.execute()


@router.get("/analytics/articles", response_model=ListAdminArticleAnalyticsResp)
async def list_admin_article_analytics(
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: ListAdminArticleAnalyticsAppService = Depends(get_list_admin_article_analytics_service),
) -> ListAdminArticleAnalyticsResp:
    await guard.require_admin(request)
    return await service.execute()


@router.get("/ai-usage/overview", response_model=GetAdminAIUsageOverviewResp)
async def get_admin_ai_usage_overview(
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: GetAdminAIUsageOverviewAppService = Depends(get_get_admin_ai_usage_overview_service),
) -> GetAdminAIUsageOverviewResp:
    await guard.require_admin(request)
    return await service.execute()


@router.get("/system/status", response_model=GetAdminSystemStatusResp)
async def get_admin_system_status(
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: GetAdminSystemStatusAppService = Depends(get_get_admin_system_status_service),
) -> GetAdminSystemStatusResp:
    await guard.require_admin(request)
    return await service.execute()
