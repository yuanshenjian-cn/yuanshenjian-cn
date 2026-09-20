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
  团队 Override 适合修改已有流程，客户治理能力则更适合封装成可复用 Skill。本文用 BMad Builder 创建 aidev-risk-gate：读取 SPEC.md、AGENTS.md、架构文档和 stories.yaml，生成带证据引用的交付风险评估，并从 Workflow 与 Agent 的边界、Guided/Headless 模式和输出结构开始设计。
---

> 一个好的治理 Skill 不替团队做产品决策，它把容易遗漏的风险问题变成一份有证据、有结论边界的交付检查。

前六篇把 BMad 原生流程跑通，并把团队规则注入 Developer Agent 和 Code Review。客户项目往往还需要一层额外判断：这个 Spec 有没有不可逆数据操作？有没有隐私或权限风险？回滚、监控和发布方案是否足够？这些问题不属于通用代码 Review，也不应该每次靠人临时记忆。

这篇用 BMad Builder 创建一个叫 `aidev-risk-gate` 的 Workflow Skill。它读取 BMad 的规划产物，输出 `RISK-ASSESSMENT.md`，但不修改代码、Spec 或 Story 文件。

## 先注册 BMad Builder

第一次使用 Builder 时，在项目中运行：

```text
/bmad-bmb-setup
```

按提示配置用户名、交互语言、Skill 输出目录和 Builder 报告目录。Setup 的作用是把 Builder 能力注册到项目和 `bmad-help`，不是创建客户 Skill 本身。

## 这个能力为什么选择 Workflow

`aidev-risk-gate` 有明确的输入、过程和产物：读取 Spec，检查风险，生成报告。它不需要记住某个用户上次聊过什么，也没有一个需要长期陪伴的固定人格，所以选择 Workflow 比选择 Agent 更贴切。

可以用下面的判断：

| 更像 Agent | 更像 Workflow |
| --- | --- |
| 用户会跨会话持续回来交流 | 一次执行产生一个明确结果 |
| 记忆和人格会改变使用价值 | 无状态即可完成 |
| 能力彼此松散，依赖长期关系 | 所有步骤服务同一个目标 |

风险门禁属于后者。以后如果需要一个长期记忆客户偏好的治理顾问，再考虑在 Workflow 之上包一层 Agent。

## 让 Workflow Builder 先做需求发现

运行：

```text
/bmad-workflow-builder

请创建一个生产级 Workflow Skill，使用 Guided 模式。

Skill 名称：
aidev-risk-gate

用途：
读取一个 BMad SPEC.md，以及可选的 AGENTS.md、架构文档、stories.yaml
和客户合规检查表，生成客户交付风险评估。

触发条件：
当用户要求“评估这个 Spec 的交付风险”“运行客户风险门禁”或
“判断这个 Epic 是否可以进入实现”时触发。

输入：
- 必需：SPEC.md 路径
- 可选：AGENTS.md
- 可选：ARCHITECTURE-SPINE.md
- 可选：stories.yaml
- 可选：客户合规检查表

检查维度：
1. 意图和成功条件是否可验证。
2. 是否存在未记录的不可逆操作。
3. 数据、安全、隐私和权限风险。
4. 跨系统和架构协调风险。
5. 测试、发布、监控和回滚能力。
6. Open Questions 是否阻止实现。
7. Non-goals 是否足以抑制范围膨胀。

输出：
在 Spec 目录生成 RISK-ASSESSMENT.md。

结论：
PASS、CONCERNS 或 FAIL。

要求：
- 每个发现必须引用输入文件中的证据。
- 无证据时不能给出确定结论。
- 缺少关键信息时列出 Decision Needed。
- 不修改代码、Spec 或 stories.yaml。
- 支持 Guided 和 Headless 模式。
- Headless 模式最终输出机器可读状态。
```

Guided 模式的价值不是让 Builder 多问几轮，而是把生产能力里容易遗漏的选择提前显式化。它可能继续询问：风险级别如何定义、`CONCERNS` 和 `FAIL` 的边界、缺少回滚信息时是否阻塞、输出目录是否可配置，以及 Headless 结果需要哪些稳定字段。

## 把判断规则和执行细节分开

Builder 可能生成这样的目录：

```text
aidev-risk-gate/
├── SKILL.md
├── customize.toml
├── prompts/
│   ├── guided.md
│   └── headless.md
├── resources/
│   └── risk-rubric.md
├── templates/
│   └── risk-assessment.md
└── scripts/
    └── validate_report.py
```

不需要为了凑齐目录而强行创建所有文件。可以按职责分：

- `SKILL.md` 只保留触发条件、输入、流程路由和输出契约。
- `resources/` 放风险分级、客户检查表字段和长篇解释，按需加载。
- `templates/` 固定报告结构，避免每次输出标题漂移。
- `scripts/` 处理文件存在性、报告字段和机器可读状态等机械检查。
- 语义判断留给模型，但每个结论都必须回指输入文件中的证据。

一个简单的报告结构可以是：

```markdown
# Delivery Risk Assessment

Verdict: CONCERNS

## Evidence Inventory

## Findings

### Data and Reversibility

### Security and Privacy

### Verification and Rollback

## Decision Needed

## Suggested Next Step
```

报告本身不应该修改 Spec 的 `Non-goals`，也不应该替用户自动关闭 Open Question。它的职责是把“现在有什么证据”和“还缺什么决定”分开写清楚。

## PASS、CONCERNS 和 FAIL 要有边界

可以先定一个简单规则，再让客户项目补充领域标准：

**PASS**：已知范围可验证，没有证据表明存在阻塞风险，测试和回滚信息足够当前阶段使用。

**CONCERNS**：存在需要处理的风险或缺口，但团队可以在实现前补充决定，不必直接否定整个 Epic。

**FAIL**：发现明确的高风险事实，例如不可逆生产数据迁移却没有回滚方案，或安全/合规约束与当前方案直接冲突。

缺少信息不等于低风险。若 Spec 没有成功条件、没有说明数据权限，报告应放入 `Decision Needed`，并说明为什么暂时不能支持一个确定结论。

## 手工试运行时检查“只读”边界

把 Skill 安装到实际工具的 Skill 目录后，在新会话中运行：

```text
/aidev-risk-gate

评估：
_bmad-output/specs/spec-task-tags/SPEC.md
```

验收重点不是报告写得像不像咨询文档，而是：

- 能否准确触发，而不是抢占普通 `bmad-build` 请求。
- 是否生成 `RISK-ASSESSMENT.md`。
- 每个发现能否引用 Spec 或其他输入文件的具体位置。
- 输入信息不足时是否列出 Decision Needed，而不是编造结论。
- Spec、Story 和代码是否保持未修改。
- Guided 和 Headless 两种路径是否都能结束在稳定产物上。

一个治理 Skill 只有在证据不足时敢于降低结论确定性，才有资格进入客户交付流程。下一篇会为它编写 Artifact Eval 和 Trigger Eval，验证这种边界能否稳定保持。

官方资料：

- [What Are BMad Workflows?](https://bmad-builder-docs.bmad-method.org/explanation/what-are-workflows/)
- [Builder Commands Reference](https://bmad-builder-docs.bmad-method.org/reference/builder-commands/)
- [BMad Builder](https://bmad-builder-docs.bmad-method.org/)
