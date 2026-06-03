from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO


class KnowledgeContextQueryService:
    async def query_contexts(
        self,
        session: AsyncSession,
        query: str,
        article_slug: str | None = None,
        top_k: int = 5,
    ) -> tuple[list[str], list[dict[str, str]]]:
        statement = select(KnowledgeChunkPO, KnowledgeDocumentPO).join(
            KnowledgeDocumentPO,
            KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id,
        )
        if article_slug:
            statement = statement.where(KnowledgeDocumentPO.slug == article_slug)
        rows = list(await session.execute(statement.limit(top_k)))
        if not rows and article_slug:
            rows = list(
                await session.execute(
                    select(KnowledgeChunkPO, KnowledgeDocumentPO).join(
                        KnowledgeDocumentPO,
                        KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id,
                    ).limit(top_k)
                )
            )
        contexts: list[str] = []
        references: list[dict[str, str]] = []
        query_terms = [term for term in query.lower().split() if len(term) > 1]
        for chunk, document in rows:
            if query_terms and not any(term in chunk.content.lower() for term in query_terms):
                continue
            contexts.append(chunk.content)
            references.append(
                {
                    "id": chunk.id,
                    "title": document.title,
                    "url": document.url or "",
                    "source_type": "article-section" if document.source_type == "article" else document.source_type,
                    "excerpt": chunk.content[:160],
                }
            )
        return contexts, references
