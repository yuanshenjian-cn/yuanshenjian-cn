---
title: OpenCode 进阶：TUI 隐藏技巧与 Agent 配置体系深度实践
date: '2026-04-16'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: true
brief: >-
  用了 OpenCode 一段时间后，大多数人还停在"建个对话发需求"的层面。这篇文章分享一些 TUI 界面里不太常见的操作方式，以及 Agent 配置体系的完整玩法——包括我自己的多模型 Agent 矩阵实践。
---

## 前言

OpenCode 的文档写得很全，但很多功能需要你主动去翻才能发现。我用下来感受最深的有两块：一是 TUI 里有不少快捷键和命令，知道了就能省很多重复操作；二是 Agent 配置体系比表面看起来灵活得多，可以基于它构建一套相当完整的多模型协作工作流。

这篇文章就按这两个方向写，尽量结合实际用法说，不只是罗列配置项。

---

## TUI 隐藏技巧

### 思考块显示控制

用带推理能力的模型（Claude Sonnet、GPT-5 等）时，OpenCode 会显示模型的"思考过程"。这些思考块在调试复杂问题时很有用，但平时全程显示会占很大屏幕空间。

```
/thinking
```

这个命令只切换**显示**，不影响模型是否实际使用推理。换句话说，你可以让模型该思考还是思考，只是 TUI 里折叠起来不显示。调试的时候再 `/thinking` 展开看。

### 模型 Variant 切换

```
Ctrl + T    # variant_cycle：循环切换模型 variant
```

这个快捷键会在当前模型支持的 variant 之间循环。各 provider 的 variant 取值不同：

- **Anthropic**（Claude）：`high` / `max` / `xhigh`（Opus 4.7 支持，v1.4.7 新增）
- **OpenAI**：`none` / `minimal` / `low` / `medium` / `high` / `xhigh`
- **Google**（Gemini）：`low` / `high`
- **自定义**：也支持在配置里手动定义 variant

TUI 状态栏会显示当前 variant。切换前先确认当前模型支持哪些 variant，循环到不支持的值会 fallback。

值得注意的是，**每个模型的 variant 设置是持久化的**（实测行为），存在 `~/.local/state/opencode/model.json` 的 `variant` 字段里。换句话说，你给某个模型切到 `high` 之后，下次打开还是 `high`，不用每次重设。

不需要每次去 `/models` 里找，`Ctrl+T` 两三下搞定。

### 收藏模型 & 快速切换

OpenCode 维护两个模型列表（实测行为，官方文档未详细说明），都存在 `~/.local/state/opencode/model.json`：

- `recent`：最近使用过的模型，按时间排序
- `favorite`：你在模型列表里手动收藏（标星）的模型

对应的快捷键：

| 快捷键 | 操作 | 说明 |
|--------|------|------|
| `F2` | `model_cycle_recent` | 按最近使用顺序循环切换 |
| `Shift+F2` | 反向切换 recent | 反向切换 |
| `model_cycle_favorite` | 只在收藏列表里循环 | 需自定义快捷键绑定 |

收藏模型不需要改配置文件，直接在 `<Leader>+M` 打开的模型列表里标星即可，OpenCode 自动写入 state 文件。`F2` 切最近用过的模型特别顺手，常用的几个来回两三下就够。

### 模型列表 & 命令面板

> **关于 `<Leader>` 键**：OpenCode 默认以 `Ctrl+X` 作为 Leader 键。下文所有 `<Leader>+X` 快捷键都是"先按 `Ctrl+X`，再按 X"。可以在 `tui.json` 的 `keybinds.leader` 里自定义。

```
<Leader>+M    # 打开模型列表（model_list）
Ctrl+P        # 打开命令面板（command_list）
```

命令面板里能找到所有可用命令，等同于一个"功能搜索"入口。不记得某个命令叫什么时，`Ctrl+P` 搜一下。

### 侧边栏控制

```
<Leader>+B    # sidebar_toggle：切换侧边栏显示
```

侧边栏提供附加信息面板。屏幕空间紧张时隐藏，需要查看时展开。

### 子 Agent 会话导航

Task tool 运行时，primary agent 会创建子 agent 会话。子会话默认在后台跑，但你可以主动进去看。

| 快捷键 | 说明 |
|--------|------|
| `<Leader>+Down` | 进入第一个子 agent 会话 |
| `→` | 切换到下一个子会话 |
| `←` | 切换到上一个子会话 |
| `↑` | 返回父会话 |

这个导航体系在 Agent 并行运行多个子任务时很有用，可以实时看到各个子任务的进展。

### 工具执行详情

`tool_details` 默认没有绑定快捷键。如果你想在 TUI 里随时切换工具执行详情，需要先在 `tui.json` 里手动加一个绑定：

```json
// ~/.config/opencode/tui.json
{
  "keybinds": {
    "tool_details": "<leader>d"
  }
}
```

这样我就可以在"只看工具摘要"和"展开完整参数与输出"之间切换。排查复杂调用、看请求参数或者调试 MCP 工具时，会顺手很多。

### TUI 鼠标行为

默认情况下，OpenCode TUI 会捕获鼠标事件。这意味着你在终端里无法用鼠标拖拽选中文本（因为被 TUI 拦截了）。

如果你需要用鼠标复制 TUI 里的内容，可以在 `tui.json` 里禁用：

```json
// ~/.config/opencode/tui.json
{
  "mouse": false
}
```

关掉后，鼠标的文本选择和滚动操作都回归终端原生行为。

### 滚动加速

macOS 上的惯性滚动在 TUI 里默认不生效。如果想要更顺滑的滚动体验：

```json
// ~/.config/opencode/tui.json
{
  "scroll_acceleration": {
    "enabled": true
  }
}
```

注意：开启加速后 `scroll_speed` 配置会失效，加速由系统惯性控制。

---

## Agent 配置体系

### Primary vs Subagent

OpenCode 里 Agent 分两种角色：

- **Primary Agent**：和你直接对话的那个，TUI 里 `Tab` 键循环切换
- **Subagent**：在子会话里运行，有两种调用方式：一是由 primary agent 通过 Task tool 自动调用；二是用户在对话框里直接输入 `@subagent-name` 手动指定

Built-in 的 `build` 和 `plan` 都是 primary，`general` 和 `explore` 都是 subagent。

这个区分很重要，因为几个配置项只对特定角色生效：
- `hidden: true` 只对 subagent 有效，primary agent 设了也不会从 Tab 循环里消失
- `description` 是 agent 配置的正式必填项，subagent 的自动委派尤其依赖它——primary agent 根据 description 决定把任务交给哪个 subagent
- `default_agent` 只能设置 primary agent（非 primary 会 fallback 到 `build`）

### 完整配置项一览

Agent 配置支持 JSON（`opencode.jsonc` 的 `agent` 字段）和 Markdown 两种格式，选项是一样的。Markdown 文件的放置路径有两个层级：

- **全局**：`~/.config/opencode/agents/name.md`（对所有项目生效）
- **项目级**：`.opencode/agents/name.md`（仅对当前项目生效，优先级更高）

```markdown
---
description: subagent 描述（被 primary 自动选择时的触发依据）
mode: primary | subagent | all    # 默认 all
model: provider/model-id          # 如 github-copilot/claude-sonnet-4.6
color: primary | secondary | accent | success | warning | error | info | #hex
hidden: true | false              # 仅对 subagent 有效
temperature: 0.0-1.0
top_p: 0.0-1.0
steps: 20                         # max steps
reasoningEffort: high                             # 透传给 provider，取值依 provider 而定
prompt: "{file:./system-prompt.txt}"           # 外部文件引用

permission:
  bash:
    "*": ask
    "git status*": allow
    "rm -rf *": deny
  edit: deny
  task:
    "*": deny
    "safe-agent-*": allow
---

系统 prompt 正文写在这里...
```

几个容易踩坑的地方：

1. **`reasoningEffort` 是透传参数**，不是 OpenCode 内置的，值直接传给 provider API，具体支持哪些取值要看各 provider 的文档
2. **`tools` 字段已废弃**，现在用 `permission` 来控制工具权限
3. **`permission.task`** 控制该 agent 可以调用哪些 subagent，最后匹配的规则生效（glob 语法）
4. **`prompt` 里可以用 `{file:./path}`** 引用外部文件，路径相对于配置文件所在目录

### 实践案例：多模型 Agent 矩阵

我自己用了一套比较系统化的 Agent 配置，核心思路是：**每个 primary agent 绑定一组对应的 subagent，保证整个对话链路用的是同一个模型系列**。

为什么要这样？因为不同提供商的模型特性差异挺大：Claude 更擅长遵循指令和代码修改，GPT-5 推理链路更完整，Kimi 对中文和长上下文处理得好。如果 primary 用 Claude 但 subagent 用 GPT，有时候上下文传递和风格会有割裂感。

#### Primary Agent 矩阵

我配置了几个 primary agent，每个对应一个模型，用于不同场景：

| Agent | 模型 | 适用场景 |
|-------|------|----------|
| 赤兔 | Claude Opus（via GitHub Copilot）| 复杂重构、需要深度思考的任务 |
| 赵云 | Claude Sonnet（via GitHub Copilot）| 日常开发，速度和质量平衡 |
| 诸葛亮 | GPT-5.4（via GitHub Copilot）| 架构设计、多步骤推理 |
| 趣申请 | GPT-5.4（直连 OpenAI）| 需要直连 API 的场景 |
| 国模 | Kimi（k2p5）| 中文任务、长文档处理 |

每个 primary agent 的 system prompt 里都会指定"使用哪个 subagent 代替默认的 explore/general"：

```markdown
---
# 赵云.md
description: 日常开发 primary agent，速度和质量平衡，适合大多数编码任务
model: github-copilot/claude-sonnet-4.6
color: success
mode: primary
---

## Sub-Agent 使用规则

- 使用 explore-sonnet 代替 explore
- 使用 general-sonnet 代替 general
```

这样当赵云（Sonnet）运行时，它启动的子任务也走 Sonnet，整条链路模型一致。

#### Subagent 矩阵

基于上面的设计，我给每个主要模型都建了 explore 和 general 两个版本的 subagent：

**Explore 系列（只读，快速搜索代码库）**

```markdown
---
# explore-sonnet.md
description: Fast agent specialized for exploring codebases...
mode: subagent
model: github-copilot/claude-sonnet-4.6
reasoningEffort: high
permission:
  write: deny
  edit: deny
---
```

`explore-sonnet`、`explore-opus`、`explore-high`（GPT-5.4 high）、`explore-xhigh`、`explore-china`（Kimi）……

**General 系列（全权限，执行任务）**

```markdown
---
# general-sonnet.md
description: General-purpose agent for researching complex questions...
mode: subagent
model: github-copilot/claude-sonnet-4.6
reasoningEffort: high
---
```

同样有 `general-sonnet`、`general-opus`、`general-high`、`general-xhigh`、`general-china` 等版本。

#### 代码审查 Agent

另外还有两个 review agent，专门做代码审查：

```markdown
---
# review-high.md
description: 代码审查专家
mode: subagent
model: openai/gpt-5.4
reasoningEffort: high
permission:
  write: deny
  edit: deny
---

从业界最佳实践、项目规范、代码质量（重复代码、命名表意、代码冗余等）、
并发安全、测试有效性、是否修复 bug 等方面，对当前的代码实现进行详细审查，
提出评价和改进建议。
```

`review-high` 和 `review-xhigh` 的区别只是 `reasoningEffort` 不同，复杂改动用 xhigh 推理更彻底。

#### 全局权限配置

主配置文件里设了一些全局安全规则：

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "default_agent": "赤兔",
  "permission": {
    "bash": {
      "rm *": "deny",
      "rm -rf *": "deny"
    }
  },
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  }
}
```

`rm` 系列命令全局禁止。`compaction.auto` 开启后上下文超长时自动压缩，`prune: true` 会在压缩时移除旧的工具调用输出，节省 token 用量；`reserved: 10000` 则是预留一段 token 缓冲，让压缩过程本身更从容，不容易在临界点顶满上下文。

### Hidden 配置的实际行为

说一下 `hidden` 这个配置项，文档里写得不够清楚，实际行为容易搞混：

- **对 subagent**：`hidden: true` 让它不出现在 `@` 补全菜单，但 primary agent 仍可以通过 Task tool 调用它（用 agent 名字）
- **对 primary agent**：用户设置的 primary agent 无法通过 `hidden: true` 从 Tab 循环里隐藏。注意这和系统行为不同——OpenCode 内置了一些 hidden primary agent（如 `compaction`、`title`、`summary`），这些是系统层面的隐藏，不是用户 `hidden: true` 能控制的

我把 built-in 的 `build` 和 `plan` 设置了 `hidden: true`，但它们还是会出现在 Tab 切换列表里（实测）。正确的做法是直接用 `disable: true` 禁用，或者干脆不动它们，让自己的 agent 默认就好。

---

## 小结

TUI 方面，我用得最多的几个：

- `Ctrl+T`：切 effort，调任务复杂度时随手按
- `/thinking`：思考块显示开关，重要任务时展开看推理过程
- `<Leader>+Down` / 方向键：子 agent 会话导航，并行任务时跟进进展

Agent 配置方面，核心思路是**模型绑定**：primary agent 指定配套的 subagent，保证整条链路模型一致。这在需要长时间多轮对话、多 agent 协作的任务里效果比较明显。

这套配置搭起来初始有点工作量，但用熟了后基本不需要再调整，直接 `Tab` 切 agent 就行。

---

## 参考

- [OpenCode TUI 文档](https://opencode.ai/docs/tui/)
- [OpenCode Agents 文档](https://opencode.ai/docs/agents/)
- [OpenCode Keybinds 文档](https://opencode.ai/docs/keybinds/)
- [OpenCode Config 文档](https://opencode.ai/docs/config/)
