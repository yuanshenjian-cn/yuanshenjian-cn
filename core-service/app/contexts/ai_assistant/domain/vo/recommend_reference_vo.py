from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RecommendReferenceVO:
    slug: str
    title: str
    excerpt: str
    tags: list[str]
    date: str
    url: str | None = None

    def to_payload(self) -> dict[str, object]:
        payload: dict[str, object] = {
            "slug": self.slug,
            "title": self.title,
            "excerpt": self.excerpt,
            "tags": self.tags,
            "date": self.date,
        }
        if self.url is not None:
            payload["url"] = self.url
        return payload
