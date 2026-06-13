from __future__ import annotations

from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_index_run_po import KnowledgeIndexRunPO


class KnowledgeIndexRunDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_latest(self) -> KnowledgeIndexRunPO | None:
        return cast(
            KnowledgeIndexRunPO | None,
            await self._session.scalar(select(KnowledgeIndexRunPO).order_by(KnowledgeIndexRunPO.started_at.desc()).limit(1)),
        )

    def add(self, run: KnowledgeIndexRunPO) -> None:
        self._session.add(run)
