from __future__ import annotations

from typing import Any, Protocol

from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO


class PublishedAIAssetReader(Protocol):
    def load_article_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        ...

    def load_article_payload(self, slug: str) -> dict[str, Any]:
        ...

    def load_author_payload(self) -> dict[str, Any]:
        ...

    def load_ai_briefing_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        ...

    def load_investment_briefing_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        ...
