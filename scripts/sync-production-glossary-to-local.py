#!/usr/bin/env python3
"""同步生产公开术语库到本地开发数据库。"""

from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

CORE_SERVICE_ROOT = Path(__file__).resolve().parents[1] / "core-service"
if str(CORE_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(CORE_SERVICE_ROOT))

GLOSSARY_URL = "https://api.yuanshenjian.cn/api/v1/ai-assistant/glossary"


def fetch_glossary() -> list[dict[str, object]]:
    with urlopen(GLOSSARY_URL, timeout=30) as response:
        payload = json.load(response)
    items = payload.get("items")
    if not isinstance(items, list) or not items:
        raise ValueError("生产术语接口未返回任何术语")
    return items


def as_string_list(value: object) -> list[str]:
    return [item for item in value if isinstance(item, str)] if isinstance(value, list) else []


def as_references(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    return [
        {"label": str(item.get("label", "")), "url": str(item.get("url", ""))}
        for item in value
        if isinstance(item, dict) and item.get("label") and item.get("url")
    ]


async def sync() -> None:
    from sqlalchemy import delete

    from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO
    from app.shared.infra.app_config import settings
    from app.shared.infra.database import transactional_session

    if settings.app_env != "local":
        raise ValueError("仅允许向本地开发环境同步生产术语")

    items = fetch_glossary()
    seen_ids: set[str] = set()
    now = datetime.now(timezone.utc)

    async with transactional_session() as session:
        await session.execute(delete(KnowledgeTermPO))
        for item in items:
            term_id = item.get("id")
            term = item.get("term")
            definition = item.get("definition")
            explanation = item.get("explanation")
            if not all(isinstance(value, str) and value.strip() for value in (term_id, term, definition, explanation)):
                raise ValueError("生产术语存在缺少必填字段的记录")
            assert isinstance(term_id, str)
            assert isinstance(term, str)
            assert isinstance(definition, str)
            assert isinstance(explanation, str)
            if term_id in seen_ids:
                raise ValueError(f"生产术语存在重复 ID: {term_id}")
            seen_ids.add(term_id)
            session.add(
                KnowledgeTermPO(
                    id=term_id,
                    term=term,
                    aliases=as_string_list(item.get("aliases")),
                    definition=definition,
                    explanation=explanation,
                    related_article_slugs=as_string_list(item.get("related_article_slugs")),
                    references=as_references(item.get("references")),
                    domains=[],
                    scenes=[],
                    status="enabled",
                    notes="从生产公开术语库同步到本地开发环境",
                    updated_by="local-glossary-sync",
                    created_at=now,
                    updated_at=now,
                )
            )

    print(f"已同步 {len(seen_ids)} 条生产术语到本地数据库")


if __name__ == "__main__":
    asyncio.run(sync())
