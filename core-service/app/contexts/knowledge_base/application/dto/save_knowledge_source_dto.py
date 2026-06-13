from __future__ import annotations

from pydantic import BaseModel, Field


class SaveKnowledgeSourceReq(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    source_kind: str = Field(min_length=1, max_length=64)
    domains: list[str] = Field(default_factory=list)
    scenes: list[str] = Field(default_factory=list)
    status: str = Field(default="enabled", min_length=1, max_length=32)
    source_uri: str | None = None
    sync_strategy: str = Field(default="manual", min_length=1, max_length=64)
    content_config: dict[str, object] = Field(default_factory=dict)
    notes: str | None = None
    updated_by: str | None = None


class SaveKnowledgeSourceResp(BaseModel):
    id: str
    status: str
