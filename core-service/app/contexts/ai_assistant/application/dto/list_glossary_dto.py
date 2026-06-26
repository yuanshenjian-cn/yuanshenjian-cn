from __future__ import annotations

from pydantic import BaseModel


class GlossaryReferenceResp(BaseModel):
    label: str
    url: str


class GlossaryItemResp(BaseModel):
    id: str
    term: str
    aliases: list[str]
    definition: str
    explanation: str
    related_article_slugs: list[str]
    references: list[GlossaryReferenceResp]


class ListGlossaryResp(BaseModel):
    items: list[GlossaryItemResp]
