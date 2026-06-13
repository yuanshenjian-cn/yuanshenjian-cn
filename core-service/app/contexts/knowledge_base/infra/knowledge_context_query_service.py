from __future__ import annotations

import re

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO


class KnowledgeContextQueryService:
    _ARTICLE_NAVIGATION_PHRASES = (
        "有哪些文章",
        "文章有哪些",
        "推荐文章",
        "推荐阅读",
        "下一篇看什么",
        "先看哪篇",
        "先看什么",
        "阅读顺序",
    )

    def _reference_source_type(self, source_type: str) -> str:
        if source_type == "article":
            return "article-section"
        if source_type == "ai_briefing":
            return "ai-section"
        if source_type == "investment_briefing":
            return "investment-section"
        return source_type

    def _query_terms(self, query: str) -> list[str]:
        normalized = query.lower()
        terms = set(re.findall(r"[a-z0-9][a-z0-9_-]{1,}", normalized))
        for sequence in re.findall(r"[\u4e00-\u9fff]{2,}", normalized):
            max_size = min(6, len(sequence))
            for size in range(2, max_size + 1):
                for start in range(0, len(sequence) - size + 1):
                    terms.add(sequence[start : start + size])
        return sorted(terms, key=len, reverse=True)

    def _is_article_navigation_query(self, query: str) -> bool:
        normalized = query.replace(" ", "")
        return any(phrase in normalized for phrase in self._ARTICLE_NAVIGATION_PHRASES)

    def _match_score(self, query_terms: list[str], chunk: KnowledgeChunkPO, document: KnowledgeDocumentPO) -> int:
        if not query_terms:
            return 0
        title_text = f"{document.title}\n{chunk.heading or ''}".lower()
        content_text = chunk.content.lower()
        score = 0
        for term in query_terms:
            if term in title_text:
                score += len(term) * 3
            if term in content_text:
                score += len(term)
        return score

    async def query_contexts(
        self,
        session: AsyncSession,
        query: str,
        article_slug: str | None = None,
        top_k: int = 5,
        *,
        scene: str | None = None,
        domain: str | None = None,
        page_slug: str | None = None,
    ) -> tuple[list[str], list[dict[str, str]]]:
        candidate_limit = max(top_k * 20, 50)

        def build_statement(*, include_page_slug: bool) -> Select[tuple[KnowledgeChunkPO, KnowledgeDocumentPO]]:
            statement = select(KnowledgeChunkPO, KnowledgeDocumentPO).join(
                KnowledgeDocumentPO,
                KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id,
            )
            if article_slug:
                statement = statement.where(KnowledgeDocumentPO.slug == article_slug)
            if include_page_slug and page_slug:
                statement = statement.where(or_(KnowledgeDocumentPO.slug == page_slug, KnowledgeDocumentPO.source_id == page_slug))
            if scene:
                statement = statement.where(or_(KnowledgeDocumentPO.scenes.is_(None), KnowledgeDocumentPO.scenes.contains([scene])))
            if domain:
                statement = statement.where(or_(KnowledgeDocumentPO.domains.is_(None), KnowledgeDocumentPO.domains.contains([domain])))
            return statement.limit(candidate_limit)

        rows = list(await session.execute(build_statement(include_page_slug=True)))
        if not rows and page_slug and not article_slug:
            rows = list(await session.execute(build_statement(include_page_slug=False)))
        if not rows and not (article_slug or page_slug or scene or domain):
            rows = list(
                await session.execute(
                    select(KnowledgeChunkPO, KnowledgeDocumentPO).join(
                        KnowledgeDocumentPO,
                        KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id,
                    ).limit(candidate_limit)
                )
            )
        contexts: list[str] = []
        references: list[dict[str, str]] = []
        is_article_navigation_query = self._is_article_navigation_query(query)
        query_terms = [] if is_article_navigation_query else self._query_terms(query)
        scored_rows: list[tuple[int, KnowledgeChunkPO, KnowledgeDocumentPO]] = []
        seen_documents: set[str] = set()
        for chunk, document in rows:
            document_key = document.url or document.title
            if is_article_navigation_query and document_key in seen_documents:
                continue
            score = self._match_score(query_terms, chunk, document)
            if query_terms and score <= 0:
                continue
            seen_documents.add(document_key)
            scored_rows.append((score, chunk, document))
        scored_rows.sort(key=lambda item: item[0], reverse=True)
        for _, chunk, document in scored_rows[:top_k]:
            contexts.append(chunk.content)
            references.append(
                {
                    "id": chunk.id,
                    "title": document.title,
                    "url": document.url or "",
                    "source_type": self._reference_source_type(document.source_type),
                    "excerpt": chunk.content[:160],
                }
            )
        return contexts, references
