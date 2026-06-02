from __future__ import annotations

from pydantic import BaseModel


class LoginAdminSessionReq(BaseModel):
    password: str
    csrf_token: str = ""
    turnstile_token: str = ""


class LoginAdminSessionResp(BaseModel):
    ok: bool
    csrf_token: str
