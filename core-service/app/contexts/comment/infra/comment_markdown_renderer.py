from __future__ import annotations

from datetime import UTC, datetime

import bleach
from markdown_it import MarkdownIt


class CommentMarkdownRenderer:
    _allowed_tags = ["p", "a", "blockquote", "code", "pre", "ul", "ol", "li", "strong", "em"]
    _allowed_attributes = {"a": ["href", "title", "rel", "target"]}

    def render(self, markdown: str) -> str:
        raw_html = MarkdownIt("commonmark").render(markdown)
        cleaned = bleach.clean(raw_html, tags=self._allowed_tags, attributes=self._allowed_attributes, strip=True)
        return cleaned.replace("<a href=", '<a rel="nofollow noopener noreferrer" target="_blank" href=')

    def now(self) -> datetime:
        return datetime.now(UTC)
