from __future__ import annotations

from typing import Protocol


class LLMProfile(Protocol):
    @property
    def id(self) -> str: ...

    @property
    def provider(self) -> str: ...

    @property
    def base_url(self) -> str: ...

    @property
    def model(self) -> str: ...

    @property
    def api_key(self) -> str: ...

    @property
    def temperature(self) -> float: ...

    @property
    def max_tokens(self) -> int: ...
