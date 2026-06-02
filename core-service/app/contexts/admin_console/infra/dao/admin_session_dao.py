from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contexts.admin_console.infra.po.admin_session_po import AdminSessionPO


class AdminSessionDAO:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, admin_session_po: AdminSessionPO) -> None:
        self._session.add(admin_session_po)

    def get_by_session_hash(self, session_hash: str) -> AdminSessionPO | None:
        statement = select(AdminSessionPO).where(AdminSessionPO.session_hash == session_hash)
        return self._session.scalar(statement)

    def flush(self) -> None:
        self._session.flush()

    def refresh(self, admin_session_po: AdminSessionPO) -> None:
        self._session.refresh(admin_session_po)
