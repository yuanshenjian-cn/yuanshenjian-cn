from __future__ import annotations

import json
from collections.abc import AsyncIterator

from app.contexts.ai_assistant.application.dto.stream_ai_advisor_dto import StreamAIAdvisorReq
from app.contexts.ai_assistant.domain.knowledge_context_reader import KnowledgeContextReader
from app.contexts.ai_assistant.domain.llm_answer_stream_gateway import LLMAnswerStreamGateway
from app.contexts.ai_assistant.domain.llm_profile_resolver import LLMProfileResolver
from app.contexts.ai_assistant.domain.published_ai_asset_reader import PublishedAIAssetReader
from app.contexts.knowledge_base.domain.advisor_prompt import build_advisor_prompt, format_references


class StreamAIAdvisorAppService:
    def __init__(
        self,
        profile_query_service: LLMProfileResolver,
        llm_stream_service: LLMAnswerStreamGateway,
        knowledge_query_service: KnowledgeContextReader,
        published_ai_asset_query_service: PublishedAIAssetReader,
    ) -> None:
        self._profile_query_service = profile_query_service
        self._llm_stream_service = llm_stream_service
        self._knowledge_query_service = knowledge_query_service
        self._published_ai_asset_query_service = published_ai_asset_query_service

    async def execute(self, req: StreamAIAdvisorReq) -> AsyncIterator[str]:
        profile = self._profile_query_service.resolve_active_profile("advisor")
        contexts, db_references = self._knowledge_query_service.query(req.message, req.article_slug)
        references: list[dict[str, str]] = db_references
        if req.article_slug and not contexts:
            article = self._published_ai_asset_query_service.load_article_payload(req.article_slug)
            if article:
                contexts.append(str(article.get("content") or article.get("excerpt") or ""))
                references.append(
                    {
                        "id": req.article_slug,
                        "title": str(article.get("title") or req.article_slug),
                        "excerpt": str(article.get("excerpt") or ""),
                        "source_type": "article-section",
                    }
                )
        if not contexts:
            posts = self._published_ai_asset_query_service.load_article_recommendation_candidates()[:5]
            contexts = [json.dumps(post.to_payload(), ensure_ascii=False) for post in posts]
            references = [
                {
                    "id": post.slug,
                    "title": post.title,
                    "excerpt": post.excerpt,
                    "source_type": "article-section",
                }
                for post in posts
            ]
        prompt = build_advisor_prompt(req.message, contexts) + f"\n\n入口：{req.entrypoint}"
        async for event in self._llm_stream_service.stream_completion(
            profile,
            prompt,
            req.message,
            format_references(references),
        ):
            yield event
