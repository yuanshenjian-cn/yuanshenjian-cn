from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.ai_assistant.domain.knowledge_term_reader import (
    KnowledgeTermReader,
    KnowledgeTermReferenceLink,
    MatchedKnowledgeTerm,
)
from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class KnowledgeTermQueryReader(KnowledgeTermReader):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _matches_scope(self, term: KnowledgeTermPO, *, scene: str | None = None, domain: str | None = None) -> bool:
        if scene and term.scenes and not (len(term.scenes) == 0 or scene in term.scenes):
            return False
        if domain and term.domains and not (len(term.domains) == 0 or domain in term.domains):
            return False
        return True

    def _build_term_payload(self, term: KnowledgeTermPO) -> MatchedKnowledgeTerm:
        references: list[KnowledgeTermReferenceLink] = [
            {"label": str(item.get("label", "")), "url": str(item.get("url", ""))}
            for item in list(term.references or [])
            if str(item.get("label", "")).strip() and str(item.get("url", "")).strip()
        ]
        return {
            "term": term.term,
            "aliases": list(term.aliases or []),
            "definition": term.definition,
            "explanation": term.explanation,
            "related_article_slugs": ",".join(term.related_article_slugs or []),
            "references": references,
        }

    async def list_terms(
        self,
        *,
        scene: str | None = None,
        domain: str | None = None,
    ) -> list[MatchedKnowledgeTerm]:
        statement = select(KnowledgeTermPO).where(KnowledgeTermPO.status == "enabled")
        terms = list(await self._session.scalars(statement))
        return [self._build_term_payload(term) for term in terms if self._matches_scope(term, scene=scene, domain=domain)]

    async def find_matching_terms(
        self,
        query: str,
        *,
        scene: str | None = None,
        domain: str | None = None,
    ) -> list[MatchedKnowledgeTerm]:
        normalized_query = query.lower().strip()
        if not normalized_query:
            return []

        terms = await self.list_terms(scene=scene, domain=domain)
        matches: list[MatchedKnowledgeTerm] = []
        for term in terms:
            candidates = [term["term"].lower(), *(alias.lower() for alias in term["aliases"])]
            for candidate in candidates:
                if candidate in normalized_query:
                    matches.append(term)
                    break
        return matches
