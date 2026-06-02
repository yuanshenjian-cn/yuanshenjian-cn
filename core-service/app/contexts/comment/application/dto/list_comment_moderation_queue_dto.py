from __future__ import annotations

from pydantic import BaseModel


class ListCommentModerationQueueItemResp(BaseModel):
    id: str
    article_slug: str
    parent_id: str | None
    display_name: str
    content_markdown: str
    status: str
    ai_moderation_recommended_status: str | None
    ai_moderation_labels: list[str]
    ai_moderation_reason: str | None
    created_at: str


class ListCommentModerationQueueResp(BaseModel):
    items: list[ListCommentModerationQueueItemResp]
    next_cursor: str | None = None
