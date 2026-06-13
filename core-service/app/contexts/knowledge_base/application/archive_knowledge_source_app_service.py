from __future__ import annotations

from app.contexts.knowledge_base.application.dto.save_knowledge_source_dto import SaveKnowledgeSourceResp
from app.contexts.knowledge_base.domain.exceptions import KnowledgeSourceNotFoundError
from app.contexts.knowledge_base.infra.dao.knowledge_source_dao import KnowledgeSourceDAO


class ArchiveKnowledgeSourceAppService:
    def __init__(self, source_dao: KnowledgeSourceDAO) -> None:
        self._source_dao = source_dao

    async def execute(self, source_id: str) -> SaveKnowledgeSourceResp:
        source = await self._source_dao.get_by_id(source_id)
        if source is None:
            raise KnowledgeSourceNotFoundError(source_id)
        source.status = "archived"
        return SaveKnowledgeSourceResp(id=source.id, status=source.status)
