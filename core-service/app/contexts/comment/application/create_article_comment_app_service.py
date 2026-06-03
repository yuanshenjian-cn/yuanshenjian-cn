from __future__ import annotations

from app.contexts.comment.application.dto.create_article_comment_dto import CreateArticleCommentReq, CreateArticleCommentResp
from app.contexts.comment.domain.comment import ArticleComment, CommentStatus
from app.contexts.comment.domain.comment_content_renderer import CommentContentRenderer
from app.contexts.comment.domain.comment_moderation_service import CommentModerationService
from app.contexts.comment.domain.comment_repository import CommentRepository
from app.contexts.comment.domain.exceptions import InvalidParentCommentError


class CreateArticleCommentAppService:
    def __init__(
        self,
        comment_repository: CommentRepository,
        markdown_renderer: CommentContentRenderer,
        moderation_service: CommentModerationService,
    ) -> None:
        self._comment_repository = comment_repository
        self._markdown_renderer = markdown_renderer
        self._moderation_service = moderation_service

    async def execute(self, req: CreateArticleCommentReq) -> CreateArticleCommentResp:
        if req.parent_id:
            parent = await self._comment_repository.get_by_id(req.parent_id)
            if parent is None or parent.article_slug != req.article_slug or not parent.can_accept_reply():
                raise InvalidParentCommentError()

        moderation = self._moderation_service.evaluate(req.content_markdown)
        comment = ArticleComment(
            id="",
            article_slug=req.article_slug,
            parent_id=req.parent_id,
            actor_type=req.actor.actor_type,
            visitor_id=req.actor.visitor_id,
            user_id=req.actor.user_id,
            display_name=req.display_name,
            email_hash=req.email_hash,
            content_markdown=req.content_markdown,
            content_html=self._markdown_renderer.render(req.content_markdown),
            status=CommentStatus.PENDING,
            ai_moderation_recommended_status=moderation.recommended_status.value,
            ai_moderation_score=moderation.score,
            ai_moderation_labels=list(moderation.labels),
            ai_moderation_reason=moderation.reason,
            ip_hash=req.ip_hash,
            user_agent_hash=req.user_agent_hash,
            reviewed_by=None,
            review_note=None,
            reviewed_at=None,
            created_at=self._markdown_renderer.now(),
            updated_at=None,
        )
        saved = await self._comment_repository.add(comment)
        return CreateArticleCommentResp(id=saved.id, status=saved.status.value, message="评论已提交，审核后展示。")
