from __future__ import annotations

from app.contexts.knowledge_base.application.dto.save_knowledge_term_dto import SaveKnowledgeTermReq, SaveKnowledgeTermResp
from uuid import uuid4

from app.contexts.knowledge_base.domain.exceptions import KnowledgeTermValidationError
from app.contexts.knowledge_base.domain.knowledge_term import (
    KnowledgeTermStatus,
    normalize_term_aliases,
    normalize_term_definition,
    normalize_term_domains,
    normalize_term_explanation,
    normalize_term_related_slugs,
    normalize_term_scenes,
    normalize_term_status,
)
from app.contexts.knowledge_base.domain.knowledge_term_repository import KnowledgeTermRepository
from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class CreateKnowledgeTermAppService:
    def __init__(self, term_dao: KnowledgeTermRepository) -> None:
        self._term_dao = term_dao

    async def execute(self, req: SaveKnowledgeTermReq) -> SaveKnowledgeTermResp:
        status = normalize_term_status(req.status)
        if status not in {item.value for item in KnowledgeTermStatus}:
            raise KnowledgeTermValidationError("knowledge_term_status_invalid", "术语状态不合法")
        term_text = req.term.strip()
        if await self._term_dao.get_by_term(term_text) is not None:
            raise KnowledgeTermValidationError("knowledge_term_conflict", "术语已存在")
        term = KnowledgeTermPO(
            id=str(uuid4()),
            term=term_text,
            aliases=normalize_term_aliases(req.aliases),
            definition=normalize_term_definition(req.definition),
            explanation=normalize_term_explanation(req.explanation),
            related_article_slugs=normalize_term_related_slugs(req.related_article_slugs),
            domains=normalize_term_domains(req.domains),
            scenes=normalize_term_scenes(req.scenes),
            status=status,
            notes=req.notes.strip() if isinstance(req.notes, str) and req.notes.strip() else None,
            updated_by=req.updated_by.strip() if isinstance(req.updated_by, str) and req.updated_by.strip() else None,
        )
        self._term_dao.add(term)
        return SaveKnowledgeTermResp(id=term.id, status=term.status)
