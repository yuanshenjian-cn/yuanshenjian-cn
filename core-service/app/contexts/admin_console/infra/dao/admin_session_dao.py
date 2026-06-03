from __future__ import annotations

from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.admin_console.infra.po.admin_session_po import AdminSessionPO


class AdminSessionDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def add(self, admin_session_po: AdminSessionPO) -> None:
        self._session.add(admin_session_po)

    async def get_by_session_hash(self, session_hash: str) -> AdminSessionPO | None:
        statement = select(AdminSessionPO).where(AdminSessionPO.session_hash == session_hash)
        return cast(AdminSessionPO | None, await self._session.scalar(statement))

    async def flush(self) -> None:
        await self._session.flush()

    async def refresh(self, admin_session_po: AdminSessionPO) -> None:
        await self._session.refresh(admin_session_po)
