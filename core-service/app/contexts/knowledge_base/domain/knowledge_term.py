from __future__ import annotations

from enum import StrEnum


class KnowledgeTermStatus(StrEnum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    ARCHIVED = "archived"


def normalize_term_status(value: str) -> str:
    normalized = value.strip().lower()
    if normalized in {KnowledgeTermStatus.ENABLED, KnowledgeTermStatus.DISABLED, KnowledgeTermStatus.ARCHIVED}:
        return normalized
    return KnowledgeTermStatus.ENABLED


def normalize_term_list(items: list[str] | None) -> list[str]:
    if not items:
        return []
    values: list[str] = []
    for item in items:
        normalized = item.strip()
        if normalized and normalized not in values:
            values.append(normalized)
    return values


def normalize_term_aliases(aliases: list[str] | None) -> list[str]:
    return normalize_term_list(aliases)


def normalize_term_definition(definition: str) -> str:
    return definition.strip()


def normalize_term_explanation(explanation: str) -> str:
    return explanation.strip()


def normalize_term_domains(domains: list[str] | None) -> list[str]:
    return normalize_term_list(domains)


def normalize_term_scenes(scenes: list[str] | None) -> list[str]:
    return normalize_term_list(scenes)


def normalize_term_related_slugs(slugs: list[str] | None) -> list[str]:
    return normalize_term_list(slugs)
