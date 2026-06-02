from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contexts.visitor_identity.infra.po.visitor_po import VisitorPO


class VisitorIdentityDAO:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_visitor_key_hash(self, visitor_key_hash: str) -> VisitorPO | None:
        statement = select(VisitorPO).where(VisitorPO.visitor_key_hash == visitor_key_hash)
        return self._session.scalar(statement)

    def add(self, visitor_po: VisitorPO) -> None:
        self._session.add(visitor_po)

    def flush(self) -> None:
        self._session.flush()

    def refresh(self, visitor_po: VisitorPO) -> None:
        self._session.refresh(visitor_po)
