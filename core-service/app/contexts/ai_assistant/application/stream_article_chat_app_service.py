from __future__ import annotations

from app.contexts.ai_assistant.application.dto.stream_article_chat_dto import StreamArticleChatReq, StreamArticleChatResp
from app.contexts.ai_assistant.infra.llm_profile_query_service import LLMProfileQueryService
from app.contexts.ai_assistant.infra.llm_stream_service import LLMStreamService
from app.contexts.ai_assistant.infra.page_answer_prompt_builder import build_article_answer_stream_system_prompt
from app.contexts.ai_assistant.infra.published_ai_asset_query_service import PublishedAIAssetQueryService


class StreamArticleChatAppService:
    def __init__(
        self,
        data_query_service: PublishedAIAssetQueryService,
        profile_query_service: LLMProfileQueryService,
        llm_stream_service: LLMStreamService,
    ) -> None:
        self._data_query_service = data_query_service
        self._profile_query_service = profile_query_service
        self._llm_stream_service = llm_stream_service

    async def execute(self, req: StreamArticleChatReq) -> StreamArticleChatResp:
        article = self._data_query_service.load_article_payload(req.slug)
        profile = self._profile_query_service.resolve_active_profile("article")
        references = [{
            "id": req.slug,
            "title": str(article.get("title") or req.slug),
            "excerpt": str(article.get("excerpt") or ""),
            "sourceType": "article-section",
        }]
        return StreamArticleChatResp(
            stream=self._llm_stream_service.stream_completion(
                profile,
                build_article_answer_stream_system_prompt(article),
                req.message,
                references,
            )
        )
