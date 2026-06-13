from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_source_po import KnowledgeSourcePO


class KnowledgeSourceQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_sources(self) -> list[dict[str, object]]:
        rows = list(
            await self._session.scalars(
                select(KnowledgeSourcePO).order_by(KnowledgeSourcePO.updated_at.desc(), KnowledgeSourcePO.created_at.desc())
            )
        )
        return [
            {
                "id": item.id,
                "name": item.name,
                "source_kind": item.source_kind,
                "domains": list(item.domains or []),
                "scenes": list(item.scenes or []),
                "status": item.status,
                "source_uri": item.source_uri,
                "sync_strategy": item.sync_strategy,
                "content_config": dict(item.content_config or {}),
                "notes": item.notes,
                "updated_by": item.updated_by,
                "created_at": item.created_at.isoformat(),
                "updated_at": item.updated_at.isoformat(),
            }
            for item in rows
        ]
