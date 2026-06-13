from __future__ import annotations

import json
from collections.abc import AsyncIterator

from app.contexts.ai_assistant.application.dto.stream_ai_advisor_dto import StreamAIAdvisorReq
from app.contexts.ai_assistant.domain.contextual_advisor import normalize_advisor_domain, normalize_advisor_scene
from app.contexts.ai_assistant.domain.contextual_advisor_prompt import build_contextual_advisor_prompt
from app.contexts.ai_assistant.domain.knowledge_context_reader import KnowledgeContextReader
from app.contexts.ai_assistant.domain.llm_answer_stream_gateway import LLMAnswerStreamGateway
from app.contexts.ai_assistant.domain.llm_profile_resolver import LLMProfileResolver
from app.contexts.ai_assistant.domain.published_ai_asset_reader import PublishedAIAssetReader
from app.contexts.knowledge_base.domain.advisor_prompt import format_references
from app.shared.infra.app_config import settings


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

    def _append_reference_links_to_contexts(self, contexts: list[str], references: list[dict[str, str]]) -> list[str]:
        if not references:
            return contexts
        enriched_contexts: list[str] = []
        for index, context in enumerate(contexts):
            reference = references[index] if index < len(references) else None
            if not reference:
                enriched_contexts.append(context)
                continue
            title = reference.get("title") or "未命名文章"
            url = reference.get("url") or ""
            link_line = f"链接：{url}\n" if url else ""
            enriched_contexts.append(f"标题：{title}\n{link_line}内容：{context}")
        return enriched_contexts

    async def execute(self, req: StreamAIAdvisorReq) -> AsyncIterator[str]:
        scene = normalize_advisor_scene(req.scene)
        domain = normalize_advisor_domain(req.domain)
        profile = self._profile_query_service.resolve_active_profile("contextual_ai_advisor")
        contexts, db_references = await self._knowledge_query_service.query(
            req.message,
            req.article_slug,
            scene=scene,
            domain=domain,
            page_slug=req.page_slug,
        )
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
                        "url": f"/articles/{req.article_slug}",
                        "source_type": "article-section",
                    }
                )
        if scene == "author" and not contexts:
            author = self._published_ai_asset_query_service.load_author_payload()
            sections = author.get("sections") if isinstance(author, dict) else None
            if isinstance(sections, list):
                contexts.extend(
                    str(section.get("content") or section.get("excerpt") or "")
                    for section in sections
                    if isinstance(section, dict) and (section.get("content") or section.get("excerpt"))
                )
            if author:
                references.append(
                    {
                        "id": "author",
                        "title": "作者资料",
                        "excerpt": "作者公开资料",
                        "source_type": "author-section",
                    }
                )
        column_scoped = bool(req.article_slug or req.page_slug or domain or scene)
        if not contexts and not column_scoped:
            posts = self._published_ai_asset_query_service.load_article_recommendation_candidates()[:5]
            contexts = [json.dumps(post.to_payload(), ensure_ascii=False) for post in posts]
            references = [
                {
                    "id": post.slug,
                    "title": post.title,
                    "excerpt": post.excerpt,
                    "url": post.url or f"/articles/{post.slug}",
                    "source_type": "article-section",
                }
                for post in posts
            ]
        contexts = self._append_reference_links_to_contexts(contexts, references)
        prompt = build_contextual_advisor_prompt(
            req.message,
            contexts,
            scene=scene,
            domain=domain,
            page_title=req.page_title,
        )
        max_history_items = max(settings.ai_advisor_history_rounds, 1) * 2
        recent_history = [item.strip() for item in req.history if item.strip()][-max_history_items:]
        if recent_history:
            prompt += "\n\n最近对话（从旧到新）：\n" + "\n".join(f"- {item}" for item in recent_history)
        prompt += f"\n\n入口：{req.entrypoint}"
        async for event in self._llm_stream_service.stream_completion(
            profile,
            prompt,
            req.message,
            format_references(references),
        ):
            yield event
