from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass(frozen=True)
class StreamArticleRecommendationReq:
    message: str


@dataclass(frozen=True)
class StreamArticleRecommendationResp:
    stream: AsyncIterator[str]
