---
title: "Claude Code 第二篇：快速上手——安装、登录、选入口、跑通第一个真实任务"
date: '2026-09-19'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: >-
  从安装、登录到完成一次真实修改，Claude Code 的上手重点不是记住命令，而是建立“目标—上下文—权限—验证”的工作习惯。本文覆盖本地安装、常用入口、首次任务和最容易踩坑的配置边界。
---

> 先在真实项目里完成一个小而完整的任务，比在空目录里试一堆命令更容易理解 Claude Code。

## 安装方式按更新习惯来选

官方推荐 Native Install。macOS、Linux 和 WSL 可以直接运行：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Windows 可以在 PowerShell 中运行：

```powershell
irm https://claude.ai/install.ps1 | iex
```

也可以使用 CMD 安装脚本：

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

Native Install 会在后台更新。macOS 用户如果希望由 Homebrew 管理，可以选择稳定频道或最新频道：

```bash
brew install --cask claude-code
# 最新频道：brew install --cask claude-code@latest
```

Homebrew 不会自动更新，升级命令要和安装的 cask 对应。Windows 也可以使用 WinGet：

```powershell
winget install Anthropic.ClaudeCode
```

Windows 原生运行不强制要求 Git for Windows。安装 Git 后，Claude Code 可以使用 Git Bash；没有 Git 时则使用 PowerShell 工具。需要 Linux 工具链或沙箱时，再考虑 WSL 2。

安装完成后先确认命令可用：

```bash
claude --version
claude doctor
```

`claude doctor` 只做安装和配置诊断，不会开启一轮编码会话。遇到 `command not found` 时，先重新打开终端并检查 PATH，不要急着用 `sudo` 覆盖安装目录。

## 登录方式决定可用能力

在项目目录运行 `claude`，按提示完成登录：

```bash
cd /path/to/your-project
claude
```

也可以直接调用认证命令：

```bash
claude auth login
```

Claude Code 支持几类常见身份：

| 身份 | 适合场景 | 说明 |
|------|----------|------|
| Claude Pro / Max | 个人开发 | 通过 Claude 账户登录，适合本地日常使用 |
| Team / Enterprise | 团队和企业 | 支持组织策略、权限管理和托管设置 |
| Anthropic Console | API 用量计费 | 可用 API Key，也可用 `claude auth login --console` 登录 |
| Amazon Bedrock / Google Cloud / Microsoft Foundry | 企业云部署 | 模型、凭证和可用功能由云平台配置 |

如果环境里已经设置 `ANTHROPIC_API_KEY`，首次启动时 Claude Code 会询问是否使用它。API Key、第三方云凭证和 Claude 账户登录不是同一套计费与功能边界；Chrome、Channels 等能力还会受身份类型限制，遇到功能不可用时先查看对应官方文档。

切换账户可以重新运行：

```text
/login
```

退出当前身份则使用：

```bash
claude auth logout
```

## 入口选择比命令数量更重要

| 入口 | 适合谁 | 主要价值 |
|------|--------|----------|
| CLI | 终端开发者、远程服务器和脚本使用者 | 功能完整，能接管道、`claude -p` 和 Agent SDK |
| VS Code | 希望在编辑器里看 diff 的开发者 | 内联 diff、文件上下文和计划审查 |
| JetBrains | IntelliJ、PyCharm、WebStorm 用户 | 选中代码、diff 和终端会话结合 |
| Desktop | 需要并行会话、预览和可视化审查 | 管理本地或云端任务，也支持 Dispatch |
| Web / Mobile | 不在电脑前、需要云端继续任务 | 云端运行，移动端负责启动和监控 |

首次使用建议从 CLI 开始，因为它最容易看清权限、工具调用和文件 diff。熟悉后再按工作场景增加 IDE 或 Desktop，不需要把所有入口都装一遍。

## 用一个小任务跑通完整闭环

在真实项目里启动 Claude Code，先让它说明计划，不要一上来就授权大范围修改：

```text
请先了解这个项目的技术栈、入口文件和测试命令。
只阅读必要的文件，先不要修改任何内容。
```

Claude Code 不会因为你启动了会话就自动读完整个仓库。它会根据问题调用搜索和读取工具，因此问题越具体，初始上下文越干净。已知文件时，可以用 `@` 直接引用：

```text
解释 @src/auth/session.ts 如何从登录请求走到会话校验。
```

确认项目结构后，给一个范围清楚的小任务：

```text
在 README.md 增加本地开发说明，沿用 package.json 里的命令。
只修改 README.md，完成后运行 Markdown 校验或项目已有的文档检查。
```

在默认权限模式下，Claude Code 会在需要执行命令或修改文件时请求批准。批准前检查路径、命令和变更范围；看见不符合要求的动作，直接拒绝并说明原因。

修改完成后，把验收标准说清楚：

```text
查看当前 diff，确认没有修改 README.md 之外的文件。
运行项目已有的检查命令，并把失败原因和未运行的检查分别列出。
```

确认 diff 和检查结果后，再由你决定是否提交。Claude Code 可以帮忙生成 commit message，但不应该把“看过 diff”和“提交代码”混成一个不可逆动作。

## 六个概念足够支撑第一次使用

### 会话

每次 `claude` 都会创建或恢复一个会话。常用入口如下：

```bash
claude --continue       # 继续当前目录最近的会话
claude --resume         # 打开会话选择器
claude --resume name    # 恢复命名会话
claude --from-pr 123    # 按 Pull Request 筛选相关会话
```

会话会持续写入本地 transcript。`/clear` 会开始一段干净对话，但之前的会话仍可通过 `/resume` 找回。

### 代理循环

Claude Code 的一次回答可能包含多次读取、搜索、编辑和命令执行。它会根据每一步结果决定下一步，不是只生成一段代码就结束。因此提示词里最好同时写清楚目标、范围和验证方式。

### 内置工具

常见工具包括文件读取与编辑、Glob / Grep 搜索、Bash 或 PowerShell、WebFetch、MCP、代码智能和浏览器工具。工具能否调用由权限模式和规则决定，不由 `CLAUDE.md` 里的文字决定。

### 权限模式

当前常用模式可以这样理解：

| 模式 | 无需逐次确认的范围 | 适合场景 |
|------|--------------------|----------|
| Manual（配置值 `default`） | 读取通常直接执行，编辑、命令和网络操作会询问 | 初次使用、敏感仓库 |
| `acceptEdits` | 自动接受文件编辑和常见文件操作，命令仍需关注 | 反复改代码、由人审查命令 |
| `plan` | 读取和计划阶段的探索动作 | 复杂改动先研究再执行 |
| `auto` | 由安全分类器代替人工逐项判断 | 长任务、减少提示疲劳 |
| `dontAsk` | 只运行预先允许的工具，其余直接拒绝 | CI 和严格自动化 |
| `bypassPermissions` | 跳过大多数检查 | 只在隔离容器或虚拟机中使用 |

交互会话中可用 `Shift+Tab` 切换可用模式。`dontAsk` 和 Bypass 通常应在启动参数或受控配置中明确设置。

### 上下文窗口

对话历史、工具输出、项目指令和当前问题都会占用上下文。`/context` 可以查看装载情况，`/compact` 会把旧历史压缩成摘要，`/clear` 则从新会话开始。不要把“上下文更大”理解成“所有文件都应该一次读进来”。

### 检查点

Claude Code 会保存文件修改的历史检查点。需要回退时可以运行 `/rewind`，或连续按两次 `Esc` 打开回退入口。检查点只覆盖 Claude Code 能记录的本地文件和对话状态，远程 API、数据库或部署动作不能靠它撤销。

## 高频命令

### 启动与脚本

```bash
claude
claude "检查登录流程的错误处理"
claude -p "解释这个函数"                       # 非交互运行
cat build.log | claude -p "找出构建失败的根因"
claude --model sonnet
claude --permission-mode plan
```

脚本或 CI 使用 `-p` 时，通常还要配合 `--bare`、`--allowedTools` 和 `--output-format json`，避免把个人机器上的 Hooks、Skills 或 MCP 意外带进自动化环境。

### 会话内命令

```text
/help          查看帮助
/config        设置界面
/permissions   查看 allow / ask / deny 规则
/model         切换模型
/effort        调整推理深度
/context       查看上下文
/compact       压缩历史
/clear         开始新对话
/resume        切换会话
/rewind        回退检查点
/mcp           查看 MCP 状态
/plugin        管理插件
/hooks         查看 Hooks
/agents        查看 Subagent 配置
/tasks         查看后台任务
/doctor        诊断设置
```

浏览器自动化使用 `/chrome`，沙箱使用 `/sandbox`，需要把本地会话交给手机或浏览器时使用 Remote Control 相关命令。命令列表会随入口和组织策略变化，以 `/help` 为准。

## 把项目约定放到正确的位置

运行 `/init` 可以让 Claude Code 根据项目生成一份起点 `CLAUDE.md`。生成后仍要人工删掉它能从代码推断出的冗余内容，只留下构建、测试、架构约束和安全边界。

如果项目已经有 `AGENTS.md`，可以直接保留，并在 `CLAUDE.md` 中导入：

```markdown
@AGENTS.md

## Claude Code 专用约定
- 修改后运行 `just check`
- 未经确认不要提交或推送
```

项目共享权限和 Hooks 放入 `.claude/settings.json`；个人例外放入 `.claude/settings.local.json`，不要把个人 Token 写进仓库。项目级 MCP 使用 `.mcp.json`，个人 MCP 使用 `~/.claude.json`。

## 上手时最容易误判的几件事

| 现象 | 更准确的判断 |
|------|--------------|
| Claude 没有主动读完整个仓库 | 这是正常的按需读取；用具体问题或 `@` 指定范围 |
| 每一步都在问权限 | 先理解模式和规则，再为安全的重复命令增加 `allow` |
| Windows 安装提示缺少 Git | Git 是 Bash 工具的选项，不是原生安装的硬性前提 |
| API Key 能登录但某功能不可用 | 账户登录、Console 和第三方云的功能范围不同 |
| 上下文很快变大 | 检查大段日志、无关 MCP、过长 `CLAUDE.md` 和没有隔离的探索任务 |

第一次使用不需要记住全部命令。能在真实项目中完成一次“理解范围—修改—验证—审查 diff”的闭环，之后再按遇到的问题补充权限、记忆和扩展配置。

安装、认证和 CLI 参数的当前写法，见[安装与更新](https://code.claude.com/docs/en/setup)、[快速开始](https://code.claude.com/docs/en/quickstart)和[CLI 参考](https://code.claude.com/docs/en/cli-reference)。
