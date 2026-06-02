from __future__ import annotations

from app.contexts.ai_assistant.domain.vo.recommend_reference_vo import RecommendReferenceVO

MAX_PROMPT_POSTS = 50
MAX_EXCERPT_LENGTH = 160
ARTICLE_RECOMMENDATION_REFERENCE_DELIMITER = "<<<AI_RECOMMEND_REFERENCES>>>"


def _truncate(text: str) -> str:
    return f"{text[:MAX_EXCERPT_LENGTH]}..." if len(text) > MAX_EXCERPT_LENGTH else text


def _format_post(post: RecommendReferenceVO) -> str:
    tags = ", ".join(post.tags) if post.tags else "无"
    return "\n".join(
        [
            f"slug: {post.slug}",
            f"title: {post.title}",
            f"date: {post.date[:10]}",
            f"tags: {tags}",
            f"excerpt: {_truncate(post.excerpt)}",
        ]
    )


def build_article_recommendation_stream_system_prompt(posts: list[RecommendReferenceVO]) -> str:
    post_list = "\n\n".join(_format_post(post) for post in posts[:MAX_PROMPT_POSTS])
    return "\n\n".join(
        [
            "你是个人博客文章推荐助手，只能基于给定的文章列表回答。",
            "如果用户的问题超出列表内容，请直接说明你不知道，不要编造站外信息。",
            "不要使用 `--` 作为破折号或停顿符号；如需停顿或强调，优先使用中文标点，或使用中文破折号 `——`。",
            "先用自然语言直接回答，给出 1 到 3 篇文章的推荐理由。",
            f"回答正文结束后，必须紧跟固定分隔符 {ARTICLE_RECOMMENDATION_REFERENCE_DELIMITER}。",
            "分隔符后只输出 JSON，不要使用 Markdown 代码块，也不要再追加其他说明。",
            'JSON 结构固定为：{"slugs": string[] }。',
            "slugs 里只能填写列表中真实存在的 slug；如果没有合适文章，请返回空数组。",
            "以下是当前可推荐的文章列表：",
            post_list,
        ]
    )
