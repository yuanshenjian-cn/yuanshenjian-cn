from __future__ import annotations

from typing import cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class KnowledgeTermDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[KnowledgeTermPO]:
        return list(
            await self._session.scalars(
                select(KnowledgeTermPO).order_by(KnowledgeTermPO.updated_at.desc(), KnowledgeTermPO.created_at.desc())
            )
        )

    async def list_page(
        self,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[KnowledgeTermPO], int]:
        total = await self._session.scalar(select(func.count()).select_from(KnowledgeTermPO))
        rows = list(
            await self._session.scalars(
                select(KnowledgeTermPO)
                .order_by(KnowledgeTermPO.updated_at.desc(), KnowledgeTermPO.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return rows, total or 0

    async def list_enabled(self) -> list[KnowledgeTermPO]:
        return list(
            await self._session.scalars(
                select(KnowledgeTermPO)
                .where(KnowledgeTermPO.status == "enabled")
                .order_by(KnowledgeTermPO.term)
            )
        )

    async def get_by_id(self, term_id: str) -> KnowledgeTermPO | None:
        return await self._session.get(KnowledgeTermPO, term_id)

    async def get_by_term(self, term: str) -> KnowledgeTermPO | None:
        return cast(
            KnowledgeTermPO | None,
            await self._session.scalar(select(KnowledgeTermPO).where(KnowledgeTermPO.term == term)),
        )

    def add(self, term: KnowledgeTermPO) -> None:
        self._session.add(term)

    async def delete(self, term: KnowledgeTermPO) -> None:
        await self._session.delete(term)
