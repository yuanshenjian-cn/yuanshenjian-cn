from __future__ import annotations

from app.contexts.comment.application.dto.list_article_comments_dto import ListArticleCommentItemResp, ListArticleCommentsResp
from app.contexts.comment.domain.comment import ArticleComment
from app.contexts.comment.domain.comment_repository import CommentRepository


class ListArticleCommentsAppService:
    def __init__(self, comment_repository: CommentRepository) -> None:
        self._comment_repository = comment_repository

    def execute(self, article_slug: str, limit: int) -> ListArticleCommentsResp:
        comments = self._comment_repository.list_public_by_article(article_slug, limit)
        top_level = [self._to_item(comment) for comment in comments if comment.parent_id is None]
        by_id = {item.id: item for item in top_level}
        for comment in comments:
            if comment.parent_id and comment.parent_id in by_id:
                by_id[comment.parent_id].replies.append(self._to_item(comment))
        return ListArticleCommentsResp(items=top_level, next_cursor=None)

    def _to_item(self, comment: ArticleComment) -> ListArticleCommentItemResp:
        return ListArticleCommentItemResp(
            id=comment.id,
            article_slug=comment.article_slug,
            parent_id=comment.parent_id,
            display_name=comment.display_name,
            content_html=comment.content_html,
            status=comment.status.value,
            created_at=comment.created_at.isoformat(),
            replies=[],
        )
