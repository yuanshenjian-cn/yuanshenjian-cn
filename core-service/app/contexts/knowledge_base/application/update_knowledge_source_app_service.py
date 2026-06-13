from __future__ import annotations

from app.contexts.knowledge_base.application.dto.save_knowledge_source_dto import SaveKnowledgeSourceReq, SaveKnowledgeSourceResp
from app.contexts.knowledge_base.domain.exceptions import KnowledgeSourceNotFoundError, KnowledgeSourceValidationError
from app.contexts.knowledge_base.domain.knowledge_source import KnowledgeSourceKind, KnowledgeSourceStatus, normalize_source_domains, normalize_source_scenes
from app.contexts.knowledge_base.infra.dao.knowledge_source_dao import KnowledgeSourceDAO


class UpdateKnowledgeSourceAppService:
    def __init__(self, source_dao: KnowledgeSourceDAO) -> None:
        self._source_dao = source_dao

    async def execute(self, source_id: str, req: SaveKnowledgeSourceReq) -> SaveKnowledgeSourceResp:
        source = await self._source_dao.get_by_id(source_id)
        if source is None:
            raise KnowledgeSourceNotFoundError(source_id)
        if req.source_kind not in {item.value for item in KnowledgeSourceKind}:
            raise KnowledgeSourceValidationError("knowledge_source_kind_invalid", "知识源类型不合法")
        if req.status not in {item.value for item in KnowledgeSourceStatus}:
            raise KnowledgeSourceValidationError("knowledge_source_status_invalid", "知识源状态不合法")

        source.name = req.name.strip()
        source.source_kind = req.source_kind
        source.domains = normalize_source_domains(req.domains)
        source.scenes = normalize_source_scenes(req.scenes)
        source.status = req.status
        source.source_uri = req.source_uri.strip() if isinstance(req.source_uri, str) and req.source_uri.strip() else None
        source.sync_strategy = req.sync_strategy.strip() or "manual"
        source.content_config = dict(req.content_config)
        source.notes = req.notes.strip() if isinstance(req.notes, str) and req.notes.strip() else None
        source.updated_by = req.updated_by.strip() if isinstance(req.updated_by, str) and req.updated_by.strip() else None
        return SaveKnowledgeSourceResp(id=source.id, status=source.status)
