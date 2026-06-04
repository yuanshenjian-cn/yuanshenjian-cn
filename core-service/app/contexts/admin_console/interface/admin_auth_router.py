from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.admin_console.application.dto.get_admin_session_profile_dto import GetAdminSessionProfileResp
from app.contexts.admin_console.application.dto.login_admin_session_dto import LoginAdminSessionReq, LoginAdminSessionResp
from app.contexts.admin_console.application.get_admin_session_profile_app_service import GetAdminSessionProfileAppService
from app.contexts.admin_console.application.login_admin_session_app_service import LoginAdminSessionAppService
from app.contexts.admin_console.domain.exceptions import InvalidAdminPasswordError
from app.contexts.admin_console.infra.admin_session_authenticator import RepositoryAdminSessionAuthenticator
from app.contexts.admin_console.infra.admin_session_request_guard import AdminSessionRequestGuard
from app.contexts.admin_console.infra.dao.admin_session_dao import AdminSessionDAO
from app.contexts.admin_console.infra.sqlmodel_admin_session_repository import SQLModelAdminSessionRepository
from app.shared.infra.app_config import settings
from app.shared.infra.database import get_session
from app.shared.infra.pre_auth_rate_limit_guard import PreAuthRateLimitGuard
from app.shared.infra.rate_limit_guard import RateLimitGuard
from app.shared.infra.request_identity_resolver import RequestIdentityResolver
from app.shared.infra.request_security import turnstile_action_for_scene, verify_origin, verify_turnstile

router = APIRouter(prefix="/api/v1/admin")


def build_login_admin_session_service(session: AsyncSession) -> LoginAdminSessionAppService:
    repository = SQLModelAdminSessionRepository(AdminSessionDAO(session))
    return LoginAdminSessionAppService(RepositoryAdminSessionAuthenticator(repository))


def get_login_admin_session_service(session: AsyncSession = Depends(get_session)) -> LoginAdminSessionAppService:
    return build_login_admin_session_service(session)


def build_get_admin_session_profile_service() -> GetAdminSessionProfileAppService:
    return GetAdminSessionProfileAppService()


def get_get_admin_session_profile_service() -> GetAdminSessionProfileAppService:
    return build_get_admin_session_profile_service()


def build_admin_session_request_guard(session: AsyncSession) -> AdminSessionRequestGuard:
    repository = SQLModelAdminSessionRepository(AdminSessionDAO(session))
    return AdminSessionRequestGuard(repository, settings.session_secret)


def get_admin_session_request_guard(session: AsyncSession = Depends(get_session)) -> AdminSessionRequestGuard:
    return build_admin_session_request_guard(session)


@router.post("/auth/login", response_model=LoginAdminSessionResp)
async def login_admin_session(
    payload: LoginAdminSessionReq,
    request: Request,
    response: Response,
    service: LoginAdminSessionAppService = Depends(get_login_admin_session_service),
) -> LoginAdminSessionResp:
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    subject = await RequestIdentityResolver().resolve_public_subject(request, response)
    await PreAuthRateLimitGuard().enforce("admin_login", subject)
    verified = await verify_turnstile(payload.turnstile_token, turnstile_action_for_scene("admin-login"), subject.raw_ip)
    if not verified:
        raise HTTPException(status_code=403, detail="turnstile_failed")
    await RateLimitGuard().enforce("admin_login", subject)
    try:
        result = await service.execute(payload)
        response.set_cookie(
            "admin_session",
            result.raw_session_token,
            httponly=True,
            secure=settings.app_env == "production",
            samesite="lax",
            domain=settings.cookie_domain if settings.app_env == "production" else None,
            path="/api/v1/admin",
            max_age=60 * 60 * 24 * 7,
        )
        response.set_cookie(
            "csrf_token",
            result.response.csrf_token,
            httponly=False,
            secure=settings.app_env == "production",
            samesite="lax",
            domain=settings.cookie_domain if settings.app_env == "production" else None,
            path="/",
            max_age=60 * 60 * 24 * 7,
        )
        return result.response
    except InvalidAdminPasswordError as error:
        raise HTTPException(status_code=401, detail=error.error_code) from error


@router.post("/auth/logout")
async def logout_admin_session(
    request: Request,
    response: Response,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
) -> dict[str, bool]:
    await guard.require_admin(request)
    guard.require_csrf(request)
    response.delete_cookie("admin_session", path="/api/v1/admin", domain=settings.cookie_domain if settings.app_env == "production" else None)
    response.delete_cookie("csrf_token", path="/", domain=settings.cookie_domain if settings.app_env == "production" else None)
    return {"ok": True}


@router.get("/me", response_model=GetAdminSessionProfileResp)
async def get_admin_session_profile(
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: GetAdminSessionProfileAppService = Depends(get_get_admin_session_profile_service),
) -> GetAdminSessionProfileResp:
    await guard.require_admin(request)
    return service.execute()
