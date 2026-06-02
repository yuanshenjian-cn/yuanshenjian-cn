from __future__ import annotations

from pydantic import BaseModel


class ReviewArticleCommentPayloadReq(BaseModel):
    review_note: str | None = None
    csrf_token: str = ""


class ReviewArticleCommentReq(BaseModel):
    comment_id: str
    review_note: str | None = None
    csrf_token: str = ""


class ReviewArticleCommentResp(BaseModel):
    id: str
    status: str
