from __future__ import annotations

from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO

AI_BRIEFING_RECOMMENDATION_REFERENCE_DELIMITER = "<<<AI_BRIEFING_RECOMMEND_REFERENCES>>>"
MAX_PROMPT_BRIEFINGS = 10
MAX_EXCERPT_LENGTH = 180


def _truncate(value: str) -> str:
    return f"{value[:MAX_EXCERPT_LENGTH]}..." if len(value) > MAX_EXCERPT_LENGTH else value


def _format_briefing(briefing: RecommendReferenceVO) -> str:
    tags = ", ".join(briefing.tags) if briefing.tags else "无"
    url = briefing.url or f"/ai/briefings/{briefing.slug}"
    return "\n".join(
        [
            f"slug: {briefing.slug}",
            f"title: {briefing.title}",
            f"date: {briefing.date[:10]}",
            f"url: {url}",
            f"tags: {tags}",
            f"excerpt: {_truncate(briefing.excerpt)}",
        ]
    )


def build_briefing_recommendation_stream_system_prompt(briefings: list[RecommendReferenceVO]) -> str:
    context = "\n\n---\n\n".join(_format_briefing(item) for item in briefings[:MAX_PROMPT_BRIEFINGS])
    return "\n\n".join(
        [
            "你是博客 AI 简报推荐助手。你的任务只是在给定的 AI 简报列表中推荐最相关的 1 到 3 期。",
            "不要推荐上下文里不存在的简报，不要编造日期、标题或链接。",
            "优先匹配用户主题、厂商名、时间范围和摘要。",
            "先用中文自然语言直接回答，简洁说明推荐理由。",
            f"回答正文结束后，必须紧跟固定分隔符 {AI_BRIEFING_RECOMMENDATION_REFERENCE_DELIMITER}。",
            "分隔符后只输出 JSON，不要使用 Markdown 代码块，也不要再追加其他说明。",
            'JSON 结构固定为：{"slugs": string[] }。',
            "可推荐的 AI 简报：",
            context or "当前时间范围内没有可推荐的 AI 简报。",
        ]
    )
