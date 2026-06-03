from __future__ import annotations

import hmac
from datetime import UTC, datetime, timedelta

from app.contexts.admin_console.domain.admin_session import AdminSession
from app.contexts.admin_console.domain.admin_session_authenticator import AdminSessionAuthenticator, IssuedAdminSession
from app.contexts.admin_console.domain.admin_session_repository import AdminSessionRepository
from app.shared.infra.app_config import settings
from app.shared.infra.secret_hash import create_secret_token, hash_with_pepper


class RepositoryAdminSessionAuthenticator(AdminSessionAuthenticator):
    def __init__(self, repository: AdminSessionRepository) -> None:
        self._repository = repository

    def verify_admin_password(self, password: str) -> bool:
        if not settings.admin_secret_hash:
            return False
        password_hash = hash_with_pepper(password, settings.session_secret)
        return hmac.compare_digest(password_hash, settings.admin_secret_hash)

    async def issue_admin_session(self) -> IssuedAdminSession:
        raw_session_token = create_secret_token()
        session_hash = hash_with_pepper(raw_session_token, settings.session_secret)
        await self._repository.add(
            AdminSession(
                id="",
                session_hash=session_hash,
                expires_at=datetime.now(UTC) + timedelta(days=7),
                created_at=datetime.now(UTC),
                last_seen_at=datetime.now(UTC),
            )
        )
        return IssuedAdminSession(raw_session_token=raw_session_token, csrf_token=create_secret_token())
