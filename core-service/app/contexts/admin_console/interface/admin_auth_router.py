from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.contexts.admin_console.application.dto.get_admin_session_profile_dto import GetAdminSessionProfileResp
from app.contexts.admin_console.application.dto.login_admin_session_dto import LoginAdminSessionReq, LoginAdminSessionResp
from app.contexts.admin_console.application.get_admin_session_profile_app_service import GetAdminSessionProfileAppService
from app.contexts.admin_console.application.login_admin_session_app_service import LoginAdminSessionAppService
from app.shared.config import settings
from app.shared.rate_limit import admin_login_limiter
from app.shared.security import require_admin, require_csrf, turnstile_action_for_scene, verify_origin, verify_turnstile
from app.shared.infra.database import get_session

router = APIRouter(prefix="/api/v1/admin")


def build_login_admin_session_service() -> LoginAdminSessionAppService:
    return LoginAdminSessionAppService()


def get_login_admin_session_service() -> LoginAdminSessionAppService:
    return build_login_admin_session_service()


def build_get_admin_session_profile_service() -> GetAdminSessionProfileAppService:
    return GetAdminSessionProfileAppService()


def get_get_admin_session_profile_service() -> GetAdminSessionProfileAppService:
    return build_get_admin_session_profile_service()


@router.post("/auth/login", response_model=LoginAdminSessionResp)
async def login_admin_session(
    payload: LoginAdminSessionReq,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
    service: LoginAdminSessionAppService = Depends(get_login_admin_session_service),
) -> LoginAdminSessionResp:
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    bucket_key = request.client.host if request.client else "unknown"
    if not admin_login_limiter.hit(bucket_key):
        raise HTTPException(status_code=429, detail="admin_login_rate_limited")
    verified = await verify_turnstile(payload.turnstile_token, turnstile_action_for_scene("admin-login"), request.client.host if request.client else None)
    if not verified:
        raise HTTPException(status_code=403, detail="turnstile_failed")
    try:
        return service.execute(payload, session, response)
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error


@router.post("/auth/logout")
def logout_admin_session(request: Request, response: Response, session: Session = Depends(get_session)) -> dict[str, bool]:
    require_admin(session, request)
    require_csrf(request)
    response.delete_cookie("admin_session", path="/api/v1/admin", domain=settings.cookie_domain if settings.app_env == "production" else None)
    response.delete_cookie("csrf_token", path="/", domain=settings.cookie_domain if settings.app_env == "production" else None)
    return {"ok": True}


@router.get("/me", response_model=GetAdminSessionProfileResp)
def get_admin_session_profile(
    request: Request,
    session: Session = Depends(get_session),
    service: GetAdminSessionProfileAppService = Depends(get_get_admin_session_profile_service),
) -> GetAdminSessionProfileResp:
    require_admin(session, request)
    return service.execute()
