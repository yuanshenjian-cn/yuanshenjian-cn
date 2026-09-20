---
title: "OpenCode 选型与实践：模型、权限和工作流"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: false
brief: >-
  OpenCode 的核心取舍是把客户端、模型提供商和项目规则拆开管理。内容从使用形态、模型来源、权限边界和扩展方式比较 OpenCode 与编辑器型、终端型编码代理的差异，并给出适合个人项目和团队仓库的选择与实践建议。
---

> 如果你想自己决定模型从哪里来、工具能做什么、规则如何进入上下文，OpenCode 值得认真考虑；如果你只想要一套已经打包好的模型和编辑器体验，它的配置成本可能不划算。

## OpenCode 的核心取舍

OpenCode 是开源 AI 编程代理，提供终端 TUI、桌面应用和 IDE 扩展。它把“客户端”与“模型服务”分开：客户端负责会话、工具和项目上下文，模型通过 provider 接入。你可以使用自己的 provider，也可以使用 OpenCode Zen 这类官方整理的模型入口。

这种设计带来三个直接结果：

- 模型可以按任务更换，不必把整个工作流绑定到一个模型产品；
- provider 的凭据、上下文策略和数据边界需要自己确认；
- 项目规则、权限、Agent、Skills、MCP 和插件都可以落到可审查的配置里。

OpenCode 不是“免费模型服务”。客户端开源与模型调用费用是两件事；使用什么模型、是否付费、代码发送到哪里，都由你选择的 provider 决定。

## 适合从四个维度比较

| 维度 | OpenCode | 编辑器型编码代理 | 终端型厂商编码代理 |
| --- | --- | --- | --- |
| 主要入口 | TUI、桌面、IDE 扩展 | 编辑器内的侧栏和编辑区 | 终端，也可能提供 IDE、桌面或 Web 入口 |
| 模型来源 | 自己连接 provider，或使用官方模型入口 | 通常由产品统一管理模型体验 | 以厂商模型和账号体系为中心，也可能支持第三方 provider |
| 工作区控制 | JSONC、Agent、权限、规则、Skills、MCP 和插件 | 依赖产品自己的规则、Agent 和扩展机制 | 依赖厂商的配置、规则、Hooks 和集成 |
| 适合的使用者 | 愿意管理路由和边界的人 | 希望编辑器内获得完整体验的人 | 已经深度使用对应模型生态的人 |

这个表只描述产品形态，不代表任何工具在所有任务上都更强。真实差异通常出现在权限询问、上下文注入、差异审查、模型切换和失败恢复这些细节里。

Cursor 官方把 Agent 定义为可以搜索、编辑和运行命令的编辑器内助手；Claude Code 官方则同时覆盖终端、IDE、桌面和 Web。它们都能完成多文件编码任务，区别更多是模型生态、界面中心和配置习惯，而不是“能不能写代码”。

## OpenCode 的优势在哪里

### 模型和客户端可以分开

OpenCode 的模型配置使用 provider/model 形式：

```text
provider/model-id
```

可以用 /models 或命令行查看实际可用模型：

```bash
opencode models
opencode models --refresh
```

当一个模型在长任务中表现不稳定时，可以先只更换模型，不必迁移整个项目规则和 TUI 工作流。反过来，这也意味着你要承担 provider 能力不同带来的兼容问题。

### 权限是显式的

OpenCode 使用 allow、ask、deny 三种权限动作。你可以允许读取和搜索，要求编辑和 Bash 询问，并单独拒绝外部目录：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "edit": "ask",
    "bash": "ask",
    "external_directory": "deny"
  }
}
```

权限规则还能匹配 Bash 命令和 MCP 工具名。团队仓库如果把规则提交到项目中，新成员更容易得到一致的安全边界。

### 项目知识可以落到文件

/init 会根据项目生成或更新 AGENTS.md。构建命令、测试方式、目录边界和操作禁忌写进文件后，不需要在每次会话中重新解释。

这不是 OpenCode 独有的思路，但 OpenCode 同时兼容 Claude Code 的规则和 Skills 路径。对已经使用多种编码代理的项目，统一规则文件能减少重复维护。

### 扩展面比较完整

OpenCode 提供自定义 Agent、Commands、Skills、MCP、Plugins、Formatter 和 LSP 配置。它们可以组合成一个项目工作流：

- Agent 定义职责和权限；
- Skill 提供可复用的领域知识；
- Command 固化重复的 prompt；
- MCP 接入外部数据和工具；
- Plugin 在生命周期中增加 hook 或集成；
- Formatter 与 LSP 把验证反馈接回会话。

扩展越多，上下文和故障面也越大。能用项目脚本解决的问题，不一定需要 MCP；能用一个清晰的 Agent 解决的问题，也不必急着安装插件。

## OpenCode 的代价是什么

### 你要自己处理 provider

连接 provider 不只是填 API key。你还要考虑模型 ID、上下文窗口、推理参数、图片和工具调用能力、超时、费用以及数据策略。某个 provider 可以连接，不代表其中每个模型都适合 Agent 工作。

如果团队希望固定成本和固定体验，需要在项目或组织层约束 provider，而不是把选择权完全交给每个开发者。

### 配置自由会带来维护成本

全局配置、项目配置、TUI 配置、Agent 文件、Skills、MCP 和插件叠加后，问题可能来自多个层级。遇到异常时，不能只盯着当前 prompt。

可以用这些命令缩小范围：

```bash
opencode debug config
opencode auth list
opencode models --refresh
opencode mcp list
```

必要时暂时关闭插件、MCP、Formatter 或 LSP，先确认 OpenCode 核心行为，再逐项恢复扩展。

### 终端工作流需要习惯

TUI 的斜杠命令、Leader 快捷键、Plan/Build 切换和子会话导航，开始时需要记忆。桌面或编辑器用户更习惯鼠标操作，第一次使用会觉得信息密度偏高。

最有效的做法不是记住全部快捷键，而是先熟悉 /models、/init、/compact、/undo、/redo 和 Tab。其余命令在 Ctrl+P 命令面板里查即可。

### 开源不等于风险自动消失

客户端开源带来可审查性，却不会替你审查 provider、插件、MCP 服务器和项目权限。一个允许 Bash、外部目录和远程 MCP 的配置，风险边界远大于一个只读本地审查 Agent。

需要合规或敏感代码场景时，应分别检查：

- 代码和工具结果是否发送到外部 provider；
- provider 是否保存或训练使用请求内容；
- MCP 是否读取仓库之外的路径；
- 插件是否执行本地命令；
- 自动化 workflow 拥有哪些 GitHub 权限。

## 哪类人适合使用

**适合 OpenCode 的人**：

- 经常切换模型或 provider；
- 主要在终端工作；
- 希望把权限、规则和 Agent 写成项目配置；
- 愿意自己排查模型和扩展的兼容性；
- 需要把同一套客户端接到不同项目。

**不一定适合的人**：

- 只希望安装后使用固定模型，不想管理 provider；
- 团队没有维护项目规则和权限配置的习惯；
- 主要需求是编辑器内联补全，而不是 Agent 操作；
- 不能接受模型请求经过外部 provider。

判断工具时，不要只看能否生成一段代码。更值得比较的是：它能否准确获得上下文，能否在修改前询问，能否让你快速检查 diff，失败后能否恢复，以及团队能否复用同一套规则。

## 一套稳妥的使用方式

### 把工作拆成计划和执行

复杂任务先切换到 Plan，让它列出文件、依赖和验收方式；确认后切换到 Build。Plan 默认会对编辑和 Bash 询问权限，但最终仍要检查 diff 和测试。

### 让请求包含边界

一个可复用的任务描述应该包含：

- 目标和不变的行为；
- 允许修改的目录；
- 不要引入的抽象；
- 需要运行的测试；
- 完成后要汇报的结果。

“把这个模块重构一下”不是可验证的目标；“保持公开 API 不变，拆出查询层，运行现有单元测试并列出未覆盖的路径”才接近可执行任务。

### 让验证回到项目工具

不要把模型的“应该没问题”当成测试。把格式化、类型检查、单元测试、集成测试和 Git diff 作为项目规则写进 AGENTS.md，并要求 Agent 在任务末尾实际执行。

### 控制扩展数量

每增加一个 MCP 或插件，就增加一组工具描述、网络请求和权限边界。先解决当前问题，再按明确需求接入扩展；如果一个扩展没有被任务使用，就不要让它常驻上下文。

### 先检查分享和日志

OpenCode 的分享默认是手动的，但命令一旦执行，仍要检查会话内容。尤其是 provider 错误、环境变量、绝对路径和工具输出，可能包含不应公开的信息。

## 最终判断

OpenCode 的独特价值是可组合，而不是“所有场景都更快”。它更适合把模型、客户端和工程规则分开管理的开发者；它不适合希望完全隐藏这些选择的人。

如果你准备试用，先用一个非敏感项目完成一条完整链路：连接一个 provider，运行 /init，使用 Plan 规划小改动，用 Build 实现，检查 diff 并运行测试。只有这条链路顺畅后，才值得继续配置 MCP、插件和多 Agent。

## 参考资料

- [OpenCode 官方文档](https://opencode.ai/docs/)
- [OpenCode Config](https://opencode.ai/docs/config/)
- [OpenCode Permissions](https://opencode.ai/docs/permissions/)
- [OpenCode Agents](https://opencode.ai/docs/agents/)
- [OpenCode TUI](https://opencode.ai/docs/tui/)
- [Cursor Agent Overview](https://cursor.com/docs/agent/overview)
- [Claude Code Overview](https://code.claude.com/docs/en/overview)
