from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


class CommentStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SPAM = "spam"


@dataclass(frozen=True)
class CommentModerationDecision:
    recommended_status: CommentStatus
    score: float
    labels: list[str] = field(default_factory=list)
    reason: str = ""


@dataclass
class ArticleComment:
    id: str
    article_slug: str
    parent_id: str | None
    actor_type: str
    visitor_id: str | None
    user_id: str | None
    display_name: str
    email_hash: str | None
    content_markdown: str
    content_html: str
    status: CommentStatus
    ai_moderation_recommended_status: str | None
    ai_moderation_score: float | None
    ai_moderation_labels: list[str]
    ai_moderation_reason: str | None
    ip_hash: str | None
    user_agent_hash: str | None
    reviewed_by: str | None
    review_note: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime | None

    def can_accept_reply(self) -> bool:
        return self.parent_id is None

    def mark_approved(self, reviewed_by: str, review_note: str | None) -> None:
        self._mark_reviewed(CommentStatus.APPROVED, reviewed_by, review_note)

    def mark_rejected(self, reviewed_by: str, review_note: str | None) -> None:
        self._mark_reviewed(CommentStatus.REJECTED, reviewed_by, review_note)

    def mark_spam(self, reviewed_by: str, review_note: str | None) -> None:
        self._mark_reviewed(CommentStatus.SPAM, reviewed_by, review_note)

    def _mark_reviewed(self, status: CommentStatus, reviewed_by: str, review_note: str | None) -> None:
        self.status = status
        self.reviewed_by = reviewed_by
        self.review_note = review_note
        self.reviewed_at = datetime.now(UTC)
