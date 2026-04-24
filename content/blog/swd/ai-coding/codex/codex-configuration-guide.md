---
title: "Codex 配置中的沙盒哲学"
date: '2026-04-23'
tags:
  - 软件开发
  - AI 编程
  - Codex
published: true
brief: >-
  从 OpenCode 和 Claude Code 迁移到 Codex，最大的认知转变不是语法差异，而是安全模型的设计哲学。Codex 用三层配置（全局 config.toml、项目 AGENTS.md、命令行覆盖）和严格的沙盒分级，把"信任"变成了可量化的配置项。
---

## 为什么 Codex 的配置值得关注

OpenCode 用 `opencode.json` 管理一切，Claude Code 用 `CLAUDE.md` 加上交互式设置，而 Codex 选择了**集中式 TOML 配置**加**项目级 Markdown 说明**的双层结构。这个设计不是随意的，它反映了 GitHub 对"AI 编码 Agent 应该如何被约束"的理解。

Codex 的默认行为比 Claude Code 更保守：默认沙盒是只读的，每次网络访问都需要批准，文件写入被严格限制在当前工作区。这种保守不是缺陷，而是 Codex 的核心假设——**代码库的信任度应该由用户显式声明，而不是由工具隐式推断**。

理解这一点后，配置 Codex 就变成了一个"声明信任边界"的过程。

## 全局配置：~/.codex/config.toml

Codex 的所有持久化设置都存放在 `~/.codex/config.toml`。这是一个单文件配置，没有分散的 dotfiles 或交互式向导。

### 最简可用的配置模板

```toml
# ~/.codex/config.toml

model = "gpt-5.4"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
approval_policy = "on-request"

[analytics]
enabled = true
```

`gpt-5.4` 是官方 bundled catalog 中推荐的默认模型，你可以在配置中按需求切换。这五行配置覆盖了日常使用中最需要调整的四个维度：

| 配置项 | 可选值 | 建议 |
|--------|--------|------|
| **model** | gpt-5.4, gpt-5.1, o4-mini 等 | 日常编码用 gpt-5.4，复杂推理任务切 o4 |
| **model_reasoning_effort** | none, minimal, low, medium, high, xhigh | 默认 medium；简单重构用 low，架构设计用 high |
| **sandbox_mode** | read-only, workspace-write, danger-full-access | 新仓库用 read-only；日常开发用 workspace-write |
| **approval_policy** | untrusted, on-request, never, granular | 新仓库用 untrusted；熟悉后用 on-request |

### 模型选择的实际差异

`model_reasoning_effort` 是 Codex 独有的配置，Claude Code 和 OpenCode 没有直接对应项。它控制模型在回答前投入的"思考 Token"量：

- **none**：不额外推理，直接输出
- **minimal**：最轻量推理，适合简单问答
- **low**：响应快，适合代码补全、格式化、简单重构
- **medium**：平衡模式，日常开发默认选它
- **high**：深度推理，适合设计评审、复杂 Bug 定位
- **xhigh**：最高强度推理，适合架构决策和复杂分析

这个六级制比 OpenCode 的模型切换更细粒度。OpenCode 需要换模型（如从 Claude Sonnet 切到 Opus）才能获得更强的推理能力，而 Codex 在同一模型内通过调整 effort 就能实现近似效果。

### 审批策略的四种信任级别

Codex 的 `approval_policy` 定义了 Agent 执行操作的授权模式：

- **untrusted**：每次文件写入、命令执行、网络访问都要确认。适合第一次运行的新仓库。
- **on-request**：部分操作自动批准（如只读文件访问），写入和网络仍需确认。适合已建立信任的仓库。
- **never**：几乎完全自动，只在触及安全规则时暂停。适合高度信任的自动化场景。
- **granular**：按审批流程类型分别控制（shell 命令、规则检查、skill 脚本、权限请求、MCP 引导），每个字段为 `true`（允许）或 `false`（自动拒绝）。
- **on-failure**（已弃用）：操作失败时才请求确认。旧版本保留，不推荐使用。

**使用 `never` 需要谨慎**：它只在触及沙盒硬边界时才暂停，意味着 Agent 可以在没有任何人工确认的情况下执行文件写入、命令运行和网络请求。只有在已隔离环境或完全信任的自动化管道中才应考虑。

`granular` 的 TOML 配置示例：

```toml
approval_policy = { granular = { sandbox_approval = true, rules = false, skill_approval = false, request_permissions = true, mcp_elicitations = true } }
```

五个子字段的含义：`sandbox_approval`（shell/exec 命令）、`rules`（规则检查）、`skill_approval`（skill 脚本）、`request_permissions`（权限请求）、`mcp_elicitations`（MCP 引导）。设为 `true` 时允许该类请求，`false` 时自动拒绝。

Claude Code 的对应机制是 `Shift+Tab` 循环切换模式，OpenCode 则是按工具类型配置权限（`edit: allow`, `bash: ask`）。Codex 的策略方式覆盖范围更完整——一个策略值同时管文件、命令、网络三类操作——但 `granular` 策略虽可按审批流程类型分别控制，粒度仍不及 OpenCode 的按工具类型配置（比如自动改代码但确认每条 shell 命令）。这是 Codex 相比 OpenCode 的一个功能缺口。

### MCP 服务器配置

Codex 在 TOML 中直接支持 MCP 服务器：

```toml
[mcp_servers.docs]
command = "npx"
args = ["-y", "@mcp/docs-server"]

[mcp_servers.docs.tools.search]
approval_mode = "approve"
```

和 Claude Code 的 MCP 配置（通过交互式 `/mcp` 命令或 JSON 文件）相比，Codex 的 TOML 方式更适合版本控制和团队共享。OpenCode 也在 `opencode.json` 中支持 MCP，语法类似但用的是 JSON 结构。

### TUI 配置

#### 界面模式

Codex 的交互界面默认使用终端的**备用屏幕缓冲区**（alternate screen），提供全屏聊天体验，不会污染主终端的滚动历史。但在某些终端复用器（如 Zellij）中，备用屏幕模式会导致无法回溯对话历史——因为 Zellij 严格遵循 xterm 规范，禁用了备用屏幕的滚动回溯。

Codex 为此提供了三种模式，在 `config.toml` 中通过 `tui.alternate_screen` 配置：

```toml
[tui]
alternate_screen = "auto"
```

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| **auto** | 自动检测终端复用器；在 Zellij 中禁用备用屏幕，其他环境启用 | 默认，覆盖大多数场景 |
| **always** | 始终使用备用屏幕 | 不用 Zellij、偏好全屏体验 |
| **never** | 始终使用内联模式 | 需要保留完整滚动历史 |

TUI 的其他可配置项：

```toml
[tui]
animations = true                  # 启用动画效果
notifications = true               # 启用桌面通知
notification_condition = "unfocused"  # 通知触发条件：unfocused（窗口失焦）或 always
notification_method = "auto"       # 通知方法
show_tooltips = true               # 显示启动提示
```

也可以命令行临时覆盖：

```bash
# 强制内联模式，保留滚动历史
codex --no-alt-screen
```

Claude Code 和 OpenCode 都没有类似的 TUI 显示模式配置——它们要么固定全屏（OpenCode），要么取决于具体入口（Claude Code CLI 是内联，Desktop App 是独立窗口）。Codex 的这个设计给了终端用户更多控制权。

#### 状态栏定制

Codex TUI 底部的状态栏默认显示当前模型和目录。但这个状态栏是**完全可定制**的——你可以决定显示什么信息、按什么顺序排列。

通过 `tui.status_line` 配置：

```toml
[tui]
status_line = ["current-dir", "git-branch", "model-with-reasoning", "context-used", "five-hour-limit"]
```

所有可用的状态栏组件（共 19 个独立标识符，部分支持别名）：

| 组件标识符 | 别名 | 显示内容 | 条件 |
|-----------|------|---------|------|
| **model-name** | — | 当前模型名称 | 始终 |
| **model-with-reasoning** | — | 模型名称 + 推理级别 | 始终 |
| **current-dir** | — | 当前工作目录 | 始终 |
| **project-root** | project | 项目根目录 | 检测到项目时 |
| **git-branch** | — | 当前 Git 分支 | 在 Git 仓库中时 |
| **status** | run-state | 会话状态（Ready/Working/Thinking） | 始终 |
| **context-remaining** | — | 上下文窗口剩余百分比 | 有数据时 |
| **context-used** | context-usage | 上下文窗口已用百分比 | 有数据时 |
| **context-window-size** | — | 总上下文窗口大小（token） | 有数据时 |
| **used-tokens** | — | 会话已用 token 数 | 非零时 |
| **total-input-tokens** | — | 总输入 token 数 | 始终 |
| **total-output-tokens** | — | 总输出 token 数 | 始终 |
| **five-hour-limit** | — | 5 小时使用限额剩余 | 有数据时 |
| **weekly-limit** | — | 周使用限额剩余 | 有数据时 |
| **session-id** | — | 会话 UUID | 会话开始后 |
| **thread-title** | — | 当前线程标题 | 设置后 |
| **task-progress** | — | 任务进度 | 有更新计划时 |
| **fast-mode** | — | Fast 模式是否激活 | 始终 |
| **codex-version** | — | Codex 应用版本 | 始终 |

默认状态栏只显示 `model-with-reasoning` 和 `current-dir`。我个人推荐加上 `git-branch` 和 `context-used`——前者帮你确认自己在正确的分支上工作，后者让你在长会话中随时掌握上下文消耗情况。

状态栏的交互式配置也很方便：在 TUI 中按 `?` 打开帮助，找到 status line 的设置入口，用方向键调整顺序、空格键切换显示，变更实时预览。

Claude Code 的状态栏是固定的（模型 + 当前目录），不支持定制。OpenCode 的状态栏信息更少。Codex 在这点上给了终端重度用户充分的自由度。

#### 终端标题定制

Codex 还可以定制终端窗口/标签页的标题，通过 `tui.terminal_title` 配置：

```toml
[tui]
terminal_title = ["spinner", "project", "status"]
```

可用的终端标题组件如下（与状态栏大部分重叠）：

**状态栏中没有的独有组件**：

| 组件标识符 | 显示内容 |
|-----------|---------|
| **app-name** | 显示 "codex" |
| **spinner** | 动画旋转器，任务运行时转动 |

**与状态栏共用的组件**：`current-dir`、`project-root`（别名 `project`、`project-name`）、`status`（别名 `run-state`）、`model-name`、`model-with-reasoning`、`git-branch`、`context-remaining`、`context-used`（别名 `context-usage`）、`context-window-size`、`used-tokens`、`total-input-tokens`、`total-output-tokens`、`five-hour-limit`、`weekly-limit`、`session-id`、`thread-title`（别名 `thread`）、`task-progress`、`fast-mode`、`codex-version`

默认标题是 `spinner` + `project-name`（如 `my-project ⠋`）。如果你同时开多个 Codex 会话，建议把 `thread` 或 `current-dir` 加进去，这样从终端标签就能区分不同会话。

#### 语法高亮主题

Codex 支持自定义语法高亮主题：

```toml
[tui]
theme = "one-dark"
```

内置主题覆盖常见的明暗偏好。你也可以把 `.tmTheme` 文件放到 `~/.codex/themes/` 目录下，然后在 TUI 中用 `/theme` 命令浏览和切换，选中的主题会自动写入 `config.toml`。

#### 历史记录与搜索

Codex 的历史记录分为两层：

- **持久化历史**：`~/.codex/history.jsonl`，跨会话保留，只存文本
- **会话历史**：当前会话的完整提交记录，包括附件和文本元素

历史记录的行为可以配置：

```toml
[history]
persistence = "save-all"  # 或 "none" 禁用持久化历史
max_bytes = 10485760      # 历史文件最大 10MB
```

在 TUI 中按 `↑`/`↓` 可以遍历历史，`Ctrl+R` 进入反向搜索模式。搜索时底部变为查询输入区，主体显示匹配条目，`Enter` 接受当前匹配，`Esc` 恢复原始草稿。

这个设计比 OpenCode 的 `/sessions` 命令更轻量——不需要离开当前界面就能找回之前的提示。

#### 完整配置示例

把以上内容汇总，一份实用的 TUI 配置：

```toml
[tui]
alternate_screen = "auto"
status_line = ["current-dir", "git-branch", "model-with-reasoning", "context-used", "five-hour-limit"]
terminal_title = ["spinner", "project", "current-dir", "status"]
theme = "one-dark"
```

#### 通知钩子

Codex 支持在 Agent 每轮对话完成时执行自定义脚本：

```toml
notify = ["/path/to/notify-script.sh"]
```

带参数时写为数组：

```toml
notify = ["osascript", "-e", "display notification \"Codex done\""]
```

这个功能在 Claude Code 中对应 Desktop App 的原生通知，OpenCode 则没有内置支持。对于纯终端用户，Codex 的钩子更灵活——你可以触发任何系统通知工具（macOS 的 `osascript`、Linux 的 `notify-send` 等）。

## 项目配置：AGENTS.md

Codex 从项目根目录的 `AGENTS.md` 读取项目级指令。这个机制和 Claude Code 的 `CLAUDE.md` 几乎完全相同，和 OpenCode 的 `AGENTS.md` 也完全兼容——如果你从 OpenCode 迁移过来，文件可以直接复用。

如果你需要本地个性化配置但不想提交到版本控制，可以创建 `AGENTS.override.md`，它的优先级高于 `AGENTS.md`。这对多人协作项目中保留个人偏好很有用。

### 一份实用的 AGENTS.md 示例

```markdown
# AGENTS.md

## 项目概述
这是一个基于 Next.js 和 TypeScript 的博客系统，使用 Tailwind CSS 做样式，MDX 处理内容。

## 代码风格
- 所有函数组件用箭头函数，命名导出
- TypeScript 严格模式开启，不允许 `any`
- 最大行宽 100 字符
- 使用单引号字符串

## 测试
- 运行测试：`npm test`
- 单元测试用 Vitest，组件测试用 React Testing Library
- 新功能必须附带测试

## 构建与部署
- 本地构建：`npm run build`
- 构建成功后才能提交
- 提交前运行 `npm run lint`

## 重要文件
- `content/blog/` — 博客文章目录，MDX 格式
- `app/` — Next.js App Router 页面
- `components/` — 可复用组件
- `lib/` — 工具函数和类型定义
```

Codex 读取 `AGENTS.md` 后，会在每次交互前将其内容注入上下文。这意味着你不需要在每次提示中重复项目约定——文件本身承担了"记忆"的职责。

### 与 CLAUDE.md 的互操作

如果你同时使用 Claude Code 和 Codex，最佳实践是维护一份统一的 `AGENTS.md`，然后在 `CLAUDE.md` 中重复或引用其中的关键约定：

```markdown
# CLAUDE.md

## 项目通用约定（与 AGENTS.md 保持一致）
- 所有函数组件用箭头函数，命名导出
- TypeScript 严格模式开启，不允许 `any`

## Codex 没有的特殊约定
- 使用 `/compact` 管理长会话
- 优先使用 Claude 的内置工具而非 shell 命令
```

这样既避免了重复维护，又能为各自工具补充特定指令。

## 沙盒策略：Codex 的核心差异化设计

Codex 的沙盒系统是它与其他 AI 编码工具最显著的差异。理解沙盒策略是正确配置 Codex 的前提。

### 三级沙盒

Codex 提供三种预定义沙盒级别：

| 级别 | 文件访问 | 网络访问 | 适用场景 |
|------|----------|----------|----------|
| **read-only** | 只读当前目录 | 完全禁止 | 查看、分析、提问 |
| **workspace-write** | 可写入工作区 | 默认禁止，可配置开启 | 日常开发、代码修改 |
| **danger-full-access** | 无限制 | 无限制 | **仅在隔离环境（如 CI 容器）中使用** |

默认是 `read-only`，这比 Claude Code 的默认模式更严格。Claude Code 默认也有文件写入权限（通过交互式确认控制），而 Codex 默认连写入能力都不给。

**警告**：`danger-full-access` 会关闭 Codex 的所有文件系统和网络访问限制，Agent 可以读写系统中任何文件、访问任意网络端点。这相当于给了 AI 完整的 shell 权限，只在完全隔离的环境中使用。

### 在 config.toml 中配置沙盒

当 `sandbox_mode` 设为 `workspace-write` 时，可以通过同名配置节进一步控制该模式的行为：

```toml
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

`[sandbox_workspace_write]` 是 `workspace-write` 模式的详细配置节，`network_access = true` 只在 `workspace-write` 模式下有意义。即使开启了网络访问，Codex 仍会根据 `approval_policy` 决定是否需要每次确认。

### 命令行覆盖沙盒

```bash
# 默认只读模式
codex

# 允许工作区写入
codex --sandbox workspace-write

# 完全信任（仅在容器中）
codex --sandbox danger-full-access
```

命令行覆盖适合临时场景：比如你只需要 Codex 查看代码而不做任何修改，用默认的 `read-only` 即可；如果需要它修复 Bug，再切换到 `workspace-write`。

## 命令行快捷操作

Codex 的 CLI 设计偏向"一次性任务"，和 Claude Code 的"持续会话"模式形成对比。

### 常用启动模式

```bash
# 交互式 TUI（默认）
codex

# 带初始提示启动
codex "Fix the bug in main.py"

# 非交互模式（exec 子命令）
codex exec "Explain this code"
# 或简写
codex e "Explain this code"

# 非交互 + 管道输入
cat error.log | codex exec "What caused this error?"
```

非交互模式通过 `codex exec`（或 `codex e`）子命令进入，是 Codex 的强项。Claude Code 虽然有 `claude -p`，但 Codex 的管道支持更自然，和 Unix 工具链的集成更紧密。OpenCode 也有 `opencode run`，但需要显式指定 `--command`。

### 运行时配置覆盖

```bash
# 临时切换模型
codex --model gpt-5.4 "Write unit tests"

# 临时调整审批策略
codex --ask-for-approval never "Refactor the database module"
# 或简写
codex -a never "Refactor the database module"

# 快捷参数：低摩擦自动执行（workspace-write + on-request）
codex --full-auto "Fix all lint errors"

# 快捷参数：完全自动（danger-full-access + never）
codex --yolo "Run the full test suite"

# 多配置项覆盖
codex -c model=o4-mini --sandbox read-only "Analyze security"
```

`-c`/`--config` 参数的语法是 `key=value`（值按 TOML 解析），可以多次使用。`--full-auto` 是 `--sandbox workspace-write --ask-for-approval on-request` 的快捷方式，`--yolo`（全称 `--dangerously-bypass-approvals-and-sandbox`）是 `--sandbox danger-full-access --ask-for-approval never` 的快捷方式。这些覆盖只在当前命令生效，不会写入 `config.toml`。

### 程序化访问

Codex 支持以服务器模式运行，供其他程序调用：

```bash
# stdio 模式（默认，适合编辑器插件）
codex app-server

# WebSocket 模式（适合 Web 应用）
codex app-server --listen ws://127.0.0.1:8080
```

`stdio://` 是 `--listen` 的默认值，可以省略。

这个能力目前比 Claude Code 更开放。Claude Code 的 IDE 集成是官方提供的封闭扩展，而 Codex 的 `app-server` 允许第三方工具直接集成。

## 三工具配置体系的对比

| 维度 | OpenCode | Claude Code | Codex |
|------|----------|-------------|-------|
| **配置文件** | `~/.config/opencode/opencode.json` | `CLAUDE.md` + 交互设置 | `~/.codex/config.toml` |
| **项目指令** | `AGENTS.md` | `CLAUDE.md` | `AGENTS.md` |
| **权限控制** | 按工具类型（bash/edit/read） | 按模式（默认/自动/Plan） | 按策略（untrusted/on-request/never） |
| **沙盒** | 无内置沙盒 | 无内置沙盒 | 三级沙盒（read-only/workspace-write/full-access） |
| **非交互模式** | `opencode run` | `claude -p` | `codex -n` + 管道 |
| **MCP 配置** | JSON 文件 | 交互式 `/mcp` | TOML 文件 |
| **模型选择** | 多厂商切换 | Anthropic 内部切换 | OpenAI 模型 + reasoning effort |

这个对比揭示了一个有趣的取向分化：

OpenCode 最灵活——支持多厂商模型、细粒度权限、自定义命令，但配置分散在多个文件中。Claude Code 最集成——配置通过交互式命令完成，学习曲线平缓，但定制化空间受限。Codex 最简洁——单文件 TOML 管全局，沙盒策略覆盖安全，但功能范围最窄（只支持 OpenAI 模型）。

## 我的配置建议

基于一周的三工具并行使用经验，以下是我为不同场景推荐的 Codex 配置：

### 场景一：探索陌生代码库

```toml
model = "gpt-5.4"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
approval_policy = "untrusted"
```

只读模式确保安全，你可以放心让 Codex 分析任何仓库而不担心意外修改。

### 场景二：日常功能开发

```toml
model = "gpt-5.4"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[sandbox_workspace_write]
network_access = true
```

写入和网络都开启，但保留审批确认。这是日常开发最平衡的配置。

### 场景三：CI/CD 自动化

```bash
codex --model gpt-5.1 \
      --sandbox danger-full-access \
      --ask-for-approval never \
      --non-interactive \
      "Run lint and fix auto-fixable issues"
```

在已隔离的 CI 容器中，关闭所有交互和安全限制，让 Codex 全自动执行。

### 场景四：复杂架构设计

```toml
model = "o4"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
approval_policy = "untrusted"
```

用最高推理强度做深度分析，保持只读避免任何副作用。设计完成后再切换到 workspace-write 执行实现。

## 从 OpenCode/Claude Code 迁移的注意事项

如果你已经在用 OpenCode 或 Claude Code，切换到 Codex 时需要注意三个差异：

**AGENTS.md 可以直接复用**，但检查是否有 OpenCode 特有的语法（如 `{{variable}}` 插值），Codex 不支持这些扩展。

**权限模型不同**。OpenCode 用户习惯按工具配置权限（`edit: allow`, `bash: ask`），Codex 的策略是全局的。即使选择 `granular` 策略，也无法做到像 OpenCode 那样按工具类型分别控制（比如自动改代码但确认每条 shell 命令）——这是 Codex 相比 OpenCode 的一个功能缺口。

**没有内置的记忆系统**。Claude Code 的 Auto Memory 和 `.claude/rules/` 在 Codex 中没有对应物。你需要通过完善的 `AGENTS.md` 和更具体的提示来补偿。

## 写在最后

Codex 的配置体系用一句话概括：**一个文件管全局，一个文件管项目，命令行管临时**。

这种简洁是有代价的——它牺牲了一些细粒度控制能力（如按工具类型配置权限），换取了更低的心智负担。对于刚从 OpenCode 或 Claude Code 迁移过来的用户，这种"少即是多"的设计可能需要适应，但一旦理解了沙盒哲学的底层逻辑，配置 Codex 反而比其他工具更快。

如果你同时维护多个项目、使用多种 AI 编码工具，我的建议是：**用 AGENTS.md 作为跨工具的通用项目指令，用各自的配置文件处理工具特有的行为偏好**。这样，工具切换时项目上下文不丢失，每个工具又能按自己的方式工作。

Codex 不是 OpenCode 或 Claude Code 的替代品，而是特定场景下的更优选择——当你需要严格的沙盒控制、紧密的 Unix 管道集成、或纯 OpenAI 模型生态时，它的简洁就是优势。
