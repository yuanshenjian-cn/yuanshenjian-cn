from __future__ import annotations


def build_advisor_prompt(question: str, contexts: list[str]) -> str:
    joined = "\n\n---\n\n".join(contexts) if contexts else "当前知识库没有检索到足够资料。"
    return (
        "你是袁慎建博客的 AI 顾问。请只基于给定资料回答，资料不足时必须明确说明资料不足。"
        "回答需要包含建议、风险或限制、下一步行动，并在可能时给出引用。\n\n"
        f"资料：\n{joined}\n\n问题：{question}"
    )


def format_references(chunks: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {
            "title": chunk.get("title", "未命名资料"),
            "url": chunk.get("url", ""),
            "sourceType": chunk.get("source_type", "article-section"),
            "excerpt": chunk.get("excerpt", chunk.get("content", "")[:120]),
            "id": chunk.get("id", chunk.get("url", "reference")),
        }
        for chunk in chunks
    ]
