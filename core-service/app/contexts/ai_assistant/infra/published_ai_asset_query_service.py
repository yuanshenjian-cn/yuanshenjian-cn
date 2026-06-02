from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import httpx

from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO
from app.shared.infra.app_config import settings


class PublishedAIAssetQueryService:
    def _read_json_file(self, path: Path) -> Any:
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def _read_json_url(self, relative_path: str) -> Any:
        url = f"{settings.public_site_url.rstrip('/')}/{relative_path.lstrip('/')}"
        try:
            response = httpx.get(url, timeout=5, follow_redirects=True)
            if response.status_code != 200:
                return None
            return response.json()
        except (httpx.HTTPError, json.JSONDecodeError):
            return None

    def _read_json(self, relative_path: str) -> Any:
        if settings.app_env == "production":
            return self._read_json_url(relative_path)
        return self._read_json_file(settings.site_public_dir / relative_path)

    def _to_reference(self, value: Any) -> RecommendReferenceVO | None:
        if not isinstance(value, dict):
            return None
        slug = value.get("slug")
        title = value.get("title")
        excerpt = value.get("excerpt")
        tags = value.get("tags")
        date = value.get("date")
        url = value.get("url")
        if not isinstance(slug, str) or not isinstance(title, str) or not isinstance(excerpt, str) or not isinstance(date, str):
            return None
        if not isinstance(tags, list) or not all(isinstance(tag, str) for tag in tags):
            return None
        if url is not None and not isinstance(url, str):
            return None
        return RecommendReferenceVO(slug=slug, title=title, excerpt=excerpt, tags=list(tags), date=date, url=url)

    def load_article_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        payload = self._read_json("ai-data/index.json")
        if not isinstance(payload, dict):
            return []
        posts = payload.get("posts")
        if not isinstance(posts, list):
            return []
        return [item for raw in posts if (item := self._to_reference(raw)) is not None]

    def load_article_payload(self, slug: str) -> dict[str, Any]:
        payload = self._read_json(f"ai-data/articles/{slug}.json")
        return payload if isinstance(payload, dict) else {}

    def load_author_payload(self) -> dict[str, Any]:
        payload = self._read_json("ai-data/author.json")
        return payload if isinstance(payload, dict) else {}

    def load_ai_briefing_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        payload = self._read_json("ai-data/briefings/index.json")
        if not isinstance(payload, dict):
            return []
        raw_items = payload.get("briefings")
        if not isinstance(raw_items, list):
            items_value = payload.get("items")
            raw_items = items_value if isinstance(items_value, list) else []
        return [item for raw in raw_items if (item := self._to_reference(raw)) is not None]

    def load_investment_briefing_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        payload = self._read_json("investment-data/briefings/index.json")
        if not isinstance(payload, dict):
            return []
        raw_items = payload.get("briefings")
        if not isinstance(raw_items, list):
            items_value = payload.get("items")
            raw_items = items_value if isinstance(items_value, list) else []
        return [item for raw in raw_items if (item := self._to_reference(raw)) is not None]
