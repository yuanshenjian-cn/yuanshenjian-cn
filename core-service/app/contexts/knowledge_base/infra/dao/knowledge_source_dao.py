from __future__ import annotations

from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_source_po import KnowledgeSourcePO


class KnowledgeSourceDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[KnowledgeSourcePO]:
        return list(
            await self._session.scalars(
                select(KnowledgeSourcePO).order_by(KnowledgeSourcePO.updated_at.desc(), KnowledgeSourcePO.created_at.desc())
            )
        )

    async def get_by_id(self, source_id: str) -> KnowledgeSourcePO | None:
        return await self._session.get(KnowledgeSourcePO, source_id)

    async def get_by_name(self, name: str) -> KnowledgeSourcePO | None:
        return cast(KnowledgeSourcePO | None, await self._session.scalar(select(KnowledgeSourcePO).where(KnowledgeSourcePO.name == name)))

    def add(self, source: KnowledgeSourcePO) -> None:
        self._session.add(source)
