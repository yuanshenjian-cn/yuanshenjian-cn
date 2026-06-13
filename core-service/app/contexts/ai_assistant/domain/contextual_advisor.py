from __future__ import annotations


def normalize_advisor_scene(value: str) -> str:
    return value.strip().lower()


def normalize_advisor_domain(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower().replace(" ", "-")
    return normalized or None
