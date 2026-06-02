from __future__ import annotations

from datetime import datetime
from typing import Protocol


class CommentContentRenderer(Protocol):
    def render(self, markdown: str) -> str:
        ...

    def now(self) -> datetime:
        ...
