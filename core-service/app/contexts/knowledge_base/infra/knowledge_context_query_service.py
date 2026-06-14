from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import Select, Text, cast, literal, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO


_FALLBACK_SCORE = 1


class KnowledgeContextQueryService:
    _ARTICLE_NAVIGATION_PHRASES = (
        "有哪些文章",
        "文章有哪些",
        "推荐文章",
        "推荐阅读",
        "下一篇看什么",
        "先看哪篇",
        "先看什么",
        "阅读顺序",
    )

    _RECENT_TRENDS_PHRASES = (
        "最近",
        "最新",
        "近期",
        "近来",
        "这几天",
        "这几天",
        "本周",
        "本月",
        "有什么动态",
        "哪些动态",
        "有什么发布",
        "哪些发布",
        "有什么新闻",
        "哪些新闻",
        "有什么进展",
        "哪些进展",
        "有什么动向",
        "哪些动向",
        "有什么更新",
        "值得跟进",
        "值得关注",
    )

    def _reference_source_type(self, source_type: str) -> str:
        if source_type == "article":
            return "article-section"
        if source_type == "ai_briefing":
            return "ai-section"
        if source_type == "investment_briefing":
            return "investment-section"
        return source_type

    def _query_terms(self, query: str) -> list[str]:
        normalized = query.lower()
        terms = set(re.findall(r"[a-z0-9][a-z0-9_-]{1,}", normalized))
        for sequence in re.findall(r"[\u4e00-\u9fff]{2,}", normalized):
            max_size = min(6, len(sequence))
            for size in range(2, max_size + 1):
                for start in range(0, len(sequence) - size + 1):
                    terms.add(sequence[start : start + size])
        return sorted(terms, key=len, reverse=True)

    def _extract_dates_from_query(self, query: str) -> list[datetime]:
        """从查询中提取可能的日期（优先 YYYY-MM-DD，其次 M月D日）。"""
        dates: list[datetime] = []
        seen: set[str] = set()
        for match in re.finditer(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", query):
            key = f"{match.group(1)}-{int(match.group(2)):02d}-{int(match.group(3)):02d}"
            if key in seen:
                continue
            seen.add(key)
            try:
                dates.append(datetime.strptime(key, "%Y-%m-%d").replace(tzinfo=timezone.utc))
            except ValueError:
                continue
        current_year = datetime.now(timezone.utc).year
        for match in re.finditer(r"(\d{1,2})\s*月\s*(\d{1,2})\s*日", query):
            month = int(match.group(1))
            day = int(match.group(2))
            for year in {current_year, current_year - 1}:
                key = f"{year}-{month:02d}-{day:02d}"
                if key in seen:
                    continue
                try:
                    dates.append(datetime.strptime(key, "%Y-%m-%d").replace(tzinfo=timezone.utc))
                    seen.add(key)
                except ValueError:
                    continue
        return dates

    def _is_article_navigation_query(self, query: str) -> bool:
        normalized = query.replace(" ", "")
        return any(phrase in normalized for phrase in self._ARTICLE_NAVIGATION_PHRASES)

    def _is_recent_trends_query(self, query: str) -> bool:
        normalized = query.replace(" ", "")
        return any(phrase in normalized for phrase in self._RECENT_TRENDS_PHRASES)

    def _match_score(self, query_terms: list[str], chunk: KnowledgeChunkPO, document: KnowledgeDocumentPO) -> int:
        if not query_terms:
            return 0
        title_text = f"{document.title}\n{chunk.heading or ''}".lower()
        content_text = chunk.content.lower()
        score = 0
        for term in query_terms:
            if term in title_text:
                score += len(term) * 3
            if term in content_text:
                score += len(term)
        return score

    def _json_array_contains(self, column: Any, value: str) -> ColumnElement[bool]:
        return cast(column, Text).like(literal(f'%"{value}"%'))

    def _source_types_for_recent_trends(
        self,
        scene: str | None,
        domain: str | None,
    ) -> list[str] | None:
        values = []
        for scope in (scene, domain):
            if scope:
                values.append(scope)
        scope_value = "".join(values)
        if "investment" in scope_value:
            return ["investment_briefing"]
        if "ai" in scope_value:
            return ["ai_briefing"]
        return None

    async def query_contexts(
        self,
        session: AsyncSession,
        query: str,
        article_slug: str | None = None,
        top_k: int = 5,
        *,
        scene: str | None = None,
        domain: str | None = None,
        page_slug: str | None = None,
    ) -> tuple[list[str], list[dict[str, str]]]:
        candidate_limit = max(top_k * 20, 50)
        is_recent_trends_query = self._is_recent_trends_query(query)
        prefer_recent = is_recent_trends_query and not article_slug
        recent_source_types = self._source_types_for_recent_trends(scene, domain) if prefer_recent else None

        def build_statement(*, include_page_slug: bool) -> Select[tuple[KnowledgeChunkPO, KnowledgeDocumentPO]]:
            statement = select(KnowledgeChunkPO, KnowledgeDocumentPO).join(
                KnowledgeDocumentPO,
                KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id,
            )
            if article_slug:
                statement = statement.where(KnowledgeDocumentPO.slug == article_slug)
            if include_page_slug and page_slug:
                statement = statement.where(or_(KnowledgeDocumentPO.slug == page_slug, KnowledgeDocumentPO.source_id == page_slug))
            if recent_source_types:
                statement = statement.where(KnowledgeDocumentPO.source_type.in_(recent_source_types))
            if scene:
                statement = statement.where(or_(KnowledgeDocumentPO.scenes.is_(None), self._json_array_contains(KnowledgeDocumentPO.scenes, scene)))
            if domain:
                statement = statement.where(or_(KnowledgeDocumentPO.domains.is_(None), self._json_array_contains(KnowledgeDocumentPO.domains, domain)))
            return statement.order_by(KnowledgeDocumentPO.published_at.desc().nullslast()).limit(candidate_limit)

        query_dates = self._extract_dates_from_query(query)
        rows: list[Any] = []
        if query_dates and not article_slug:
            rows = await self._query_by_dates(
                session,
                query_dates,
                scene=scene,
                domain=domain,
                source_types=recent_source_types,
                limit=candidate_limit,
            )
        else:
            rows = list(await session.execute(build_statement(include_page_slug=not prefer_recent)))
            if not rows and page_slug and not article_slug:
                rows = list(await session.execute(build_statement(include_page_slug=False)))
            if not rows and not (article_slug or page_slug or scene or domain):
                rows = list(
                    await session.execute(
                        select(KnowledgeChunkPO, KnowledgeDocumentPO).join(
                            KnowledgeDocumentPO,
                            KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id,
                        ).limit(candidate_limit)
                    )
                )

        contexts: list[str] = []
        references: list[dict[str, str]] = []
        is_article_navigation_query = self._is_article_navigation_query(query)
        query_terms = [] if is_article_navigation_query or prefer_recent else self._query_terms(query)
        scored_rows: list[tuple[int, KnowledgeChunkPO, KnowledgeDocumentPO]] = []
        seen_documents: set[str] = set()
        for chunk, document in rows:
            document_key = document.url or document.title
            if document_key in seen_documents:
                continue
            score = self._match_score(query_terms, chunk, document)
            if query_terms and score <= 0:
                continue
            seen_documents.add(document_key)
            scored_rows.append((score, chunk, document))

        if not scored_rows and (scene or domain) and not article_slug:
            scored_rows = await self._fallback_recent_chunks(
                session,
                scene=scene,
                domain=domain,
                source_types=recent_source_types,
                top_k=top_k,
            )

        if prefer_recent:
            scored_rows.sort(
                key=lambda item: getattr(item[2], "published_at", None) or datetime.min.replace(tzinfo=timezone.utc),
                reverse=True,
            )
        else:
            scored_rows.sort(
                key=lambda item: (
                    item[0],
                    getattr(item[2], "published_at", None) or datetime.min.replace(tzinfo=timezone.utc),
                ),
                reverse=True,
            )
        for _, chunk, document in scored_rows[:top_k]:
            contexts.append(chunk.content)
            references.append(
                {
                    "id": chunk.id,
                    "title": document.title,
                    "url": document.url or "",
                    "source_type": self._reference_source_type(document.source_type),
                    "excerpt": chunk.content[:160],
                }
            )
        return contexts, references

    async def _fallback_recent_chunks(
        self,
        session: AsyncSession,
        *,
        scene: str | None,
        domain: str | None,
        source_types: list[str] | None,
        top_k: int,
    ) -> list[tuple[int, KnowledgeChunkPO, KnowledgeDocumentPO]]:
        statement = (
            select(KnowledgeChunkPO, KnowledgeDocumentPO)
            .join(KnowledgeDocumentPO, KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id)
            .where(KnowledgeChunkPO.chunk_index == 0)
            .order_by(KnowledgeDocumentPO.published_at.desc().nullslast())
            .limit(top_k)
        )
        if source_types:
            statement = statement.where(KnowledgeDocumentPO.source_type.in_(source_types))
        if scene:
            statement = statement.where(or_(KnowledgeDocumentPO.scenes.is_(None), self._json_array_contains(KnowledgeDocumentPO.scenes, scene)))
        if domain:
            statement = statement.where(or_(KnowledgeDocumentPO.domains.is_(None), self._json_array_contains(KnowledgeDocumentPO.domains, domain)))

        fallback_rows = list(await session.execute(statement))
        seen_documents: set[str] = set()
        result: list[tuple[int, KnowledgeChunkPO, KnowledgeDocumentPO]] = []
        for chunk, document in fallback_rows:
            document_key = document.url or document.title
            if document_key in seen_documents:
                continue
            seen_documents.add(document_key)
            result.append((_FALLBACK_SCORE, chunk, document))
            if len(result) >= top_k:
                break
        return result

    async def _query_by_dates(
        self,
        session: AsyncSession,
        dates: list[datetime],
        *,
        scene: str | None,
        domain: str | None,
        source_types: list[str] | None,
        limit: int,
    ) -> list[Any]:
        """按日期精确匹配简报或文章，返回对应 chunk。"""
        if not dates:
            return []
        start = min(dates)
        end = max(dates) + timedelta(days=1)
        statement = (
            select(KnowledgeChunkPO, KnowledgeDocumentPO)
            .join(KnowledgeDocumentPO, KnowledgeChunkPO.document_id == KnowledgeDocumentPO.id)
            .where(
                KnowledgeDocumentPO.published_at >= start,
                KnowledgeDocumentPO.published_at < end,
            )
            .order_by(KnowledgeDocumentPO.published_at.desc())
            .limit(limit)
        )
        if source_types:
            statement = statement.where(KnowledgeDocumentPO.source_type.in_(source_types))
        if scene:
            statement = statement.where(or_(KnowledgeDocumentPO.scenes.is_(None), self._json_array_contains(KnowledgeDocumentPO.scenes, scene)))
        if domain:
            statement = statement.where(or_(KnowledgeDocumentPO.domains.is_(None), self._json_array_contains(KnowledgeDocumentPO.domains, domain)))
        return list(await session.execute(statement))
