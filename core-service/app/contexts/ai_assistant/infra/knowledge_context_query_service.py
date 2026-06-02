from __future__ import annotations

from app.contexts.knowledge_base.infra.knowledge_context_query_service import KnowledgeContextQueryService as KnowledgeBaseContextQueryService
from app.shared.infra.database import transactional_session


class KnowledgeContextQueryService:
    def query(self, query: str, article_slug: str | None = None, top_k: int = 5) -> tuple[list[str], list[dict[str, str]]]:
        with transactional_session() as session:
            return KnowledgeBaseContextQueryService().query_contexts(session, query, article_slug, top_k)
