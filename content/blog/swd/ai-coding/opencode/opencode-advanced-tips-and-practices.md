---
title: "OpenCode 进阶使用：把 TUI、工具和工作流用起来"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: true
brief: >-
  OpenCode 的效率来自清楚地组合上下文、工具和验证，而不是记住一串神奇提示。内容覆盖内置工具、TUI 命令、文件引用、CLI 无交互运行、权限控制、自定义规则和 GitHub Actions，让常见任务更容易复现和回滚。
---

> OpenCode 用得顺不顺，关键不在于把所有功能打开，而在于让每次任务都有明确的上下文、权限和验收条件。

## 内置工具要按权限理解

OpenCode 的工具可以读文件、搜索代码、运行命令，也可以通过 MCP（Model Context Protocol）接入外部能力。默认配置偏宽松，真正用于团队项目时，应该把权限配置和工具职责一起看。

| 工具 | 作用 | 适合的使用边界 |
| --- | --- | --- |
| read | 读取文件 | 让模型获取已有实现和配置 |
| glob | 按路径模式找文件 | 定位目录或文件类型 |
| grep | 按正则搜索内容 | 查找符号、调用点和字符串 |
| bash | 执行 shell 命令 | 测试、构建、Git 和诊断 |
| edit | 精确替换已有内容 | 修改已有文件 |
| write | 创建或覆盖文件 | 生成新文件，权限由 edit 控制 |
| apply_patch | 应用补丁 | 处理结构化修改，权限同样由 edit 控制 |
| todowrite | 维护任务清单 | 跟踪多步任务 |
| lsp | 调用语言服务 | 定义、引用、重命名和诊断；需要开启实验选项 |
| skill | 加载 SKILL.md | 按需加载可复用的工作规则 |
| webfetch | 抓取指定网页 | 阅读已知的官方文档 |
| websearch | 搜索网页 | 发现资料；需要 OpenCode provider 或相应环境变量 |
| question | 向用户提问 | 在执行中获取选择和约束 |

write、edit 和 apply_patch 都归到 edit 权限下。想做只读审查时，不要只禁用 write，否则模型仍可能通过 edit 修改已有文件。

lsp 只在 OPENCODE_EXPERIMENTAL_LSP_TOOL=true 或 OPENCODE_EXPERIMENTAL=true 时可用。websearch 也不是任何 provider 都自动提供；没有搜索工具时，可以用 webfetch 读取已经确认的 URL。

## TUI 里最值得记住的命令

OpenCode 的 TUI 使用斜杠触发命令，使用感叹号触发一次 shell 命令，使用 @ 搜索并引用文件：

```text
@src/api/users.ts
!git diff --stat
/models
```

| 命令 | 用途 |
| --- | --- |
| /connect | 添加或认证 provider |
| /models | 查看可用模型 |
| /init | 创建或更新项目的 AGENTS.md |
| /compact | 压缩会话上下文，别名是 /summarize |
| /sessions | 列出并切换会话 |
| /new | 创建新会话，别名是 /clear |
| /undo、/redo | 撤销或恢复消息和文件变化 |
| /thinking | 切换思考块的显示 |
| /details | 切换工具执行详情 |
| /share、/unshare | 分享或取消分享会话 |
| /editor、/export | 使用外部编辑器输入或导出 Markdown |
| /themes | 切换主题 |

/thinking 只改变界面是否显示思考块，不会打开或关闭模型的推理能力。实际的模型 variant 使用 Ctrl+T 循环切换；两件事不要混为一谈。

默认 Leader 键是 Ctrl+X。常用快捷键包括：

| 快捷键 | 作用 |
| --- | --- |
| Ctrl+P | 打开命令面板 |
| Ctrl+X M | 打开模型列表 |
| Ctrl+X C | 压缩会话 |
| Ctrl+X N | 新建会话 |
| Ctrl+X L | 打开会话列表 |
| Ctrl+X U、Ctrl+X R | 撤销、重做 |
| Tab、Shift+Tab | 循环切换 primary agent |
| F2、Shift+F2 | 循环最近使用的模型 |
| Ctrl+T | 循环当前模型的 variant |

快捷键可以在 tui.json 的 keybinds 中覆盖。配置文件是增量合并的，只需要写要改的键：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "keybinds": {
    "command_list": "ctrl+space",
    "session_compact": "none"
  },
  "mouse": false
}
```

禁用鼠标捕获后，终端原生的文本选择通常更容易使用。需要桌面通知或完成提示时，再配置 attention，不要把声音和通知当成默认必需项。

## 让每个请求都带着可检查的上下文

自然语言不是问题，缺少边界才是问题。下面这类请求通常比一句“把它改好”稳定：

```text
请修复订单列表的分页问题。
先检查路由、查询层和现有测试，保持当前分页参数命名。
不要改变数据库 schema。
完成后运行订单相关测试，并在最后列出修改文件和未覆盖的情况。
```

这里有四个有效信息：目标、探索范围、禁止事项和验收条件。它们比堆叠“认真、仔细、完整”更能改变实际行为。

文件引用适合把上下文入口说清楚：

```text
请比较 @src/orders/list.ts 和 @src/orders/query.ts，
解释分页参数在哪里丢失，并给出最小修复方案。
```

如果一个任务需要跨越很多目录，可以先让 Plan agent 输出相关文件清单，再切换到 Build。这样能在改动之前发现上下文缺口。

## 用 CLI 把 OpenCode 接进脚本

不需要 TUI 时，可以使用 opencode run：

```bash
opencode run "解释当前项目的认证入口，并列出相关文件"
opencode run --model provider/model-id --agent plan "审查这个变更的风险"
opencode run --format json "运行相关测试并返回结构化结果"
```

format json 适合 CI 或脚本消费事件；agent 只能选择可作为入口的 primary agent。需要自动批准权限时可以使用 auto，但它只会批准原本需要询问的操作，显式的 deny 仍然生效：

```bash
opencode run --auto "运行测试并修复失败用例"
```

自动批准适合隔离环境或已经限制好权限的任务。对真实项目直接使用时，至少应该先把 edit、bash 和外部目录权限写成明确规则。

## 用项目规则减少重复沟通

/init 可以生成 AGENTS.md，但生成后仍要人工检查。适合写进去的内容包括：

- 安装、构建、Lint 和测试命令；
- 目录职责以及不可直接修改的生成文件；
- API、错误处理和命名约定；
- 需要按顺序执行的检查；
- 本地开发中的环境变量和已知陷阱。

稳定规则放在 AGENTS.md，一次性任务放在 prompt 中。不要把密钥、临时路径或个人偏好写进团队共享文件。

也可以用 instructions 引用多个规则文件：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "CONTRIBUTING.md",
    "docs/development.md",
    ".cursor/rules/*.md"
  ]
}
```

规则会和 AGENTS.md 一起进入模型上下文。文件太多会增加噪声，按职责拆分比把所有内容塞进一个超长文件更容易维护。

## 自定义 Agent 的最小做法

OpenCode 内置 Build、Plan 两个 primary agent，以及 General、Explore、Scout 三个 subagent。日常使用中，先用这五个入口就够了；只有职责稳定、重复出现时，才值得创建自定义 agent。

例如，创建一个只做审查的 subagent：

```markdown
---
description: Review code without changing files
mode: subagent
permission:
  edit: deny
  bash: ask
  webfetch: allow
---

检查潜在 bug、边界条件、性能和安全问题。
只给出带文件路径和行号的建议，不直接修改代码。
```

把文件保存为 ~/.config/opencode/agents/review.md，当前项目专用的 agent 放在 .opencode/agents/。文件名会成为 agent 名称，使用 @review 可以手动调用。

自定义 agent 最值得控制的字段是：

| 字段 | 作用 |
| --- | --- |
| description | 告诉模型这个 agent 适合处理什么 |
| mode | 设置为 primary、subagent 或 all |
| model | 覆盖该 agent 的模型 |
| prompt | 指定外部 system prompt 文件 |
| temperature | 控制回答随机性 |
| steps | 限制 agentic 操作轮数 |
| permission | 控制工具是否允许、询问或拒绝 |
| hidden | 隐藏 subagent 的 @ 自动补全入口 |

新配置应优先使用 permission，因为它支持按工具参数匹配。例如可以允许 git status，却要求对 git push 询问：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "git push*": "deny"
    }
  }
}
```

权限规则按匹配顺序计算，最后一个匹配项生效。把通配规则放前面，把更具体的规则放后面。

## Skills、MCP 和插件不要一次全开

Skills 是按需加载的 SKILL.md，可以放在项目或用户目录。一个 Skill 适合描述重复工作流、领域约束和使用条件；不要把每次任务的具体目标写成全局 Skill。

MCP server 可以是本地进程，也可以是远程服务：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "local-tools": {
      "type": "local",
      "command": ["npx", "-y", "example-mcp"],
      "enabled": true
    },
    "docs": {
      "type": "remote",
      "url": "https://example.com/mcp",
      "enabled": true
    }
  }
}
```

MCP 工具会进入模型上下文，数量过多会增加提示长度和选择成本。启用一个 MCP 后，最好观察它实际暴露的工具，再决定是否按 agent 或权限禁用其中一部分。远程 MCP 还涉及 OAuth、请求头和外部服务信任边界。

插件可以放在 .opencode/plugins/ 或 ~/.config/opencode/plugins/，也可以通过 plugin 配置加载 npm 模块。插件适合扩展 hook、工具和集成；涉及权限或网络的插件要像代码依赖一样审查来源。

## GitHub Actions 适合处理有明确边界的任务

官方 GitHub 集成支持在 Issue 或 Pull Request 评论中使用 /opencode 或 /oc 触发任务，也支持 issue、PR、定时和手动 workflow。快速安装：

```bash
opencode github install
```

手动 workflow 的核心形态如下：

```yaml
name: opencode

on:
  issue_comment:
    types: [created]

jobs:
  opencode:
    if: contains(github.event.comment.body, '/opencode') || contains(github.event.comment.body, '/oc')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: anomalyco/opencode/github@latest
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        with:
          model: provider/model-id
```

model 是必填的 provider/model。需要在没有评论上下文的 issues、schedule 或 workflow_dispatch 事件中运行时，还要提供 prompt。涉及写分支或创建 PR 的 workflow，必须仔细授予 contents、pull-requests 和 issues 权限。

GitHub Actions 的价值是把范围固定在 runner、事件和权限里。它不适合直接接受含糊的“把项目整理一下”，更适合代码审查、Issue 分流和可重复的维护任务。

## 适合自己的最小组合

如果你主要在终端工作，下面这套组合已经覆盖大多数场景：

1. 项目根目录维护 AGENTS.md；
2. 用 Plan 看清复杂任务，再用 Build 修改；
3. 用 @ 指定关键文件，用感叹号获取短命令输出；
4. 通过 permission 限制 bash、edit 和外部目录；
5. 用 Git diff、测试和 undo 保持可回滚；
6. 只有在上下文和工具边界都清楚时，才接入 MCP、插件或自动化 workflow。

OpenCode 的高级能力不是“让模型更自由”，而是让它在更清楚的边界里工作。这个边界写在配置、规则、权限和验证命令中，才会真正转化为效率。

## 官方参考

- [OpenCode Tools](https://opencode.ai/docs/tools/)
- [TUI](https://opencode.ai/docs/tui/)
- [CLI](https://opencode.ai/docs/cli/)
- [Agents](https://opencode.ai/docs/agents/)
- [Permissions](https://opencode.ai/docs/permissions/)
- [Skills](https://opencode.ai/docs/skills/)
- [MCP servers](https://opencode.ai/docs/mcp-servers/)
- [GitHub 集成](https://opencode.ai/docs/github/)
