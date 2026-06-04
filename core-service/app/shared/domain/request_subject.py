from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


VisitorTokenStatus = Literal["missing", "valid", "legacy", "invalid"]


@dataclass(frozen=True)
class RequestSubject:
    raw_ip: str
    ip_hash: str
    user_agent_hash: str
    visitor_key: str | None
    visitor_key_hash: str | None
    visitor_token_status: VisitorTokenStatus
    direct_origin: bool = False
