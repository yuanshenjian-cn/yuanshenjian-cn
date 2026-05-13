---
title: OpenCode 提效配置手册：从基础增强到高级生态
date: '2026-05-11'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: true
brief: >-
  OpenCode 的配置体系远比表面看起来丰富。这篇手册按实际使用优先级，系统梳理从基础增强、权限控制、自动压缩，到 Provider、Agent、Skills、MCP、Plugins 的完整配置方法，每一节都配有可直接落地的配置示例。
---

## 前言

用 OpenCode 一段时间后，大多数人的配置还停留在 `model` 和 `provider` 两个字段。但实际上，OpenCode 的配置体系覆盖了从 TUI 交互到 Agent 协作、从权限控制到外部工具集成的完整链路。

这篇手册基于 OpenCode 最新稳定版本（截至 2026 年 5 月），按**使用优先级**而非文档目录顺序来写——先解决你每天会碰到的问题，再深入进阶配置。

## 配置文件总览

OpenCode 的配置分散在多个文件中，搞清楚各自管辖范围才能避免改错地方：

| 文件 | 路径 | 作用范围 | 优先级 |
|------|------|----------|--------|
| `opencode.json` / `opencode.jsonc` | `~/.config/opencode/` | 全局 | 基础 |
| `opencode.json` / `opencode.jsonc` | `.opencode/`（项目根目录） | 项目级 | 覆盖全局 |
| `tui.json` / `tui.jsonc` | `~/.config/opencode/` | TUI 界面 | 独立 |
| `agents/*.md` | `~/.config/opencode/agents/` 或 `.opencode/agents/` | Agent 定义 | 项目级覆盖全局 |
| `skills/*/SKILL.md` | `~/.config/opencode/skills/` 或 `.opencode/skills/` | Skill 定义 | 项目级覆盖全局 |
| `commands/*.md` | `~/.config/opencode/commands/` 或 `.opencode/commands/` | 自定义命令 | 项目级覆盖全局 |

> 除上述路径外，OpenCode 也会加载 `~/.opencode/` 作为兼容路径（顺序：全局 `~/.config/opencode/` → 项目根 `.opencode/` → `~/.opencode/`）。还可以用环境变量 `OPENCODE_CONFIG_DIR` 指定额外的配置目录。

`$schema` 字段建议加上，能获得 IDE 的自动补全：

```json
{
  "$schema": "https://opencode.ai/config.json"
}
```

## 一、基础增强配置

### 1. 自动压缩（Compaction）

长会话的上下文膨胀是实际使用中最大的隐性成本。OpenCode 的 compaction 机制可以在上下文接近上限时自动总结历史，腾出 token 空间。

```json
{
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  }
}
```

| 选项 | 说明 | 建议值 |
|------|------|--------|
| `auto` | 上下文满时自动触发压缩 | `true`（默认） |
| `prune` | 压缩时移除旧的工具调用输出，节省 token | `true`（默认） |
| `tail_turns` | 压缩时保留的最近用户轮数（连同其后续 assistant/tool 响应一起逐字保留） | `2`（默认） |
| `preserve_recent_tokens` | 压缩后从最近轮次逐字保留的最大 token 数 | 视上下文窗口而定 |
| `reserved` | 压缩时预留的 token 缓冲，避免临界点溢出 | `5000~15000` |

`reserved` 这个字段很多人不知道。如果不设，压缩过程本身可能就把上下文撑满，导致压缩失败。建议根据常用模型的上下文窗口大小来设：200K 窗口设 5000，1M 窗口设 10000~15000。

`tail_turns` 和 `preserve_recent_tokens` 控制"最近轮次保留多少不动"，调大这两个值会牺牲压缩力度换上下文连贯性，对话依赖近期细节时很有用。

### 2. 默认 Agent 与快照

```json
{
  "default_agent": "赵云",
  "snapshot": true,
  "autoupdate": "notify"
}
```

- `default_agent`：必须指向一个 primary agent；若指向 subagent，OpenCode 会发出警告并回退到 `build`
- `snapshot`：修改前自动做 git snapshot，配合 `/undo` 和 `/redo` 使用。默认开启，如果你觉得它拖慢了大文件操作可以关掉
- `autoupdate`：`false` 完全静默，`"notify"` 有更新时通知但不自动安装

### 3. Shell 与格式化

```json
{
  "shell": "zsh",
  "formatter": {
    "prettier": { "disabled": false }
  },
  "lsp": true
}
```

- `shell`：控制交互式 shell 和工具调用时的 shell 环境，默认继承系统 `$SHELL`
- `formatter`：代码格式化工具，支持 prettier、biome 等
- `lsp`：语言服务器协议，开启后 Agent 可以获取类型错误和符号关系

### 4. 文件监控

```json
{
  "watcher": {
    "ignore": ["node_modules/**", ".git/**", "dist/**", "*.log"]
  }
}
```

避免大目录触发不必要的文件扫描，提升 TUI 响应速度。

### 5. 额外指令文件

除了项目根目录的 `AGENTS.md`，可以通过顶层 `instructions` 字段引入更多指令文件，支持 glob：

```json
{
  "instructions": ["CONTRIBUTING.md", "docs/guidelines.md", ".cursor/rules/*.md"]
}
```

适合复用已有的 `.cursor/rules`、团队规范文档等，避免内容重复维护。

### 6. 会话分享策略

```json
{
  "share": "manual"
}
```

- `"manual"`（默认）— 显式执行 `/share` 才上传
- `"auto"` — 新会话自动分享
- `"disabled"` — 完全禁用分享

涉及敏感代码的项目建议显式设为 `"disabled"`。

## 二、TUI 增强配置

TUI 配置单独放在 `tui.json`（或 `tui.jsonc`）中，路径：`~/.config/opencode/tui.json`。

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "nord",
  "keybinds": {
    "leader": "ctrl+x",
    "command_list": "ctrl+p",
    "tool_details": "<leader>d",
    "model_list": "<leader>m"
  },
  "leader_timeout": 2000,
  "scroll_speed": 3,
  "scroll_acceleration": {
    "enabled": true
  },
  "diff_style": "auto",
  "mouse": true
}
```

### Theme

内置主题可通过 `/themes` 命令查看完整列表并实时切换预览。下表为高频键位摘录，完整列表见官方 keybinds 文档。

### Keybinds

几个值得自定义的绑定：

| 功能 | 默认绑定 | 建议 |
|------|----------|------|
| `command_list` | `ctrl+p` | 保持默认，功能搜索入口 |
| `model_list` | `<leader>m` | 保持默认 |
| `tool_details` | `none`（未绑定） | 建议加 `<leader>d`，调试 MCP 时频繁用到 |
| `display_thinking` | `none`（未绑定） | 默认未绑定。若想为它指定快捷键请避开 `ctrl+t`——后者默认是 `variant_cycle`（切换推理强度档位） |

Leader 键默认是 `ctrl+x`，所有 `<leader>X` 都是先按 `ctrl+x` 再按 X。

### Mouse

默认 `mouse: true` 会捕获终端鼠标事件，导致你无法用鼠标选中文本复制。如果你经常需要从 TUI 复制内容，建议设为 `false`。

### Scroll Acceleration

macOS 用户建议开启 `scroll_acceleration.enabled`，惯性滚动体验更接近原生。开启后实际滚动速度由加速曲线主导。

### Diff Style

`"auto"` 会根据终端宽度自动选择显示方式。小屏终端建议手动设为 `"stacked"`，避免 diff 显示不全。

## 三、权限控制体系

OpenCode 的权限控制分**全局**和**Per-Agent**两个层级，支持 glob 模式匹配，最后匹配的规则生效。

### 全局权限

```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git log*": "allow",
      "rm *": "deny",
      "rm -rf *": "deny"
    },
    "edit": {
      "/tmp/**": "allow"
    },
    "task": {
      "*": "allow"
    },
    "skill": {
      "*": "allow",
      "experimental-*": "ask"
    }
  }
}
```

### 权限键与对应工具

| 权限键 | 控制的工具 |
|--------|-----------|
| `read` | `read`（对 `*.env` 和 `*.env.*` 默认 `deny`） |
| `edit` | 所有文件修改：`edit`, `write`, `patch` |
| `bash` | `bash` |
| `task` | `task`（调用 subagent） |
| `glob`, `grep`, `list` | 同名工具 |
| `webfetch`, `websearch` | 同名工具 |
| `lsp`, `skill`, `question` | 同名工具 |
| `todowrite` | `todowrite`（待办列表写入） |
| `repo_clone`, `repo_overview` | 仓库克隆与概览操作 |
| `external_directory` | 工作树外文件访问（默认 `ask`） |
| `doom_loop` | 模型陷入循环时的恢复提示（默认 `ask`） |

> 以上权限键多数支持 glob 模式精细控制（如 `bash`、`edit`、`task`、`skill`、`read`、`glob`、`grep`）；`external_directory`、`doom_loop`、`question` 等通常只用 `allow`/`ask`/`deny` 三态简单态。

### Per-Agent 权限

在 agent 的 markdown frontmatter 或 `opencode.json` 的 `agent.<name>.permission` 中覆盖。下面是一个只读 reviewer agent 的实战示例，禁掉所有编辑，bash 只放行 `git diff/log/show` 等查询命令：

```json
{
  "agent": {
    "reviewer": {
      "permission": {
        "edit": "deny",
        "bash": {
          "*": "deny",
          "git diff*": "allow",
          "git log*": "allow",
          "git show*": "allow",
          "git status*": "allow"
        }
      }
    }
  }
}
```

### Task 权限（控制可调用哪些 Subagent）

```json
{
  "permission": {
    "task": {
      "*": "deny",
      "explore-*": "allow",
      "general-*": "allow"
    }
  }
}
```

这个配置很实用：限制某个 primary agent 只能调用特定前缀的 subagent，防止误调用高成本 agent。

### `tools` 字段 vs `permission`

早期 agent 配置用 `tools: { write: false }` 二态切换工具开关，官方文档已建议 agent 层优先使用 `permission`——后者支持 glob 模式和 allow/ask/deny 三态，表达力更强。在 `permission` 中，`<tool>: "allow"` 是简写形式，等价于 `<tool>: { "*": "allow" }`，`deny` 和 `ask` 同理。

不过 `tools` 并未完全消失，**MCP 工具的 per-agent 隐藏（不注入工具描述、省 token）目前仍优先用 `tools` 字段**（详见第七节）。本文除 MCP 章节外，统一使用 `permission`。

## 四、Provider 配置

### 内置 Provider

OpenCode 支持 40+ 内置 provider，大多数通过 `/connect` 命令图形化配置即可。常用的包括：

| Provider | 接入方式 | 特点 |
|----------|----------|------|
| GitHub Copilot | OAuth | 模型丰富（Claude、GPT、Gemini、Grok），推荐主力 |
| OpenAI | API Key | GPT-5.x 系列，直连 |
| Anthropic | API Key | Claude 系列 |
| DeepSeek | API Key | 性价比高，长上下文 |
| Moonshot AI | API Key | Kimi 系列，中文友好 |
| Groq | API Key | 速度极快，适合 explore 类任务 |
| Ollama | 本地 | 完全本地运行，隐私首选 |

### 自定义 Provider

如果内置列表没有你要的，可以用 `@ai-sdk/openai-compatible` 包接入任何 OpenAI 兼容 API：

```json
{
  "provider": {
    "myprovider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My Provider",
      "options": {
        "baseURL": "https://api.example.com/v1",
        "apiKey": "{file:~/.secrets/myprovider-api-key}",
        "timeout": 600000,
        "chunkTimeout": 30000
      },
      "models": {
        "model-id": {
          "name": "Display Name",
          "limit": {
            "context": 200000,
            "output": 65536
          }
        }
      }
    }
  }
}
```

关键规则：
- `/v1/chat/completions` 端点用 `@ai-sdk/openai-compatible`
- `/v1/responses` 端点用 `@ai-sdk/openai`
- 凭证支持两种引用语法避免明文：`{file:~/path/to/key}` 读取文件首行；`{env:VAR_NAME}` 读取环境变量。两种语法适用于配置文件中所有字符串字段，不限于 `apiKey`
- `timeout`、`chunkTimeout` 是通用 `options` 字段，内置 provider 也可用

### Model 与 Small Model

```json
{
  "model": "github-copilot/claude-sonnet-4.6",
  "small_model": "github-copilot/claude-haiku-4.5"
}
```

- `model`：默认使用的模型，影响所有未单独指定模型的 agent
- `small_model`：轻量任务（如标题生成、摘要）使用的模型
- 格式统一为 `provider/model-id`
- 具体可用的模型 ID 以 `opencode models` 输出或 `/models` 列表为准，不同 provider 命名规则不一

### Variant（推理强度）

> ⚠️ Variant 是 OpenCode 暴露的模型推理强度切换机制。具体支持的 variant 名称因 provider 和模型而异，且会随版本调整，使用前建议通过 `Ctrl+T` 在 TUI 中实际验证当前模型支持的值。

部分模型（如 Anthropic Claude、OpenAI GPT、Google Gemini 等推理类模型）支持 variant，通过 `Ctrl+T` 在 TUI 中循环切换。常见档位包括 `low` / `medium` / `high` 等推理强度标识。

自定义 variant 可在 `provider.*.models.*.variants` 中定义（以 DeepSeek 为例）：

```json
{
  "provider": {
    "deepseek": {
      "models": {
        "deepseek-v4-pro": {
          "variants": {
            "low": {
              "reasoningEffort": "low",
              "thinking": { "type": "enabled" }
            },
            "high": {
              "reasoningEffort": "high",
              "thinking": { "type": "enabled" }
            }
          }
        }
      }
    }
  }
}
```

### Provider 过滤

```json
{
  "disabled_providers": ["openai"],
  "enabled_providers": ["github-copilot", "anthropic"]
}
```

`disabled_providers` 优先级高于 `enabled_providers`。这个功能在团队环境里很有用——统一限制可选 provider，避免误选成本高的。

## 五、Agent 配置体系

### Primary vs Subagent

| 维度 | Primary Agent | Subagent |
|------|--------------|----------|
| 交互方式 | 直接对话，`Tab` 切换 | `@name` 手动调用，或 Task tool 自动调用 |
| `hidden` | 生效，隐藏后不出现在 Tab 循环 | 生效，隐藏后不出现在 `@` 补全 |
| `default_agent` | 可设为默认 | 不可设为默认 |
| 典型用途 | 主工作流 | 专项任务（搜索、审查、研究） |

内置 agent：

| Agent | 角色 | 特点 |
|-------|------|------|
| `build` | Primary | 默认，全工具权限 |
| `plan` | Primary | 只读，`edit` 和 `bash` 默认 ask |
| `general` | Subagent | 全工具（除 todo），并行工作 |
| `explore` | Subagent | 只读，快速搜索代码库 |
| `scout` | Subagent | 外部文档和依赖研究 |
| `compaction` | System | 自动上下文压缩（系统内部管理） |
| `title` | System | 自动生成会话标题（系统内部管理） |
| `summary` | System | 自动生成会话摘要（系统内部管理） |

### 完整配置项

```markdown
---
description: "Agent 用途描述（必填，subagent 的自动委派依赖它）"
mode: primary | subagent | all
color: primary | secondary | accent | success | warning | error | info | #hex
model: provider/model-id
hidden: true | false        # 从 Tab 循环（primary）或 @ 补全（subagent）中隐藏
disable: true | false       # 临时禁用该 agent
temperature: 0.0-1.0
top_p: 0.0-1.0
steps: 20                   # 最大迭代步数
reasoningEffort: high       # 透传给 provider
permission:
  edit: deny
  bash:
    "*": ask
    "git *": allow
prompt: "{file:./system-prompt.txt}"   # 引用外部文件
---

系统 prompt 正文...
```

### 实践：多模型 Agent 矩阵

我自己用了一套模型绑定的 Agent 矩阵，核心思路是：**primary 和配套的 subagent 用同一系列模型**。同系列模型的指令遵循风格、JSON 输出习惯、工具调用偏好一致，整条任务链路的稳定性会明显高于混搭。

> 下表中的模型 ID 以我本地当时可用的版本为准，具体可用模型请用 `opencode models` 或 TUI 中 `/models` 查询，照抄前先替换为当前可用 ID。

**Primary Agents：**

| Agent | 模型 | 场景 |
|-------|------|------|
| 赵云 | Claude Sonnet 4.6 | 日常开发 |
| 诸葛亮 | GPT-5.5 | 架构设计、深度推理 |
| 小七 | GPT-5.5（直连） | 需要直连 API 的场景 |
| 工具人 | Kimi K2.6 | 中文任务、长文档 |

**Subagent 矩阵（每个模型配 explore + general 两个版本）：**

```markdown
---
# explore-sonnet.md
description: Fast read-only agent for exploring codebases
mode: subagent
model: github-copilot/claude-sonnet-4.6
reasoningEffort: high
permission:
  write: deny
  edit: deny
---
```

```markdown
---
# general-sonnet.md
description: General-purpose agent for complex tasks
mode: subagent
model: github-copilot/claude-sonnet-4.6
reasoningEffort: high
---
```

Primary 的 system prompt 里指定 subagent 委派规则：

```markdown
---
# 赵云.md
mode: primary
model: github-copilot/claude-sonnet-4.6
---

## Sub-Agent 委派规则

- 使用 explore-sonnet 代替 explore
- 使用 general-sonnet 代替 general
```

这样赵云启动的子任务自动走 Claude Sonnet 系列，整条链路的模型保持一致。

## 六、Skills 系统

Skills 是可复用的指令集合，Agent 通过 `skill` 工具按需加载。

### 文件格式

每个 skill 是一个目录，内含 `SKILL.md`：

```
~/.config/opencode/skills/my-skill/
  └── SKILL.md
```

```markdown
---
name: my-skill                    # 小写字母 + 数字 + 连字符
description: "Skill 用途描述，写得越具体触发越精准"
license: "MIT"                    # 可选
compatibility: "opencode"         # 可选
metadata:                         # 可选
  author: "your-name"
---

Skill 的具体指令内容...
```

### 搜索路径

OpenCode 会从以下位置加载 skills（项目级路径会从当前目录向上遍历至 git worktree 根）：

1. `.opencode/skills/<name>/SKILL.md`（项目级）
2. `~/.config/opencode/skills/<name>/SKILL.md`（全局）
3. `.claude/skills/<name>/SKILL.md`（兼容 Claude Code）
4. `~/.claude/skills/<name>/SKILL.md`（兼容 Claude Code）
5. `.agents/skills/<name>/SKILL.md`（兼容 agent 生态约定）
6. `~/.agents/skills/<name>/SKILL.md`（兼容 agent 生态约定）

同名 skill 在多处存在时建议保持唯一，否则加载行为不确定。

### 权限控制

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

被 `deny` 的 skill 对 Agent 完全不可见。`ask` 会在加载前弹窗确认。

> ⚠️ 多条规则匹配同一名称时，**最后一个匹配的规则胜出**。约定写法是：通配规则 `*` 放最前面，更具体的规则放后面，这样具体规则才能覆盖通配。反过来写会让 `deny` 失效。

### 使用方式

Agent 在 `skill` 工具描述中能看到所有可用的 skills，根据 description 自动判断何时加载。你也可以在对话中手动触发：

```
使用 git-release skill 帮我发版
```

### 最佳实践

1. **description 要具体** — Agent 根据 description 决定是否调用，写得越具体触发越精准
2. **name 要匹配目录名** — 使用小写字母、数字与连字符
3. **跨平台复用** — 一套 skill 可以同时被 OpenCode、Claude Code、Codex 加载
4. **避免重复命名** — 不同路径下 skill name 冲突时，先找到的生效

## 七、MCP 服务器

MCP（Model Context Protocol）让 OpenCode 可以调用外部工具服务。

### Local MCP

本地运行的 MCP 服务器，通过命令启动：

```json
{
  "mcp": {
    "serena": {
      "type": "local",
      "command": [
        "uvx", "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server", "--context", "ide-assistant"
      ],
      "enabled": true,
      "environment": {
        "MY_VAR": "value"
      }
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"],
      "enabled": true
    },
    "context7": {
      "type": "local",
      "command": [
        "npx", "-y", "@upstash/context7-mcp",
        "--api-key", "{file:~/.secrets/context7-api-key}"
      ],
      "enabled": true
    }
  }
}
```

### Remote MCP

远程 HTTP 服务：

```json
{
  "mcp": {
    "jira": {
      "type": "remote",
      "url": "https://jira.example.com/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {env:JIRA_TOKEN}"
      },
      "timeout": 30000
    }
  }
}
```

### OAuth 认证

大多数 OAuth-enabled MCP 服务器无需特殊配置，OpenCode 检测到 401 会自动启动 OAuth 流程，使用 RFC 7591 动态客户端注册，token 安全存储。

手动触发认证：

```bash
opencode mcp auth <server-name>
```

预注册 OAuth（已有 clientId/clientSecret 时）：

```json
{
  "oauth": {
    "clientId": "{env:MCP_CLIENT_ID}",
    "clientSecret": "{env:MCP_CLIENT_SECRET}",
    "scope": "tools:read tools:execute"
  }
}
```

### 管理命令

| 命令 | 作用 |
|------|------|
| `opencode mcp list` | 列出所有 MCP 服务器和认证状态 |
| `opencode mcp auth <name>` | 认证指定服务器 |
| `opencode mcp auth list` | 查看所有支持 OAuth 服务器的认证状态 |
| `opencode mcp logout <name>` | 移除凭据 |
| `opencode mcp debug <name>` | 调试连接问题 |

### 最佳实践

1. **注意 token 消耗** — MCP 工具描述会随服务器一起注入到上下文，GitHub、Jira 这类工具数量多、描述长，开几个就能撑爆几千 token
2. **按 agent 控制 MCP 工具可见性** — 顺着上一条，在大多数 agent 里关掉非必需 MCP 工具，仅在专用 agent 里启用
3. **用 `timeout` 控制超时** — 默认 5000ms，网络慢的 MCP 建议调高

```json
{
  "mcp": {
    "github": {
      "enabled": true    // 服务器进程启用
    }
  },
  "agent": {
    "build": {
      "tools": {
        "github_*": false   // 默认 agent 里关闭 github 工具
      }
    },
    "github-agent": {
      "tools": {
        "github_*": true    // 专用 agent 单独启用
      }
    }
  }
}
```

> MCP 工具以服务器名为前缀注册（如 `github_create_issue`、`github_list_prs`），用 glob `"github_*"` 可匹配该服务器的所有工具。注意：`mcp.<name>.enabled: false` 会停掉服务器进程，agent 层无法再启用；要做 per-agent 显隐，需保持服务器 `enabled: true`，再用 agent 的 `tools` 字段控制工具列表的注入——`permission` 也能拦截调用，但工具描述仍会注入上下文，省 token 优先用 `tools`。

## 八、Plugins 体系

Plugins 是 OpenCode 的扩展机制，通过事件钩子介入工作流。

### 安装方式

**本地文件：**

```
~/.config/opencode/plugins/my-plugin.ts
.opencode/plugins/my-plugin.ts
```

**npm 包：**

```json
{
  "plugin": ["opencode-helicone-session", "@my-org/custom-plugin"]
}
```

npm 插件通过 Bun 自动安装，缓存在 `~/.cache/opencode/node_modules/`。

### Plugin 结构

```typescript
import { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async ({ tool, input }) => {
      // 工具执行前的拦截
      if (tool === "read" && input.path?.includes(".env")) {
        throw new Error("禁止读取 .env 文件");
      }
    },
    "session.idle": async () => {
      // 会话空闲时触发通知
      await $("osascript -e 'display notification \"任务完成\"'");
    },
    "shell.env": async () => {
      // 注入环境变量到所有 shell 执行
      return { MY_VAR: "value" };
    }
  };
};
```

### 可用事件

事件覆盖工具调用前后、会话生命周期、Permission、Shell 环境、TUI 交互、LSP、Todo 等多个维度。事件名和签名随版本调整较频繁，开发 plugin 前建议直接查看 `@opencode-ai/plugin` 包导出的 TypeScript 类型定义，按 IDE 补全提示选用。

### 开发注意事项

1. **依赖管理** — 本地 plugin 需要外部包时，在 config 目录放 `package.json`，OpenCode 启动时自动 `bun install`
2. **日志** — 用 `client.app` 提供的日志方法代替 `console.log`，支持分级输出
3. **自定义工具** — plugin 可以用 `tool()` helper 配合 Zod schema 注册自定义工具，同名时 plugin 工具优先于内置工具
4. **TypeScript** — 从 `@opencode-ai/plugin` 导入类型

## 九、自定义命令

自定义命令是放在 `commands/*.md` 中的可复用 prompt 模板：

```markdown
---
description: 将本地目录 attach 到远程 Git 仓库
---

# Attach 本地目录到远程 Git 仓库

你的任务是帮用户将一个本地目录关联到远程 Git 仓库...

## 执行步骤

1. 检查当前目录是否已有 git 仓库
2. 如果没有，初始化 `git init`
3. 添加远程 `git remote add origin <url>`
4. 推送...
```

通过 `/attach-remote` 调用（文件名即命令名）。适合封装重复性的交互式工作流。

## 十、我的完整配置参考

下面是我的全局 `opencode.jsonc` 核心部分，供参考：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "赵云",
  "autoupdate": "notify",
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  },
  "shell": "zsh",
  "snapshot": true,
  "permission": {
    "bash": {
      "rm *": "deny",
      "rm -rf *": "deny"
    },
    "edit": {
      "/tmp/**": "allow"
    }
  },
  "provider": {
    "tencent-tokenhub": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Tencent TokenHub",
      "options": {
        "baseURL": "https://tokenhub.tencentmaas.com/v1/",
        "apiKey": "{file:~/.secrets/tencent-api-key}"
      },
      "models": {
        "kimi-k2.6": { "name": "Kimi K2.6" },
        "deepseek-v4-pro": {
          "name": "DeepSeek V4 Pro",
          "limit": { "context": 1000000, "output": 384000 },
          "variants": {
            "low": { "reasoningEffort": "low", "thinking": { "type": "enabled" } },
            "high": { "reasoningEffort": "high", "thinking": { "type": "enabled" } }
          }
        }
      }
    }
  },
  "mcp": {
    "serena": {
      "type": "local",
      "command": ["uvx", "--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "ide-assistant"],
      "enabled": true
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"],
      "enabled": true
    },
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp", "--api-key", "{file:~/.secrets/context7-api-key}"],
      "enabled": true
    }
  },
  "agent": {
    "build": { "color": "secondary", "hidden": true },
    "plan": { "color": "accent", "hidden": true }
  },
  "plugin": [],
  "watcher": {
    "ignore": ["node_modules/**", ".git/**", "dist/**", "*.log"]
  }
}
```

配套的 `~/.config/opencode/tui.json`：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "nord",
  "keybinds": {
    "leader": "ctrl+x",
    "tool_details": "<leader>d"
  },
  "diff_style": "auto",
  "scroll_acceleration": { "enabled": true },
  "mouse": false
}
```

几点说明：

- API Key 用 `{file:path}` 引用外部文件，或用 `{env:VAR_NAME}` 引用环境变量，避免明文写入配置文件
- 自定义 provider 的 `npm` 字段指定 SDK 包名，模型 ID 和显示名在 `models` 中映射
- MCP 的 `enabled` 根据使用频率调整，不常用的先关后开
- `agent.build` 和 `agent.plan` 设了 `hidden: true` 后会从 Tab 循环中消失，日常 Tab 切换只看到自己定义的 primary agent

## 小结

OpenCode 的配置体系可以总结为三层：

1. **基础层**（compaction、permission、provider）—— 影响所有会话的默认行为
2. **交互层**（TUI、theme、keybinds）—— 影响你每天的使用体验
3. **扩展层**（agents、skills、MCP、plugins）—— 构建个性化的 AI 工作流

建议的配置顺序：先搞定 compaction 和权限 → 配好常用 provider 和默认模型 → 按需定义 agent 矩阵 → 逐步接入 MCP 和 skills → 有定制需求时再写 plugin。

配置一次，长期受益。花半小时把这套体系搭好，后续每天的使用效率会有明显提升。

## 参考

- [OpenCode Config 文档](https://opencode.ai/docs/config/)
- [OpenCode TUI 文档](https://opencode.ai/docs/tui/)
- [OpenCode Agents 文档](https://opencode.ai/docs/agents/)
- [OpenCode Skills 文档](https://opencode.ai/docs/skills/)
- [OpenCode MCP 文档](https://opencode.ai/docs/mcp-servers/)
- [OpenCode Plugins 文档](https://opencode.ai/docs/plugins/)
- [OpenCode Providers 文档](https://opencode.ai/docs/providers/)
