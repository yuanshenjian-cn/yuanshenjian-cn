from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.domain.knowledge_term import normalize_term_related_slugs
from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO
from app.contexts.knowledge_base.infra.po.knowledge_source_po import KnowledgeSourcePO
from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class KnowledgeTermSyncService:
    _SOURCE_TYPE = "glossary"

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _content_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def _chunk_text(self, content: str, max_chars: int = 1200) -> list[str]:
        normalized = content.strip()
        if not normalized:
            return []
        if len(normalized) <= max_chars:
            return [normalized]
        return [normalized[index : index + max_chars] for index in range(0, len(normalized), max_chars)]

    async def _ensure_source(self) -> KnowledgeSourcePO:
        source = await self._session.scalar(
            select(KnowledgeSourcePO).where(KnowledgeSourcePO.name == "系统内容-glossary")
        )
        if source is None:
            source = KnowledgeSourcePO(
                name="系统内容-glossary",
                source_kind="manual",
                domains=[],
                scenes=[],
                status="enabled",
                sync_strategy="auto",
                content_config={},
                updated_by="system",
            )
            self._session.add(source)
            await self._session.flush()
        return source

    def _build_document_content(self, term: KnowledgeTermPO) -> str:
        lines = [f"# {term.term}", "", f"定义：{term.definition}", "", term.explanation]
        aliases = list(term.aliases or [])
        related_article_slugs = normalize_term_related_slugs(term.related_article_slugs)
        if aliases:
            lines.extend(["", f"别名：{', '.join(aliases)}"])
        if related_article_slugs:
            lines.extend(["", "相关文章："])
            for slug in related_article_slugs:
                lines.append(f"- /articles/{slug}")
        return "\n".join(lines)

    async def sync_term(self, term: KnowledgeTermPO) -> None:
        source_id = f"glossary:{term.id}"
        document = await self._session.scalar(
            select(KnowledgeDocumentPO).where(
                KnowledgeDocumentPO.source_type == self._SOURCE_TYPE,
                KnowledgeDocumentPO.source_id == source_id,
            )
        )

        if term.status != "enabled":
            if document is not None:
                stale_chunks = list(await self._session.scalars(select(KnowledgeChunkPO).where(KnowledgeChunkPO.document_id == document.id)))
                for stale_chunk in stale_chunks:
                    await self._session.delete(stale_chunk)
                await self._session.delete(document)
            return

        source = await self._ensure_source()
        content = self._build_document_content(term)
        content_hash = self._content_hash(content)

        if document is None:
            document = KnowledgeDocumentPO(
                source_type=self._SOURCE_TYPE,
                source_id=source_id,
                knowledge_source_id=source.id,
                slug=f"glossary-{term.id}",
                title=term.term,
                url=None,
                summary=term.definition,
                visibility="public",
                content_hash=content_hash,
                published_at=datetime.now(timezone.utc),
                domains=list(term.domains or []),
                scenes=list(term.scenes or []),
                tags=[],
                metadata_json={"term_id": term.id, "aliases": list(term.aliases or [])},
            )
            self._session.add(document)
            await self._session.flush()
        else:
            document.title = term.term
            document.summary = term.definition
            document.content_hash = content_hash
            document.domains = list(term.domains or [])
            document.scenes = list(term.scenes or [])
            document.metadata_json = {"term_id": term.id, "aliases": list(term.aliases or [])}

        chunks = self._chunk_text(content)
        existing_chunks = list(
            await self._session.scalars(select(KnowledgeChunkPO).where(KnowledgeChunkPO.document_id == document.id))
        )
        by_index = {chunk.chunk_index: chunk for chunk in existing_chunks}

        for index, chunk_body in enumerate(chunks):
            chunk_hash = self._content_hash(chunk_body)
            chunk = by_index.get(index)
            if chunk is None:
                self._session.add(
                    KnowledgeChunkPO(
                        document_id=document.id,
                        chunk_index=index,
                        heading=term.term,
                        content=chunk_body,
                        token_count=max(1, len(chunk_body) // 4),
                        content_hash=chunk_hash,
                        embedding=[],
                        embedding_model="not-generated",
                        embedding_dimensions=None,
                        embedding_status="not-generated",
                        metadata_json={},
                    )
                )
            elif chunk.content_hash != chunk_hash:
                chunk.content = chunk_body
                chunk.content_hash = chunk_hash
                chunk.token_count = max(1, len(chunk_body) // 4)
                chunk.embedding_status = "not-generated"

        for stale_index, stale_chunk in by_index.items():
            if stale_index >= len(chunks):
                await self._session.delete(stale_chunk)

    async def sync_all_terms(self) -> int:
        terms = list(await self._session.scalars(select(KnowledgeTermPO)))
        for term in terms:
            await self.sync_term(term)
        return len(terms)
