from __future__ import annotations

from pathlib import Path

from app.contexts.knowledge_base.application.dto.save_knowledge_source_dto import SaveKnowledgeSourceResp
from app.contexts.knowledge_base.domain.exceptions import KnowledgeSourceNotFoundError
from app.contexts.knowledge_base.infra.dao.knowledge_index_run_dao import KnowledgeIndexRunDAO
from app.contexts.knowledge_base.infra.dao.knowledge_source_dao import KnowledgeSourceDAO
from app.contexts.knowledge_base.infra.po.knowledge_index_run_po import KnowledgeIndexRunPO
from app.contexts.knowledge_base.infra.published_content_sync_service import PublishedContentSyncService


class RebuildKnowledgeIndexAppService:
    def __init__(
        self,
        source_dao: KnowledgeSourceDAO,
        run_dao: KnowledgeIndexRunDAO,
        sync_service: PublishedContentSyncService,
    ) -> None:
        self._source_dao = source_dao
        self._run_dao = run_dao
        self._sync_service = sync_service

    async def execute(self, source_id: str, repo_root: Path, commit_sha: str = "") -> SaveKnowledgeSourceResp:
        source = await self._source_dao.get_by_id(source_id)
        if source is None:
            raise KnowledgeSourceNotFoundError(source_id)
        self._run_dao.add(
            KnowledgeIndexRunPO(
                status="running",
                trigger="manual",
                source_id=source_id,
                commit_sha=commit_sha or None,
                metadata_json={"source_name": source.name},
            )
        )
        await self._sync_service.sync_public_content(repo_root, commit_sha)
        return SaveKnowledgeSourceResp(id=source.id, status=source.status)
