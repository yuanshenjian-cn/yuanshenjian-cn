from __future__ import annotations

from enum import StrEnum
from posixpath import basename


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
    if not slugs:
        return []
    values: list[str] = []
    for item in slugs:
        normalized = item.strip().replace("\\", "/")
        if not normalized:
            continue
        if "/articles/" in normalized:
            normalized = normalized.split("/articles/", 1)[1]
        normalized = normalized.split("?", 1)[0].split("#", 1)[0]
        normalized = basename(normalized)
        if normalized and normalized not in values:
            values.append(normalized)
    return values


def normalize_term_references(references: list[dict[str, str]] | None) -> list[dict[str, str]]:
    if not references:
        return []
    values: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for item in references:
        label = str(item.get("label", "")).strip()
        url = str(item.get("url", "")).strip()
        if not label or not url:
            continue
        key = (label, url)
        if key in seen:
            continue
        seen.add(key)
        values.append({"label": label, "url": url})
    return values
