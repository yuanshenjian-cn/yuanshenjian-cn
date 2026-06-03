from __future__ import annotations

from app.contexts.visitor_identity.domain.visitor_identity import VisitorIdentity
from app.contexts.visitor_identity.domain.visitor_identity_repository import VisitorIdentityRepository
from app.contexts.visitor_identity.infra.dao.visitor_identity_dao import VisitorIdentityDAO
from app.contexts.visitor_identity.infra.po.visitor_po import VisitorPO


class SQLModelVisitorIdentityRepository(VisitorIdentityRepository):
    def __init__(self, visitor_dao: VisitorIdentityDAO) -> None:
        self._visitor_dao = visitor_dao

    async def get_by_visitor_key_hash(self, visitor_key_hash: str) -> VisitorIdentity | None:
        visitor_po = await self._visitor_dao.get_by_visitor_key_hash(visitor_key_hash)
        return None if visitor_po is None else self._to_domain(visitor_po)

    async def add(self, visitor: VisitorIdentity) -> VisitorIdentity:
        visitor_po = VisitorPO(visitor_key_hash=visitor.visitor_key_hash)
        self._visitor_dao.add(visitor_po)
        await self._visitor_dao.flush()
        await self._visitor_dao.refresh(visitor_po)
        return self._to_domain(visitor_po)

    async def save(self, visitor: VisitorIdentity) -> VisitorIdentity:
        visitor_po = await self._visitor_dao.get_by_visitor_key_hash(visitor.visitor_key_hash)
        if visitor_po is None:
            raise ValueError("visitor_not_found")
        visitor_po.last_seen_at = visitor.last_seen_at
        visitor_po.risk_score = visitor.risk_score
        await self._visitor_dao.flush()
        await self._visitor_dao.refresh(visitor_po)
        return self._to_domain(visitor_po)

    def _to_domain(self, visitor_po: VisitorPO) -> VisitorIdentity:
        return VisitorIdentity(
            id=visitor_po.id,
            visitor_key_hash=visitor_po.visitor_key_hash,
            first_seen_at=visitor_po.first_seen_at,
            last_seen_at=visitor_po.last_seen_at,
            risk_score=visitor_po.risk_score,
            created_at=visitor_po.created_at,
        )
