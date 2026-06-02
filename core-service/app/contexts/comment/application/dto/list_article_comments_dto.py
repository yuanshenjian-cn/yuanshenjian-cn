from __future__ import annotations

from pydantic import BaseModel


class ListArticleCommentItemResp(BaseModel):
    id: str
    article_slug: str
    parent_id: str | None
    display_name: str
    content_html: str
    status: str
    created_at: str
    replies: list["ListArticleCommentItemResp"] = []


class ListArticleCommentsResp(BaseModel):
    items: list[ListArticleCommentItemResp]
    next_cursor: str | None = None


ListArticleCommentItemResp.model_rebuild()
