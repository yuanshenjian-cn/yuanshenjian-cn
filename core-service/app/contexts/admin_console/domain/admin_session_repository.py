from __future__ import annotations

from typing import Protocol

from app.contexts.admin_console.domain.admin_session import AdminSession


class AdminSessionRepository(Protocol):
    def add(self, admin_session: AdminSession) -> AdminSession:
        ...

    def get_by_session_hash(self, session_hash: str) -> AdminSession | None:
        ...

    def save(self, admin_session: AdminSession) -> AdminSession:
        ...
