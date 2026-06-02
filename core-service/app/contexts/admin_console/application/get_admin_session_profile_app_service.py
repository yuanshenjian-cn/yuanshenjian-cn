from __future__ import annotations

from app.contexts.admin_console.application.dto.get_admin_session_profile_dto import GetAdminSessionProfileResp


class GetAdminSessionProfileAppService:
    def execute(self) -> GetAdminSessionProfileResp:
        return GetAdminSessionProfileResp(role="admin")
