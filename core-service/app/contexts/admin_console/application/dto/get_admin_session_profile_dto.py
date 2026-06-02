from __future__ import annotations

from pydantic import BaseModel


class GetAdminSessionProfileResp(BaseModel):
    role: str
