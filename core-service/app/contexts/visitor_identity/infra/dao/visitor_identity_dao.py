from __future__ import annotations

from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.visitor_identity.infra.po.visitor_po import VisitorPO


class VisitorIdentityDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_visitor_key_hash(self, visitor_key_hash: str) -> VisitorPO | None:
        statement = select(VisitorPO).where(VisitorPO.visitor_key_hash == visitor_key_hash)
        return cast(VisitorPO | None, await self._session.scalar(statement))

    def add(self, visitor_po: VisitorPO) -> None:
        self._session.add(visitor_po)

    async def flush(self) -> None:
        await self._session.flush()

    async def refresh(self, visitor_po: VisitorPO) -> None:
        await self._session.refresh(visitor_po)
