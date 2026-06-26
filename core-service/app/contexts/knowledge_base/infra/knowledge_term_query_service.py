from __future__ import annotations

from typing import Any

from sqlalchemy import Text, cast, func, literal, select
from sqlalchemy.sql.elements import ColumnElement
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
        term: str | None = None,
        scene: str | None = None,
        domain: str | None = None,
        include_total: bool = True,
    ) -> tuple[list[dict[str, object]], int | None]:
        query = select(KnowledgeTermPO)
        count_query = select(func.count()).select_from(KnowledgeTermPO)
        filters: list[ColumnElement[bool]] = []

        if term and term.strip():
            keyword = f"%{term.strip()}%"
            filters.append(KnowledgeTermPO.term.ilike(keyword))
        if scene and scene.strip():
            filters.append(self._json_array_contains(KnowledgeTermPO.scenes, scene.strip()))
        if domain and domain.strip():
            filters.append(self._json_array_contains(KnowledgeTermPO.domains, domain.strip()))

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total = await self._session.scalar(count_query) if include_total else None
        rows = list(
            await self._session.scalars(
                query
                .order_by(KnowledgeTermPO.updated_at.desc(), KnowledgeTermPO.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return [self._to_dict(item) for item in rows], total

    def _json_array_contains(self, column: Any, value: str) -> ColumnElement[bool]:
        return cast(column, Text).like(literal(f'%"{value}"%'))

    def _to_dict(self, item: KnowledgeTermPO) -> dict[str, object]:
        return {
            "id": item.id,
            "term": item.term,
            "aliases": list(item.aliases or []),
            "definition": item.definition,
            "explanation": item.explanation,
            "related_article_slugs": list(item.related_article_slugs or []),
            "references": list(item.references or []),
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
                "references": list(item.references or []),
                "domains": list(item.domains or []),
                "scenes": list(item.scenes or []),
            }
            for item in rows
        ]
