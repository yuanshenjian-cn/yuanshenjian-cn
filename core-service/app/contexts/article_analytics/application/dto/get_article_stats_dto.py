from __future__ import annotations

from pydantic import BaseModel


class GetArticleStatsResp(BaseModel):
    article_slug: str
    pv: int
    uv: int
