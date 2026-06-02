from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass(frozen=True)
class StreamAuthorChatReq:
    message: str


@dataclass(frozen=True)
class StreamAuthorChatResp:
    stream: AsyncIterator[str]
