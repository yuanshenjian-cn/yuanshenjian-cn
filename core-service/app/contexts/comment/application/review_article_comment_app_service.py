from __future__ import annotations

from app.contexts.comment.application.dto.review_article_comment_dto import ReviewArticleCommentReq, ReviewArticleCommentResp
from app.contexts.comment.domain.comment import ArticleComment
from app.contexts.comment.domain.comment_repository import CommentRepository
from app.contexts.comment.domain.exceptions import CommentNotFoundError


class ReviewArticleCommentAppService:
    def __init__(self, comment_repository: CommentRepository) -> None:
        self._comment_repository = comment_repository

    async def approve(self, req: ReviewArticleCommentReq, reviewed_by: str) -> ReviewArticleCommentResp:
        comment = await self._load(req.comment_id)
        comment.mark_approved(reviewed_by, req.review_note)
        saved = await self._comment_repository.save(comment)
        return ReviewArticleCommentResp(id=saved.id, status=saved.status.value)

    async def reject(self, req: ReviewArticleCommentReq, reviewed_by: str) -> ReviewArticleCommentResp:
        comment = await self._load(req.comment_id)
        comment.mark_rejected(reviewed_by, req.review_note)
        saved = await self._comment_repository.save(comment)
        return ReviewArticleCommentResp(id=saved.id, status=saved.status.value)

    async def mark_spam(self, req: ReviewArticleCommentReq, reviewed_by: str) -> ReviewArticleCommentResp:
        comment = await self._load(req.comment_id)
        comment.mark_spam(reviewed_by, req.review_note)
        saved = await self._comment_repository.save(comment)
        return ReviewArticleCommentResp(id=saved.id, status=saved.status.value)

    async def _load(self, comment_id: str) -> ArticleComment:
        comment = await self._comment_repository.get_by_id(comment_id)
        if comment is None:
            raise CommentNotFoundError()
        return comment
