---
title: "BMad Method Build：按 Story 实现并审查一个 Epic"
date: '2026-09-15'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - 代码审查
  - 测试
published: true
brief: >-
  一个 Story 一个会话，先让基础 Story 稳定数据和兼容策略，再实现筛选与统计。本文说明如何用 bmad-build 实现 Task CLI 标签 Epic，并用 bmad-code-review 检查跨 Story 的组合问题。
---

> Story 的完成标准，是用户行为、测试证据和实现记录都能对上父级 Spec。

## S1 先建立实现模式

在新会话中运行：

```text
/bmad-build

实现 _bmad-output/specs/spec-task-tags/stories.yaml 中的 S1。
读取父级 SPEC.md 和 AGENTS.md。
只完成“添加并显示带标签任务”，不要实现筛选和统计。
必须验证旧 JSON 数据兼容性。
```

重点检查：

- `tags` 对旧任务是可选字段。
- 标签比较值和显示形式分开处理。
- 旧命令的输出和退出码不变。
- 测试覆盖旧数据、多个标签和重复标签。

S1 通过后，实际运行：

```bash
uv run pytest
uv run task --db /tmp/bmad-task-epic.json add "阅读 BMad 文档" --tag learning --tag ai
uv run task --db /tmp/bmad-task-epic.json list
```

## S2、S3 只完成各自的用户结果

| Story | 核心检查 |
| --- | --- |
| S2：标签筛选 | 匹配不区分大小写；无标签任务不误匹配；原有 `list` 不退化 |
| S3：标签统计 | 只统计未完成任务；多标签分别计数；旧任务仍能读取 |

每个 Story 都开一个新会话，并读取父级 Spec 和前置 Story 记录。发现范围外问题时写入 `deferred-work.md`，不要顺手扩展当前 Story。

## Build Review 和独立 Code Review

`bmad-build` 已包含实现后的审查。需要从整个 Epic 或别人的分支重新看一遍时，再运行：

```text
/bmad-code-review thorough

审查当前分支相对于 Epic 基线的全部变更。
读取：
- _bmad-output/specs/spec-task-tags/SPEC.md
- _bmad-output/specs/spec-task-tags/stories.yaml

重点检查旧数据兼容、标签大小写、CLI 退出码、stdout/stderr、重复逻辑和测试覆盖。
```

小变更可以使用 `quick`。每个发现都要有代码证据，并明确归类为修复、延后、请求决策或误报。[Review a Change](https://docs.bmad-method.org/build/review-a-change/)

## Story 级完成证据

- Story 实现记录存在，且内容与实际变更一致。
- 测试完整运行，没有靠跳过测试换结果。
- 添加、筛选、统计和错误路径实际执行过。
- Review 发现有处理结论。
- Git diff 没有混入其他功能。

Story 都通过后，仍需用 `bmad-retrospective` 检查整个 Epic。
