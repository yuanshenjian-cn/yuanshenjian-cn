from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

InvestmentBriefingRange = Literal["3d", "7d", "14d", "30d"]


@dataclass(frozen=True)
class StreamInvestmentBriefingRecommendationReq:
    message: str
    range: InvestmentBriefingRange


@dataclass(frozen=True)
class StreamInvestmentBriefingRecommendationResp:
    stream: AsyncIterator[str]
