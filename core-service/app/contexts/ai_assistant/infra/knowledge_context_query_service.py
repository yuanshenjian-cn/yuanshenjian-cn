from __future__ import annotations

from app.contexts.knowledge_base.infra.knowledge_context_query_service import KnowledgeContextQueryService as KnowledgeBaseContextQueryService
from app.shared.infra.database import transactional_session


class KnowledgeContextQueryService:
    async def query(self, query: str, article_slug: str | None = None, top_k: int = 5) -> tuple[list[str], list[dict[str, str]]]:
        async with transactional_session() as session:
            return await KnowledgeBaseContextQueryService().query_contexts(session, query, article_slug, top_k)
