from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Actor:
    actor_type: str
    visitor_id: str | None = None
    user_id: str | None = None
