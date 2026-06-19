from __future__ import annotations

from app.contexts.ai_assistant.application.dto.list_glossary_dto import GlossaryItemResp, ListGlossaryResp
from app.contexts.knowledge_base.domain.knowledge_term_repository import KnowledgeTermRepository


class ListGlossaryAppService:
    def __init__(self, term_dao: KnowledgeTermRepository) -> None:
        self._term_dao = term_dao

    async def execute(self, scene: str | None, domain: str | None) -> ListGlossaryResp:
        terms = await self._term_dao.list_enabled()
        items: list[GlossaryItemResp] = []
        for term in terms:
            term_scenes = term.scenes or []
            term_domains = term.domains or []
            if scene and term_scenes and scene not in term_scenes:
                continue
            if domain and term_domains and domain not in term_domains:
                continue
            items.append(
                GlossaryItemResp(
                    id=term.id,
                    term=term.term,
                    aliases=list(term.aliases or []),
                    definition=term.definition,
                    explanation=term.explanation,
                    related_article_slugs=list(term.related_article_slugs or []),
                )
            )
        return ListGlossaryResp(items=items)
