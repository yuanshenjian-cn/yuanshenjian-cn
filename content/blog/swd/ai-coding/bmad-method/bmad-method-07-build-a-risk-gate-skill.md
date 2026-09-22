---
title: "BMad Builder 实战：创建一个客户风险门禁 Skill"
date: '2026-09-18'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - BMad Builder
  - 研发治理
published: true
brief: >-
  客户治理能力适合封装成独立 Workflow Skill。本文用 BMad Builder 设计 aidev-risk-gate，读取 Spec 和治理资料，输出带证据的客户风险评估，同时划清它与官方 readiness gate 的边界。
---

> 风险门禁不替团队做决定，它负责把容易遗漏的风险问题变成有证据的检查。

## 为什么选 Workflow

`aidev-risk-gate` 有明确输入、过程和产物：读取 Spec，检查风险，生成报告。它不需要长期记忆和固定人格，因此更像 Workflow；需要跨会话积累偏好的协作伙伴，才更像 Agent。

第一次使用 Builder，先运行：

```text
/bmad-bmb-setup
```

## 定义风险门禁的边界

```text
/bmad-workflow-builder

请创建 aidev-risk-gate Workflow Skill。

输入：SPEC.md，以及可选的 AGENTS.md、架构文档、stories.yaml、客户合规清单。
输出：Spec 目录下的 RISK-ASSESSMENT.md。
检查：数据、安全、隐私、权限、不可逆操作、回滚、监控、发布和 Open Questions。
要求：每个发现引用输入证据；缺少信息时列出 Decision Needed；不修改代码、Spec 或 stories.yaml；支持 Guided 和 Headless。
```

这个 Skill 应该聚焦客户特有的安全、合规、数据迁移和回滚风险。“Epic 是否可以进入实现”属于官方 `bmad-sprint-planning` 的 readiness gate，不应让自定义 Skill 抢占。[Break Work into Stories](https://docs.bmad-method.org/plan/break-work-into-stories-and-track-it/)

## 把报告结构固定下来

```text
aidev-risk-gate/
├── SKILL.md
├── prompts/
├── resources/
├── templates/
└── scripts/
```

- `SKILL.md`：触发条件、输入和流程边界。
- `resources/`：风险规则和客户检查表。
- `templates/`：报告结构。
- `scripts/`：文件、字段和机器状态的确定性校验。

报告至少区分：Evidence Inventory、Findings、Decision Needed 和 Verdict。`PASS / CONCERNS / FAIL` 是这个客户 Skill 的判定规则，不是 BMad 所有门禁的统一结论。

## 试运行看三件事

```text
/aidev-risk-gate

评估：
_bmad-output/specs/spec-task-tags/SPEC.md
```

检查它是否：

- 能识别客户风险请求，不抢占普通 Build 或 Code Review。
- 每个发现都引用输入文件。
- 信息不足时降低确定性，不编造安全结论。
- 只生成报告，不修改输入文件。

Workflow 的职责是产出可靠的风险判断材料，而不是增加更多流程。[What Are BMad Workflows?](https://bmad-builder-docs.bmad-method.org/explanation/what-are-workflows/)
