from __future__ import annotations

from app.contexts.knowledge_base.application.dto.save_knowledge_term_dto import SaveKnowledgeTermResp
from app.contexts.knowledge_base.domain.exceptions import KnowledgeTermNotFoundError
from app.contexts.knowledge_base.domain.knowledge_term_repository import KnowledgeTermRepository


class DeleteKnowledgeTermAppService:
    def __init__(self, term_dao: KnowledgeTermRepository) -> None:
        self._term_dao = term_dao

    async def execute(self, term_id: str) -> SaveKnowledgeTermResp:
        term = await self._term_dao.get_by_id(term_id)
        if term is None:
            raise KnowledgeTermNotFoundError(term_id)
        await self._term_dao.delete(term)
        return SaveKnowledgeTermResp(id=term_id, status="deleted")
