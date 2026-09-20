---
title: "Codex 配置指南：把权限边界写进 config.toml"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - Codex
published: true
brief: >-
  Codex 的配置重点不是把选项全部打开，而是把模型、审批、沙盒、项目指令和命令行覆盖组合成清晰的信任边界。文章按当前官方配置体系，说明 config.toml 的层级与优先级、workspace-write 的网络策略、权限 profile、AGENTS.md、TUI 以及 codex exec 的实际用法。
---

> Codex 的配置顺序应该是先划定文件和网络边界，再决定模型与自动化程度；`config.toml` 负责默认行为，项目配置和命令行只在明确的范围内覆盖它。

如果你把 Codex 当作一条可以自动修改仓库的终端流水线，最先要解决的不是模型选哪个，而是它能读写什么、什么时候必须询问、网络请求从哪里出去。当前 Codex CLI 把这些设置拆在用户配置、项目配置、配置 profile 和命令行覆盖中，模型、TUI 和 MCP 都建立在这套层级之上。

## 先弄清楚配置从哪里生效

用户级配置默认位于 `~/.codex/config.toml`。如果通过 `CODEX_HOME` 指定了其他目录，配置、认证和历史状态都会以那个目录为基准。项目可以在一个或多个目录下放置 `.codex/config.toml`，但只有被信任的项目才会加载项目层。

有效配置的优先级从高到低如下：

| 优先级 | 配置来源 | 适合放什么 |
|--------|----------|------------|
| 1 | CLI flags 与 `--config` | 单次任务的临时覆盖 |
| 2 | 项目中的 `.codex/config.toml` | 仓库共享的行为约束 |
| 3 | `--profile` 选择的 profile 文件 | 同一用户的多套工作模式 |
| 4 | `~/.codex/config.toml` | 个人默认值 |
| 5 | 工作区下发的云端默认配置 | 组织统一的默认值 |
| 6 | `/etc/codex/config.toml` 等系统配置 | 机器级默认值 |
| 7 | 内置默认值 | 没有其他配置时的兜底 |

项目层从项目根目录向当前工作目录逐层读取，距离当前目录最近的定义优先。涉及提供商、认证、通知、profile 选择和遥测路由的机器级选项不能放进项目配置；这能避免一个仓库通过配置文件重定向本机凭证或通知命令。

需要多套个人配置时，每套 profile 都是一个独立文件，例如 `~/.codex/deep-review.config.toml`，通过下面的命令选择：

```bash
codex --profile deep-review
codex exec --profile deep-review "review this change"
```

profile 文件使用顶层配置键，不要再包一层 `[profiles.deep-review]`。这让基础配置保留共同默认值，profile 只保存模型或审批策略等差异项。

## 一份稳妥的基础配置

下面这份配置适合作为本地开发的起点：允许 Codex 修改当前工作区，但默认不开放命令网络，并在需要越过边界时询问。

```toml
# ~/.codex/config.toml
model = "gpt-5.6"
model_reasoning_effort = "medium"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false
```

`model_reasoning_effort` 控制支持该选项的模型投入多少推理资源，可用值是 `minimal`、`low`、`medium`、`high` 和 `xhigh`。它改变的是推理强度，不等于更换模型；实际可用模型仍取决于当前登录方式、提供商和模型目录。

还可以设置默认表达风格：

```toml
personality = "pragmatic"  # 也可以是 friendly 或 none
```

如果只是让 Codex 阅读仓库、解释设计或做代码审查，可以把 `sandbox_mode` 改成 `read-only`。只有在受信任仓库、专用隔离环境、没有暴露敏感凭证且能够监控执行结果时，才考虑 `danger-full-access`。

## 沙盒和审批是两道不同的门

沙盒回答“技术上能碰到什么”，审批策略回答“什么时候必须停下来问你”。只改其中一个，另一层仍然生效。

| 设置 | 作用 | 常见场景 |
|------|------|----------|
| `sandbox_mode = "read-only"` | 以只读边界执行本地命令 | 阅读陌生仓库、方案评审 |
| `sandbox_mode = "workspace-write"` | 可读写当前工作区，网络需单独开启 | 日常开发 |
| `sandbox_mode = "danger-full-access"` | 不使用 Codex 的本地沙盒边界 | 已隔离的容器或专用虚拟机 |
| `approval_policy = "on-request"` | 在需要越过当前边界时请求批准 | 交互式工作 |
| `approval_policy = "never"` | 不弹出审批请求 | 受控的无人值守任务 |

`workspace-write` 不代表命令天然可以访问互联网。只有显式配置下面的选项，命令网络才会打开：

```toml
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

需要扩大可写范围时，优先增加具体目录，而不是直接关闭沙盒：

```toml
[sandbox_workspace_write]
writable_roots = ["/Users/me/.pyenv/shims"]
network_access = false
```

审批还可以按类别设置细粒度（granular）策略：

```toml
approval_policy = { granular = {
  sandbox_approval = true,
  rules = true,
  mcp_elicitations = true,
  request_permissions = true,
  skill_approval = false
} }
```

`approvals_reviewer = "user"` 表示由用户处理符合条件的审批请求；设为 `auto_review` 则交给自动审查器。它只改变审批请求由谁审查，不会放宽沙盒边界，也不会让沙盒内本来就允许的动作多经过一层审查。

## 用权限 profile 表达更细的边界

如果一个项目经常需要“能改代码，但不能读 `.env`，网络只允许访问几个域名”，可以用命名权限 profile 把文件和网络规则放在一起：

```toml
default_permissions = "project-edit"

[features]
network_proxy = true

[permissions.project-edit]
description = "只允许修改项目并访问必要的 API"
extends = ":workspace"

[permissions.project-edit.filesystem.":workspace_roots"]
"." = "write"
".devcontainer" = "read"
"**/*.env" = "deny"

[permissions.project-edit.network]
enabled = true

[permissions.project-edit.network.domains]
"api.openai.com" = "allow"
"objects.githubusercontent.com" = "allow"
```

内置 profile 有 `:read-only`、`:workspace` 和 `:danger-full-access`。自定义 profile 可以从前两个继承，再用 `read`、`write`、`deny` 描述文件访问。网络规则只有在命令网络已开启、并且 `features.network_proxy` 启用时才会限制目标域名；`deny` 会覆盖同一范围内的 `allow`。

权限 profile 目前仍处于 Beta。它与 `sandbox_mode` / `sandbox_workspace_write` 是两套配置模型；选择 profile 后不要再同时配置另一套。如果加载的配置、profile 或命令行中出现 `sandbox_mode` 或 `--sandbox`，旧式沙盒设置会优先于 `default_permissions`。

## 模型、提供商和单次覆盖

只想临时换模型时，使用专用 flag：

```bash
codex --model gpt-5.6
```

需要覆盖任意 TOML 键时，用 `-c` 或 `--config`。值按 TOML 解析，不是 JSON：

```bash
codex --config model='"gpt-5.6"'
codex --config sandbox_workspace_write.network_access=true
codex --config 'shell_environment_policy.filters={ "PATH" = "include", "HOME" = "include" }'
```

使用 OpenAI 内置 provider 的代理地址时，可以直接设置：

```toml
openai_base_url = "https://proxy.example.com/v1"
```

需要独立认证或不同协议时，再定义自定义 provider：

```toml
model = "gpt-5.6-terra"
model_provider = "proxy"

[model_providers.proxy]
name = "OpenAI using LLM proxy"
base_url = "https://proxy.example.com/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
```

提供商、认证和代理地址属于机器级配置，放在用户配置或受管配置中，不要提交到仓库的 `.codex/config.toml`。

## AGENTS.md 负责项目语境

`config.toml` 适合表达“工具怎么运行”，`AGENTS.md` 适合表达“这个项目应该怎么修改”。Codex 会先读取全局指令，再按项目根目录到当前目录的顺序拼接项目指令。每个目录优先选择 `AGENTS.override.md`，没有时才读取 `AGENTS.md`。

一份够用的项目指令可以这样写：

```markdown
# AGENTS.md

## 项目约束

- 保持公开 API 的向后兼容。
- 修改 TypeScript 后运行类型检查和单元测试。
- 不要修改生成文件，除非任务明确要求。

## 验证命令

- `npm run lint`
- `npm test`
```

项目还可以使用 `.codex/config.toml` 保存团队共享的模型、TUI 或 MCP 默认值。项目配置、项目规则和项目 Hooks 都建立在“信任该项目”的前提上；不信任时，用户级配置仍然可以生效，但项目层会被跳过。

## TUI、历史和通知

终端界面只需要少量定制就能适应长会话：

```toml
[tui]
alternate_screen = "auto"
raw_output_mode = false
status_line = ["current-dir", "git-branch", "model-with-reasoning", "context-remaining"]
terminal_title = ["spinner", "project", "status"]
notifications = true
notification_condition = "unfocused"
notification_method = "auto"

[history]
persistence = "save-all"
max_bytes = 10485760
```

`alternate_screen = "auto"` 会在支持备用屏幕的终端中使用全屏界面，并在 Zellij 等场景保留滚动历史。`raw_output_mode` 更适合需要直接复制终端输出的场景。状态栏和终端标题都可以在 TUI 中通过 `/statusline`、`/title`、`/theme` 和 `/keymap` 调整，`/status` 用来检查当前模型、权限和工作目录，`/debug-config` 用来查看最终配置层。

历史持久化写入 `$CODEX_HOME/history.jsonl`。不希望保存会话文本时设置 `persistence = "none"`。如果要按 Codex 的通知事件调用外部通知脚本，使用用户级的 `notify`：

```toml
notify = ["/absolute/path/to/notify-script"]
```

脚本会收到 Codex 提供的 JSON payload。它和 TUI 的桌面通知是两条独立路径，项目层不能用 `notify` 改写本机通知命令。

## 把 Codex 接入脚本和编辑器

交互式任务直接运行 `codex`。脚本和 CI 使用 `codex exec`，默认以只读沙盒运行：

```bash
codex exec "summarize the repository structure"
codex exec --sandbox workspace-write "run the tests and fix the smallest failure"
codex exec --json "review the working tree" | jq
codex exec --ephemeral "inspect this repository without saving the rollout"
```

`--json` 输出 JSON Lines，适合被流水线逐行消费；`--output-last-message` 或 `-o` 可以把最终自然语言结果写入文件。需要接着处理上一次非交互任务时，可以使用：

```bash
codex exec resume --last "apply the smallest safe fix"
```

第三方程序需要长期连接 Codex 时，可以使用 app server：

```bash
codex app-server --listen stdio://
codex app-server --listen ws://127.0.0.1:8080
```

这条路径面向协议客户端和开发调试，不应替代普通终端会话。

## 三种常用工作模式

探索陌生仓库时，使用只读沙盒并保留审批：

```bash
codex --sandbox read-only --ask-for-approval on-request
```

日常开发使用工作区写入，网络按任务临时打开：

```bash
codex --sandbox workspace-write --ask-for-approval on-request
```

自动化任务可以在受控的 CI runner 或专用隔离环境中使用 `codex exec`，并把写入范围和凭证暴露范围压到最低。只有在环境隔离、仓库受信任、没有暴露敏感凭证且能够监控执行结果时，才使用 `danger-full-access` 或 `approval_policy = "never"`；在开发机上把两者设成默认值，会让一次误判直接变成机器级副作用。

配置 Codex 的关键不是找到一份永远不变的模板，而是让每个任务都能回答三个问题：它能触碰哪些路径，能访问哪些网络，出了边界由谁批准。能把这三件事说清楚，模型和 TUI 的其他选项才值得继续调。

## 相关官方文档

- [Config basics](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Advanced Configuration](https://learn.chatgpt.com/docs/config-file/config-advanced)
- [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [Permissions](https://learn.chatgpt.com/docs/permissions)
- [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)
