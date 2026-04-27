---
title: "Claude Code 第四篇：交互模式、内置命令与上下文管理"
date: '2026-04-04'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: >-
  Claude Code 的交互终端远不止"打字→回车"。六种权限模式、60+ 条内置命令、快捷键组合、上下文管理策略——掌握这些，你才算真正"住进"了 Claude Code。本文带你从权限模式、键盘操控、命令体系到上下文管理，逐层拆解 Claude Code 的交互全貌。
---

> **系列导读**：本文是 Claude Code 系列第 4 篇。第 1 篇讲[迁移心智模型](/articles/opencode-to-claude-code-getting-oriented)，第 2 篇讲[安装与上手](/articles/claude-code-getting-started)，第 3 篇讲[日常工作流](/articles/claude-code-common-workflows)。本篇将深入交互层——权限模式、命令体系与上下文管理，让你从"能用"进阶到"用得顺"。

---

## 为什么交互模式值得单独讲

前三篇我们从心智模型到安装，再到六个真实工作场景，已经能用 Claude Code 干活了。但你可能遇到过这些卡点：

- 每次修改文件都要手动确认，连续修 20 个文件时崩溃
- 聊到一半上下文满了，Claude 开始"忘事"
- 想跑个 shell 命令但不知道怎么最快触发
- 不知道哪些命令是内置的，哪些其实是 Skill

这些问题的答案都在**交互模式**里。Claude Code 的终端不是一个简单的聊天框，而是一个精心设计的**开发者控制台**，拥有六种权限模式、60+ 条内置命令、十几个快捷键组合，以及一套完整的上下文管理策略。

---

## 六种权限模式：安全与效率的平衡

权限模式决定了 Claude 在执行操作时**需不需要你点头**。这是 Claude Code 最核心的交互机制之一。

### 模式总览

| 模式 | 启动方式 | 文件读取 | 文件写入 | 命令执行 | 适用场景 |
|------|---------|---------|---------|---------|---------|
| **Default** | 默认 | ✅ 自动 | ⚠️ 需确认 | ⚠️ 需确认 | 日常开发，平衡安全与效率 |
| **Accept Edits** | `Shift+Tab` / `--permission-mode acceptEdits` | ✅ 自动 | ✅ 自动 | ⚠️ 需确认 | 信任 Claude 的代码修改，但命令仍需把关 |
| **Plan** | `Shift+Tab` / `--permission-mode plan` | ✅ 自动 | ❌ 禁止 | ⚠️ 只读探索命令 | 分析和规划，允许读文件和执行探索性 shell 命令（如 `ls`、`cat`）|
| **Auto** | 需额外启用 / `--permission-mode auto` | ✅ 自动 | ✅ 自动 | ⚠️ 分类器判断 | 大批量任务，Auto 分类器自动判断命令安全性 |
| **Don't Ask** | `--permission-mode dontAsk` | ✅ 自动 | ✅ 自动 | ⚠️ 仅预批准 | CI/CD 流水线，自动拒绝未在 allow 列表中预批准的工具 |
| **Bypass Permissions** | `--permission-mode bypassPermissions` | ✅ 自动 | ✅ 自动 | ✅ 自动（含危险操作） | 极端场景，跳过所有安全检查 |

### 用 Shift+Tab 实时切换

在交互模式下，按 `Shift+Tab` 可以在三种模式之间循环切换：

```text
Default → Accept Edits → Plan → Default → ...
```

> **注意**：Auto 模式不在 `Shift+Tab` 循环中，需要通过设置或命令行标志 `--permission-mode auto` 额外启用。

这是 Claude Code 最实用的快捷键之一。典型工作流：

1. 用 **Plan** 模式让 Claude 分析问题、给出方案
2. 确认方案后切到 **Accept Edits**，让它自动改代码
3. 改完切回 **Default**，逐个确认命令执行（跑测试、提交等）

> **提示**：`dontAsk` 和 `bypassPermissions` 只能通过命令行标志启用，不能在交互模式中切换——这是故意的安全设计。

### Auto 模式的分类器机制

Auto 模式不是简单的"全部允许"。它内置了一个**安全分类器**，将操作分为三类：

| 分类 | 示例 | 行为 |
|------|------|------|
| **默认允许** | `ls`、`cat`、`git status`、`npm test` | 自动执行 |
| **默认阻止** | `rm -rf`、`curl \| bash`、修改 `/etc` | 拒绝执行并提示 |
| **灰色地带** | `git push`、`npm install`、`docker run` | 分类器根据上下文判断 |

你可以通过 `/permissions` 命令自定义允许和阻止列表：

```text
/permissions

# 添加到允许列表
Allow: npm run build
Allow: docker compose up

# 添加到阻止列表
Block: rm -rf /
```

### 受保护目录

无论什么权限模式，Claude Code 都**不会**修改以下目录和文件：

- `.git/`（Git 内部数据）
- `.vscode/`、`.idea/`（IDE 配置）
- `.husky/`（Git Hooks）
- `.bashrc`、`.zshrc`、`.profile` 等 Shell 配置文件
- 其他开发环境敏感路径

即使在 `bypassPermissions` 模式下，这些路径也是硬编码保护的。

---

## 快捷键与输入技巧

Claude Code 的终端支持丰富的键盘操控。掌握这些快捷键，手可以不离键盘就完成所有操作。

### 核心快捷键速查

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Enter` | 发送消息 | 单行输入时直接发送 |
| `Shift+Tab` | 切换权限模式 | 循环：Default → Accept Edits → Plan |
| `Esc` `Esc`（连按两次） | 回退到检查点（rewind） | 撤销上一轮 Claude 的修改 |
| `Ctrl+C` | 取消当前操作 | 中断当前正在进行的操作 |
| `Ctrl+D` | 退出 | 等价于输入 `/exit` |
| `Ctrl+L` | 清屏 | 清除终端显示，不清除上下文 |
| `Ctrl+G` | 在编辑器中打开输入 | 用外部编辑器编写长 prompt |
| `Ctrl+R` | 搜索历史 | 搜索之前输入过的提示词 |
| `Ctrl+V` | 粘贴图片 | 从剪贴板粘贴截图到对话 |
| `Ctrl+O` | 切换详细输出 | 展开/折叠工具调用的详细信息 |
| `Ctrl+B` | 后台运行 bash | 在后台启动一个 bash 进程 |
| `Ctrl+T` | 打开任务列表 | 管理多个并行任务（最多 10 个） |
| `Alt+P` | 切换模型 | 在不同模型之间快速切换 |

### 多行输入

Claude Code 支持三种多行输入方式：

**方式一：反斜杠续行**

```text
我需要你做以下修改：\
1. 在 Header 组件中添加搜索框 \
2. 搜索结果用 debounce 处理 \
3. 添加对应的单元测试
```

**方式二：Vim 模式**

如果你习惯 Vim，可以启用 Vim 模式：

```text
/config
# 找到 Vim mode 选项并启用
```

启用后，你在输入框中获得完整的 Vim 按键绑定——`i` 进入插入模式，`Esc` 回到普通模式，`o` 新开一行。对于长 prompt 的编辑体验大幅提升。

**方式三：粘贴多行文本**

直接从编辑器粘贴多行内容，Claude Code 会自动识别为多行输入。

### ! 前缀直接执行 bash

在输入框中以 `!` 开头，可以直接执行 bash 命令而不经过 Claude：

```text
! git status
! npm run test -- --watch
! docker ps
```

这比切出终端窗口再切回来快得多。执行结果会直接显示在对话中，Claude 也能看到输出。

### 后台 bash（Ctrl+B）

`Ctrl+B` 启动一个后台 bash 进程，非常适合需要长时间运行的命令：

```text
# 按 Ctrl+B 后输入
npm run dev

# 后台进程持续运行，你继续和 Claude 对话
# 进程输出最多保留 5GB
```

典型用法：在后台跑 `npm run dev`，前台继续让 Claude 改代码，改完直接在浏览器看效果。

### /btw 侧面提问

`/btw` 是一个特殊命令，用于"顺便问一下"——提出一个与当前任务无关的问题：

```text
/btw TypeScript 5.7 的 using 关键字是怎么用的？
```

`/btw` 的三个特点：

1. **不加入对话历史**——不会干扰当前任务的上下文
2. **不使用工具**——纯知识回答，不读文件、不跑命令
3. **成本更低**——使用更轻量的处理方式

适合在工作中临时查一个语法、确认一个概念，而不想打断正在进行的任务流。

---

## 内置命令全景

Claude Code 拥有 60+ 条内置命令，输入 `/` 即可看到完整列表和搜索。以下按功能分类梳理。

### 会话管理

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/clear` | 清除当前对话历史 | 上下文混乱时重新开始 |
| `/compact` | 压缩对话历史 | 上下文快满时，保留关键信息 |
| `/compact [主题]` | 按主题压缩 | 指定保留哪些方面的信息 |
| `/save` | 保存当前会话 | 离开前保存进度 |
| `/resume` | 恢复之前的会话 | 继续上次的工作 |
| `/exit` | 退出 Claude Code | 等价于 Ctrl+D |

### 上下文操作

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `@文件路径` | 引用文件到上下文 | 精确指定 Claude 要看的文件 |
| `@目录路径` | 引用整个目录 | 批量加载相关文件 |
| `@url` | 引用 URL 内容 | 加载网页、文档链接 |
| `/add-dir` | 添加工作目录 | 将额外目录纳入 Claude 的视野 |
| `/add-tool` | 添加自定义工具 | 扩展 Claude 可用的工具集 |
| `/remove-tool` | 移除工具 | 精简工具列表 |
| `/tools` | 列出可用工具 | 查看当前 Claude 能用什么工具 |

### 配置与设置

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/config` | 打开配置菜单 | 修改主题、Vim 模式等设置 |
| `/model` | 切换模型 | 在 Opus、Sonnet 之间切换 |
| `/permissions` | 管理权限规则 | 添加允许/阻止的命令模式 |
| `/cost` | 查看会话费用 | 监控 token 消耗和成本 |
| `/status` | 查看当前状态 | 确认会话 ID、模式、模型等 |

### 扩展与集成

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/mcp` | 管理 MCP 服务器 | 添加、移除、查看 MCP 连接 |
| `/plugin` | 管理代码智能插件 | 安装语言插件（LSP 能力） |
| `/hooks` | 管理生命周期钩子 | 配置事件触发的自动化动作 |
| `/agents` | 管理 sub-agents | 查看和配置子代理 |
| `/chrome` | 启动 Chrome 浏览器 | 需要浏览器操作时 |

### 工作流命令

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/review` | 代码审查（已弃用） | 审查当前 diff 或指定提交 |
| `/pr-comments` | 查看 PR 评论 | 拉取 GitHub PR 的评论到上下文 |
| `/init` | 初始化 CLAUDE.md | 在项目中创建指令文件 |
| `/tasks` | 管理子任务 | 查看和管理 sub-agent 任务 |
| `/help` | 查看帮助 | 获取命令使用指南 |

### 内置命令 vs Bundled Skills

> **重要区分**：以下命令看起来像内置命令，但其实是 **Bundled Skills**（预装技能）：
>
> | 命令 | 本质 | 说明 |
> |------|------|------|
> | `/batch` | Skill | 批量处理多个文件的相同操作 |
> | `/debug` | Skill | 交互式调试工作流 |
> | `/loop` | Skill | 循环执行直到条件满足 |
> | `/simplify` | Skill | 简化和重构代码 |
>
> Bundled Skills 和内置命令的区别：Skills 可以被覆盖或扩展，它们使用 Claude 的 Agent 能力执行，而内置命令是硬编码的系统功能。了解这个区别在你自定义工作流时很重要——你可以创建同名 Skill 来覆盖 bundled 版本。

---

## 上下文管理：最容易被忽视的关键能力

上下文窗口是 Claude Code 的"工作记忆"。管理好上下文，是高效使用 Claude Code 和"用了就忘"之间的分水岭。

### 上下文窗口模型

Claude Code 的上下文窗口就像一个固定大小的白板：

```text
┌─────────────────────────────────────────────────────────┐
│  系统指令 (CLAUDE.md, Rules 等)                          │
│  ───────────────────────────────                        │
│  对话历史 (你的提问 + Claude 的回答)                      │
│  ───────────────────────────────                        │
│  工具调用结果 (文件内容、命令输出等)                       │
│  ───────────────────────────────                        │
│  当前提问                                                │
│  ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼                               │
│  [窗口上限 ≈ 200K tokens]                                │
└─────────────────────────────────────────────────────────┘
```

当内容接近窗口上限时，Claude Code 会自动提示你需要 compact。

### 什么在消耗你的上下文

| 消耗来源 | 典型大小 | 说明 |
|---------|---------|------|
| 系统指令 | 2K-10K tokens | CLAUDE.md、Rules、项目配置 |
| 每轮对话 | 500-5K tokens | 取决于回答复杂度 |
| 文件读取 | 1K-50K tokens | 大文件是头号杀手 |
| 命令输出 | 500-20K tokens | `git log`、测试输出等 |
| 图片 | 1K-5K tokens | 截图和图表 |

### 三种上下文管理策略

#### 策略一：/compact —— 压缩而不丢弃

```text
/compact
```

Claude 会把当前对话历史压缩成一段摘要，释放上下文空间但保留关键信息。你可以指定压缩主题：

```text
/compact 保留所有关于数据库迁移的决策和代码修改
```

**适用时机**：

- 上下文使用率超过 70%
- Claude 开始"忘记"之前的约定
- 对话中有大量已完成的探索性内容

**注意**：compact 后，Claude 对之前的精确代码细节可能模糊。如果后续需要引用之前改过的文件，最好用 `@` 重新加载。

#### 策略二：/clear + 新开会话 —— 干净重来

```text
/clear
```

完全清空对话历史。适用于：

- 任务已完成，准备开始全新任务
- 上下文被错误信息污染
- 切换到完全不同的代码模块

> **技巧**：在 `/clear` 之前，先用 `/save` 保存当前会话。万一后续需要回来，可以用 `/resume` 恢复。

#### 策略三：/resume —— 接续之前的会话

```text
/resume
```

显示最近的会话列表，选择一个恢复。这在以下场景非常有用：

- 下班前 `/save`，第二天 `/resume` 继续
- 在 CLI 中做了一半，切到 Web 端继续（Web/Desktop/CLI 共享会话）
- 在不同分支间切换任务

你也可以通过 CLI 标志直接恢复：

```bash
# 恢复最近的会话
claude --resume

# 恢复指定会话
claude --resume session-id

# 继续上次的会话（等价于 --resume 最近一个）
claude --continue
```

### @ 引用的最佳实践

`@` 是精确控制上下文的利器：

```text
# 引用单个文件
看一下 @src/components/Header.tsx 的实现

# 引用多个文件
比较 @src/old-api.ts 和 @src/new-api.ts 的差异

# 引用目录
分析 @src/hooks/ 目录下所有自定义 Hook

# 引用 URL
参考 @https://react.dev/reference/react/useEffect 来重构这段代码
```

**@ 引用 vs 让 Claude 自己找**：

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| `@` 精确引用 | 节省 token，精确 | 需要你知道文件路径 | 已知要看哪些文件 |
| 让 Claude 自己搜索 | 能发现你不知道的文件 | 消耗更多上下文 | 探索性任务 |
| 子代理探索 | 不污染主上下文 | 结果需要传回主会话 | 大范围代码搜索 |

### 上下文管理决策流

面对上下文管理，可以按这个决策流来：

```text
上下文快满了？
├── 当前任务还在进行中
│   ├── 需要之前的精确细节 → /compact [保留主题]
│   └── 不需要精确细节 → /compact
├── 当前任务已完成
│   ├── 可能还要回来 → /save → /clear
│   └── 不会回来了 → /clear
└── 上下文被污染了
    └── /clear 重新开始
```

---

## 会话的生命周期：保存、恢复与跨端迁移

### 会话自动保存

Claude Code 会自动保存会话状态。即使你意外关闭终端，下次启动时也可以通过 `/resume` 恢复。

### 跨端共享

Claude Code 的会话可以在不同入口之间无缝切换：

```text
CLI ←→ VS Code 扩展 ←→ JetBrains 插件 ←→ Web 端（claude.ai/code）
```

场景示例：

1. 在 CLI 中开始一个重构任务
2. 需要看 UI 效果，切到 VS Code 扩展继续
3. 回到家在 Web 端 `/resume`，继续收尾

### 从 PR 恢复上下文

一个特别实用的功能——从 Pull Request 恢复上下文：

```bash
claude --from-pr 123
```

Claude 会读取 PR #123 的所有信息（标题、描述、diff、评论），自动构建出一个包含完整上下文的会话。非常适合：

- 接手别人的 PR 做 review
- 继续一个之前搁置的 PR
- 根据 reviewer 评论修改代码

---

## CLI 标志速查：非交互场景必备

当你在脚本、CI/CD 或管道中使用 Claude Code 时，CLI 标志是你的主要交互方式。

### 会话相关

| 标志 | 功能 | 示例 |
|------|------|------|
| `-c, --continue` | 继续最近的会话 | `claude -c` |
| `-r, --resume` | 选择会话恢复 | `claude -r session-id` |
| `-n, --new` | 强制新会话 | `claude -n` |
| `--from-pr` | 从 PR 初始化 | `claude --from-pr 123` |

### 权限与模式

| 标志 | 功能 | 示例 |
|------|------|------|
| `--permission-mode` | 设置权限模式 | `claude --permission-mode auto` |
| `--allowedTools` | 指定允许的工具 | `claude --allowedTools "Bash,Read"` |
| `--disallowedTools` | 指定禁止的工具 | `claude --disallowedTools "WebFetch"` |

### 模型与性能

| 标志 | 功能 | 示例 |
|------|------|------|
| `--model` | 指定模型 | `claude --model sonnet` |
| `--effort` | 推理力度 | `claude --effort high` |

### 输出控制

| 标志 | 功能 | 示例 |
|------|------|------|
| `-p, --print` | 非交互模式 | `echo "分析代码" \| claude -p` |
| `--output-format` | 输出格式 | `claude -p --output-format json` |

### 系统提示

| 标志 | 功能 | 示例 |
|------|------|------|
| `--system-prompt` | 追加系统提示 | `claude --system-prompt "用中文回答"` |
| `--system-prompt-file` | 从文件加载提示 | `claude --system-prompt-file rules.md` |
| `--system-prompt-override` | 覆盖系统提示 | 替代而非追加 |

### MCP 配置

| 标志 | 功能 | 示例 |
|------|------|------|
| `--mcp-config` | 指定 MCP 配置文件 | `claude --mcp-config mcp.json` |

### Worktree

| 标志 | 功能 | 示例 |
|------|------|------|
| `-w, --worktree` | 使用 Git Worktree | `claude -w feature/auth` |

> **管道模式典型用法**：
>
> ```bash
> # 代码审查管道
> git diff main..HEAD | claude -p "审查这个 diff，列出问题和建议"
>
> # 批量文件处理
> find src -name "*.ts" | claude -p "找出所有未处理的 Promise"
>
> # CI 中的自动修复
> claude -p --permission-mode auto "修复所有 lint 错误并提交"
> ```

---

## 实战组合技

掌握了单个命令和快捷键后，真正的效率来自**组合使用**。以下是几个经过实战验证的组合技。

### 组合技一：Plan → Execute → Verify

```text
# 第一步：Plan 模式分析（按 Shift+Tab 切到 Plan）
分析 @src/auth/ 目录的认证逻辑，给出从 JWT 迁移到 Session 的方案

# 第二步：确认方案后切到 Accept Edits（Shift+Tab）
按照刚才的方案执行迁移

# 第三步：切回 Default 模式（Shift+Tab），逐个确认命令
跑一下测试看有没有回归
```

### 组合技二：后台服务 + 前台开发

```text
# Ctrl+B 启动后台进程
npm run dev

# 前台继续工作
修改 @src/pages/Login.tsx，添加"记住我"功能

# 改完后
! curl http://localhost:3000/api/auth/session  # ! 快速验证
```

### 组合技三：子任务并行

```text
# Ctrl+T 打开任务列表
# 创建任务 1：修复认证模块
# 创建任务 2：优化首页性能
# 最多可以并行 10 个任务
```

任务之间的上下文是隔离的——一个任务中的文件修改不会干扰另一个任务的上下文。适合在等待一个耗时操作时开启另一个任务。

### 组合技四：Review + PR Comments 闭环

```text
/review                  # 审查当前 diff
/pr-comments             # 拉取 PR 评论
根据评论修改代码          # Claude 结合评论做针对性修改
/review                  # 再次审查确认修改质量
```

---

## 常见问题速查

| 问题 | 解答 |
|------|------|
| Claude 不停问我要不要执行，太烦了 | 切到 Accept Edits 或 Auto 模式（`Shift+Tab`） |
| 上下文满了怎么办 | `/compact` 压缩，或 `/save` + `/clear` 重来 |
| 怎么看当前用了多少上下文 | `/cost` 查看 token 消耗 |
| Vim 模式怎么开 | `/config` → 找到 Vim Mode → 启用 |
| 怎么在不同设备间继续工作 | `/save` 后在另一个设备 `/resume` |
| `/batch` 和 `/loop` 是内置命令吗 | 不是，它们是 Bundled Skills |
| Auto 模式安全吗 | 相对安全，有分类器保护，但建议在 Git 仓库中使用（可随时回退） |
| 怎么快速执行 shell 命令 | 用 `!` 前缀，如 `! git status` |

---

## 小结

本文覆盖了 Claude Code 交互层的四个维度：

| 维度 | 核心要点 |
|------|---------|
| **权限模式** | 6 种模式从最保守到最激进，`Shift+Tab` 实时切换前 3 种 |
| **快捷键** | `Esc Esc` 中断、`Ctrl+B` 后台 bash、`!` 前缀直接执行、`/btw` 侧面提问 |
| **内置命令** | 60+ 条命令分 5 大类，注意区分内置命令和 Bundled Skills |
| **上下文管理** | `/compact` 压缩、`/clear` 重来、`/resume` 恢复、`@` 精确引用 |

交互模式是你和 Claude Code 之间的**操作系统**。掌握它，你的每个意图都能以最短路径传达给 Claude；忽略它，你就像在用一台没学过快捷键的电脑——能用，但慢。

> **下一篇预告**：第 5 篇将深入 CLAUDE.md、Rules 和 Auto Memory——Claude Code 的"长期记忆"系统。如何让 Claude 记住你的编码偏好、项目规范和团队约定，让每次对话都不从零开始。
