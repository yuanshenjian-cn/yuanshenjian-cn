from __future__ import annotations

from app.contexts.ai_assistant.application.dto.stream_author_chat_dto import StreamAuthorChatReq, StreamAuthorChatResp
from app.contexts.ai_assistant.domain.llm_answer_stream_gateway import LLMAnswerStreamGateway
from app.contexts.ai_assistant.domain.llm_profile_resolver import LLMProfileResolver
from app.contexts.ai_assistant.domain.page_answer_prompt import build_author_answer_stream_system_prompt
from app.contexts.ai_assistant.domain.published_ai_asset_reader import PublishedAIAssetReader


class StreamAuthorChatAppService:
    def __init__(
        self,
        data_query_service: PublishedAIAssetReader,
        profile_query_service: LLMProfileResolver,
        llm_stream_service: LLMAnswerStreamGateway,
    ) -> None:
        self._data_query_service = data_query_service
        self._profile_query_service = profile_query_service
        self._llm_stream_service = llm_stream_service

    async def execute(self, req: StreamAuthorChatReq) -> StreamAuthorChatResp:
        author = self._data_query_service.load_author_payload()
        profile = self._profile_query_service.resolve_active_profile("author")
        references = [{
            "id": "author",
            "title": "作者资料",
            "excerpt": "作者公开资料",
            "sourceType": "author-section",
        }]
        return StreamAuthorChatResp(
            stream=self._llm_stream_service.stream_completion(
                profile,
                build_author_answer_stream_system_prompt(author),
                req.message,
                references,
            )
        )
