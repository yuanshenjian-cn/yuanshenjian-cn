from __future__ import annotations

from dataclasses import dataclass

from app.contexts.admin_console.domain.admin_session_authenticator import AdminSessionAuthenticator
from app.contexts.admin_console.domain.exceptions import InvalidAdminPasswordError
from app.contexts.admin_console.application.dto.login_admin_session_dto import LoginAdminSessionReq, LoginAdminSessionResp


@dataclass(frozen=True)
class LoginAdminSessionResult:
    response: LoginAdminSessionResp
    raw_session_token: str


class LoginAdminSessionAppService:
    def __init__(self, authenticator: AdminSessionAuthenticator) -> None:
        self._authenticator = authenticator

    async def execute(self, req: LoginAdminSessionReq) -> LoginAdminSessionResult:
        if not self._authenticator.verify_admin_password(req.password):
            raise InvalidAdminPasswordError()
        issued_session = await self._authenticator.issue_admin_session()
        return LoginAdminSessionResult(
            response=LoginAdminSessionResp(ok=True, csrf_token=issued_session.csrf_token),
            raw_session_token=issued_session.raw_session_token,
        )
