from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class AdminSession:
    id: str
    session_hash: str
    expires_at: datetime
    created_at: datetime
    last_seen_at: datetime

    def touch(self, seen_at: datetime) -> None:
        self.last_seen_at = seen_at
