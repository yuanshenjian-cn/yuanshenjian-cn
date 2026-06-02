from __future__ import annotations

import json
from collections.abc import AsyncIterator
from dataclasses import dataclass

from app.contexts.ai_assistant.application.answer_delta_sanitizer import AnswerDeltaSanitizer
from app.contexts.ai_assistant.application.dto.stream_article_recommendation_dto import (
    StreamArticleRecommendationReq,
    StreamArticleRecommendationResp,
)
from app.contexts.ai_assistant.application.stream_event_codec import encode_sse_event
from app.contexts.ai_assistant.domain.article_recommendation_prompt import (
    ARTICLE_RECOMMENDATION_REFERENCE_DELIMITER,
    build_article_recommendation_stream_system_prompt,
)
from app.contexts.ai_assistant.domain.llm_message_stream_gateway import LLMChatMessage, LLMChatStreamEvent, LLMMessageStreamGateway
from app.contexts.ai_assistant.domain.llm_profile import LLMProfile
from app.contexts.ai_assistant.domain.llm_profile_resolver import LLMProfileResolver
from app.contexts.ai_assistant.domain.published_ai_asset_reader import PublishedAIAssetReader
from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO

ARTICLE_RECOMMENDATION_AI_ERROR_MESSAGE = "AI 服务刚刚开小差了，请稍后重试。"
MAX_CONTEXT_POSTS = 8
MAX_REFERENCES = 3
QUERY_STOPWORDS = ["推荐", "几篇", "关于", "文章", "博客", "一下", "帮我", "想读", "主题", "相关", "内容", "请", "的"]


@dataclass(frozen=True)
class _SelectedPostsResult:
    posts: list[RecommendReferenceVO]
    has_match: bool


class StreamArticleRecommendationAppService:
    def __init__(
        self,
        data_query_service: PublishedAIAssetReader,
        profile_query_service: LLMProfileResolver,
        llm_message_stream_gateway: LLMMessageStreamGateway,
    ) -> None:
        self._data_query_service = data_query_service
        self._profile_query_service = profile_query_service
        self._llm_message_stream_gateway = llm_message_stream_gateway

    async def execute(self, req: StreamArticleRecommendationReq) -> StreamArticleRecommendationResp:
        posts = self._data_query_service.load_article_recommendation_candidates()
        selection = self._select_context_posts(posts, req.message)
        profile = self._profile_query_service.resolve_active_profile("article_recommendation")
        stream = self._llm_message_stream_gateway.stream_chat(
            profile,
            messages=[
                LLMChatMessage(role="system", content=build_article_recommendation_stream_system_prompt(selection.posts)),
                LLMChatMessage(role="user", content=req.message),
            ],
            max_tokens=800,
            temperature=0.4,
        )
        return StreamArticleRecommendationResp(stream=self._stream(profile, stream, selection))

    async def _stream(
        self,
        profile: LLMProfile,
        stream: AsyncIterator[LLMChatStreamEvent],
        selection: _SelectedPostsResult,
    ) -> AsyncIterator[str]:
        if not profile.api_key or not profile.base_url or profile.model == "fallback":
            yield encode_sse_event("error", {"message": ARTICLE_RECOMMENDATION_AI_ERROR_MESSAGE})
            return

        processor = _RecommendAnswerStreamProcessor()
        answer_chunks: list[str] = []
        sanitizer = AnswerDeltaSanitizer(lambda delta: answer_chunks.append(delta))
        usage_payload: dict[str, int | None] | None = None
        fallback_references = self._build_fallback_references(selection.posts)

        try:
            async for event in stream:
                if event.delta:
                    emitted_chunks = processor.push(event.delta)
                    for chunk in emitted_chunks:
                        sanitizer.push(chunk)
                        if answer_chunks:
                            delta = "".join(answer_chunks)
                            answer_chunks.clear()
                            yield encode_sse_event("answer-delta", {"delta": delta})
                if event.usage is not None:
                    usage_payload = event.usage.as_dict()

            result = processor.finish()
            if result.remaining_answer:
                sanitizer.push(result.remaining_answer)
            sanitizer.finish()
            if answer_chunks:
                delta = "".join(answer_chunks)
                answer_chunks.clear()
                yield encode_sse_event("answer-delta", {"delta": delta})

            references = fallback_references
            if result.saw_delimiter:
                try:
                    slugs = self._parse_tail_payload(result.tail)
                    mapped = self._map_references(selection.posts, slugs)
                    references = mapped or fallback_references
                except Exception:
                    references = fallback_references

            yield encode_sse_event("references", {"references": [item.to_payload() for item in references]})
            yield encode_sse_event("done", {"usage": usage_payload})
        except Exception:
            yield encode_sse_event("error", {"message": ARTICLE_RECOMMENDATION_AI_ERROR_MESSAGE})

    def _build_fallback_references(self, posts: list[RecommendReferenceVO]) -> list[RecommendReferenceVO]:
        return posts[:MAX_REFERENCES]

    def _parse_tail_payload(self, value: str) -> list[str]:
        payload = json.loads(value)
        if not isinstance(payload, dict) or not isinstance(payload.get("slugs"), list):
            raise ValueError("Invalid article recommendation tail payload")
        slugs = payload["slugs"]
        if not all(isinstance(slug, str) for slug in slugs):
            raise ValueError("Invalid article recommendation tail payload")
        return list(slugs)

    def _map_references(self, posts: list[RecommendReferenceVO], slugs: list[str]) -> list[RecommendReferenceVO]:
        post_map = {post.slug: post for post in posts}
        references: list[RecommendReferenceVO] = []
        for slug in slugs:
            post = post_map.get(slug)
            if post is not None:
                references.append(post)
        return references[:MAX_REFERENCES]

    def _normalize_text(self, value: str) -> str:
        lowered = value.lower()
        return "".join(character for character in lowered if character.isalnum())

    def _strip_stopwords(self, value: str, stopwords: list[str]) -> str:
        result = value
        for stopword in stopwords:
            result = result.replace(stopword, "")
        return result

    def _extract_topic_keywords(self, message: str, stopwords: list[str]) -> list[str]:
        import re

        match = (
            re.search(r"关于(.+?)(?:相关的)?文章", message)
            or re.search(r"和(.+?)(?:相关的)?文章", message)
            or re.search(r"推荐几篇(.+?)文章", message)
        )
        if match is None or not match.group(1):
            return []

        keywords: list[str] = []
        for segment in re.split(r"[、，,/\s]+", match.group(1)):
            keyword = self._strip_stopwords(self._normalize_text(segment), stopwords)
            if len(keyword) < 2:
                continue
            keywords.append(keyword)
            if all("\u4e00" <= character <= "\u9fff" for character in keyword) and len(keyword) >= 4:
                keywords.append(keyword[:2])

        return list(dict.fromkeys(keywords))

    def _build_query_keywords(self, message: str) -> list[str]:
        import re

        compact_stopwords = [self._normalize_text(item) for item in QUERY_STOPWORDS if self._normalize_text(item)]
        compact = self._strip_stopwords(self._normalize_text(message), compact_stopwords)
        topic_keywords = self._extract_topic_keywords(message, compact_stopwords)
        spaced_tokens = [
            self._strip_stopwords(self._normalize_text(token), compact_stopwords)
            for token in re.split(r"[^\w\u4e00-\u9fff]+", message.lower())
        ]
        raw_keywords = [keyword for keyword in dict.fromkeys([compact, *topic_keywords, *spaced_tokens]) if len(keyword) >= 2]
        return [
            keyword
            for keyword in raw_keywords
            if len(keyword) > 2 or not any(candidate != keyword and keyword in candidate for candidate in raw_keywords)
        ]

    def _score_post(self, post: RecommendReferenceVO, keywords: list[str]) -> int:
        if not keywords:
            return 0
        title = self._normalize_text(post.title)
        excerpt = self._normalize_text(post.excerpt)
        tags = [self._normalize_text(tag) for tag in post.tags]

        score = 0
        for keyword in keywords:
            if any(tag == keyword for tag in tags):
                score += 10
            if any(keyword in tag or tag in keyword for tag in tags):
                score += 4
            if keyword in title:
                score += 5
            if keyword in excerpt:
                score += 2
        return score

    def _select_context_posts(self, posts: list[RecommendReferenceVO], message: str) -> _SelectedPostsResult:
        keywords = self._build_query_keywords(message)
        ranked = sorted(
            ((post, index, self._score_post(post, keywords)) for index, post in enumerate(posts)),
            key=lambda item: (-item[2], item[1]),
        )
        matched = [post for post, _, score in ranked if score > 0]
        if matched:
            return _SelectedPostsResult(posts=matched[:MAX_CONTEXT_POSTS], has_match=True)
        return _SelectedPostsResult(posts=posts[:MAX_CONTEXT_POSTS], has_match=False)


@dataclass(frozen=True)
class _RecommendProcessorResult:
    saw_delimiter: bool
    tail: str
    remaining_answer: str


class _RecommendAnswerStreamProcessor:
    def __init__(self) -> None:
        self._before_delimiter_buffer = ""
        self._tail_buffer = ""
        self._saw_delimiter = False

    def push(self, chunk: str) -> list[str]:
        if not chunk:
            return []
        if self._saw_delimiter:
            self._tail_buffer += chunk
            return []

        self._before_delimiter_buffer += chunk
        delimiter_index = self._before_delimiter_buffer.find(ARTICLE_RECOMMENDATION_REFERENCE_DELIMITER)
        if delimiter_index >= 0:
            answer_chunk = self._before_delimiter_buffer[:delimiter_index]
            self._tail_buffer += self._before_delimiter_buffer[delimiter_index + len(ARTICLE_RECOMMENDATION_REFERENCE_DELIMITER) :]
            self._before_delimiter_buffer = ""
            self._saw_delimiter = True
            return [answer_chunk] if answer_chunk else []

        safe_length = max(0, len(self._before_delimiter_buffer) - (len(ARTICLE_RECOMMENDATION_REFERENCE_DELIMITER) - 1))
        if safe_length <= 0:
            return []
        safe_text = self._before_delimiter_buffer[:safe_length]
        self._before_delimiter_buffer = self._before_delimiter_buffer[safe_length:]
        return [safe_text] if safe_text else []

    def finish(self) -> _RecommendProcessorResult:
        remaining_answer = ""
        if not self._saw_delimiter and self._before_delimiter_buffer:
            remaining_answer = self._before_delimiter_buffer
            self._before_delimiter_buffer = ""
        return _RecommendProcessorResult(
            saw_delimiter=self._saw_delimiter,
            tail=self._tail_buffer.strip(),
            remaining_answer=remaining_answer,
        )
