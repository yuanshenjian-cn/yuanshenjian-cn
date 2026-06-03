from __future__ import annotations

import hmac
from datetime import UTC, datetime

from fastapi import HTTPException, Request

from app.contexts.admin_console.domain.admin_session_repository import AdminSessionRepository
from app.shared.infra.secret_hash import hash_with_pepper

ADMIN_COOKIE = "admin_session"
CSRF_COOKIE = "csrf_token"


class AdminSessionRequestGuard:
    def __init__(self, repository: AdminSessionRepository, session_secret: str) -> None:
        self._repository = repository
        self._session_secret = session_secret

    async def require_admin(self, request: Request) -> None:
        raw_token = request.cookies.get(ADMIN_COOKIE)
        if not raw_token:
            raise HTTPException(status_code=401, detail="admin_session_required")
        session_hash = hash_with_pepper(raw_token, self._session_secret)
        admin_session = await self._repository.get_by_session_hash(session_hash)
        if admin_session is None or self._coerce_utc_datetime(admin_session.expires_at) < datetime.now(UTC):
            raise HTTPException(status_code=401, detail="admin_session_invalid")
        admin_session.touch(datetime.now(UTC))
        await self._repository.save(admin_session)

    def require_csrf(self, request: Request) -> None:
        cookie_token = request.cookies.get(CSRF_COOKIE)
        header_token = request.headers.get("x-csrf-token")
        if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
            raise HTTPException(status_code=403, detail="csrf_invalid")

    def _coerce_utc_datetime(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
