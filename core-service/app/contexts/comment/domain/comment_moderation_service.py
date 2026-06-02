from __future__ import annotations

from typing import Protocol

from app.contexts.comment.domain.comment import CommentModerationDecision


class CommentModerationService(Protocol):
    def evaluate(self, content: str) -> CommentModerationDecision:
        ...
