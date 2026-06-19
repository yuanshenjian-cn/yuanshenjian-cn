from __future__ import annotations

from app.contexts.knowledge_base.application.dto.list_knowledge_terms_dto import ListKnowledgeTermsItemResp, ListKnowledgeTermsResp
from app.contexts.knowledge_base.infra.knowledge_term_query_service import KnowledgeTermQueryService


class ListKnowledgeTermsAppService:
    def __init__(self, query_service: KnowledgeTermQueryService) -> None:
        self._query_service = query_service

    async def execute(self) -> ListKnowledgeTermsResp:
        items = await self._query_service.list_terms()
        return ListKnowledgeTermsResp(items=[ListKnowledgeTermsItemResp.model_validate(item) for item in items])
