from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.infra.persistence.models import KnowledgeChunk, KnowledgeDocument


class KnowledgeContextQueryService:
    def query_contexts(
        self,
        session: Session,
        query: str,
        article_slug: str | None = None,
        top_k: int = 5,
    ) -> tuple[list[str], list[dict[str, str]]]:
        statement = select(KnowledgeChunk, KnowledgeDocument).join(
            KnowledgeDocument,
            KnowledgeChunk.document_id == KnowledgeDocument.id,
        )
        if article_slug:
            statement = statement.where(KnowledgeDocument.slug == article_slug)
        rows = list(session.execute(statement.limit(top_k)))
        if not rows and article_slug:
            rows = list(
                session.execute(
                    select(KnowledgeChunk, KnowledgeDocument).join(
                        KnowledgeDocument,
                        KnowledgeChunk.document_id == KnowledgeDocument.id,
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
