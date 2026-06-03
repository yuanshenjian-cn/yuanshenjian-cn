from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class IssuedAdminSession:
    raw_session_token: str
    csrf_token: str


class AdminSessionAuthenticator(Protocol):
    def verify_admin_password(self, password: str) -> bool:
        ...

    async def issue_admin_session(self) -> IssuedAdminSession:
        ...
