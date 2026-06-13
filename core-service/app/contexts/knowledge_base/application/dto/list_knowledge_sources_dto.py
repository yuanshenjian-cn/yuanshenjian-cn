from __future__ import annotations

from pydantic import BaseModel


class ListKnowledgeSourcesItemResp(BaseModel):
    id: str
    name: str
    source_kind: str
    domains: list[str]
    scenes: list[str]
    status: str
    source_uri: str | None
    sync_strategy: str
    content_config: dict[str, object]
    notes: str | None
    updated_by: str | None
    created_at: str
    updated_at: str


class ListKnowledgeSourcesResp(BaseModel):
    items: list[ListKnowledgeSourcesItemResp]
