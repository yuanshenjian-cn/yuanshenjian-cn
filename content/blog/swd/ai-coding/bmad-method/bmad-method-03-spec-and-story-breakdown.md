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
  当一个需求需要多次编码会话时，直接运行 bmad-build 会让上下文和决策逐渐失控。本文用 Task CLI 的标签功能演示 bmad-spec 的五段式规格、Capability 的验收条件、Spec-backed Epic 与 Story Breakdown，并给出适合独立实现的垂直 Story 切分方式。
---

> `SPEC.md` 不是技术设计书，它是一份让多个实现会话对“要交付什么”保持一致的短契约。

Task CLI 已经能添加、查看和完成任务。接下来增加标签、按标签筛选和标签统计，这个目标仍然属于同一个产品结果，却明显超过了一次小型 Build 的安全范围：会改动持久化数据、增加多个命令行为，还需要多个独立测试切片。

这时先运行 `bmad-spec`，再做 Story Breakdown，比直接把所有需求交给一个不断膨胀的会话更稳。

## 先用五段信息写清楚 Epic

在新的 AI 会话中运行：

```text
/bmad-spec

请为当前 Task CLI 创建一个 Epic 级规格。

Why：
用户的任务越来越多，需要使用标签分类和查看相关任务。

Capabilities：
1. 添加任务时可以指定零个或多个标签。
2. `task list --tag <标签>` 可以筛选包含该标签的任务。
3. `task stats` 可以显示各标签的未完成任务数量。
4. 不带标签的旧任务仍然可以正常读取和显示。

Constraints：
- 必须兼容已有 JSON 数据。
- 标签不区分大小写，但显示时保留首次录入形式。
- 单个任务中重复标签只存储一次。
- 不访问网络。
- 所有新行为必须有自动化测试。
- CLI 现有 add、list、done 行为不能退化。

Non-goals：
- 不实现标签重命名、标签删除、云同步和交互式终端 UI。
- 不实现优先级和截止日期。

Success signal：
用户能够创建带标签任务、按标签筛选，并查看标签统计；
旧 JSON 数据仍可读取，全部测试实际通过。
```

当前 `SPEC.md` 的核心结构是：

- **Why**：为什么现在要做这件事。
- **Capabilities**：要提供哪些能力，每项都有 Intent 和 Success condition。
- **Constraints**：实现必须服从的边界。
- **Non-goals**：明确不做什么，阻止范围继续膨胀。
- **Success signal**：用什么可观察结果判断 Epic 有价值。

这个结构刻意把“结果”与“手段”分开。标签大小写和旧 JSON 兼容性是约束；`Task` 类要不要拆成几个模块，是实现阶段结合代码决定的技术选择。

## 每个 Capability 都要能被验收

不要只写“支持标签”。一个可用的 Capability 至少要回答两个问题：用户想得到什么，以及用什么现象判断它已经得到。

例如：

```text
Intent：用户可以在添加任务时提供零个或多个标签。

Success condition：
- 不带标签的旧式 add 命令仍然成功。
- 带多个标签时，list 能显示这些标签。
- 同一任务传入大小写不同但语义相同的标签时，只保留一个规范化值。
```

如果某个条件无法通过命令、测试或可检查的产物验证，它就还不是一个合格的成功条件。尤其要把“旧数据可读取”“现有命令不退化”写出来，否则后续 Build 很容易只实现新路径。

## SPEC.md 由 bmad-spec 维护

生成后通常会得到：

```text
_bmad-output/
└── specs/
    └── spec-task-tags/
        └── SPEC.md
```

如果发现遗漏，不要直接打开文件手改。再次运行 `bmad-spec`，并明确要求更新哪条约束：

```text
/bmad-spec

更新 _bmad-output/specs/spec-task-tags/SPEC.md：

补充约束：
当用户按标签筛选时，标签匹配不区分大小写。
保留现有 Capability ID，不要重建整个规格。
```

由同一个 Skill 维护，可以让 Capability ID、开放问题和后续引用保持稳定。它也会把无法从输入中确定的内容列为 Open Questions；这些问题要在实现前解决，不能让代码会话自行猜测。

## Story 应按用户价值切成垂直切片

现在让 `bmad-spec` 执行 Story Breakdown：

```text
/bmad-spec

对 _bmad-output/specs/spec-task-tags/SPEC.md 执行 Story Breakdown。

要求：
- 每个 Story 是可独立验证的垂直切片。
- 不要按数据库层、领域层、CLI 层拆分。
- 标明依赖顺序。
- 基础兼容性或高风险决策安排人工 checkpoint。
```

合理的结果可以是：

| Story | 用户能看到的结果 | 依赖 |
| --- | --- | --- |
| S1 | 添加任务时支持标签，并在列表中显示 | 无 |
| S2 | `task list --tag` 可以按标签筛选 | S1 |
| S3 | `task stats` 显示未完成任务的标签统计 | S1 |

S1 应该同时包含命令参数、业务处理、JSON 持久化、旧数据读取和测试。把它拆成“先改 Schema、再改 Model、最后补 CLI”，前两个 Story 没有独立用户价值，测试也会被推迟到最后。

## 检查 stories.yaml，而不是默认接受拆分

Spec-backed Epic 通常会得到：

```text
_bmad-output/specs/spec-task-tags/
├── SPEC.md
└── stories.yaml
```

审核时逐项确认：

- 每个 Story 能否在一个 Build 会话里完成。
- 测试是否包含在 Story 的验收条件中。
- 旧数据兼容是否被某个 Story 明确承担。
- Story 之间的顺序和依赖是否可解释。
- 哪些决策需要实现前或实现后的人工 checkpoint。

对 Spec-backed Epic 来说，`stories.yaml` 就是主要追踪文件，不要再无端增加一个平行的 sprint 状态文件。后续每个 Story 都会由 `bmad-build` 产生实现记录，Epic 收尾时再由 `bmad-retrospective` 读取这些记录和父级 Spec。

## 什么时候应该回到上游

如果 Story Breakdown 过程中发现“标签是否去重”“旧 JSON 如何升级”仍没有足够信息，先补充 Spec，而不是把决定藏在 S1 的代码里。

如果实现 S1 后发现三个 Story 会共同依赖一个未记录的架构选择，也要重新运行 `bmad-spec` 或重新拆分。Story 清单是当前理解下的执行计划，它可以随着证据变化；稳定的是用户意图和验收边界，不是某一份初稿的文件结构。

下一篇会用三个新会话分别实现 S1、S2、S3，再对整个分支做一次独立 Review。

官方资料：

- [Define Requirements and a Specification](https://docs.bmad-method.org/plan/define-requirements-and-a-specification/)
- [Break Work into Stories and Track It](https://docs.bmad-method.org/plan/break-work-into-stories-and-track-it/)
- [Choose a Planning Path](https://docs.bmad-method.org/plan/choose-a-planning-path/)
