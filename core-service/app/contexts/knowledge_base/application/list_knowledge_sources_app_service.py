from __future__ import annotations

from app.contexts.knowledge_base.application.dto.list_knowledge_sources_dto import ListKnowledgeSourcesItemResp, ListKnowledgeSourcesResp
from app.contexts.knowledge_base.infra.knowledge_source_query_service import KnowledgeSourceQueryService


class ListKnowledgeSourcesAppService:
    def __init__(self, query_service: KnowledgeSourceQueryService) -> None:
        self._query_service = query_service

    async def execute(self) -> ListKnowledgeSourcesResp:
        items = await self._query_service.list_sources()
        return ListKnowledgeSourcesResp(items=[ListKnowledgeSourcesItemResp.model_validate(item) for item in items])
