from __future__ import annotations

from typing import Protocol


class AdminConsoleQueryReader(Protocol):
    def get_dashboard_overview(self) -> dict[str, int]:
        ...

    def list_article_analytics(self, limit: int = 20) -> list[dict[str, int | str]]:
        ...

    def get_ai_usage_overview(self) -> dict[str, object]:
        ...

    def get_system_status(self) -> dict[str, object]:
        ...
