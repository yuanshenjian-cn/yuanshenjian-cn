---
title: "BMad Method Spec：把一个 Epic 拆成可实现的 Story"
date: '2026-09-14'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - 敏捷
  - 软件设计
published: true
brief: >-
  当一个需求超过一次 Build 的范围，先用 bmad-spec 写下共同契约，再用 Story Breakdown 切成可独立验证的垂直切片。本文以 Task CLI 标签功能为例，说明 SPEC.md、stories.yaml 和 Story 的职责。
---

> `SPEC.md` 解决“要交付什么”，Story 解决“怎样切成一次能完成的工作”。

Task CLI 下一步要增加标签、标签筛选和标签统计。它们属于同一个 Epic，却涉及多次编码、旧数据兼容和多组 CLI 行为，适合先写 Spec。

## SPEC.md 只保留实现需要的契约

运行：

```text
/bmad-spec

请为 Task CLI 的标签功能创建 Epic 规格。

Why：用户需要给任务分类。
Capabilities：添加标签、按标签筛选、统计未完成任务。
Constraints：兼容旧 JSON；标签比较不区分大小写；重复标签只存一次；所有新行为有测试。
Non-goals：不做标签重命名、删除、云同步、优先级和截止日期。
Success signal：用户可以创建带标签任务、筛选任务和查看统计，旧数据仍可读取。
```

Spec 的固定骨架是：

| 部分 | 要回答的问题 |
| --- | --- |
| Why | 为什么做 |
| Capabilities | 用户得到什么，每项如何验收 |
| Constraints | 必须遵守哪些边界 |
| Non-goals | 明确不做什么 |
| Success signal | 用什么结果判断完成 |

它不是类名、函数名或数据库表设计。技术细节应留给架构和实现阶段。[Define Requirements and a Specification](https://docs.bmad-method.org/plan/define-requirements-and-a-specification/)

`SPEC.md` 由 `bmad-spec` 维护。发现遗漏时重新运行 Skill，不要直接手改，这样 Capability ID 和引用关系更稳定。

## Story 应该是垂直切片

让 `bmad-spec` 执行 Story Breakdown：

```text
/bmad-spec

对 _bmad-output/specs/spec-task-tags/SPEC.md 执行 Story Breakdown。
要求每个 Story 都能在一次 Build 中实现和验证，并标明依赖与 checkpoint。
```

一个合理的拆分是：

| Story | 用户能看到的结果 | 依赖 |
| --- | --- | --- |
| S1 | 添加任务时支持标签，并在列表中显示 | 无 |
| S2 | `task list --tag` 支持筛选 | S1 |
| S3 | `task stats` 显示未完成任务的标签统计 | S1 |

S1 同时承担 CLI 参数、持久化、旧数据读取和测试。按“Schema、Model、CLI、测试”分层拆，会让前几个 Story 没有独立用户价值。

## 认识 stories.yaml 的边界

Spec-backed Epic 通常包含：

```text
_bmad-output/specs/spec-task-tags/
├── SPEC.md
├── stories.yaml
└── stories/
```

`stories.yaml` 是有序的 Story 清单，负责记录 ID、顺序、依赖和 checkpoint；它不是 Story 状态表。完成状态以对应的 Story 实现记录为准。[Break Work into Stories](https://docs.bmad-method.org/plan/break-work-into-stories-and-track-it/)

审核拆分时只问三件事：每个 Story 能否一次完成，是否包含测试，是否明确承担了兼容性风险。

## 什么时候回到 Spec

如果 Story 之间出现未记录的共享决策，或者实现发现标签规则与原意冲突，先更新 Spec，再重新拆分。不要把需求修订藏在某个 Story 的代码里。
