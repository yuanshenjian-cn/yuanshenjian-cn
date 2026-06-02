from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass(frozen=True)
class StreamArticleChatReq:
    message: str
    slug: str


@dataclass(frozen=True)
class StreamArticleChatResp:
    stream: AsyncIterator[str]
