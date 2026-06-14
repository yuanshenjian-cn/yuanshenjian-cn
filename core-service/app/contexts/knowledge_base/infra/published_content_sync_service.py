from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, cast

import frontmatter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO
from app.contexts.knowledge_base.infra.po.knowledge_source_po import KnowledgeSourcePO
from app.contexts.knowledge_base.infra.po.rag_sync_run_po import RagSyncRunPO
from app.shared.infra.database import transactional_session


class PublishedContentSyncService:
    def content_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def chunk_text(self, content: str, max_chars: int = 1600) -> list[str]:
        normalized = content.strip()
        if not normalized:
            return []
        if len(normalized) <= max_chars:
            return [normalized]
        return [normalized[index : index + max_chars] for index in range(0, len(normalized), max_chars)]

    def should_ingest_frontmatter(self, frontmatter_data: dict[str, Any]) -> bool:
        return frontmatter_data.get("published") is not False

    def canonical_source_id(self, source_type: str, slug: str) -> str:
        return f"{source_type}:{slug}"

    def _parse_published_at(self, metadata: dict[str, Any]) -> datetime | None:
        raw_date = metadata.get("date")
        if isinstance(raw_date, datetime):
            if raw_date.tzinfo is None:
                return raw_date.replace(tzinfo=timezone.utc)
            return raw_date
        if isinstance(raw_date, str):
            try:
                parsed = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed
            except ValueError:
                return None
        return None

    def _format_briefing_date(self, metadata: dict[str, Any]) -> str | None:
        published_at = self._parse_published_at(metadata)
        if published_at is None:
            return None
        return published_at.strftime("%Y-%m-%d")

    def _document_url(self, source_type: str, slug: str, metadata: dict[str, Any]) -> str | None:
        if source_type == "article":
            return f"/articles/{slug}"
        if source_type == "ai_briefing":
            date_str = self._format_briefing_date(metadata)
            return f"/ai/briefings/{date_str}" if date_str else None
        if source_type == "investment_briefing":
            date_str = self._format_briefing_date(metadata)
            return f"/investment/briefings/{date_str}" if date_str else None
        return None

    def _extract_briefing_date_terms(self, metadata: dict[str, Any]) -> list[str]:
        date_str = self._format_briefing_date(metadata)
        if date_str is None:
            return []
        terms = [date_str]
        match = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", date_str)
        if match:
            year, month, day = match.groups()
            terms.append(f"{year}年{int(month)}月{int(day)}日")
            terms.append(f"{int(month)}月{int(day)}日")
            terms.append(f"{year}/{month}/{day}")
        return terms

    def discover_public_content(self, repo_root: Path) -> list[Path]:
        content_root = repo_root / "content"
        if not content_root.exists():
            return []
        return sorted(content_root.glob("**/*.md*"))

    def _source_type_for_path(self, path: Path) -> str:
        value = path.as_posix()
        if "/ai-briefings/" in value:
            return "ai_briefing"
        if "/investment-briefings/" in value:
            return "investment_briefing"
        return "article"

    def _domains_for_path(self, path: Path, source_type: str) -> list[str]:
        value = path.as_posix()
        if "/health/" in value:
            return ["health"]
        if "/investment/" in value or source_type == "investment_briefing":
            return ["investment"]
        if "/swd/ai-coding/" in value or source_type == "ai_briefing":
            return ["ai"]
        return ["article"]

    def _scenes_for_path(self, path: Path, source_type: str) -> list[str]:
        value = path.as_posix()
        if source_type == "article":
            if "/health/" in value:
                return ["article", "health", "health-column"]
            if "/investment/" in value:
                return ["article", "investment", "investment-column"]
            if "/swd/ai-coding/" in value:
                return ["article", "ai", "ai-column"]
            return ["article"]
        if source_type == "ai_briefing":
            return ["ai", "ai-column"]
        if source_type == "investment_briefing":
            return ["investment", "investment-column"]
        return ["article"]

    async def _ensure_default_source(
        self,
        session: AsyncSession,
        *,
        source_type: str,
        domains: list[str],
        scenes: list[str],
    ) -> KnowledgeSourcePO:
        source = cast(
            KnowledgeSourcePO | None,
            await session.scalar(select(KnowledgeSourcePO).where(KnowledgeSourcePO.name == f"系统内容-{source_type}")),
        )
        if source is None:
            source = KnowledgeSourcePO(
                name=f"系统内容-{source_type}",
                source_kind=source_type,
                domains=domains,
                scenes=scenes,
                status="enabled",
                sync_strategy="auto",
                content_config={},
                updated_by="system",
            )
            session.add(source)
            await session.flush()
            return source
        source.domains = domains
        source.scenes = scenes
        return source

    async def sync_public_content(self, repo_root: Path, commit_sha: str = "") -> RagSyncRunPO:
        async with transactional_session() as session:
            sync_run = RagSyncRunPO(status="running", commit_sha=commit_sha or None)
            session.add(sync_run)
            await session.flush()
            await session.refresh(sync_run)
            sync_run_id = sync_run.id

        try:
            async with transactional_session() as session:
                loaded_sync_run = await session.get(RagSyncRunPO, sync_run_id)
                if loaded_sync_run is None:
                    raise RuntimeError("rag_sync_run_not_found")
                sync_run = loaded_sync_run

                paths = self.discover_public_content(repo_root)
                sync_run.documents_seen = len(paths)
                for path in paths:
                    post = frontmatter.loads(path.read_text(encoding="utf-8"))
                    metadata: dict[str, Any] = dict(post.metadata)
                    if not self.should_ingest_frontmatter(metadata):
                        continue
                    slug = path.stem
                    source_type = self._source_type_for_path(path)
                    source_id = self.canonical_source_id(source_type, slug)
                    domains = self._domains_for_path(path, source_type)
                    scenes = self._scenes_for_path(path, source_type)
                    raw_tags = metadata.get("tags", [])
                    tags = [str(tag) for tag in raw_tags if isinstance(tag, str)] if isinstance(raw_tags, list) else []
                    source = await self._ensure_default_source(
                        session,
                        source_type=source_type,
                        domains=domains,
                        scenes=scenes,
                    )
                    document = await session.scalar(
                        select(KnowledgeDocumentPO).where(
                            KnowledgeDocumentPO.source_type == source_type,
                            KnowledgeDocumentPO.source_id == source_id,
                        )
                    )
                    body_hash = self.content_hash(post.content)
                    published_at = self._parse_published_at(metadata)
                    url = self._document_url(source_type, slug, metadata)
                    date_terms = self._extract_briefing_date_terms(metadata)
                    title = str(metadata.get("title") or slug)
                    summary = str(metadata.get("brief") or metadata.get("excerpt") or "")
                    if document is None:
                        document = KnowledgeDocumentPO(
                            source_type=source_type,
                            source_id=source_id,
                            knowledge_source_id=source.id,
                            slug=slug,
                            title=title,
                            url=url,
                            summary=summary,
                            visibility="public",
                            content_hash=body_hash,
                            published_at=published_at,
                            domains=domains,
                            scenes=scenes,
                            tags=tags,
                            metadata_json=metadata,
                        )
                        session.add(document)
                        await session.flush()
                        sync_run.documents_upserted += 1
                    else:
                        document.content_hash = body_hash
                        document.title = title
                        document.summary = summary
                        document.knowledge_source_id = source.id
                        document.published_at = published_at
                        document.url = url
                        document.domains = domains
                        document.scenes = scenes
                        document.tags = tags
                        document.metadata_json = metadata
                        sync_run.documents_upserted += 1

                    heading_prefix = " ".join(date_terms)
                    chunks = self.chunk_text(post.content)
                    existing_chunks = list(await session.scalars(select(KnowledgeChunkPO).where(KnowledgeChunkPO.document_id == document.id)))
                    by_index = {chunk.chunk_index: chunk for chunk in existing_chunks}
                    for index, chunk_body in enumerate(chunks):
                        enriched_body = chunk_body
                        if heading_prefix and index == 0:
                            enriched_body = f"{heading_prefix}\n{chunk_body}"
                        chunk_hash = self.content_hash(enriched_body)
                        chunk = by_index.get(index)
                        if chunk is None:
                            session.add(
                                KnowledgeChunkPO(
                                    document_id=document.id,
                                    chunk_index=index,
                                    heading=document.title,
                                    content=enriched_body,
                                    token_count=max(1, len(enriched_body) // 4),
                                    content_hash=chunk_hash,
                                    embedding=[],
                                    embedding_model="not-generated",
                                    embedding_dimensions=None,
                                    embedding_status="not-generated",
                                    metadata_json={},
                                )
                            )
                            sync_run.chunks_upserted += 1
                        elif chunk.content_hash != chunk_hash:
                            chunk.content = enriched_body
                            chunk.content_hash = chunk_hash
                            chunk.token_count = max(1, len(enriched_body) // 4)
                            chunk.embedding_status = "not-generated"
                            sync_run.chunks_upserted += 1

                    for stale_index, stale_chunk in by_index.items():
                        if stale_index >= len(chunks):
                            await session.delete(stale_chunk)
                            sync_run.chunks_deleted += 1

                sync_run.status = "success"
                await session.flush()
                await session.refresh(sync_run)
                return sync_run
        except Exception as error:
            async with transactional_session() as session:
                loaded_sync_run = await session.get(RagSyncRunPO, sync_run_id)
                if loaded_sync_run is not None:
                    loaded_sync_run.status = "failed"
                    loaded_sync_run.error_message = str(error)
            raise
