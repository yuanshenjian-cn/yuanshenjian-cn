from __future__ import annotations

from pydantic import BaseModel, Field


class KnowledgeTermReferenceReq(BaseModel):
    label: str = Field(min_length=1, max_length=128)
    url: str = Field(min_length=1, max_length=2048)


class SaveKnowledgeTermReq(BaseModel):
    term: str = Field(min_length=1, max_length=256)
    aliases: list[str] = Field(default_factory=list)
    definition: str = Field(min_length=1)
    explanation: str = Field(min_length=1)
    related_article_slugs: list[str] = Field(default_factory=list)
    references: list[KnowledgeTermReferenceReq] = Field(default_factory=list)
    domains: list[str] = Field(default_factory=list)
    scenes: list[str] = Field(default_factory=list)
    status: str = Field(default="enabled", min_length=1, max_length=32)
    notes: str | None = None
    updated_by: str | None = None


class SaveKnowledgeTermResp(BaseModel):
    id: str
    status: str
