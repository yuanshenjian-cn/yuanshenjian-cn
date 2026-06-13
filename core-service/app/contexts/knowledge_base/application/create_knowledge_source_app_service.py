from __future__ import annotations

from app.contexts.knowledge_base.application.dto.save_knowledge_source_dto import SaveKnowledgeSourceReq, SaveKnowledgeSourceResp
from app.contexts.knowledge_base.domain.exceptions import KnowledgeSourceValidationError
from app.contexts.knowledge_base.domain.knowledge_source import KnowledgeSourceKind, KnowledgeSourceStatus, normalize_source_domains, normalize_source_scenes
from app.contexts.knowledge_base.infra.dao.knowledge_source_dao import KnowledgeSourceDAO
from app.contexts.knowledge_base.infra.po.knowledge_source_po import KnowledgeSourcePO


class CreateKnowledgeSourceAppService:
    def __init__(self, source_dao: KnowledgeSourceDAO) -> None:
        self._source_dao = source_dao

    async def execute(self, req: SaveKnowledgeSourceReq) -> SaveKnowledgeSourceResp:
        if req.source_kind not in {item.value for item in KnowledgeSourceKind}:
            raise KnowledgeSourceValidationError("knowledge_source_kind_invalid", "知识源类型不合法")
        if req.status not in {item.value for item in KnowledgeSourceStatus}:
            raise KnowledgeSourceValidationError("knowledge_source_status_invalid", "知识源状态不合法")
        if await self._source_dao.get_by_name(req.name.strip()) is not None:
            raise KnowledgeSourceValidationError("knowledge_source_name_conflict", "知识源名称已存在")
        source = KnowledgeSourcePO(
            name=req.name.strip(),
            source_kind=req.source_kind,
            domains=normalize_source_domains(req.domains),
            scenes=normalize_source_scenes(req.scenes),
            status=req.status,
            source_uri=req.source_uri.strip() if isinstance(req.source_uri, str) and req.source_uri.strip() else None,
            sync_strategy=req.sync_strategy.strip() or "manual",
            content_config=dict(req.content_config),
            notes=req.notes.strip() if isinstance(req.notes, str) and req.notes.strip() else None,
            updated_by=req.updated_by.strip() if isinstance(req.updated_by, str) and req.updated_by.strip() else None,
        )
        self._source_dao.add(source)
        return SaveKnowledgeSourceResp(id=source.id, status=source.status)
