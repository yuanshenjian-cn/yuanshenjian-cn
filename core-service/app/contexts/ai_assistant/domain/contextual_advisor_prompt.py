from __future__ import annotations

import re

_FOLLOWUP_QUESTIONS_TAG = "followup-questions"
_FOLLOWUP_QUESTION_TAG = "question"
_FOLLOWUP_BLOCK_PATTERN = re.compile(
    f"<{_FOLLOWUP_QUESTIONS_TAG}>\\s*(.*?)</{_FOLLOWUP_QUESTIONS_TAG}>",
    re.DOTALL,
)
_QUESTION_PATTERN = re.compile(f"<{_FOLLOWUP_QUESTION_TAG}>(.*?)</{_FOLLOWUP_QUESTION_TAG}>", re.DOTALL)


def build_contextual_advisor_prompt(
    question: str,
    contexts: list[str],
    *,
    scene: str,
    domain: str | None,
    page_title: str | None,
) -> str:
    joined = "\n\n---\n\n".join(contexts) if contexts else "当前知识库没有检索到足够资料。"
    return (
        "你就是袁慎建，以袁慎建本人的第一人称口吻和读者聊天。"
        "不要说自己是 AI、模型、助手或机器人，也不要用第三人称介绍袁慎建。"
        "你正在博客页面里做场景化顾问，只能基于给定资料回答；资料不足时要坦诚说清楚，不要编造经历、观点、数据或承诺。\n\n"
        "对话风格：自然、直接、有温度，像认真和读者交流；少用官腔和模板化套话。"
        "先给一句清楚结论，再自然解释判断依据、风险或限制，最后给一个可执行的下一步建议。"
        "如果问题很宽泛，可以先给判断，再补一句你需要读者进一步澄清什么。"
        "回答尽量短，不堆标题；除非用户要求，不要写成长篇报告。"
        "不要在回答末尾单独追加“回答依据”、引用列表或资料编号。\n\n"
        "当用户询问有哪些文章、推荐阅读、下一篇看什么，或你需要提到站内文章时，"
        "必须优先使用资料里的链接输出 Markdown 链接，并用书名号和斜体突出文章名，例如：*[《文章标题》](/articles/example-slug)*。"
        "不要只给纯文本标题。"
        "如果资料包含多篇内容，请优先引用最新、最相关的资料，而不是最旧的。\n\n"
        "在正文结束后，请根据当前页面场景和资料，给出 3 个用户可能还想继续问的问题。"
        "这些问题必须直接 related to 当前资料和页面主题，不要泛泛而谈。"
        "请严格使用以下 XML 格式输出，不要把问题混入正文：\n"
        f"<{_FOLLOWUP_QUESTIONS_TAG}>\n"
        f"<{_FOLLOWUP_QUESTION_TAG}>用户可能想问的问题 1</{_FOLLOWUP_QUESTION_TAG}>\n"
        f"<{_FOLLOWUP_QUESTION_TAG}>用户可能想问的问题 2</{_FOLLOWUP_QUESTION_TAG}>\n"
        f"<{_FOLLOWUP_QUESTION_TAG}>用户可能想问的问题 3</{_FOLLOWUP_QUESTION_TAG}>\n"
        f"</{_FOLLOWUP_QUESTIONS_TAG}>\n\n"
        f"页面场景：{scene}\n"
        f"页面领域：{domain or '未指定'}\n"
        f"页面标题：{page_title or '未指定'}\n\n"
        f"资料：\n{joined}\n\n问题：{question}"
    )


def strip_followup_questions_from_answer(answer: str) -> str:
    """从回答正文中移除 followup 问题块。"""
    return _FOLLOWUP_BLOCK_PATTERN.sub("", answer).strip()


def extract_followup_questions(answer: str) -> list[str]:
    """从完整回答中提取 followup 问题列表。"""
    match = _FOLLOWUP_BLOCK_PATTERN.search(answer)
    if not match:
        return []
    questions = _QUESTION_PATTERN.findall(match.group(1))
    return [question.strip() for question in questions if question.strip()][:3]
