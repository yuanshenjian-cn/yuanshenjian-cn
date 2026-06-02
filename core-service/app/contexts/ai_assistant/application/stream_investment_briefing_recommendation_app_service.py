from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import datetime, timedelta

from app.contexts.ai_assistant.application.answer_delta_sanitizer import AnswerDeltaSanitizer
from app.contexts.ai_assistant.application.dto.stream_investment_briefing_recommendation_dto import (
    InvestmentBriefingRange,
    StreamInvestmentBriefingRecommendationReq,
    StreamInvestmentBriefingRecommendationResp,
)
from app.contexts.ai_assistant.application.stream_event_codec import encode_sse_event
from app.contexts.ai_assistant.domain.briefing_recommendation_prompt import (
    AI_BRIEFING_RECOMMENDATION_REFERENCE_DELIMITER,
    build_briefing_recommendation_stream_system_prompt,
)
from app.contexts.ai_assistant.domain.llm_message_stream_gateway import LLMChatMessage, LLMChatStreamEvent, LLMMessageStreamGateway
from app.contexts.ai_assistant.domain.llm_profile import LLMProfile
from app.contexts.ai_assistant.domain.llm_profile_resolver import LLMProfileResolver
from app.contexts.ai_assistant.domain.published_ai_asset_reader import PublishedAIAssetReader
from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO

INVESTMENT_BRIEFING_RECOMMENDATION_AI_ERROR_MESSAGE = "AI 服务刚刚开小差了，请稍后重试。"
MAX_CONTEXT_BRIEFINGS = 10
MAX_REFERENCES = 3


class StreamInvestmentBriefingRecommendationAppService:
    def __init__(
        self,
        data_query_service: PublishedAIAssetReader,
        profile_query_service: LLMProfileResolver,
        llm_message_stream_gateway: LLMMessageStreamGateway,
    ) -> None:
        self._data_query_service = data_query_service
        self._profile_query_service = profile_query_service
        self._llm_message_stream_gateway = llm_message_stream_gateway

    async def execute(self, req: StreamInvestmentBriefingRecommendationReq) -> StreamInvestmentBriefingRecommendationResp:
        briefings = [
            item for item in self._data_query_service.load_investment_briefing_recommendation_candidates() if self._is_in_range(item.date, req.range)
        ]
        profile = self._profile_query_service.resolve_active_profile("investment_briefing_recommendation")
        selected = briefings[:MAX_CONTEXT_BRIEFINGS]
        stream = self._llm_message_stream_gateway.stream_chat(
            profile,
            messages=[
                LLMChatMessage(role="system", content=build_briefing_recommendation_stream_system_prompt(selected)),
                LLMChatMessage(role="user", content=req.message),
            ],
            max_tokens=700,
            temperature=0.3,
        )
        return StreamInvestmentBriefingRecommendationResp(stream=self._stream(profile, stream, selected))

    async def _stream(
        self,
        profile: LLMProfile,
        stream: AsyncIterator[LLMChatStreamEvent],
        briefings: list[RecommendReferenceVO],
    ) -> AsyncIterator[str]:
        if not profile.api_key or not profile.base_url or profile.model == "fallback":
            yield encode_sse_event("error", {"message": INVESTMENT_BRIEFING_RECOMMENDATION_AI_ERROR_MESSAGE})
            return

        full_text = ""
        usage_payload: dict[str, int | None] | None = None
        fallback_references = briefings[:MAX_REFERENCES]

        try:
            async for event in stream:
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
            sanitizer.push(answer or "这个时间范围内没有找到足够相关的投资简报。")
            sanitizer.finish()
            for chunk in chunks:
                yield encode_sse_event("answer-delta", {"delta": chunk})
            yield encode_sse_event("references", {"references": [item.to_payload() for item in references]})
            yield encode_sse_event("done", {"usage": usage_payload})
        except Exception:
            yield encode_sse_event("error", {"message": INVESTMENT_BRIEFING_RECOMMENDATION_AI_ERROR_MESSAGE})

    def _parse_tail_payload(self, value: str) -> list[str]:
        payload = json.loads(value)
        if not isinstance(payload, dict) or not isinstance(payload.get("slugs"), list):
            raise ValueError("Invalid investment briefing recommendation tail payload")
        slugs = payload["slugs"]
        if not all(isinstance(slug, str) for slug in slugs):
            raise ValueError("Invalid investment briefing recommendation tail payload")
        return list(slugs)

    def _map_references(self, briefings: list[RecommendReferenceVO], slugs: list[str]) -> list[RecommendReferenceVO]:
        briefing_map = {briefing.slug: briefing for briefing in briefings}
        return [briefing_map[slug] for slug in slugs if slug in briefing_map][:MAX_REFERENCES]

    def _is_in_range(self, value: str, range_value: InvestmentBriefingRange) -> bool:
        days = int(range_value.replace("d", ""))
        start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date() >= start.date()
