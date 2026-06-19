from __future__ import annotations

from app.contexts.ai_assistant.domain.contextual_advisor_prompt import (
    build_contextual_advisor_prompt,
    extract_followup_questions,
    strip_followup_questions_from_answer,
)


def test_build_contextual_advisor_prompt_requires_followup_questions() -> None:
    prompt = build_contextual_advisor_prompt("怎么学 TDD", ["资料 A"], scene="article", domain=None, page_title="测试")

    assert "<followup-questions>" in prompt
    assert "</question>" in prompt
    assert "给出 3 个用户可能还想继续问的问题" in prompt


def test_extract_followup_questions_parses_xml_block() -> None:
    answer = (
        "回答正文。\n\n"
        "<followup-questions>\n"
        "<question>问题 1</question>\n"
        "<question>问题 2</question>\n"
        "<question>问题 3</question>\n"
        "</followup-questions>"
    )

    questions = extract_followup_questions(answer)

    assert questions == ["问题 1", "问题 2", "问题 3"]


def test_extract_followup_questions_limits_to_three() -> None:
    answer = (
        "<followup-questions>\n"
        "<question>1</question>\n"
        "<question>2</question>\n"
        "<question>3</question>\n"
        "<question>4</question>\n"
        "</followup-questions>"
    )

    questions = extract_followup_questions(answer)

    assert questions == ["1", "2", "3"]


def test_extract_followup_questions_returns_empty_when_missing() -> None:
    assert extract_followup_questions("没有 followup 问题") == []


def test_strip_followup_questions_from_answer_removes_xml_block() -> None:
    answer = (
        "回答正文。\n\n"
        "<followup-questions>\n"
        "<question>问题</question>\n"
        "</followup-questions>"
    )

    stripped = strip_followup_questions_from_answer(answer)

    assert stripped == "回答正文。"
    assert "<followup-questions>" not in stripped
