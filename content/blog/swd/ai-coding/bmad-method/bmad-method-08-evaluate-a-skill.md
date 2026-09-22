---
title: "BMad Builder Eval：验证 Skill 是否会正确触发和产出"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - BMad Builder
  - 软件测试
published: true
brief: >-
  手工跑通一次 Skill 不足以证明它可靠。本文用 Artifact Eval 和 Trigger Eval 检查 aidev-risk-gate 的产物、边界、负向触发和只读行为，并说明如何诚实报告 Runner 未执行的情况。
---

> Eval 要验证业务判断，不只是验证 Skill 没有崩溃。

## 两类 Eval

| 类型 | 检查什么 |
| --- | --- |
| Artifact Eval | 报告是否存在、结论是否正确、证据是否完整 |
| Trigger Eval | 该触发时是否触发，不该触发时是否保持安静 |

目录可以这样组织：

```text
evals/aidev-risk-gate/
├── evals.json
├── triggers.json
└── files/
    ├── high-risk-spec.md
    ├── low-risk-spec.md
    └── incomplete-spec.md
```

## Artifact Eval 要写强断言

高风险案例应明确写出不可逆生产数据迁移，却没有回滚方案。断言可以是：

```json
{
  "id": "A1",
  "prompt": "Run headless. Evaluate files/high-risk-spec.md with aidev-risk-gate.",
  "files": ["evals/aidev-risk-gate/files/high-risk-spec.md"],
  "expectations": [
    "RISK-ASSESSMENT.md exists",
    "The verdict is FAIL",
    "The report cites the migration and missing rollback plan",
    "The supplied spec remains unchanged"
  ]
}
```

低风险案例要检查 Skill 不会凭空制造隐私或迁移风险；不完整案例要把缺少的成功条件列为 `Decision Needed`。官方格式使用 `expectations` 做独立评分，称为 Eval JSON 格式，不必把它误写成产品 JSON Schema。[Eval Format](https://bmad-builder-docs.bmad-method.org/reference/eval-format/)

## Trigger Eval 必须包含负向案例

```json
[
  { "query": "评估这个 Spec 的客户数据和回滚风险", "should_trigger": true },
  { "query": "运行客户合规风险门禁", "should_trigger": true },
  { "query": "帮我实现 Story S2", "should_trigger": false },
  { "query": "审查当前 Git diff 的代码缺陷", "should_trigger": false }
]
```

负向案例能防止 Skill 抢占 `bmad-build`、`bmad-code-review` 和 `bmad-sprint-planning` 的请求。

## 诚实记录 Runner 结果

```bash
bmad-eval-runner ./skills/aidev-risk-gate --mode artifact
bmad-eval-runner ./skills/aidev-risk-gate --mode trigger
```

官方 Runner 依赖 Claude Code 执行环境。使用 Codex 或其他工具时，可以保留同一套 Eval JSON 格式，或实现自己的 Runner Adapter，但手工试跑不能冒充正式通过。[Run Evals Against a Skill](https://bmad-builder-docs.bmad-method.org/how-to/run-evals-against-a-skill/)

真正值得比较的是业务断言通过率、误触发率、执行时间和无证据结论，而不是单看总分。
