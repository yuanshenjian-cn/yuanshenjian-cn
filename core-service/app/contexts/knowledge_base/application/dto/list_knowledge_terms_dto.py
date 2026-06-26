from __future__ import annotations

from pydantic import BaseModel, Field


class ListKnowledgeTermReferenceResp(BaseModel):
    label: str
    url: str


class ListKnowledgeTermsItemResp(BaseModel):
    id: str
    term: str
    aliases: list[str]
    definition: str
    explanation: str
    related_article_slugs: list[str]
    references: list[ListKnowledgeTermReferenceResp]
    domains: list[str]
    scenes: list[str]
    status: str
    notes: str | None
    updated_by: str | None
    created_at: str
    updated_at: str


class ListKnowledgeTermsReq(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    term: str | None = None
    scene: str | None = None
    domain: str | None = None
    include_total: bool = True


class ListKnowledgeTermsResp(BaseModel):
    items: list[ListKnowledgeTermsItemResp]
    total: int | None
    page: int
    page_size: int
