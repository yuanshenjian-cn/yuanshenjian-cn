from __future__ import annotations

from pydantic import BaseModel


class ListAdminArticleAnalyticsItemResp(BaseModel):
    article_slug: str
    pv: int
    uv: int


class ListAdminArticleAnalyticsResp(BaseModel):
    items: list[ListAdminArticleAnalyticsItemResp]
