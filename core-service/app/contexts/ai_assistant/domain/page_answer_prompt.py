from __future__ import annotations

import json
from typing import Any


def build_article_answer_stream_system_prompt(article: dict[str, Any]) -> str:
    title = str(article.get("title") or "")
    excerpt = str(article.get("excerpt") or "")
    content = str(article.get("content") or excerpt)
    return "\n".join(
        [
            "你是博客文章 AI 助手，只能基于给定文章内容回答。",
            "如果资料不足，必须明确说明资料不足，不要编造站外信息。",
            f"标题：{title}",
            f"摘要：{excerpt}",
            f"正文：{content}",
        ]
    )


def build_author_answer_stream_system_prompt(author: dict[str, Any]) -> str:
    return "\n".join(
        [
            "你是作者资料问答助手，只能基于给定作者公开资料回答。",
            "如果资料不足，必须明确说明资料不足。",
            f"作者资料：{json.dumps(author, ensure_ascii=False)}",
        ]
    )
