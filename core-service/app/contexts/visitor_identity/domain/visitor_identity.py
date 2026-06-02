from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class VisitorIdentity:
    id: str
    visitor_key_hash: str
    first_seen_at: datetime
    last_seen_at: datetime
    risk_score: int
    created_at: datetime

    def mark_seen(self, seen_at: datetime) -> None:
        self.last_seen_at = seen_at
