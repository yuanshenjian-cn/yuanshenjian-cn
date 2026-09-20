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
  Spec 和 stories.yaml 只是共同契约，真正的实现仍然要一次完成一个 Story。本文以 Task CLI 标签 Epic 为例，演示如何用三个新会话分别运行 bmad-build，如何把旧数据兼容、退出码和 stdout/stderr 纳入验收，以及何时用 bmad-code-review 做跨 Story 的独立审查。
---

> 一个 Story 的完成标准不是“代码写完了”，而是用户行为、测试证据和实现记录都能对上父级 Spec。

上一篇把标签 Epic 拆成了三个垂直 Story。现在进入实施阶段：S1 创建并显示带标签任务，S2 按标签筛选，S3 查看标签统计。

这里最容易犯的错误，是在一个长会话里连续做完三个 Story。这样看似省去了几次启动，实际会让上下文越来越混杂，后面的实现也容易偷偷改变前面已经确定的行为。更稳的做法是一个 Story 一个新会话。

## 先让 S1 建立可复用的实现模式

在新的 AI 会话中运行：

```text
/bmad-build

实现 _bmad-output/specs/spec-task-tags/stories.yaml 中的 Story S1。

父级规格：
_bmad-output/specs/spec-task-tags/SPEC.md

请先调查现有实现和 AGENTS.md。
不要实现 S2 和 S3。
必须验证旧 JSON 数据兼容性。
```

审批计划时，重点看这几项：

- `tags` 是否作为可选字段加入，而不是让旧任务必须补写空数组。
- 读取旧任务时缺少 `tags` 是否安全。
- 标签比较用的规范化值，是否和显示用的首次录入形式分开。
- 旧的 `add`、`list`、`done` 输出和退出码有没有被无意改变。
- 测试是否包含没有标签的旧数据、多个标签和重复标签。

S1 是基础 Story，应该把后续 Story 会依赖的数据形状和兼容策略稳定下来。它不是“先做数据库层”的基础设施任务，而是用户已经可以创建并查看带标签的完整切片。

完成后不要只看 Agent 的摘要：

```bash
uv run pytest
uv run task --db /tmp/bmad-task-epic.json add "阅读 BMad 文档" --tag learning --tag ai
uv run task --db /tmp/bmad-task-epic.json list
```

保留测试退出码和关键命令输出。后面做 Epic Review 时，这些手工行为证据比一句“已验证”更有用。

## S2 只解决筛选，不顺手做统计

开启另一个新会话：

```text
/bmad-build

实现 spec-task-tags 中的 Story S2：按标签筛选任务。

读取父级 SPEC.md、stories.yaml 和 S1 的实现记录。
只完成 S2，不实现统计。
标签匹配必须不区分大小写。
```

这里要检查的不只是 `--tag` 参数是否存在：

- `AI` 能否匹配存储或首次录入为 `ai` 的任务。
- 没有匹配结果时，退出码和正常空列表输出是否符合原有约定。
- 无标签任务不会被错误匹配。
- 原来的 `task list` 不带筛选参数时仍按创建顺序工作。

行为验证可以这样做：

```bash
uv run pytest
uv run task --db /tmp/bmad-task-epic.json list --tag AI
uv run task --db /tmp/bmad-task-epic.json list --tag missing
```

如果 S2 需要重写 S1 已经稳定的存储逻辑，先停下来判断原因。可能是父级 Spec 没写清楚，也可能是 Story 切得不合理。把新决策直接藏进 S2，会让 S3 和后续维护者失去共同依据。

## S3 把统计边界写进测试

最后再开启一个新会话：

```text
/bmad-build

实现 spec-task-tags 中的 Story S3：标签统计。

读取父级规格和前两个 Story 的实现记录。
统计范围仅包含未完成任务。
无标签任务不得被虚构为某个标签。
```

统计功能至少需要覆盖：

- 同一个标签下有多个未完成任务。
- 完成其中一个任务后，统计数量减少。
- 一个任务有多个标签时，分别计入对应标签。
- 没有标签的任务不出现在统计结果里。
- 旧 JSON 任务缺少 `tags` 字段时，统计仍然成功。

```bash
uv run pytest
uv run task --db /tmp/bmad-task-epic.json stats
uv run task --db /tmp/bmad-task-epic.json done 1
uv run task --db /tmp/bmad-task-epic.json stats
```

每个 Story 都要更新自己的状态和实现记录。发现不属于当前 Story 的问题时，把它写入实现产物中的 `deferred-work.md`，不要以“顺手修一下”的方式扩大范围。

## Build 内置 Review，独立 Review 仍然有价值

`bmad-build` 的实现链路已经包含审查和修复。独立运行 `bmad-code-review` 的价值在于换一个上下文审查整个分支：它能看到 S1、S2、S3 组合后的结果，也适合审查别人提交的 PR 或一段已经存在的 diff。

在新的会话中运行：

```text
/bmad-code-review thorough

审查当前分支相对于 Epic 开始前基线的所有变更。

意图来源：
_bmad-output/specs/spec-task-tags/SPEC.md

Story 清单：
_bmad-output/specs/spec-task-tags/stories.yaml

重点检查：
- 旧 JSON 兼容性
- 标签大小写语义
- CLI 退出码
- stdout/stderr 契约
- 跨 Story 重复逻辑
- 测试是否覆盖所有变化行为
```

如果变更很小，也可以选择：

```text
/bmad-code-review quick
```

Review 的重点不是收集最多意见，而是判断每个发现有没有证据、是否属于当前变更。可以按下面的方式处理：

| 处理 | 适用情况 |
| --- | --- |
| 修复 | 问题由当前 Story 或当前 Epic 引入，且证据充分 |
| 延后 | 问题真实，但属于既有代码或另一个范围 |
| 请求决策 | 修复会改变 Spec、兼容性或产品边界 |
| 驳回 | 没有证据、与代码矛盾或属于误报 |

修复获批的问题后，重新运行完整测试和关键 CLI 行为。不要为了得到“零发现”而反复调用 Review；如果第三轮仍然暴露重要问题，通常应该回到 Spec、规则或 Story 切分，而不是继续在同一层补丁。

## 这组 Story 的完成证据

可以用一张小表做收尾检查：

| 证据 | 需要确认的内容 |
| --- | --- |
| `stories.yaml` | S1、S2、S3 状态与实际进度一致 |
| 实现记录 | 每个 Story 的决策、测试和结果可追溯 |
| 自动化测试 | 完整运行，没有通过跳过测试换结果 |
| 手工命令 | 添加、筛选、统计和错误路径实际执行 |
| Review 结果 | 发现已修复、延后或有明确决定 |
| Git diff | 没有混入标签 Epic 之外的功能 |

Story 级别都通过后，还不能直接宣布 Epic 完成。下一篇要用 `bmad-retrospective` 检查三个 Story 组合起来是否仍满足父级规格。

官方资料：

- [Build a Change](https://docs.bmad-method.org/build/build-a-change/)
- [Review a Change](https://docs.bmad-method.org/build/review-a-change/)
- [Break Work into Stories and Track It](https://docs.bmad-method.org/plan/break-work-into-stories-and-track-it/)
