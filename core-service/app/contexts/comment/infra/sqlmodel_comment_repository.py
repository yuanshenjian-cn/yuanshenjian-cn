from __future__ import annotations

from datetime import datetime

from app.contexts.comment.domain.comment import ArticleComment, CommentStatus
from app.contexts.comment.domain.comment_repository import CommentRepository
from app.contexts.comment.domain.exceptions import CommentNotFoundError
from app.contexts.comment.infra.po.article_comment_po import ArticleCommentPO
from app.contexts.comment.infra.dao.comment_dao import CommentDAO


class SQLModelCommentRepository(CommentRepository):
    def __init__(self, comment_dao: CommentDAO) -> None:
        self._comment_dao = comment_dao

    async def get_by_id(self, comment_id: str) -> ArticleComment | None:
        comment_po = await self._comment_dao.get_by_id(comment_id)
        return None if comment_po is None else self._to_domain(comment_po)

    async def add(self, comment: ArticleComment) -> ArticleComment:
        comment_po = ArticleCommentPO(
            article_slug=comment.article_slug,
            parent_id=comment.parent_id,
            actor_type=comment.actor_type,
            visitor_id=comment.visitor_id,
            user_id=comment.user_id,
            display_name=comment.display_name,
            email_hash=comment.email_hash,
            content_markdown=comment.content_markdown,
            content_html=comment.content_html,
            status=comment.status.value,
            ai_moderation_recommended_status=comment.ai_moderation_recommended_status,
            ai_moderation_score=comment.ai_moderation_score,
            ai_moderation_labels=list(comment.ai_moderation_labels),
            ai_moderation_reason=comment.ai_moderation_reason,
            ip_hash=comment.ip_hash,
            user_agent_hash=comment.user_agent_hash,
        )
        self._comment_dao.add(comment_po)
        await self._comment_dao.flush()
        await self._comment_dao.refresh(comment_po)
        return self._to_domain(comment_po)

    async def save(self, comment: ArticleComment) -> ArticleComment:
        comment_po = await self._comment_dao.get_by_id(comment.id)
        if comment_po is None:
            raise CommentNotFoundError()
        comment_po.status = comment.status.value
        comment_po.reviewed_by = comment.reviewed_by
        comment_po.review_note = comment.review_note
        comment_po.reviewed_at = comment.reviewed_at
        await self._comment_dao.flush()
        await self._comment_dao.refresh(comment_po)
        return self._to_domain(comment_po)

    async def list_public_by_article(self, article_slug: str, limit: int) -> list[ArticleComment]:
        return [self._to_domain(item) for item in await self._comment_dao.list_public_by_article(article_slug, limit)]

    async def list_by_status(self, status: CommentStatus, limit: int) -> list[ArticleComment]:
        return [self._to_domain(item) for item in await self._comment_dao.list_by_status(status.value, limit)]

    def _to_domain(self, comment_po: ArticleCommentPO) -> ArticleComment:
        return ArticleComment(
            id=comment_po.id,
            article_slug=comment_po.article_slug,
            parent_id=comment_po.parent_id,
            actor_type=comment_po.actor_type,
            visitor_id=comment_po.visitor_id,
            user_id=comment_po.user_id,
            display_name=comment_po.display_name,
            email_hash=comment_po.email_hash,
            content_markdown=comment_po.content_markdown,
            content_html=comment_po.content_html,
            status=CommentStatus(comment_po.status),
            ai_moderation_recommended_status=comment_po.ai_moderation_recommended_status,
            ai_moderation_score=float(comment_po.ai_moderation_score) if comment_po.ai_moderation_score is not None else None,
            ai_moderation_labels=list(comment_po.ai_moderation_labels or []),
            ai_moderation_reason=comment_po.ai_moderation_reason,
            ip_hash=comment_po.ip_hash,
            user_agent_hash=comment_po.user_agent_hash,
            reviewed_by=comment_po.reviewed_by,
            review_note=comment_po.review_note,
            reviewed_at=comment_po.reviewed_at,
            created_at=comment_po.created_at,
            updated_at=comment_po.updated_at if isinstance(comment_po.updated_at, datetime) else None,
        )
