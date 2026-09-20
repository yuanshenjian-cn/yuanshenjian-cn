---
title: "Codex 插件、Skills 与 MCP 配置指南"
date: '2026-09-19'
tags:
  - AI 编程
  - Codex
  - MCP
published: false
brief: >-
  Codex 中的 Skill、MCP、Plugin 和 Hook 解决的是不同问题：Skill 提供可复用的工作流，MCP 连接外部工具和数据，Plugin 把能力打包分发，Hook 在生命周期节点执行检查。文章按当前官方能力模型，给出本地 Skill、STDIO 与 Streamable HTTP MCP、插件 marketplace、工具审批和 Hook 信任机制的配置方法。
---

> Skill 负责告诉 Codex 怎样完成一类工作，MCP 负责让它接触外部工具和数据，Plugin 负责把这些能力装进一个可分发的包；先分清职责，配置才不会变成重复接入。

如果同一个 GitHub、文档或浏览器能力同时出现在多个入口里，真正的问题不是“哪个工具更强”，而是 Codex 要在几套相似的工具描述之间做选择。当前官方模型已经把能力拆成 Skill、MCP、Plugin 和 Hook 四种形态，再由 marketplace 负责发现和分发。

## 四种能力形态各自解决什么问题

| 形态 | 主要内容 | 适合解决的问题 |
|------|----------|----------------|
| Skill | `SKILL.md` 中的指令，以及模板、脚本和参考资料 | 让重复任务遵循稳定流程 |
| MCP server | 工具、资源、认证和服务端说明 | 连接外部数据或执行外部动作 |
| Plugin | 一个可安装的包，可包含 Skill、MCP server、可选 UI 和 Hook | 组合能力并交给团队或 marketplace 分发 |
| Hook | 在 Codex 生命周期节点运行的命令或 MCP 工具 | 做日志、提示词检查、变更扫描和策略校验 |

Skill 本身不要求外部服务。它可以只是“怎样做代码审查”的工作流，也可以附带脚本和模板。MCP server 则通过 STDIO 或 Streamable HTTP 暴露工具和上下文，Codex 还会读取初始化时返回的 `instructions`，把它作为整个 server 的通用约束。

Plugin 不是另一套工具协议，而是安装和分发边界。一个插件可以只包含 Skills，也可以把 Skills 和 MCP server 放在一起；如果工作需要可视化交互，MCP server 还可以返回可选 UI。Hook 也能随插件分发，但它仍然需要在 Codex 中单独审查和信任。

## 先按需求选择入口

可以用下面的判断减少重复配置：

- 只有固定流程和写作规范时，用 Skill。
- 需要读取外部系统或执行服务端动作时，用 MCP。
- 需要把一组 Skills、MCP 和 Hook 交给其他人安装时，用 Plugin。
- 需要在某个事件前后自动检查时，用 Hook。

从实践看，同一个外部能力最好只保留一个主要入口。例如，已经由插件提供 GitHub MCP server 时，就不要再额外注册一套功能重叠的 GitHub server；如果只需要一套本地工作流，也没必要为了使用一个 `SKILL.md` 再创建插件。工具越多，模型看到的选择和审批边界越复杂。

## Skill 的目录和启用方式

一个 Skill 至少需要一个目录和 `SKILL.md`：

```text
review-helper/
└── SKILL.md
```

文件必须包含 `name` 和 `description`，正文写清楚输入、工作步骤、输出格式和禁止事项：

```markdown
---
name: review-helper
description: Review a change and report correctness risks before it is merged.
---

检查变更的行为影响、测试覆盖和回归风险。
先读取仓库指令，再运行项目规定的验证命令。
输出按优先级排序的问题，并给出文件路径和依据。
```

Codex 会从这些位置发现本地 Skill：

| 范围 | 位置 | 用途 |
|------|------|------|
| 仓库 | 当前目录到仓库根目录路径上的 `.agents/skills` | 项目或团队共享 |
| 用户 | `~/.agents/skills` | 个人跨项目工作流 |
| 管理员 | `/etc/codex/skills` | 机器级共享能力 |
| 系统 | Codex 随附的内置目录 | 通用基础能力 |

仓库范围的目录会沿当前工作目录向上扫描，因此可以把项目专用 Skill 放在仓库根目录，也可以放在某个子目录下。Codex 支持符号链接；安装或修改 Skill 后如果当前会话没有看到变化，重新启动会话即可。

不想删除 Skill，只想让它不参与发现或调用，可以在用户级 `config.toml` 中关闭它：

```toml
[[skills.config]]
path = "/Users/me/.agents/skills/review-helper/SKILL.md"
enabled = false
```

Skill 的可用目录清单本身也会占用上下文。需要控制这部分预算时，可以设置：

```toml
[skills]
max_context_tokens = 6000
```

这里控制的是可用 Skill 目录的上下文预算，不是单个 Skill 执行时的输出上限。

## MCP：先接入，再限制工具面

Codex CLI、ChatGPT 桌面应用和 IDE 扩展共享同一套 MCP 配置。用户级配置放在 `~/.codex/config.toml`，项目级配置放在可信项目的 `.codex/config.toml`。CLI 中可以直接添加一个 STDIO server：

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
codex mcp list
```

命令行中的 `--env` 用 `KEY=VALUE` 为 STDIO 进程设置环境变量；如果只是允许进程读取当前 shell 中的凭证，建议在配置文件中使用 `env_vars`：

```bash
codex mcp add internal-docs --env DOCS_ENV=development -- uvx internal-docs-mcp
```

在 TUI 中输入 `/mcp` 可以查看当前连接的 server，`/mcp verbose` 会显示更详细的诊断信息。支持 OAuth 的 Streamable HTTP server 使用下面的命令登录：

```bash
codex mcp login internal-docs
```

### STDIO server

STDIO server 由 Codex 启动本地进程，最常用的配置是 `command`、`args`、`env`、`env_vars` 和 `cwd`：

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
env_vars = ["CONTEXT7_API_KEY"]
cwd = "/Users/me/projects/docs"
```

`env` 适合非敏感的固定变量；凭证优先放在进程环境中，再用 `env_vars` 允许 MCP 进程读取，不要把长期 token 写进仓库或提交到公共配置。

### Streamable HTTP server

远程 server 使用 `url`，可以选择环境变量中的 Bearer token、静态请求头或 OAuth：

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
http_headers = { "X-Figma-Region" = "us-east-1" }
```

如果服务要求预注册 OAuth 客户端，可以在添加时提供 client ID，然后按 `codex mcp add` 打印的 callback URL 完成服务端注册。登录方式和 callback 细节取决于 MCP 服务的 OAuth 元数据，不要把某一个服务的回调路径硬编码成所有 server 的通用规则。

### 工具白名单与审批

MCP server 连接成功不等于所有工具都应该暴露给模型。可以先限制工具集合，再为有副作用的工具加审批：

```toml
[mcp_servers.chrome_devtools]
url = "http://localhost:3000/mcp"
enabled_tools = ["open", "screenshot"]
disabled_tools = ["screenshot"]
default_tools_approval_mode = "prompt"
startup_timeout_sec = 20
tool_timeout_sec = 45
enabled = true

[mcp_servers.chrome_devtools.tools.open]
approval_mode = "approve"
output_token_limit = 30000
```

`disabled_tools` 会在 `enabled_tools` 之后应用。server 级默认审批模式支持 `auto`、`prompt`、`writes` 和 `approve`；单个工具可以用 `tools.<tool>.approval_mode` 覆盖。`required = true` 可以让初始化失败直接终止会话，适合缺失该 server 就无法完成任务的自动化场景；普通辅助工具更适合保持可选。

`output_token_limit` 只限制某个 MCP 工具返回给模型的输出预算，不会限制 server 本身产生的结果，也不会替代工具筛选。

## Plugin 是能力的分发边界

Codex CLI 中可以用 `/plugins` 打开插件浏览器。插件来自已配置的 marketplace，安装后要启动新会话，新的 Skills 或工具才会参与当前任务：

```text
codex
/plugins
```

也可以先从 Git marketplace 添加一个来源：

```bash
codex plugin marketplace add owner/repo
codex plugin marketplace list
codex plugin marketplace upgrade
```

本地或仓库 marketplace 常见的布局是：

```text
repository/
├── .agents/plugins/marketplace.json
└── plugins/
    └── review-helper/
        ├── plugin.json
        └── skills/
            └── review-helper/SKILL.md
```

一个最小 marketplace 可以这样声明插件：

```json
{
  "name": "local-repo",
  "interface": {
    "displayName": "Local repo plugins"
  },
  "plugins": [
    {
      "name": "review-helper",
      "source": {
        "source": "local",
        "path": "./plugins/review-helper"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Developer tools"
    }
  ]
}
```

路径相对于 marketplace 根目录，并且以 `./` 开头。插件本身可以使用便携的根目录 `plugin.json`，也可以使用 Codex 兼容的 `.codex-plugin/plugin.json`。便携格式可以在 `extensions.com.openai` 中放 OpenAI 专属的展示、MCP 映射和 Hook 配置；`.codex-plugin/plugin.json` 是兼容回退格式。需要 MCP 或 Hook 时，按所选清单格式添加 `mcp.json` / `.mcp.json` 和 `hooks/`，不要只把一种格式的清单文件改名后继续沿用原字段。

### 为项目启用或关闭插件

仓库 marketplace 负责让插件可发现，项目 `.codex/config.toml` 负责控制某个插件是否在该项目中启用：

```toml
[plugins."review-helper@local-repo"]
enabled = true
```

这里的键由“插件名@marketplace 名”组成。项目配置只在项目被信任时加载，且项目级设置可能覆盖用户级、云端和系统默认值。关闭插件不会删除 marketplace 中的插件文件，也不会阻止后续 marketplace 刷新插件内容。

插件提供的 MCP server 可以继续细调工具和审批：

```toml
[plugins."sample@test".mcp_servers.sample]
enabled = true
default_tools_approval_mode = "prompt"
enabled_tools = ["read", "search"]

[plugins."sample@test".mcp_servers.sample.tools.search]
approval_mode = "approve"
```

ChatGPT 和 Codex 使用同一个公开插件目录，但各客户端的支持范围不同：Codex CLI 和 ChatGPT 桌面应用支持插件浏览器，IDE 扩展不提供插件目录。网页端安装插件也不会把插件中的本地 Hook 脚本部署到你的机器上。

## Hook 适合做检查，不适合代替 Skill

Hook 在生命周期节点执行命令或调用已经连接的 MCP 工具。常用事件包括 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PreCompact`、`Stop` 和 `SessionEnd`；完整事件列表还包括 `PermissionRequest`、`PostCompact`、`SubagentStart`、`SubagentStop` 和 `Interrupt`。`SessionEnd` 不支持 MCP tool hook。

用户级 Hook 可以放在 `~/.codex/hooks.json` 或 `~/.codex/config.toml`，项目级 Hook 放在 `.codex/hooks.json` 或 `.codex/config.toml`。插件也可以在包内提供 `hooks/hooks.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^Bash$",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/check_command.py\"",
            "timeout": 30,
            "statusMessage": "Checking Bash command"
          }
        ]
      }
    ]
  }
}
```

Hook 不是“隐形的系统提示词”。非托管 Hook 在运行前必须审查和信任，Codex 会按当前 Hook 定义的 hash 记录信任状态；文件发生变化后，需要重新审查。CLI 中用 `/hooks` 查看来源、信任或关闭单个 Hook。需要完全关闭 Hook 时，可以设置：

```toml
[features]
hooks = false
```

如果一个 Hook 需要调用 MCP 工具，它使用已经连接的 MCP server，不会为 Hook 重新启动或重新连接 server。这个边界很重要：MCP 负责提供能力，Hook 负责在事件点调用能力，Skill 负责指导模型如何组织任务。

## 一套不容易失控的配置顺序

我更推荐按照下面的顺序接入外部能力：

先写一个只描述工作流的 Skill，确认模型需要哪些输入、输出和验证动作。确实需要外部数据时，再注册一个 MCP server，并用 `enabled_tools` 只保留任务需要的工具。需要团队共享时，再把 Skill、MCP 和必要的 Hook 包成 Plugin，放进可审查的 marketplace。

每增加一种能力，都在 TUI 里用 `/mcp`、`/plugins`、`/hooks` 和 `/status` 检查一次有效状态。遇到“配置写了但没有生效”，优先检查项目是否已信任、是否启动了新会话、server 是否初始化成功，以及更高优先级配置是否关闭了它。

外部服务的 OAuth 和权限由服务自身管理，Codex 的沙盒与审批策略仍然负责本地命令和 Host 侧动作。把凭证放在环境变量，把工具集合限制在任务需要的范围，再给写入、发送和删除类操作保留审批，通常比一次性打开整套连接器更容易维护。

## 相关官方文档

- [Skills & Plugins](https://learn.chatgpt.com/docs/skills-and-plugins)
- [Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Plugins](https://learn.chatgpt.com/docs/plugins)
- [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp)
- [Hooks](https://learn.chatgpt.com/docs/hooks)
- [Build plugins](https://developers.openai.com/plugins/build/plugins)
