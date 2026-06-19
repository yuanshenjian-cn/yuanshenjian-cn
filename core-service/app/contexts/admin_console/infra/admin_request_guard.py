from __future__ import annotations

import hmac
import secrets
from datetime import UTC, datetime

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.admin_console.domain.admin_session_repository import AdminSessionRepository
from app.contexts.admin_console.infra.dao.admin_session_dao import AdminSessionDAO
from app.contexts.admin_console.infra.sqlmodel_admin_session_repository import SQLModelAdminSessionRepository
from app.shared.infra.app_config import settings
from app.shared.infra.database import get_session
from app.shared.infra.secret_hash import hash_with_pepper


ADMIN_COOKIE = "admin_session"
CSRF_COOKIE = "csrf_token"
API_KEY_HEADER = "authorization"
API_KEY_PREFIX = "bearer "


def _secure_compare(value: str, expected: str) -> bool:
    if not value or not expected:
        return False
    return hmac.compare_digest(value.encode(), expected.encode())


def build_admin_request_guard(session: AsyncSession) -> AdminRequestGuard:
    repository = SQLModelAdminSessionRepository(AdminSessionDAO(session))
    return AdminRequestGuard(repository, settings.session_secret)


def get_admin_request_guard(session: AsyncSession = Depends(get_session)) -> AdminRequestGuard:
    return build_admin_request_guard(session)


class AdminRequestGuard:
    """Supports both session cookie auth (for UI) and API key auth (for automation)."""

    def __init__(self, repository: AdminSessionRepository, session_secret: str) -> None:
        self._repository = repository
        self._session_secret = session_secret

    async def require_admin(self, request: Request) -> None:
        api_key = self._extract_api_key(request)
        if api_key and _secure_compare(api_key, settings.admin_api_key):
            return

        raw_token = request.cookies.get(ADMIN_COOKIE)
        if not raw_token:
            raise HTTPException(status_code=401, detail="admin_auth_required")
        session_hash = hash_with_pepper(raw_token, self._session_secret)
        admin_session = await self._repository.get_by_session_hash(session_hash)
        if admin_session is None or self._coerce_utc_datetime(admin_session.expires_at) < datetime.now(UTC):
            raise HTTPException(status_code=401, detail="admin_auth_invalid")
        admin_session.touch(datetime.now(UTC))
        await self._repository.save(admin_session)

    def require_csrf(self, request: Request) -> None:
        if self._extract_api_key(request):
            return
        cookie_token = request.cookies.get(CSRF_COOKIE)
        header_token = request.headers.get("x-csrf-token")
        if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
            raise HTTPException(status_code=403, detail="csrf_invalid")

    def _extract_api_key(self, request: Request) -> str | None:
        header_value = request.headers.get(API_KEY_HEADER, "")
        if not header_value.lower().startswith(API_KEY_PREFIX):
            return None
        return header_value[len(API_KEY_PREFIX) :].strip()

    def _coerce_utc_datetime(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


def generate_admin_api_key() -> str:
    return secrets.token_urlsafe(32)
