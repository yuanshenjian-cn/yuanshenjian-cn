#!/usr/bin/env python3
"""Render glossary-candidates.json into an executable curl script.

Usage (local):
    export CORE_SERVICE_URL="http://localhost:8001"
    export ADMIN_API_KEY="<local-api-key>"
    python skills/blog-glossary-sync/scripts/render_sync_script.py \
      skills/blog-glossary-sync/out/glossary-candidates.json \
      --out skills/blog-glossary-sync/out/sync-glossary.sh
    bash skills/blog-glossary-sync/out/sync-glossary.sh

Usage (production):
    export CORE_SERVICE_URL="https://api.yuanshenjian.cn"
    export ADMIN_API_KEY="<production-api-key>"
    python skills/blog-glossary-sync/scripts/render_sync_script.py \
      skills/blog-glossary-sync/out/glossary-candidates.json \
      --out skills/blog-glossary-sync/out/sync-glossary-prod.sh
    bash skills/blog-glossary-sync/out/sync-glossary-prod.sh
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
    label: str,
) -> str:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return f"""
echo {shell_escape(label)}
curl -s \
  -X {method} {shell_escape(url)} \
  -H "Content-Type: application/json" \
  -H {shell_escape('Origin: ' + origin)} \
  -H "Authorization: Bearer ${{ADMIN_API_KEY}}" \
  -d {shell_escape(body)}
echo
""".strip()


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: render_sync_script.py <glossary-candidates.json> [--out <script.sh>]", file=sys.stderr)
        return 1

    candidates_path = Path(sys.argv[1])
    if not candidates_path.exists():
        print(f"File not found: {candidates_path}", file=sys.stderr)
        return 1

    out_path: Path | None = None
    if "--out" in sys.argv:
        out_idx = sys.argv.index("--out")
        if out_idx + 1 < len(sys.argv):
            out_path = Path(sys.argv[out_idx + 1])

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

    lines: list[str] = []
    lines.append("#!/bin/bash")
    lines.append("set -euo pipefail")
    lines.append("")
    lines.append(f'CORE_URL="{core_url}"')
    lines.append('ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"')
    lines.append(f'ORIGIN="{origin}"')
    lines.append("")

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
        lines.append(
            render_curl(
                "POST",
                f"{core_url}/api/v1/admin/knowledge-terms",
                payload,
                origin,
                f"创建术语: {item.get('term', '')}",
            )
        )
        lines.append("")

    for item in update_items:
        term_id = item.get("id", "")
        changes = item.get("changes", {})
        if not term_id:
            continue
        lines.append(
            render_curl(
                "PUT",
                f"{core_url}/api/v1/admin/knowledge-terms/{term_id}",
                changes,
                origin,
                f"更新术语: {changes.get('term', item.get('term', ''))}",
            )
        )
        lines.append("")

    lines.append('echo "术语库同步完成"')
    script = "\n".join(lines) + "\n"

    if out_path is not None:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(script, encoding="utf-8")
        out_path.chmod(0o755)
        print(f"脚本已生成: {out_path}")
    else:
        print(script)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
