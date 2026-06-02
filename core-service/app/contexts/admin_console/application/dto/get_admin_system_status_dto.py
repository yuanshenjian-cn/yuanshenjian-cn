from __future__ import annotations

from pydantic import BaseModel


class AdminSystemStatusLastRagSyncResp(BaseModel):
    status: str
    commit_sha: str | None
    started_at: str


class GetAdminSystemStatusResp(BaseModel):
    api: str
    db: str
    rag_documents: int
    rag_chunks: int
    last_rag_sync: AdminSystemStatusLastRagSyncResp | None
