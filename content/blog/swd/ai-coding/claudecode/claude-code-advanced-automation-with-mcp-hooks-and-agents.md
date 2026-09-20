---
title: "Claude Code 第八篇：高阶自动化实战——Chrome、Channels、CI/CD 与跨端协作"
date: '2026-09-19'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: "把 Claude Code 接到浏览器、CI 和消息频道时，重点不是堆叠扩展，而是划清运行位置、凭证、权限和人工确认边界。本文用三个可落地的场景说明原生 Chrome、GitHub Actions 与 Channels 应该怎样组合。"
---

> 自动化真正难的部分不是让 Claude 运行命令，而是让它在正确的环境里、以正确的身份、只做被授权的事。

## 浏览器调试不必再自建 Chrome MCP

Claude Code 有原生 Chrome 集成。它通过 Claude in Chrome 扩展连接可见的 Chrome、Edge 或其他 Chromium 浏览器，让 Claude 在同一轮任务里编译代码、打开页面、读取控制台和验证交互。

使用前准备：

- 安装 Chrome、Edge 或兼容的 Chromium 浏览器；
- 安装 Claude in Chrome 扩展；
- 使用 Claude 账户登录 Claude Code；
- 在需要浏览器的本地会话中运行 `claude --chrome`。

```bash
claude --chrome
```

进入会话后，直接描述用户行为：

```text
打开 http://localhost:3000/login，输入错误密码，确认页面显示正确的错误提示。
如果控制台有异常，记录错误位置，再检查对应源码。
```

首次连接时，浏览器动作可能需要批准。`/chrome` 可以查看连接状态、重新连接扩展、管理站点权限和选择浏览器。浏览器动作在可见窗口中执行，遇到登录页或 CAPTCHA 时会暂停并把操作交回用户。

### 一个安全的前端验证 Skill

浏览器连接本身由 Claude Code 管理，不需要在项目里写一个猜测包名的 MCP 服务器。可以把稳定的验收标准封装成 Skill：

```markdown
---
name: verify-login
description: Verify the local login flow in Chrome after frontend changes.
user-invocable: true
---

# Verify login

1. Check whether the local server is running.
2. Open the requested login page in Chrome.
3. Test invalid and valid inputs described by the user.
4. Check visible feedback and relevant console errors.
5. Report what was observed. Do not publish or send data outside the named site.
```

Hook 可以负责确定性的格式化或测试，Chrome 则负责观察真实浏览器行为。不要把登录 Cookie、验证码或浏览器配置文件复制给另一个 MCP 服务器；浏览器集成能使用现有登录状态，正因为它接触的是高价值会话。

## GitHub Actions 适合把 Claude 放进已有审查链

官方 GitHub Action 支持两种用法：在 issue 或 Pull Request 评论中响应 `@claude`，以及由 workflow 的 `prompt` 触发自动任务。快速安装可以在 Claude Code 中运行：

```text
/install-github-app
```

它会安装 Claude GitHub App、准备认证 Secret 并创建 workflow Pull Request。手工配置时，Action 常见的最小形态是：

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

订阅用户也可以使用 `claude setup-token` 生成的 `CLAUDE_CODE_OAUTH_TOKEN`，再把 workflow 输入改成 `claude_code_oauth_token`。组织场景还可以使用 OIDC workload identity federation，避免在仓库里保存长期 API Key。

### CI 中的权限要显式写

自动化运行用 `claude -p`，并把工具、会话上下文和输出格式固定下来：

```bash
claude --bare -p "审查当前 Pull Request 的变更，只报告可复现的问题" \
  --output-format json \
  --permission-mode dontAsk \
  --allowedTools "Read,Grep,Glob,Bash(git diff *)"
```

`--bare` 不会加载运行机器上的个人 Hooks、Plugins、MCP、Auto Memory 和 `CLAUDE.md`。如果审查依赖项目 Skill，应在 checkout 后显式加载项目内容，并在 workflow 中固定插件和 `--allowedTools`。

自动修复可以使用 `Write` 和针对性的测试命令，但最好只推送到任务分支，由 Pull Request 触发人工审查。不要在一个无人值守 job 里同时授予任意 Bash、生产凭证和默认分支推送权限。

### 自动审查和自定义工作流有区别

如果团队只需要每个 Pull Request 自动审查，Code Review 功能比自己维护一套 workflow 更合适。需要把 issue 转成代码、响应评论或运行团队 Skill 时，GitHub Action 才有更大的自由度。两者都共享 GitHub App 的权限边界，安装时应审查完整权限集。

## Channels 适合把事件推入本地会话

Channels 是研究预览能力。它不是一个会在云端凭空运行的机器人，而是让一个 MCP 服务器把消息、告警或 Webhook 事件推入正在运行的 CLI 会话。会话关闭后，事件不会继续排队替你完成工作。

Channels 需要 Claude 账户或 Console API Key 认证，不适用于 Bedrock、Google Cloud 的 Agent Platform 和 Microsoft Foundry。Team、Enterprise 或托管 Console 组织还需要管理员开启 Channels。

以 Telegram 为例，使用官方插件：

```text
/plugin install telegram@claude-plugins-official
/telegram:configure <BOT_TOKEN>
```

退出当前会话，再显式启用频道：

```bash
claude --channels plugin:telegram@claude-plugins-official
```

第一次收到消息后，用配对码建立发送者 allowlist：

```text
/telegram:access pair <CODE>
/telegram:access policy allowlist
```

Discord 使用对应的官方插件；iMessage 需要 macOS 和 Messages 数据库权限。三者的凭证和平台权限不同，不能把 Telegram 的配置命令套到 Discord 上。

### 远程消息不是自动授权

Channel 的安全边界有三层：

1. `--channels` 决定本次会话启用哪些插件；
2. 插件的配对和 allowlist 决定哪些发送者能推送消息；
3. Claude Code 的权限模式、规则和沙箱决定收到消息后能执行什么。

如果开启了 permission relay，频道里的 allowlist 发送者还可能批准工具权限，因此只能加入你信任的人。涉及付款、生产部署、外发消息和删除数据的任务，仍应在对话里留下明确的人工确认点。

## Agent Teams 不等于远程机器人集群

Agent Teams 是本地或 Desktop 工作环境中的多会话协作能力。它需要显式启用：

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

Team Lead 会创建任务并分配 Teammate；队友有各自上下文，可以通过消息互相传递发现，也可以共享任务列表。它适合把前端、后端和测试等相对独立的工作并行推进。

Channels 可以作为入口把一个任务消息推入 Lead 会话，但不应在提示词里承诺“手机上会实时显示所有队友进度”。实际可见内容受频道插件、会话终端和消息权限影响；需要更完整的后台会话面板，应使用 Desktop 的 Agent View 或 Web / Mobile 云会话。

如果只是让一个主会话把搜索结果隔离出去，Subagent 更省 Token；如果需要多角色讨论和共享任务，才使用 Agent Teams。对顺序依赖很强、需要修改同一文件的任务，单会话通常更容易审查。

## 三个场景的选择

| 需求 | 首选能力 | 关键边界 |
|------|----------|----------|
| 验证 Web 页面真实行为 | `--chrome` + `/chrome` | 浏览器登录态、站点权限和可见操作 |
| PR 评论、Issue 自动处理 | GitHub Action | Secret、GitHub App 权限、分支保护 |
| 手机或聊天工具推送事件 | Channels | 会话必须运行、发送者 allowlist、权限 relay |
| 大范围交叉研究 | Dynamic workflow | 代理数量、总成本和结果核验 |
| 多模块并行开发 | Agent Teams | 独立文件边界、共享任务和整合成本 |

## 生产使用的检查清单

- 运行位置写进流程：本地、云端、CI、容器还是 Desktop；
- 每个入口使用单独的凭证，避免把个人登录态放进 CI；
- `--bare`、`--allowedTools`、`dontAsk` 和容器隔离一起审查；
- 对外发消息、推送代码、部署和审批保留人工确认；
- 给 MCP、Plugin 和 Channel 做来源审查与最小权限配置；
- 为长任务设置最大轮数、CI 超时和失败后的人工接管路径；
- 让测试和 Pull Request 成为自动修复的最终质量门，而不是相信模型的口头总结。

自动化的成熟标志不是“Claude 一直在跑”，而是它在边界处会停下来，并且任何人都能从日志、diff、测试和权限配置中还原它做了什么。

官方参考：[Chrome](https://code.claude.com/docs/en/chrome)、[GitHub Actions](https://code.claude.com/docs/en/github-actions)、[Channels](https://code.claude.com/docs/en/channels)、[Agent Teams](https://code.claude.com/docs/en/agent-teams)、[非交互运行](https://code.claude.com/docs/en/headless)。
