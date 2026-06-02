from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import frontmatter
from sqlalchemy import select

from app.shared.infra.persistence.models import KnowledgeChunk, KnowledgeDocument, RagSyncRun
from app.shared.infra.database import SessionLocal


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

    def sync_public_content(self, repo_root: Path, commit_sha: str = "") -> RagSyncRun:
        session = SessionLocal()
        sync_run = RagSyncRun(status="running", commit_sha=commit_sha or None)
        session.add(sync_run)
        session.commit()
        try:
            paths = self.discover_public_content(repo_root)
            sync_run.documents_seen = len(paths)
            for path in paths:
                post = frontmatter.loads(path.read_text(encoding="utf-8"))
                if not self.should_ingest_frontmatter(dict(post.metadata)):
                    continue
                slug = path.stem
                source_type = self._source_type_for_path(path)
                source_id = self.canonical_source_id(source_type, slug)
                document = session.scalar(
                    select(KnowledgeDocument).where(
                        KnowledgeDocument.source_type == source_type,
                        KnowledgeDocument.source_id == source_id,
                    )
                )
                body_hash = self.content_hash(post.content)
                if document is None:
                    document = KnowledgeDocument(
                        source_type=source_type,
                        source_id=source_id,
                        slug=slug,
                        title=str(post.metadata.get("title") or slug),
                        url=f"/articles/{slug}" if source_type == "article" else None,
                        summary=str(post.metadata.get("brief") or post.metadata.get("excerpt") or ""),
                        visibility="public",
                        content_hash=body_hash,
                        metadata_json=dict(post.metadata),
                    )
                    session.add(document)
                    session.flush()
                    sync_run.documents_upserted += 1
                elif document.content_hash != body_hash:
                    document.content_hash = body_hash
                    document.title = str(post.metadata.get("title") or slug)
                    document.summary = str(post.metadata.get("brief") or post.metadata.get("excerpt") or "")
                    document.metadata_json = dict(post.metadata)
                    sync_run.documents_upserted += 1
                chunks = self.chunk_text(post.content)
                existing_chunks = list(session.scalars(select(KnowledgeChunk).where(KnowledgeChunk.document_id == document.id)))
                by_index = {chunk.chunk_index: chunk for chunk in existing_chunks}
                for index, chunk_body in enumerate(chunks):
                    chunk_hash = self.content_hash(chunk_body)
                    chunk = by_index.get(index)
                    if chunk is None:
                        session.add(
                            KnowledgeChunk(
                                document_id=document.id,
                                chunk_index=index,
                                heading=document.title,
                                content=chunk_body,
                                token_count=max(1, len(chunk_body) // 4),
                                content_hash=chunk_hash,
                                embedding=[],
                                embedding_model="not-generated",
                                metadata_json={},
                            )
                        )
                        sync_run.chunks_upserted += 1
                    elif chunk.content_hash != chunk_hash:
                        chunk.content = chunk_body
                        chunk.content_hash = chunk_hash
                        chunk.token_count = max(1, len(chunk_body) // 4)
                        sync_run.chunks_upserted += 1
                for stale_index, stale_chunk in by_index.items():
                    if stale_index >= len(chunks):
                        session.delete(stale_chunk)
                        sync_run.chunks_deleted += 1
            sync_run.status = "success"
            session.commit()
            session.refresh(sync_run)
            return sync_run
        except Exception as error:
            sync_run.status = "failed"
            sync_run.error_message = str(error)
            session.commit()
            raise
        finally:
            session.close()
