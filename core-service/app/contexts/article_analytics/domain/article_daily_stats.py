from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass
class ArticleDailyStats:
    article_slug: str
    stat_date: date
    pv_count: int = 0
    uv_count: int = 0

    def record_view(self, is_unique_visitor: bool) -> None:
        self.pv_count += 1
        if is_unique_visitor:
            self.uv_count += 1
