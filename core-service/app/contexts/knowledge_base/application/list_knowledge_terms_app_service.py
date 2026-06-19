from __future__ import annotations

from app.contexts.knowledge_base.application.dto.list_knowledge_terms_dto import (
    ListKnowledgeTermsItemResp,
    ListKnowledgeTermsReq,
    ListKnowledgeTermsResp,
)
from app.contexts.knowledge_base.infra.knowledge_term_query_service import KnowledgeTermQueryService


class ListKnowledgeTermsAppService:
    def __init__(self, query_service: KnowledgeTermQueryService) -> None:
        self._query_service = query_service

    async def execute(self, request: ListKnowledgeTermsReq) -> ListKnowledgeTermsResp:
        rows, total = await self._query_service.list_terms_page(
            page=request.page,
            page_size=request.page_size,
        )
        return ListKnowledgeTermsResp(
            items=[ListKnowledgeTermsItemResp.model_validate(item) for item in rows],
            total=total,
            page=request.page,
            page_size=request.page_size,
        )
