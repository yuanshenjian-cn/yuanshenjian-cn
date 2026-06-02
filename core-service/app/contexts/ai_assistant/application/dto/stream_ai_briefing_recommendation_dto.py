from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal


BriefingRange = Literal["today", "3d", "7d", "14d", "30d"]


@dataclass(frozen=True)
class StreamAiBriefingRecommendationReq:
    message: str
    range: BriefingRange


@dataclass(frozen=True)
class StreamAiBriefingRecommendationResp:
    stream: AsyncIterator[str]
