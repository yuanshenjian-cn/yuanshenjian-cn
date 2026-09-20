---
title: "OpenCode Agent 速查手册"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: true
brief: >-
  OpenCode 的 Agent 分为直接对话的 primary agent 和由主代理调用的 subagent。内容以当前内置的 Build、Plan、General、Explore、Scout 为主线，覆盖权限边界、调用方式、配置文件和自定义审查工作流。
---

> 选 Agent 之前先问一个问题：这次任务需要直接改代码，还是需要先读代码、查资料或拆解计划？

## 两类 Agent，承担两种责任

OpenCode 的 Agent 分成两类：

| 类型 | 作用 | 进入方式 |
| --- | --- | --- |
| primary agent | 负责与你直接对话，推进当前会话 | Tab 或配置的 agent 切换快捷键 |
| subagent | 由 primary agent 委派专门任务，也可以被 @ 提及 | Task 工具或 @agent-name |

primary agent 负责保持主线。subagent 负责一个相对独立的研究、探索或执行单元。子会话有自己的上下文，结果返回主会话后，主代理再决定是否采用。

## 内置 Agent 速查

### Build：默认开发入口

Build 是默认的 primary agent，工具权限完整，适合：

- 读取并修改项目文件；
- 执行测试、构建和 Git 命令；
- 完成从定位问题到验证结果的连续任务。

你可以直接在 TUI 中描述目标，也可以用 CLI：

```bash
opencode run --agent build "为用户列表增加分页，并运行相关测试"
```

Build 的能力完整，也意味着权限范围最大。对陌生仓库使用时，先检查项目规则和工作区状态。

### Plan：先看清范围

Plan 是受限的 primary agent，适合分析代码、提出方案和列出验证方式。默认情况下，文件编辑和 Bash 命令会询问许可，拒绝这些请求时可以保持只读。

Plan 不是“永远不能写”的特殊沙箱。只要你批准了权限，它仍可能执行对应操作。需要硬性只读时，应在配置中把 edit 和 bash 设为 deny，或使用只读 subagent。

### General：可执行的子任务代理

General 是通用 subagent，适合研究复杂问题和执行多步任务。它可以在被允许的范围内修改文件，但默认不使用 todo 工具。复杂工作可以拆成多个 General 子任务并行处理，再由主代理整合结果。

手动调用：

```text
@general 请检查支付回调的错误处理，并提出可直接验证的修复方案。
```

### Explore：快速、只读的代码探索

Explore 专门回答“代码在哪里”“哪些文件受影响”“这个符号如何被调用”。它不能修改文件，适合在动手之前查找入口：

```text
@explore 找出订单状态从请求到数据库写入的完整调用链。
```

Explore 的价值是缩短定位时间，而不是代替主代理做实现决策。它返回的路径和结论仍然需要结合当前分支验证。

### Scout：只读的外部资料研究

Scout 面向远程仓库、官方文档和依赖源码研究。需要核对库的真实实现、查 API 约定或比较上游示例时，可以使用它：

```text
@scout 查找官方文档中关于这个 API 的认证和超时配置，并给出来源链接。
```

Scout 适合“已知要查什么”的资料研究，不适合直接修改当前项目。

### 隐藏的系统 Agent

OpenCode 还会在内部使用 Compaction、Title 和 Summary。它们分别负责压缩长上下文、生成会话标题和创建摘要，不会出现在普通 Agent 选择列表中，也不是用户日常开发时要切换的入口。

## 选择方式

可以按这个表快速决定：

| 你的目标 | 推荐入口 |
| --- | --- |
| 已经知道要改什么，想直接完成 | Build |
| 需求复杂，想先看文件和方案 | Plan |
| 只想找实现位置或调用链 | Explore |
| 需要查上游文档、依赖源码或示例 | Scout |
| 复杂任务需要拆出独立执行单元 | General |
| 需要持续推进多个阶段 | Build + todo，或配置 subagent 协作 |

主代理可以自动调用 subagent，也可以由你在消息里用 @ 指定。调用 subagent 不会自动证明结论正确；它只是把工作拆开，让主会话少背一些无关上下文。

## JSON 配置 Agent

Agent 配置写在 opencode.json 或 opencode.jsonc 的 agent 字段中：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "permission": {
        "edit": "allow",
        "bash": "ask"
      }
    },
    "review": {
      "description": "Review code without changing files",
      "mode": "subagent",
      "permission": {
        "edit": "deny",
        "bash": {
          "*": "ask",
          "git diff*": "allow",
          "grep *": "allow"
        },
        "webfetch": "allow"
      }
    }
  }
}
```

配置内置 Agent 时，未写出的字段继续使用内置默认值。自定义 Agent 至少应提供 description，方便主代理判断它是否适合某个子任务。

Agent 的 mode 有三种：

- primary：可以作为直接对话入口；
- subagent：只能作为子任务代理；
- all：两种方式都可以。

default_agent 只能指向 primary agent。如果指向不存在的 Agent 或 subagent，OpenCode 会回退到 Build 并发出警告。

## Markdown 配置更适合长提示词

长 system prompt 不适合塞进 JSON。可以创建：

```markdown
---
description: Review code without making edits
mode: subagent
model: provider/model-id
temperature: 0.1
permission:
  edit: deny
  bash:
    "*": ask
    "git diff*": allow
    "grep *": allow
---

检查潜在 bug、边界条件、性能和安全问题。
输出文件路径、行号、影响和建议，不直接修改文件。
```

全局 Agent 放在 ~/.config/opencode/agents/，项目专用 Agent 放在 .opencode/agents/。文件名会成为 Agent 名称，例如 review.md 对应 @review。

## 常用配置字段

| 字段 | 用途 |
| --- | --- |
| description | 描述职责，属于自定义 Agent 的必填信息 |
| mode | primary、subagent 或 all |
| model | 指定 provider/model |
| temperature | 控制回答的随机性 |
| top_p | 调整采样范围 |
| steps | 限制 agentic 操作轮数 |
| prompt | 引用外部 system prompt 文件 |
| permission | 允许、询问或拒绝工具 |
| hidden | 隐藏 subagent 的 @ 自动补全入口 |
| color | 设置 TUI 中的显示颜色 |
| disable | 暂时停用 Agent |

reasoningEffort、textVerbosity 等附加字段的行为取决于目标模型和 provider；只使用官方 schema 和 provider 文档明确支持的字段。模型 ID 则统一写成 provider/model。

steps 达到上限后，Agent 会停止继续进行工具操作并总结当前工作。它是成本和范围控制，不是质量保证；仍然要配置测试和验收方式。

## 权限规则要写在工具层

每个权限值是 allow、ask 或 deny：

- allow：无需再次询问；
- ask：执行前向用户确认；
- deny：不允许使用。

全局配置可以先设一个默认规则，再用更具体的模式覆盖：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "read": "allow",
    "grep": "allow",
    "edit": "deny",
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "git push*": "deny"
    }
  }
}
```

匹配规则按顺序计算，最后匹配的规则生效。read、edit、glob、grep、bash、task、external_directory、lsp 和 skill 支持按模式细分；其他权限键使用简单的 allow、ask、deny。

不要只在 Agent 的 prompt 中写“不要修改文件”。真正的边界应放在 permission 中。提示词负责说明判断标准，权限负责限制工具行为。

## 控制子 Agent 的调用深度

主代理可以用 Task 工具调用 subagent。配置 subagent_depth 可以限制嵌套深度：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "subagent_depth": 1
}
```

默认值 1 允许 primary agent 启动 subagent，但不允许 subagent 再启动下一层。设为 0 可以禁用子代理调用，设为 2 则允许多一层嵌套。对于只需要 Explore 或 Scout 返回资料的任务，保持浅层结构通常更容易追踪。

还可以在 Agent 上配置 permission.task，按名称允许或拒绝它调用哪些 subagent。用户仍然可以通过 @ 自动补全直接调用可见的 subagent，所以这项设置主要约束模型的自动委派。

## 三条可复用工作流

### 先研究，再实现

让 Explore 找调用链，让 Plan 写方案，最后由 Build 实现。适合修改范围不清、风险较高的遗留代码。

### 先审查，再合并

使用只读 review Agent 检查 diff，再让 Build 根据问题修改。review Agent 设为 edit deny，避免审查过程意外改变工作区。

### 研究和实现并行

让 General 处理一条独立的迁移或测试任务，主会话继续处理主线。并行任务必须有不重叠的写入范围，否则两个 Agent 同时编辑同一文件，会让结果难以判断。

## 子会话导航

当 primary agent 创建子会话后，可以在 TUI 中查看它们：

| 快捷键 | 作用 |
| --- | --- |
| Leader + Down | 进入第一个子会话 |
| Right | 切换到下一个子会话 |
| Left | 切换到上一个子会话 |
| Up | 返回父会话 |

默认 Leader 是 Ctrl+X，也可以在 tui.json 中修改。子会话适合观察过程和读取结果，不代表主会话会自动采纳所有结论。

## 最后检查

创建 Agent 前先写清它的输入、输出和禁止操作。完成后检查三件事：

- 它是否真的使用了预期的模型和 provider；
- 它是否拥有完成任务所需的最小权限；
- 返回结果能否通过文件、命令或测试复核。

OpenCode 的 Agent 不是越多越好。Build 和 Plan 负责主线，Explore 和 Scout 负责只读研究，General 负责明确的可执行子任务；这套边界已经足够支撑大多数项目。

## 官方参考

- [OpenCode Agents](https://opencode.ai/docs/agents/)
- [OpenCode Permissions](https://opencode.ai/docs/permissions/)
- [OpenCode Config](https://opencode.ai/docs/config/)
- [OpenCode Keybinds](https://opencode.ai/docs/keybinds/)
