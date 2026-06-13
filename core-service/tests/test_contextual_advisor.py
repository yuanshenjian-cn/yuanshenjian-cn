from __future__ import annotations

import asyncio

from app.contexts.ai_assistant.application.dto.stream_ai_advisor_dto import StreamAIAdvisorReq
from app.contexts.ai_assistant.application.stream_ai_advisor_app_service import StreamAIAdvisorAppService
from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProviderProfile


class StubProfileResolver:
    def resolve_active_profile(self, scene: str) -> LLMProviderProfile:
        return LLMProviderProfile(id=scene, provider="openai-compatible", base_url="", model="fallback", api_key="")


class StubKnowledgeReader:
    def __init__(self) -> None:
        self.last_call: dict[str, object] | None = None

    async def query(self, query: str, article_slug: str | None = None, top_k: int = 5, *, scene: str | None = None, domain: str | None = None, page_slug: str | None = None):
        self.last_call = {
            "query": query,
            "article_slug": article_slug,
            "scene": scene,
            "domain": domain,
            "page_slug": page_slug,
        }
        return ["资料 A"], [{"id": "1", "title": "资料 A", "url": "/articles/doc-a", "excerpt": "摘录", "source_type": "article-section"}]


class StubPublishedAssets:
    def load_article_payload(self, slug: str):
        return {}

    def load_article_recommendation_candidates(self):
        return []

    def load_author_payload(self):
        return {"sections": [{"content": "作者资料"}]}

    def load_ai_briefing_recommendation_candidates(self):
        return []

    def load_investment_briefing_recommendation_candidates(self):
        return []


class StubLLMStreamService:
    async def stream_completion(
        self,
        profile,
        system_prompt,
        user_message,
        references=None,
        *,
        provider=None,
        error_message="AI 服务刚刚开小差了，请稍后重试。",
        fallback_answer="当前 AI provider 未配置，已返回基于本地资料的降级响应。",
    ):
        reference_count = len(references or [])
        yield f"profile={profile.id}|prompt={system_prompt}|message={user_message}|references={reference_count}"


def test_stream_ai_advisor_passes_scene_domain_and_page_slug() -> None:
    reader = StubKnowledgeReader()
    service = StreamAIAdvisorAppService(StubProfileResolver(), StubLLMStreamService(), reader, StubPublishedAssets())

    async def collect() -> list[str]:
        return [
            item
            async for item in service.execute(
                StreamAIAdvisorReq(
                    scene="health-column",
                    message="这组内容适合谁",
                    domain="health",
                    page_title="喝出来的健康",
                    page_slug="drink-your-way-to-health",
                    history=["先看饮品误区", "再看饮水习惯"],
                    cf_turnstile_response="token",
                )
            )
        ]

    events = asyncio.run(collect())

    assert reader.last_call == {
        "query": "这组内容适合谁",
        "article_slug": None,
        "scene": "health-column",
        "domain": "health",
        "page_slug": "drink-your-way-to-health",
    }
    assert "health-column" in events[0]
    assert "页面领域：health" in events[0]
    assert "你就是袁慎建" in events[0]
    assert "不要说自己是 AI、模型、助手或机器人" in events[0]
    assert "不要在回答末尾单独追加“回答依据”" in events[0]
    assert "Markdown 链接" in events[0]
    assert "*[《文章标题》](/articles/example-slug)*" in events[0]
    assert "标题：资料 A" in events[0]
    assert "链接：/articles/doc-a" in events[0]


def test_stream_ai_advisor_keeps_latest_history_in_natural_order() -> None:
    service = StreamAIAdvisorAppService(StubProfileResolver(), StubLLMStreamService(), StubKnowledgeReader(), StubPublishedAssets())

    async def collect() -> list[str]:
        return [
            item
            async for item in service.execute(
                StreamAIAdvisorReq(
                    scene="author",
                    message="继续说",
                    page_title="作者",
                    page_slug="author",
                    history=[f"历史 {index:02d}" for index in range(42)],
                    cf_turnstile_response="token",
                )
            )
        ]

    event = asyncio.run(collect())[0]

    assert "历史 00" not in event
    assert "历史 01" not in event
    assert event.index("历史 02") < event.index("历史 41")
    assert "最近对话（从旧到新）" in event


class EmptyKnowledgeReader:
    async def query(
        self,
        query: str,
        article_slug: str | None = None,
        top_k: int = 5,
        *,
        scene: str | None = None,
        domain: str | None = None,
        page_slug: str | None = None,
    ):
        return [], []


class CrossColumnPublishedAssets:
    def __init__(self) -> None:
        self.recommendation_calls = 0

    def load_article_payload(self, slug: str):
        return {}

    def load_article_recommendation_candidates(self) -> list[RecommendReferenceVO]:
        self.recommendation_calls += 1
        return [
            RecommendReferenceVO(
                slug="cross-column-openai-news",
                title="OpenAI 跨栏目新闻",
                excerpt="不属于投资栏目的全站推荐",
                tags=["ai"],
                date="2026-06-01",
                url="/articles/cross-column-openai-news",
            )
        ]

    def load_author_payload(self):
        return {}

    def load_ai_briefing_recommendation_candidates(self):
        return []

    def load_investment_briefing_recommendation_candidates(self):
        return []


def test_stream_ai_advisor_skips_global_fallback_when_column_scoped() -> None:
    published_assets = CrossColumnPublishedAssets()
    service = StreamAIAdvisorAppService(
        StubProfileResolver(),
        StubLLMStreamService(),
        EmptyKnowledgeReader(),
        published_assets,
    )

    async def collect() -> list[str]:
        return [
            item
            async for item in service.execute(
                StreamAIAdvisorReq(
                    scene="investment-column",
                    message="哈喽",
                    domain="investment",
                    page_title="投资观察",
                    page_slug="investment",
                    cf_turnstile_response="token",
                )
            )
        ]

    event = asyncio.run(collect())[0]

    assert published_assets.recommendation_calls == 0
    assert "OpenAI 跨栏目新闻" not in event
    assert "cross-column-openai-news" not in event
    assert "当前知识库没有检索到足够资料。" in event
    assert "references=0" in event
