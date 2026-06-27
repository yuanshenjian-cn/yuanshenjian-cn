from __future__ import annotations

from typing import Protocol, TypedDict


class KnowledgeTermReferenceLink(TypedDict):
    label: str
    url: str


class MatchedKnowledgeTerm(TypedDict):
    term: str
    aliases: list[str]
    definition: str
    explanation: str
    related_article_slugs: str
    references: list[KnowledgeTermReferenceLink]


class KnowledgeTermReader(Protocol):
    async def list_terms(
        self,
        *,
        scene: str | None = None,
        domain: str | None = None,
    ) -> list[MatchedKnowledgeTerm]:
        ...

    async def find_matching_terms(
        self,
        query: str,
        *,
        scene: str | None = None,
        domain: str | None = None,
    ) -> list[MatchedKnowledgeTerm]:
        ...
