from __future__ import annotations

from fastapi import Response
from sqlalchemy.orm import Session

from app.contexts.admin_console.application.dto.login_admin_session_dto import LoginAdminSessionReq, LoginAdminSessionResp
from app.shared.security import issue_admin_session, verify_admin_password


class LoginAdminSessionAppService:
    def execute(self, req: LoginAdminSessionReq, session: Session, response: Response) -> LoginAdminSessionResp:
        if not verify_admin_password(req.password):
            raise ValueError("invalid_admin_password")
        csrf_token = issue_admin_session(session, response)
        return LoginAdminSessionResp(ok=True, csrf_token=csrf_token)
