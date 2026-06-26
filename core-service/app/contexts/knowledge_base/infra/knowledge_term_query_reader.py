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

        statement = select(KnowledgeTermPO).where(KnowledgeTermPO.status == "enabled")
        terms = list(await self._session.scalars(statement))
        matches: list[MatchedKnowledgeTerm] = []
        for term in terms:
            if scene and term.scenes and not (len(term.scenes) == 0 or scene in term.scenes):
                continue
            if domain and term.domains and not (len(term.domains) == 0 or domain in term.domains):
                continue
            candidates = [term.term.lower(), *(alias.lower() for alias in (term.aliases or []))]
            for candidate in candidates:
                if candidate in normalized_query:
                    references: list[KnowledgeTermReferenceLink] = [
                        {"label": str(item.get("label", "")), "url": str(item.get("url", ""))}
                        for item in list(term.references or [])
                        if str(item.get("label", "")).strip() and str(item.get("url", "")).strip()
                    ]
                    matches.append(
                        {
                            "term": term.term,
                            "definition": term.definition,
                            "explanation": term.explanation,
                            "related_article_slugs": ",".join(term.related_article_slugs or []),
                            "references": references,
                        }
                    )
                    break
        return matches
