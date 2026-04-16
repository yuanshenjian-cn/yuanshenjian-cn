---
title: "Claude Code 第七篇：扩展架构全景——Skills、Sub-agents、Hooks、MCP、Plugins 与 Agent Teams"
date: '2026-04-07'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: "系统拆解 Claude Code 的六大扩展机制——Skills、Sub-agents、Hooks、MCP、Plugins、Agent Teams，理解它们的定位、协作关系与选型决策，帮你从「会用工具」迈向「设计工具链」。"
---

## 引言：从使用者到架构师

前六篇我们已经能高效使用 Claude Code 完成日常开发。但随着任务复杂度上升，你会发现单靠内置能力远远不够：

- 想让 Claude 每次提交前自动跑 lint + test，怎么做？
- 想让 Claude 访问公司内部的 API 文档服务器，怎么接入？
- 想把一套"创建 React 组件"的流程固化成可复用的模板，怎么封装？
- 想让多个 Claude 实例并行处理不同模块，怎么协调？

Claude Code 为此提供了**六大扩展机制**，从轻量脚本到分布式协作，覆盖了几乎所有定制化场景。本篇将系统拆解每一种机制的设计意图、核心配置与适用边界。

> **阅读建议**：本篇是"架构认知"篇，侧重**是什么、为什么、怎么选**。具体的端到端实战配置将在[第八篇](/articles/2026/04/08/claude-code-advanced-automation-with-mcp-hooks-and-agents)中展开。

---

## 六大机制全景图

先建立宏观视角——六大机制各自解决什么问题：

| 机制 | 核心定位 | 触发方式 | 典型场景 |
|------|---------|---------|---------|
| **Skills** | 可复用的指令模板 | `/skill-name` 命令 | 封装工作流（批量处理、调试循环） |
| **Sub-agents** | 专职的子 Claude 实例 | 自动或手动调度 | 代码探索、方案规划、专领域代理 |
| **Hooks** | 生命周期事件回调 | 25+ 事件自动触发 | 提交前检查、文件变更通知、权限拦截 |
| **MCP** | 外部工具/数据连接协议 | Claude 按需调用 | 数据库查询、API 网关、文件系统扩展 |
| **Plugins** | 多机制打包分发单元 | 安装后自动生效 | 第三方工具集成（如 Sentry、Linear） |
| **Agent Teams** | 多 Claude 并行协作 | 团队任务分发 | 大规模重构、多模块并行开发 |

它们之间不是互斥关系，而是**分层互补**：

```
┌─────────────────────────────────────────┐
│            Agent Teams（协作层）          │  多个 Claude 并行
├─────────────────────────────────────────┤
│          Sub-agents（委派层）             │  单 Claude 内委派子任务
├─────────────────────────────────────────┤
│    Skills（指令层）  │  Hooks（事件层）    │  触发方式不同
├─────────────────────────────────────────┤
│            MCP（连接层）                  │  外部工具和数据源
├─────────────────────────────────────────┤
│          Plugins（分发层）                │  打包 + 命名空间
└─────────────────────────────────────────┘
```

---

## Skills：可复用的指令模板

### 什么是 Skill

Skill 是一个 Markdown 文件（`SKILL.md`），包含 YAML frontmatter 元数据和正文指令。你可以把它理解为"可参数化的 CLAUDE.md 片段"——当用户输入 `/skill-name` 时，Claude 会加载该 Skill 的指令并按照其中的步骤执行。

### Skill 的存放位置与优先级

Skill 可存放在四个位置，优先级从高到低：

| 位置 | 路径 | 影响范围 | 是否共享 |
|------|------|---------|---------|
| **Enterprise** | 由管理策略注入 | 组织所有成员 | 由 IT 管控 |
| **Personal** | `~/.claude/skills/skill-name/SKILL.md` | 你的所有项目 | 否 |
| **Project** | `.claude/skills/skill-name/SKILL.md` | 项目所有协作者 | 提交到 git |
| **Plugin** | 通过 Plugin 安装 | 取决于 Plugin 作用域 | 取决于 Plugin |

同名 Skill 高优先级覆盖低优先级。

### SKILL.md 结构详解

一个完整的 Skill 文件：

```markdown
---
name: create-component
description: "创建 React 组件，包含类型定义、样式和测试"
argument-hint: "<ComponentName>"
user-invocable: true
allowed-tools:
  - Write
  - Read
  - Bash(npm test)
model: sonnet
effort: high
context: fork
---

# 创建 React 组件

用户通过 `/create-component Button` 调用时：

1. 在 `src/components/$ARGUMENTS/` 目录下创建：
   - `$ARGUMENTS.tsx`：组件主体
   - `$ARGUMENTS.test.tsx`：单元测试
   - `index.ts`：导出文件
2. 运行 `npm test -- --testPathPattern=$ARGUMENTS`
3. 若测试失败，自动修复后重试
```

### Frontmatter 字段速查

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | Skill 名称，决定 `/name` 命令 |
| `description` | string | 描述，用于 AI 自动选择 |
| `argument-hint` | string | 参数提示，显示在帮助中 |
| `user-invocable` | boolean | 是否可通过 `/` 命令手动调用 |
| `disable-model-invocation` | boolean | 禁止 AI 自动调用此 Skill |
| `allowed-tools` | string[] | 允许使用的工具白名单 |
| `model` | string | 运行此 Skill 的模型 |
| `effort` | string | 推理强度（`low` / `medium` / `high`） |
| `context` | string | `fork` 则在子代理中运行，隔离上下文 |
| `agent` | string | 指定运行此 Skill 的子代理 |
| `hooks` | object | 绑定到此 Skill 的 Hooks |
| `paths` | string[] | 限制 Skill 自动激活的范围（匹配工作目录下的路径） |
| `shell` | string | 指定 Bash 命令使用的 Shell |

### 参数替换机制

Skill 正文中可使用以下占位符：

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `$ARGUMENTS` | 完整参数字符串 | `/deploy staging` → `staging` |
| `$ARGUMENTS[0]` | 第 N 个参数（空格分隔） | `/deploy staging eu` → `staging` |
| `$1`, `$2`, ... | 同 `$ARGUMENTS[0]`、`$ARGUMENTS[1]` | 简写形式 |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID | 用于日志关联 |
| `${CLAUDE_SKILL_DIR}` | Skill 文件所在目录 | 引用同目录下的资源文件 |

### 动态上下文注入

Skill 正文中可使用 `` !`command` `` 语法动态注入命令输出：

```markdown
## 当前项目信息

!`cat package.json | jq '{name, version, dependencies}'`

## Git 状态

!`git status --short`
```

当 Skill 被加载时，这些命令会立即执行，输出替换到对应位置，为 Claude 提供实时上下文。

### 内置 Skills

Claude Code 自带以下 Skills：

| Skill | 用途 |
|-------|------|
| `/batch` | 批量处理多个文件或任务 |
| `/claude-api` | 加载 Claude API 参考资料到上下文 |
| `/debug` | 进入调试循环（运行→失败→修复→重试） |
| `/loop` | 循环执行直到条件满足 |
| `/simplify` | 简化复杂代码 |

### context: fork 与隔离运行

当 `context: fork` 时，Skill 会在一个**独立的子代理会话**中运行：

- **独立上下文**：不会污染主会话的对话历史
- **结果回传**：子代理完成后，结果摘要返回主会话
- **适用场景**：探索性任务、可能产生大量中间输出的操作

---

## Sub-agents：专职的子 Claude 实例

### 内置 Sub-agents

Claude Code 内置了五个专职子代理，各有明确分工：

| 子代理 | 模型 | 权限 | 用途 |
|--------|------|------|------|
| **Explore** | Haiku | 只读 | 快速搜索代码、阅读文件 |
| **Plan** | 继承主模型 | 只读 | 制定实施方案，不做修改 |
| **通用子代理** | 继承主模型 | 全工具 | 委派完整子任务 |
| **StatusLine Setup** | Sonnet | — | 配置终端状态栏 |
| **Claude Code Guide** | Haiku | — | 回答关于 Claude Code 本身的问题 |

当 Claude 自行判断某个子任务适合委派时，会自动选择合适的内置子代理。例如，当它需要了解一个大型代码库的结构时，往往会先派出 Explore 子代理进行快速扫描。

### 自定义 Sub-agents

你可以在以下位置创建自定义子代理：

- **项目级**：`.claude/agents/agent-name.md`
- **用户级**：`~/.claude/agents/agent-name.md`

文件格式与 Skill 类似——YAML frontmatter + Markdown 正文指令：

```markdown
---
name: security-reviewer
description: "审查代码中的安全漏洞"
tools:
  - Read
  - Grep
  - Glob
disallowedTools:
  - Write
  - Bash
model: sonnet
permissionMode: plan
maxTurns: 30
---

# 安全审查代理

你是一个专注于安全审查的代理。对于每个文件：

1. 检查硬编码的密钥或凭证
2. 检查 SQL 注入风险
3. 检查 XSS 漏洞
4. 检查不安全的依赖
5. 输出结构化的审查报告

**绝对不要修改任何文件**，只报告发现。
```

### Agent Frontmatter 字段速查

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 代理名称 |
| `description` | string | 描述，用于 AI 自动选择 |
| `tools` | string[] | 允许使用的工具白名单 |
| `disallowedTools` | string[] | 禁止使用的工具黑名单 |
| `model` | string | 使用的模型（haiku / sonnet / opus） |
| `permissionMode` | string | 权限模式（default / plan / auto / bypassPermissions 等） |
| `maxTurns` | number | 最大对话轮数 |
| `skills` | string[] | 此代理可使用的 Skills |
| `mcpServers` | string[] | 此代理可使用的 MCP 服务器名称列表 |
| `hooks` | object | 绑定到此代理的 Hooks |
| `memory` | string | 持久记忆级别（`user` / `project` / `local`） |
| `background` | boolean | 后台运行模式 |
| `effort` | string | 推理强度 |
| `isolation` | string | `worktree` 使用 git worktree 隔离 |
| `color` | string | 终端状态栏颜色标识 |
| `initialPrompt` | string | 代理启动时的初始提示 |

### 工具控制策略

`tools` 和 `disallowedTools` 支持精细的工具控制：

```yaml
# 只允许读取和搜索
tools:
  - Read
  - Grep
  - Glob

# 允许所有工具，但禁止写入和执行
disallowedTools:
  - Write
  - Bash

# 允许 Bash，但只能运行特定命令
tools:
  - Read
  - Bash(npm test)
  - Bash(npm run lint)
```

工具名称遵循 Claude Code 的权限规则语法——`ToolName(pattern)` 形式可限制工具的参数范围。

### 后台子代理

当 `background: true` 时，子代理在后台运行：

- **不阻塞主会话**：你可以继续与主 Claude 交互
- **权限预审批**：后台代理的工具权限在启动时确定，运行中不再弹出权限确认
- **适用场景**：长时间运行的任务（如大规模代码分析、持续监控）

### 隔离运行：git worktree

当 `isolation: worktree` 时，子代理会在一个独立的 git worktree 中工作：

```yaml
isolation: worktree
```

**效果**：
- 子代理的文件修改不会影响主工作目录
- 完成后可选择性地将更改合并回来
- 适合需要大量试错的重构任务

### 持久记忆

当 `memory: true` 时，子代理会在会话间保留记忆：

- **项目级记忆**：`.claude/agent-memory/agent-name/`
- **用户级记忆**：`~/.claude/agent-memory/agent-name/`

每次调用该代理时，之前积累的记忆会自动加载，使代理能"记住"项目的历史上下文。

---

## Hooks：生命周期事件回调

### 设计理念

Hooks 是 Claude Code 的事件系统——在特定生命周期节点自动触发外部脚本。与传统 Git hooks 类似，但覆盖面更广：不仅限于 Git 操作，还包括工具调用、权限决策、会话管理等 25+ 个事件。

### 事件一览

Claude Code 支持的 Hook 事件按生命周期阶段分组：

**会话生命周期**

| 事件 | 触发时机 |
|------|---------|
| `SessionStart` | 会话开始 |
| `SessionEnd` | 会话结束 |
| `InstructionsLoaded` | CLAUDE.md / Rules 加载完成 |
| `ConfigChange` | 配置发生变更 |
| `CwdChanged` | 工作目录切换 |

**用户交互**

| 事件 | 触发时机 |
|------|---------|
| `UserPromptSubmit` | 用户提交 prompt（可修改 prompt 内容） |
| `Notification` | Claude 发出通知 |
| `Elicitation` | MCP 服务器请求用户输入 |
| `ElicitationResult` | 用户对 Elicitation 的回复 |

**工具调用**

| 事件 | 触发时机 |
|------|---------|
| `PreToolUse` | 工具调用前（可拦截、修改或放行） |
| `PostToolUse` | 工具调用后（可审计结果） |
| `PostToolUseFailure` | 工具调用失败后 |

**权限决策**

| 事件 | 触发时机 |
|------|---------|
| `PermissionRequest` | 权限请求弹出时（可自动决策） |
| `PermissionDenied` | 权限被拒绝后（可重试） |

**子代理 / 团队**

| 事件 | 触发时机 |
|------|---------|
| `SubagentStart` | 子代理启动 |
| `SubagentStop` | 子代理停止 |
| `TeammateIdle` | 团队成员空闲 |
| `TaskCreated` | 任务创建 |
| `TaskCompleted` | 任务完成 |

**文件 / 工作区**

| 事件 | 触发时机 |
|------|---------|
| `FileChanged` | 文件发生变更 |
| `WorktreeCreate` | git worktree 创建 |
| `WorktreeRemove` | git worktree 移除 |

**上下文管理**

| 事件 | 触发时机 |
|------|---------|
| `PreCompact` | 上下文压缩前 |
| `PostCompact` | 上下文压缩后 |

**终止**

| 事件 | 触发时机 |
|------|---------|
| `Stop` | Claude 正常停止 |
| `StopFailure` | Claude 异常停止 |

### Hook 类型

Hook 支持四种执行方式：

| 类型 | 说明 | 示例 |
|------|------|------|
| `command` | 执行本地命令 | `"command": "npm test"` |
| `http` | 发送 HTTP 请求 | `"url": "https://api.example.com/hook"` |
| `prompt` | 注入额外 prompt 给 Claude | `"prompt": "记得检查类型安全"` |
| `agent` | 启动一个子代理处理 | `"agent": "security-checker"` |

### 配置格式

Hooks 配置在 settings.json 中，采用**嵌套结构**——每个事件下是一组匹配规则，每条规则包含一个 `matcher`（可选）和对应的 `hooks` 数组：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node ./scripts/pre-tool-check.js",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "请先阅读 CHANGELOG.md 了解最近的变更"
          }
        ]
      }
    ]
  }
}
```

注意结构层次：`hooks → 事件名 → [ { matcher?, hooks: [...] } ]`。`matcher` 不填则匹配该事件的所有触发。
```

### 过滤机制：matcher 与 if

- **`matcher`**：正则表达式，匹配工具名（如 `Write`、`Bash`）。对于工具相关事件（`PreToolUse` / `PostToolUse`），`matcher` 匹配的是工具名称
- **`if`**：使用**权限规则语法**（permission rule syntax），如 `Bash(npm test)`、`Write(src/**)`，而非 JavaScript 表达式

两者同时配置时，必须**同时满足**才会触发。

### 退出码与决策控制

Hook 脚本的退出码决定了后续行为：

| 退出码 | 含义 | 行为 |
|--------|------|------|
| **0** | 成功 | 继续执行，处理 stdout 中的 JSON 输出 |
| **2** | 阻断错误 | 中止操作，将 stderr 内容反馈给 Claude |
| **其他** | 非阻断错误 | 记录警告，继续执行 |

**决策控制 JSON**（通过 stdout 返回）：

对于 `PreToolUse` 事件，Hook 可通过 JSON 输出控制工具调用：

```json
{
  "permissionDecision": "allow"
}
```

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `permissionDecision` | `allow` / `deny` / `ask` / `defer` | 控制工具调用权限 |

对于 `PermissionRequest` 事件：

```json
{
  "decision": {
    "behavior": "allow"
  }
}
```

对于 `PermissionDenied` 事件：

```json
{
  "retry": true
}
```

### Hook 配置位置

Hooks 可在多个位置配置：

| 位置 | 说明 |
|------|------|
| User / Project / Local settings | 标准设置文件中的 `hooks` 字段 |
| Managed policy | 企业级强制 Hooks |
| Plugin `hooks/hooks.json` | 随 Plugin 分发 |
| Skill / Agent frontmatter | 绑定到特定 Skill 或 Agent |

**安全注意**：`disableAllHooks` 设置可临时禁用所有 Hooks，适用于调试场景。

---

## 五、MCP：外部工具与数据连接协议

### 什么是 MCP

MCP（Model Context Protocol）是一个开放标准协议，让 Claude 能够连接外部工具和数据源。你可以把它理解为"Claude 的 USB 接口"——不管外部系统是数据库、API 还是文件服务器，只要实现了 MCP 协议，Claude 就能即插即用。

### 传输方式

| 传输方式 | 适用场景 | 说明 |
|---------|---------|------|
| **HTTP** | 远程服务（推荐） | 可流式传输（Streamable HTTP） |
| **stdio** | 本地进程 | Claude 启动子进程，通过 stdin/stdout 通信 |
| **SSE** | — | 已弃用，建议迁移到 HTTP |

### 作用域与配置

MCP 服务器有三个作用域，优先级从高到低：

| 作用域 | 配置文件 | 说明 |
|--------|---------|------|
| **Local** | `~/.claude.json`（项目段） | 仅你在此项目，不共享 |
| **Project** | `.mcp.json` | 项目级，提交到 git |
| **User** | `~/.claude.json` | 你的所有项目 |

**stdio 服务器配置示例**（`.mcp.json`）：

```json
{
  "mcpServers": {
    "my-db": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/mydb"
      }
    }
  }
}
```

**HTTP 服务器配置示例**：

```json
{
  "mcpServers": {
    "remote-api": {
      "type": "http",
      "url": "https://mcp.example.com/api"
    }
  }
}
```

### 添加 MCP 服务器

推荐使用命令行添加：

```bash
# 添加 stdio 服务器
claude mcp add my-db -- npx @modelcontextprotocol/server-postgres

# 添加 HTTP 服务器
claude mcp add --transport http remote-api https://mcp.example.com/api

# 指定作用域
claude mcp add my-tool --scope project -- npx my-tool-server

# 列出已配置的服务器
claude mcp list

# 移除服务器
claude mcp remove my-db
```

### 工具搜索（Tool Search）

当配置了大量 MCP 工具时，每次都把所有工具声明发给模型会浪费 token。Claude Code 的**工具搜索默认已启用**（`auto` 模式），会根据当前任务上下文动态搜索最相关的 MCP 工具，而不是一次性加载所有工具。

工具搜索支持三种模式：

| 值 | 行为 |
|------|------|
| `true` | 始终启用工具搜索 |
| `auto`（默认） | 当 MCP 工具数量超过阈值时自动启用 |
| `false` | 禁用工具搜索，加载所有工具 |

可在 settings.json 中通过 `toolSearch` 字段配置。

### MCP 资源引用

MCP 服务器可暴露"资源"——Claude 可通过 `@` 语法引用：

```
@server-name:protocol://resource/path
```

例如，如果配置了一个文档服务器 `docs`，你可以在对话中写：

```
请参考 @docs:file:///api-reference.md 来实现这个接口
```

### MCP Prompts 作为命令

MCP 服务器可以暴露 prompts，它们会以斜杠命令的形式出现：

```bash
# 格式：/mcp__servername__promptname
/mcp__docs__search-api
```

### Claude 作为 MCP 服务器

Claude Code 本身也可以作为 MCP 服务器运行：

```bash
claude mcp serve
```

这使得其他支持 MCP 的工具可以连接到 Claude Code，利用它的代码理解和生成能力。

### 输出限制与 Elicitation

- **输出限制**：MCP 工具输出超过 10K token 时会收到警告，默认最大 25K token（可通过 `MAX_MCP_OUTPUT_TOKENS` 调整）
- **Elicitation**：MCP 服务器可以请求用户输入结构化数据（如表单字段、选择项），Claude 会将请求转发给用户

### Channels（研究预览）

Channels 是 MCP 的扩展能力，允许 MCP 服务器推送消息到 Claude 会话：

- **需要 v2.1.80+ 且 claude.ai 登录**
- **支持平台**：Telegram、Discord、iMessage（通过插件）
- **启用方式**：通过安装对应的 Plugin（如 Telegram Plugin），Plugin 提供 Channel 所需的 MCP 服务器
- **前置要求**：需要 Bun 运行时；首次连接需配对码验证
- **安全机制**：发送者允许列表、配对码验证
- **通信模式**：双向——服务器推送事件，Claude 通过同一频道回复

> **注意**：Channels 目前处于研究预览阶段，功能可能发生变化。

---

## 六、Plugins：多机制打包分发单元

### Plugin 的定位

Plugin 不是一种新的扩展机制，而是一个**打包和分发容器**——它可以包含 Skills、Agents、Hooks、MCP 配置和 Settings，以一个统一的命名空间分发。

### Plugin 目录结构

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # 清单文件（可选，用于元数据声明）
├── commands/                 # 额外命令
├── agents/                   # 子代理定义
├── skills/                   # Skill 定义
├── hooks/
│   └── hooks.json           # Hook 配置
├── .mcp.json                # MCP 服务器配置
├── .lsp.json                # LSP 配置
└── settings.json            # 设置覆盖（仅支持 agent 相关配置）
```

**plugin.json** 清单（可选）：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "我的自定义插件",
  "author": {
    "name": "your-name"
  }
}
```

### 命名空间

Plugin 内的 Skills 使用命名空间前缀，避免与其他 Plugin 或项目 Skills 冲突：

```bash
# 格式：/plugin-name:skill-name
/my-plugin:create-component
/sentry:analyze-error
```

### 开发与测试

```bash
# 测试本地 Plugin
claude --plugin-dir ./my-plugin

# 重新加载 Plugins（开发时）
/reload-plugins
```

### 安装与分发

```bash
# 从 marketplace 安装
/plugin install plugin-name

# 从 URL 安装
/plugin install https://github.com/org/plugin-repo
```

Plugin 生态系统仍在快速发展中，未来将支持更丰富的 marketplace 功能。

---

## 七、Agent Teams：多 Claude 并行协作

### 实验性状态

Agent Teams 目前是**实验性功能**，需要显式启用：

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### 架构设计

Agent Teams 与 Sub-agents 的核心区别在于**通信模式**：

| 维度 | Sub-agents | Agent Teams |
|------|-----------|-------------|
| **通信** | 只向主代理汇报 | 队友之间可跨代理通信 |
| **协调** | 主代理串行委派 | Team Lead 分发任务，并行执行 |
| **共享** | 无共享状态 | 共享任务列表 + 邮箱 |
| **适用** | 单一子任务委派 | 大规模并行开发 |

**架构图**：

```
            ┌──────────────┐
            │  Team Lead   │
            │ (协调者/你)   │
            └──────┬───────┘
                   │ 分发任务
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Teammate │ │Teammate │ │Teammate │
   │   A     │ │   B     │ │   C     │
   └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │
        └───────────┼───────────┘
                    ▼
            Shared Task List
              + Mailbox
```

### 团队通信机制

- **任务列表**：Team Lead 创建任务，分配给特定 Teammate
- **邮箱**：Teammate 之间可以发送消息（如"我修改了接口，你需要更新调用方"）
- **Hook 事件**：`TeammateIdle`、`TaskCreated`、`TaskCompleted` 用于自动化协调

### 当前限制

由于仍处于实验阶段，Agent Teams 有以下限制：

- 无法恢复进程内队友的会话（崩溃后需重新开始）
- 每个会话只能有一个团队
- 不支持嵌套团队
- Team Lead 角色固定，不可切换
- 所有 Teammate 共享同一工作目录（除非使用 `isolation: worktree`）

---

## 八、六大机制选型决策

### 决策流程图

面对一个扩展需求，按以下路径选型：

```
你想做什么？
│
├─ 连接外部工具/数据 ──────────→ MCP
│
├─ 在特定事件自动执行 ──────────→ Hooks
│  （提交前检查、文件变更通知）
│
├─ 封装可复用的工作流 ──────────→ Skills
│  （模板化、参数化）
│
├─ 委派独立子任务 ──────────────→ Sub-agents
│  （代码探索、安全审查）
│
├─ 多人/多模块并行 ──────────────→ Agent Teams
│  （大规模重构）
│
└─ 打包分发给团队/社区 ─────────→ Plugins
```

### 对比总览表

| 维度 | Skills | Sub-agents | Hooks | MCP | Plugins | Agent Teams |
|------|--------|-----------|-------|-----|---------|-------------|
| **触发** | 手动 `/` 命令或 AI 自动 | AI 自动或手动 | 事件驱动 | AI 按需调用 | 安装后生效 | 手动启动 |
| **隔离** | 可选 fork | 可选 worktree | 无 | 进程隔离 | 命名空间 | 可选 worktree |
| **共享** | git 提交 | git 提交 | settings | .mcp.json | Plugin 包 | 环境变量 |
| **学习成本** | 低 | 中 | 中 | 中 | 高 | 高 |
| **稳定性** | 稳定 | 稳定 | 稳定 | 稳定 | 较新 | 实验性 |
| **典型耗时** | 即时 | 秒到分钟 | 即时 | 取决于服务 | — | 分钟到小时 |

### 组合使用模式

实际项目中，这些机制往往组合使用：

**模式 1：Skill + Hook**

Skill 封装"创建组件"流程，Hook 在文件写入后自动运行格式化：

```
/create-component Button
    ↓ Skill 执行写入
    ↓ PostToolUse Hook 触发
    ↓ 自动运行 prettier + eslint --fix
```

**模式 2：Sub-agent + MCP**

安全审查代理通过 MCP 连接漏洞数据库：

```
主 Claude → 委派 security-reviewer 子代理
    ↓ 子代理通过 MCP 查询 CVE 数据库
    ↓ 子代理通过 MCP 查询内部安全规则
    ↓ 返回结构化审查报告
```

**模式 3：Plugin = Skill + Agent + Hook + MCP**

一个"Sentry 集成"Plugin 可能包含：

- Skill：`/sentry:analyze-error` 分析错误
- Agent：`sentry-debugger` 自动定位 Bug
- Hook：`PostToolUse` 上报代码变更到 Sentry
- MCP：连接 Sentry API

---

## 九、小结与下篇预告

本篇建立了 Claude Code 扩展架构的完整认知地图：

| 你学到了 | 关键要点 |
|---------|---------|
| **全景视角** | 六大机制分层互补：MCP（连接层）→ Hooks/Skills（事件/指令层）→ Sub-agents（委派层）→ Agent Teams（协作层）→ Plugins（分发层） |
| **Skills** | Markdown 模板 + 参数替换 + 动态上下文注入，`context: fork` 实现隔离 |
| **Sub-agents** | 五个内置 + 自定义 Markdown 定义，支持工具控制、后台运行、worktree 隔离、持久记忆 |
| **Hooks** | 26 个事件 × 4 种类型，退出码控制流程，`matcher` + `if` 精确过滤 |
| **MCP** | 3 种传输 × 3 个作用域，工具搜索懒加载，Channels 双向通信 |
| **Plugins** | 打包容器而非新机制，命名空间隔离，统一分发 |
| **Agent Teams** | 实验性多 Claude 并行，共享任务列表 + 邮箱，突破单代理瓶颈 |

下一篇（第八篇）将是本系列的收官之作——我们将用**三个端到端蓝图**把这些扩展机制串联起来，展示如何在真实项目中构建完整的自动化工作流。
