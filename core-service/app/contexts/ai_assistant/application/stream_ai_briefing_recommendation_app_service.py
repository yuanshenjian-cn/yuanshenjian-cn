from __future__ import annotations

import json
from collections.abc import AsyncIterator, Callable
from datetime import datetime, timedelta

from app.contexts.ai_assistant.application.dto.stream_ai_briefing_recommendation_dto import (
    BriefingRange,
    StreamAiBriefingRecommendationReq,
    StreamAiBriefingRecommendationResp,
)
from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO
from app.contexts.ai_assistant.infra.answer_delta_sanitizer import AnswerDeltaSanitizer
from app.contexts.ai_assistant.infra.ai_briefing_recommendation_prompt_builder import (
    AI_BRIEFING_RECOMMENDATION_REFERENCE_DELIMITER,
    build_ai_briefing_recommendation_stream_system_prompt,
)
from app.contexts.ai_assistant.infra.published_ai_asset_query_service import PublishedAIAssetQueryService
from app.contexts.ai_assistant.infra.llm_profile_query_service import LLMProfileQueryService
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProvider, LLMProviderChatRequest, LLMProviderMessage, LLMProviderProfile
from app.contexts.ai_assistant.infra.providers.llm_provider_factory import create_llm_provider
from app.contexts.ai_assistant.infra.sse_event_codec import encode_sse_event

AI_BRIEFING_RECOMMENDATION_AI_ERROR_MESSAGE = "AI 服务刚刚开小差了，请稍后重试。"
MAX_CONTEXT_BRIEFINGS = 10
MAX_REFERENCES = 3
QUERY_STOPWORDS = ["请", "推荐", "简报", "动态", "内容", "关于", "一下", "最近", "今天", "本周"]


class StreamAiBriefingRecommendationAppService:
    def __init__(
        self,
        data_query_service: PublishedAIAssetQueryService,
        profile_query_service: LLMProfileQueryService,
        provider_factory: Callable[[LLMProviderProfile], LLMProvider] = create_llm_provider,
    ) -> None:
        self._data_query_service = data_query_service
        self._profile_query_service = profile_query_service
        self._provider_factory = provider_factory

    async def execute(self, req: StreamAiBriefingRecommendationReq) -> StreamAiBriefingRecommendationResp:
        briefings = [item for item in self._data_query_service.load_ai_briefing_recommendation_candidates() if self._is_in_range(item.date, req.range)]
        selected = self._select_context_briefings(briefings, req.message)
        profile = self._profile_query_service.resolve_active_profile("ai_briefing_recommendation")
        provider = self._provider_factory(profile)
        request = LLMProviderChatRequest(
            messages=[
                LLMProviderMessage(role="system", content=build_ai_briefing_recommendation_stream_system_prompt(selected)),
                LLMProviderMessage(role="user", content=req.message),
            ],
            max_tokens=700,
            temperature=0.3,
            stream=True,
        )
        return StreamAiBriefingRecommendationResp(stream=self._stream(provider, profile, request, selected))

    async def _stream(
        self,
        provider: LLMProvider,
        profile: LLMProviderProfile,
        request: LLMProviderChatRequest,
        briefings: list[RecommendReferenceVO],
    ) -> AsyncIterator[str]:
        if not profile.api_key or not profile.base_url or profile.model == "fallback":
            yield encode_sse_event("error", {"message": AI_BRIEFING_RECOMMENDATION_AI_ERROR_MESSAGE})
            return

        full_text = ""
        usage_payload: dict[str, int | None] | None = None
        fallback_references = briefings[:MAX_REFERENCES]

        try:
            async for event in provider.stream_chat(request):
                full_text += event.delta
                if event.usage is not None:
                    usage_payload = event.usage.as_dict()

            delimiter_index = full_text.find(AI_BRIEFING_RECOMMENDATION_REFERENCE_DELIMITER)
            answer = full_text[:delimiter_index] if delimiter_index >= 0 else full_text
            tail = full_text[delimiter_index + len(AI_BRIEFING_RECOMMENDATION_REFERENCE_DELIMITER) :] if delimiter_index >= 0 else ""
            references = fallback_references
            if tail.strip():
                try:
                    slugs = self._parse_tail_payload(tail.strip())
                    mapped = self._map_references(briefings, slugs)
                    references = mapped or fallback_references
                except Exception:
                    references = fallback_references

            chunks: list[str] = []
            sanitizer = AnswerDeltaSanitizer(lambda delta: chunks.append(delta))
            sanitizer.push(answer or "这个时间范围内没有找到足够相关的 AI 简报。")
            sanitizer.finish()
            for chunk in chunks:
                yield encode_sse_event("answer-delta", {"delta": chunk})
            yield encode_sse_event("references", {"references": [item.to_payload() for item in references]})
            yield encode_sse_event("done", {"usage": usage_payload})
        except Exception:
            yield encode_sse_event("error", {"message": AI_BRIEFING_RECOMMENDATION_AI_ERROR_MESSAGE})

    def _parse_tail_payload(self, value: str) -> list[str]:
        payload = json.loads(value)
        if not isinstance(payload, dict) or not isinstance(payload.get("slugs"), list):
            raise ValueError("Invalid ai briefing recommendation tail payload")
        slugs = payload["slugs"]
        if not all(isinstance(slug, str) for slug in slugs):
            raise ValueError("Invalid ai briefing recommendation tail payload")
        return list(slugs)

    def _map_references(self, briefings: list[RecommendReferenceVO], slugs: list[str]) -> list[RecommendReferenceVO]:
        briefing_map = {briefing.slug: briefing for briefing in briefings}
        return [briefing_map[slug] for slug in slugs if slug in briefing_map][:MAX_REFERENCES]

    def _normalize_text(self, value: str) -> str:
        return "".join(character for character in value.lower() if character.isalnum())

    def _build_query_keywords(self, message: str) -> list[str]:
        import re

        compact_stopwords = [self._normalize_text(item) for item in QUERY_STOPWORDS]
        compact = self._normalize_text(message)
        for stopword in compact_stopwords:
            compact = compact.replace(stopword, "")
        tokens = [
            self._normalize_text(token)
            for token in re.split(r"[^\w\u4e00-\u9fff]+", message.lower())
            if self._normalize_text(token) and len(self._normalize_text(token)) >= 2 and self._normalize_text(token) not in compact_stopwords
        ]
        return [token for token in dict.fromkeys([compact, *tokens]) if len(token) >= 2]

    def _score_briefing(self, briefing: RecommendReferenceVO, keywords: list[str]) -> int:
        title = self._normalize_text(briefing.title)
        excerpt = self._normalize_text(briefing.excerpt)
        tags = [self._normalize_text(tag) for tag in briefing.tags]
        score = 0
        for keyword in keywords:
            if any(tag == keyword for tag in tags):
                score += 10
            if keyword in title:
                score += 5
            if any(keyword in tag or tag in keyword for tag in tags):
                score += 4
            if keyword in excerpt:
                score += 2
        return score

    def _select_context_briefings(self, briefings: list[RecommendReferenceVO], message: str) -> list[RecommendReferenceVO]:
        keywords = self._build_query_keywords(message)
        if not keywords:
            return briefings[:MAX_CONTEXT_BRIEFINGS]

        ranked = sorted(
            ((briefing, index, self._score_briefing(briefing, keywords)) for index, briefing in enumerate(briefings)),
            key=lambda item: (-item[2], item[1]),
        )
        matched = [briefing for briefing, _, score in ranked if score > 0]
        return (matched if matched else briefings)[:MAX_CONTEXT_BRIEFINGS]

    def _is_in_range(self, value: str, range_value: BriefingRange) -> bool:
        days = 1 if range_value == "today" else int(range_value.replace("d", ""))
        start = datetime.now()
        start = start.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        briefing_date = datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        return briefing_date >= start.date()
