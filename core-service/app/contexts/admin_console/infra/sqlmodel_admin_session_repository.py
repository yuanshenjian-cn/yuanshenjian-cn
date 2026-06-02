from __future__ import annotations

from app.contexts.admin_console.domain.admin_session import AdminSession
from app.contexts.admin_console.domain.admin_session_repository import AdminSessionRepository
from app.contexts.admin_console.infra.dao.admin_session_dao import AdminSessionDAO
from app.contexts.admin_console.infra.po.admin_session_po import AdminSessionPO


class SQLModelAdminSessionRepository(AdminSessionRepository):
    def __init__(self, admin_session_dao: AdminSessionDAO) -> None:
        self._admin_session_dao = admin_session_dao

    def add(self, admin_session: AdminSession) -> AdminSession:
        admin_session_po = AdminSessionPO(
            session_hash=admin_session.session_hash,
            expires_at=admin_session.expires_at,
        )
        self._admin_session_dao.add(admin_session_po)
        self._admin_session_dao.flush()
        self._admin_session_dao.refresh(admin_session_po)
        return self._to_domain(admin_session_po)

    def get_by_session_hash(self, session_hash: str) -> AdminSession | None:
        admin_session_po = self._admin_session_dao.get_by_session_hash(session_hash)
        return None if admin_session_po is None else self._to_domain(admin_session_po)

    def save(self, admin_session: AdminSession) -> AdminSession:
        admin_session_po = self._admin_session_dao.get_by_session_hash(admin_session.session_hash)
        if admin_session_po is None:
            raise ValueError("admin_session_not_found")
        admin_session_po.last_seen_at = admin_session.last_seen_at
        self._admin_session_dao.flush()
        self._admin_session_dao.refresh(admin_session_po)
        return self._to_domain(admin_session_po)

    def _to_domain(self, admin_session_po: AdminSessionPO) -> AdminSession:
        return AdminSession(
            id=admin_session_po.id,
            session_hash=admin_session_po.session_hash,
            expires_at=admin_session_po.expires_at,
            created_at=admin_session_po.created_at,
            last_seen_at=admin_session_po.last_seen_at,
        )
