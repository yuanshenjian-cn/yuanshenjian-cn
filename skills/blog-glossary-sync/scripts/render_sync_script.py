#!/usr/bin/env python3
"""Render glossary-candidates.json into an executable curl script.

Usage (local):
    export CORE_SERVICE_URL="http://localhost:8001"
    export ADMIN_API_KEY="<local-api-key>"
    python scripts/render_sync_script.py scripts/glossary-candidates.json > scripts/sync-glossary.sh
    bash scripts/sync-glossary.sh

Usage (production):
    export CORE_SERVICE_URL="https://api.yuanshenjian.cn"
    export ADMIN_API_KEY="<production-api-key>"
    python scripts/render_sync_script.py scripts/glossary-candidates.json > scripts/sync-glossary.sh
    bash scripts/sync-glossary.sh
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def shell_escape(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"


def render_curl(
    method: str,
    url: str,
    payload: dict,
    origin: str,
    api_key: str,
    label: str,
) -> str:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return f"""
echo {shell_escape(label)}
curl -s \
  -X {method} {shell_escape(url)} \
  -H "Content-Type: application/json" \
  -H {shell_escape('Origin: ' + origin)} \
  -H {shell_escape('Authorization: Bearer ' + api_key)} \
  -d {shell_escape(body)}
echo
""".strip()


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: render_sync_script.py <glossary-candidates.json>", file=sys.stderr)
        return 1

    candidates_path = Path(sys.argv[1])
    if not candidates_path.exists():
        print(f"File not found: {candidates_path}", file=sys.stderr)
        return 1

    core_url = os.environ.get("CORE_SERVICE_URL", "http://localhost:8001").rstrip("/")
    origin = os.environ.get("ADMIN_CONSOLE_ORIGIN", "")
    if not origin:
        origin = "https://admin.yuanshenjian.cn" if core_url.startswith("https://api.yuanshenjian.cn") else "http://localhost:5173"
    api_key = os.environ.get("ADMIN_API_KEY", "")
    if not api_key:
        print("请设置 ADMIN_API_KEY 环境变量", file=sys.stderr)
        return 1

    with candidates_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    create_items = data.get("create", [])
    update_items = data.get("update", [])

    print("#!/bin/bash")
    print("set -euo pipefail")
    print()
    print(f'CORE_URL="{core_url}"')
    print('ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"')
    print(f'ORIGIN="{origin}"')
    print()

    for item in create_items:
        payload = {
            "term": item.get("term", ""),
            "aliases": item.get("aliases", []),
            "definition": item.get("definition", ""),
            "explanation": item.get("explanation", ""),
            "related_article_slugs": item.get("related_article_slugs", []),
            "domains": item.get("domains", []),
            "scenes": item.get("scenes", []),
            "status": item.get("status", "enabled"),
            "notes": item.get("notes", ""),
            "updated_by": item.get("updated_by", "admin"),
        }
        print(
            render_curl(
                "POST",
                f"{core_url}/api/v1/admin/knowledge-terms",
                payload,
                origin,
                api_key,
                f"创建术语: {item.get('term', '')}",
            )
        )
        print()

    for item in update_items:
        term_id = item.get("id", "")
        changes = item.get("changes", {})
        if not term_id:
            continue
        print(
            render_curl(
                "PUT",
                f"{core_url}/api/v1/admin/knowledge-terms/{term_id}",
                changes,
                origin,
                api_key,
                f"更新术语: {changes.get('term', item.get('term', ''))}",
            )
        )
        print()

    print('echo "术语库同步完成"')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
