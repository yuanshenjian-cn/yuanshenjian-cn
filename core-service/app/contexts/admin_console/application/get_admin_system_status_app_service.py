from __future__ import annotations

from app.contexts.admin_console.application.dto.get_admin_system_status_dto import (
    AdminSystemStatusLastRagSyncResp,
    GetAdminSystemStatusResp,
)
from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService


class GetAdminSystemStatusAppService:
    def __init__(self, query_service: AdminConsoleQueryService) -> None:
        self._query_service = query_service

    def execute(self) -> GetAdminSystemStatusResp:
        payload = self._query_service.get_system_status()
        raw_last_sync = payload.get("last_rag_sync")
        raw_rag_documents = payload.get("rag_documents")
        raw_rag_chunks = payload.get("rag_chunks")
        last_rag_sync = None
        if isinstance(raw_last_sync, dict):
            last_rag_sync = AdminSystemStatusLastRagSyncResp(
                status=str(raw_last_sync.get("status", "")),
                commit_sha=str(raw_last_sync["commit_sha"]) if raw_last_sync.get("commit_sha") is not None else None,
                started_at=str(raw_last_sync.get("started_at", "")),
            )
        return GetAdminSystemStatusResp(
            api=str(payload.get("api", "unknown")),
            db=str(payload.get("db", "unknown")),
            rag_documents=raw_rag_documents if isinstance(raw_rag_documents, int) else 0,
            rag_chunks=raw_rag_chunks if isinstance(raw_rag_chunks, int) else 0,
            last_rag_sync=last_rag_sync,
        )
