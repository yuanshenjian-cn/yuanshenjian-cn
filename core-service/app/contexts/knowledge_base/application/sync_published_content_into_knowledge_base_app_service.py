from __future__ import annotations

from pathlib import Path

from app.contexts.knowledge_base.infra.published_content_sync_service import PublishedContentSyncService
from app.contexts.knowledge_base.infra.po.rag_sync_run_po import RagSyncRunPO


class SyncPublishedContentIntoKnowledgeBaseAppService:
    def __init__(self, sync_service: PublishedContentSyncService) -> None:
        self._sync_service = sync_service

    async def execute(self, repo_root: Path, commit_sha: str = "") -> RagSyncRunPO:
        return await self._sync_service.sync_public_content(repo_root, commit_sha)
