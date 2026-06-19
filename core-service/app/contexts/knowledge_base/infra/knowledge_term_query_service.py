from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class KnowledgeTermQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_terms(self) -> list[dict[str, object]]:
        rows = list(
            await self._session.scalars(
                select(KnowledgeTermPO).order_by(KnowledgeTermPO.updated_at.desc(), KnowledgeTermPO.created_at.desc())
            )
        )
        return [self._to_dict(item) for item in rows]

    async def list_terms_page(
        self,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[dict[str, object]], int]:
        total = await self._session.scalar(select(func.count()).select_from(KnowledgeTermPO))
        rows = list(
            await self._session.scalars(
                select(KnowledgeTermPO)
                .order_by(KnowledgeTermPO.updated_at.desc(), KnowledgeTermPO.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return [self._to_dict(item) for item in rows], total or 0

    def _to_dict(self, item: KnowledgeTermPO) -> dict[str, object]:
        return {
            "id": item.id,
            "term": item.term,
            "aliases": list(item.aliases or []),
            "definition": item.definition,
            "explanation": item.explanation,
            "related_article_slugs": list(item.related_article_slugs or []),
            "domains": list(item.domains or []),
            "scenes": list(item.scenes or []),
            "status": item.status,
            "notes": item.notes,
            "updated_by": item.updated_by,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat(),
        }

    async def list_enabled_terms(self) -> list[dict[str, object]]:
        rows = list(
            await self._session.scalars(
                select(KnowledgeTermPO)
                .where(KnowledgeTermPO.status == "enabled")
                .order_by(KnowledgeTermPO.term)
            )
        )
        return [
            {
                "id": item.id,
                "term": item.term,
                "aliases": list(item.aliases or []),
                "definition": item.definition,
                "explanation": item.explanation,
                "related_article_slugs": list(item.related_article_slugs or []),
                "domains": list(item.domains or []),
                "scenes": list(item.scenes or []),
            }
            for item in rows
        ]
