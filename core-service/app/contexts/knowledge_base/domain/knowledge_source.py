from __future__ import annotations

from enum import StrEnum


class KnowledgeSourceKind(StrEnum):
    ARTICLE = "article"
    AUTHOR = "author"
    AI_COLUMN = "ai_column"
    INVESTMENT_COLUMN = "investment_column"
    HEALTH_COLUMN = "health_column"
    MANUAL = "manual"


class KnowledgeSourceStatus(StrEnum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    ARCHIVED = "archived"


def normalize_source_domains(domains: list[str] | None) -> list[str]:
    if not domains:
        return []
    values: list[str] = []
    for item in domains:
        normalized = item.strip().lower().replace(" ", "-")
        if normalized and normalized not in values:
            values.append(normalized)
    return values


def normalize_source_scenes(scenes: list[str] | None) -> list[str]:
    if not scenes:
        return []
    values: list[str] = []
    for item in scenes:
        normalized = item.strip().lower().replace(" ", "-")
        if normalized and normalized not in values:
            values.append(normalized)
    return values
