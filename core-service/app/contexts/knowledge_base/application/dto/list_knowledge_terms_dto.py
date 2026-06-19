from __future__ import annotations

from pydantic import BaseModel


class ListKnowledgeTermsItemResp(BaseModel):
    id: str
    term: str
    aliases: list[str]
    definition: str
    explanation: str
    related_article_slugs: list[str]
    domains: list[str]
    scenes: list[str]
    status: str
    notes: str | None
    updated_by: str | None
    created_at: str
    updated_at: str


class ListKnowledgeTermsResp(BaseModel):
    items: list[ListKnowledgeTermsItemResp]
