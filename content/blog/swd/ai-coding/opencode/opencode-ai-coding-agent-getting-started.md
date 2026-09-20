---
title: "OpenCode 新手入门：从安装到第一次协作"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: true
brief: >-
  OpenCode 是开源的 AI 编程代理，提供终端、桌面应用和 IDE 扩展三种使用入口。内容覆盖安装、连接模型、初始化项目、Build 与 Plan 的边界、AGENTS.md、文件引用、会话回滚和常见配置。
---

> OpenCode 的价值不在于替你选择一个固定模型，而在于把客户端、模型提供商和项目工作流拆开，让你可以按任务切换组合。

## 先理解 OpenCode 在做什么

OpenCode 是开源的 AI 编程代理。它可以运行在终端 TUI（Terminal User Interface，终端用户界面）中，也提供桌面应用和 IDE 扩展。它负责读取项目、调用工具、组织对话和保存会话；真正生成回答的模型来自你配置的 provider。

因此，OpenCode 本身不是一个“自带模型的聊天窗口”。你可以连接自己的模型提供商，也可以使用 OpenCode Zen 这类由官方整理和验证过的模型入口。代码是否离开本机，取决于你选择的 provider 以及它的服务策略；使用 OpenCode 不等于自动获得本地推理。

这个边界很重要。遇到响应质量、费用或隐私问题时，应该先分别检查客户端配置、provider 凭据和模型路由，而不是笼统地说“OpenCode 不好用”。

## 安装

官方安装脚本适合大多数 macOS、Linux 和 WSL 环境：

```bash
curl -fsSL https://opencode.ai/install | bash
```

如果你希望交给包管理器维护，也可以使用 npm 或 Homebrew：

```bash
npm install -g opencode-ai
brew install anomalyco/tap/opencode
```

Homebrew 的官方 tap 更新通常比 Homebrew 社区 formula 更及时。Windows 用户优先在 WSL 中运行；官方也提供 Chocolatey、Scoop、Mise、Docker 和 GitHub Releases 等安装入口。

安装完成后先确认命令可以运行：

```bash
opencode --version
opencode --help
```

如果终端找不到 `opencode`，先检查全局 npm 目录或安装脚本写入的目录是否在 `PATH` 中。不要把 npm 包名 `opencode-ai` 和命令名 `opencode` 混为一谈。

## 第一次启动要完成三件事

进入一个已经存在的 Git 项目：

```bash
cd /path/to/project
opencode
```

### 连接模型提供商

在 TUI 中运行：

```text
/connect
```

选择 provider 并完成认证。也可以在命令行使用：

```bash
opencode auth login
```

凭据会由 OpenCode 保存到本机的数据目录，不要把 API key 直接写进提交到仓库的 `opencode.json`。如果团队有统一的密钥管理方式，优先使用环境变量或 provider 自己的认证流程。

### 初始化项目规则

在项目目录中运行：

```text
/init
```

OpenCode 会扫描项目，生成或更新根目录的 `AGENTS.md`。这份文件适合记录构建、测试、目录边界、代码风格和容易踩坑的操作。它不是模型记忆，而是每次相关会话都会加载的项目上下文，所以应该把它提交到 Git，并随着项目规则变化一起维护。

OpenCode 也兼容 Claude Code 的 `CLAUDE.md` 和 `.claude/skills/` 约定，但项目同时存在同类文件时，应明确哪一份是团队的主规则，避免重复或互相矛盾。

### 检查可用模型

在 TUI 中可以运行：

```text
/models
```

命令行对应：

```bash
opencode models
opencode models --refresh
```

模型 ID 使用 `provider/model` 形式。你也可以在项目根目录的 `opencode.jsonc` 中指定默认模型：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "provider/model-id",
  "small_model": "provider/small-model-id"
}
```

`small_model` 用于标题生成等轻量任务。没有指定时，OpenCode 会尝试从同一 provider 中选择更便宜的模型；模型列表和 provider 能力会变化，配置前先用 `opencode models` 查实际 ID。

## 用 Plan 和 Build 组成第一条工作流

OpenCode 内置两个 primary agent（主代理）：

- **Build**：默认入口，适合读写文件、运行命令和完成开发任务。
- **Plan**：偏分析和规划。文件修改与 Bash 命令默认需要询问许可，适合先看方案再决定是否执行。

按 `Tab` 可以在 primary agent 之间切换。一个稳妥的第一次任务可以这样进行：

1. 切到 Plan，说明目标、约束和验收方式，让它先检查相关代码。
2. 追问遗漏的边界条件，让计划具体到文件、命令和测试。
3. 切回 Build，要求按计划修改。
4. 让它运行针对性测试，并检查最终 diff。

Plan 并不是绝对的只读沙箱。它对写入和 Bash 请求会询问你；如果你批准，操作仍可能发生。真正需要只读时，应拒绝修改权限，或另外配置一个明确拒绝 `edit` 和 `bash` 的 agent。

## 让模型获得正确上下文

### 用 `@` 指向文件

在消息中输入 `@`，OpenCode 会在当前项目中模糊搜索文件：

```text
请解释 @src/auth/session.ts 中的登录态刷新流程，并指出它被哪些路由调用。
```

引用文件比“请看看整个项目”更容易得到可验证的回答。对于跨模块问题，可以先给入口文件，再让 OpenCode 根据调用关系扩展阅读范围。

### 用 `!` 执行一次命令

以 `!` 开头的消息会运行 shell 命令，并把结果放回当前会话：

```text
!git status --short
```

这适合查看状态、确认版本或读取短输出。需要多步操作时，直接让 Build agent 使用 Bash 工具，并为危险命令设置权限规则。

### 用项目规则代替重复提示

如果每次都要告诉模型“先运行哪个测试”“不要修改生成目录”，说明这些信息应该进入 `AGENTS.md`。模型临时提示适合任务目标，项目规则适合稳定约束。两者职责分开后，会话更短，也更容易复现。

## 先掌握这几个可恢复操作

OpenCode 会用快照记录会话中的文件变化：

```text
/undo
/redo
```

`/undo` 会撤销最近一条用户消息及其后续响应和文件变化，`/redo` 可以恢复一次撤销。相关回滚依赖项目的 Git 环境；重要修改仍然应该在你自己的分支中完成，并通过 `git diff` 和测试确认结果。

其他常用命令：

| 命令 | 用途 |
| --- | --- |
| `/compact` | 压缩当前会话上下文，别名是 `/summarize` |
| `/sessions` | 列出并切换会话，别名是 `/resume`、`/continue` |
| `/thinking` | 只切换思考块的显示，不改变模型推理能力 |
| `/share` | 手动分享当前会话 |
| `/unshare` | 取消分享 |
| `/new` | 新建会话，别名是 `/clear` |

分享默认是手动触发的。即使使用了分享功能，也要先确认会话中没有密钥、内部路径或不应公开的代码片段。

## 一次完整的真实任务应该长这样

假设你要给已有 API 增加一个分页参数，可以直接这样描述：

```text
请为 GET /users 增加 page 和 page_size 参数。
先检查现有路由、查询层和测试的分页约定，不要创建新的分页抽象。
先给出计划，说明会修改哪些文件以及要运行的测试。
```

切到 Plan 得到计划后，再切到 Build：

```text
计划可以，按这个范围实现。完成后运行与用户列表相关的测试，
再检查 diff，说明没有覆盖到的边界。
```

这个提示包含目标、探索范围、不要做什么和验收方式。它比“帮我做分页”多不了多少字，却能显著减少模型自行发明结构的机会。

## 几个容易混淆的边界

**OpenCode 运行在本地，不代表模型调用是本地的。** 本地客户端仍可能把提示、代码片段和工具结果发送给 provider。要使用本地模型，应查看官方的 local model 配置，并确认模型服务本身的监听和数据策略。

**provider 能用，不代表每个模型都能用。** 不同 provider 对工具调用、图片、推理参数和上下文窗口的支持不同。遇到“模型找不到”或参数报错时，先检查 `provider/model` 拼写和 `opencode models --refresh` 的结果。

**Plan 不等于审查结论。** Plan 只帮助你在修改前看清范围，最终仍要检查 diff、运行测试，并确认没有越过项目规则。

**Windows 的最佳路径是 WSL。** PowerShell 可以运行部分安装方式，但文件系统、终端和 Bash 工具的组合更容易在 WSL 中保持一致。

## 适合怎样开始

第一次使用不要同时配置十个 provider、多个插件和一整套自定义 agent。先完成“连接一个 provider—初始化 `AGENTS.md`—用 Plan 设计一个小改动—用 Build 实现—检查 diff”这条链路，再按真实痛点补充权限、Skills、MCP 或插件。

OpenCode 适合愿意自己管理模型来源和项目规则的人。如果你只想打开一个编辑器就获得固定模型、固定权限和一体化体验，它需要的前置配置会让你觉得偏重；如果你重视可替换 provider、终端工作流和可审查的配置，它的分层方式会更有价值。

## 官方参考

- [OpenCode 官方文档](https://opencode.ai/docs/)
- [安装与初始化](https://opencode.ai/docs/#install)
- [Agents](https://opencode.ai/docs/agents/)
- [配置文件](https://opencode.ai/docs/config/)
- [TUI 命令](https://opencode.ai/docs/tui/)
- [CLI](https://opencode.ai/docs/cli/)
