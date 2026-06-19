from __future__ import annotations

from pydantic import BaseModel


class GlossaryItemResp(BaseModel):
    id: str
    term: str
    aliases: list[str]
    definition: str
    related_article_slugs: list[str]


class ListGlossaryResp(BaseModel):
    items: list[GlossaryItemResp]
