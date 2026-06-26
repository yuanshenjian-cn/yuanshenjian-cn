from __future__ import annotations

from app.contexts.knowledge_base.application.dto.save_knowledge_term_dto import SaveKnowledgeTermReq, SaveKnowledgeTermResp
from app.contexts.knowledge_base.domain.exceptions import KnowledgeTermNotFoundError, KnowledgeTermValidationError
from app.contexts.knowledge_base.domain.knowledge_term import (
    KnowledgeTermStatus,
    normalize_term_aliases,
    normalize_term_definition,
    normalize_term_domains,
    normalize_term_explanation,
    normalize_term_references,
    normalize_term_related_slugs,
    normalize_term_scenes,
    normalize_term_status,
)
from app.contexts.knowledge_base.domain.knowledge_term_repository import KnowledgeTermRepository


class UpdateKnowledgeTermAppService:
    def __init__(self, term_dao: KnowledgeTermRepository) -> None:
        self._term_dao = term_dao

    async def execute(self, term_id: str, req: SaveKnowledgeTermReq) -> SaveKnowledgeTermResp:
        term = await self._term_dao.get_by_id(term_id)
        if term is None:
            raise KnowledgeTermNotFoundError(term_id)
        status = normalize_term_status(req.status)
        if status not in {item.value for item in KnowledgeTermStatus}:
            raise KnowledgeTermValidationError("knowledge_term_status_invalid", "术语状态不合法")

        term.term = req.term.strip()
        term.aliases = normalize_term_aliases(req.aliases)
        term.definition = normalize_term_definition(req.definition)
        term.explanation = normalize_term_explanation(req.explanation)
        term.related_article_slugs = normalize_term_related_slugs(req.related_article_slugs)
        term.references = normalize_term_references([item.model_dump() for item in req.references])
        term.domains = normalize_term_domains(req.domains)
        term.scenes = normalize_term_scenes(req.scenes)
        term.status = status
        term.notes = req.notes.strip() if isinstance(req.notes, str) and req.notes.strip() else None
        term.updated_by = req.updated_by.strip() if isinstance(req.updated_by, str) and req.updated_by.strip() else None
        return SaveKnowledgeTermResp(id=term.id, status=term.status)
