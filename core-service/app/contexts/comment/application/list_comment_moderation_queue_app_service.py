from __future__ import annotations

from app.contexts.comment.application.dto.list_comment_moderation_queue_dto import (
    ListCommentModerationQueueItemResp,
    ListCommentModerationQueueResp,
)
from app.contexts.comment.domain.comment import CommentStatus
from app.contexts.comment.domain.comment_repository import CommentRepository


class ListCommentModerationQueueAppService:
    def __init__(self, comment_repository: CommentRepository) -> None:
        self._comment_repository = comment_repository

    async def execute(self, status: str, limit: int) -> ListCommentModerationQueueResp:
        comments = await self._comment_repository.list_by_status(CommentStatus(status), limit)
        return ListCommentModerationQueueResp(
            items=[
                ListCommentModerationQueueItemResp(
                    id=comment.id,
                    article_slug=comment.article_slug,
                    parent_id=comment.parent_id,
                    display_name=comment.display_name,
                    content_markdown=comment.content_markdown,
                    status=comment.status.value,
                    ai_moderation_recommended_status=comment.ai_moderation_recommended_status,
                    ai_moderation_labels=list(comment.ai_moderation_labels),
                    ai_moderation_reason=comment.ai_moderation_reason,
                    created_at=comment.created_at.isoformat(),
                )
                for comment in comments
            ],
            next_cursor=None,
        )
