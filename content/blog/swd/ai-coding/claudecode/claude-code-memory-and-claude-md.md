---
title: "Claude Code 第五篇：记忆层——CLAUDE.md、Rules 与 Auto Memory"
date: '2026-09-19'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: >-
  Claude Code 的长期上下文分成三种责任：CLAUDE.md 和 AGENTS.md 记录项目约定，Rules 按文件范围补充规则，Auto Memory 保存 Claude 在工作中积累的经验。理解加载时机和作用域，才能让记忆帮助工作而不是制造噪音。
---

> 记忆文件不是项目百科全书，而是让每次会话少猜几个关键问题的操作手册。

## 三套记忆系统，三种责任

Claude Code 主要从三个地方获得跨会话信息：

| 系统 | 谁维护 | 更适合放什么 | 加载方式 |
|------|--------|--------------|----------|
| `CLAUDE.md` / `AGENTS.md` | 人和团队 | 项目约定、命令、架构边界 | 会话启动或访问目录时加载 |
| `.claude/rules/` | 人和团队 | 语言、目录或文件类型规则 | 全局规则启动时加载，带路径的规则按需加载 |
| Auto Memory | Claude 与人共同维护 | 调试发现、偏好和不容易从代码看出的经验 | `MEMORY.md` 索引启动时加载，主题文件按需读取 |

这三者都只是上下文，不是强制安全边界。要无条件阻止某个工具调用，应使用权限 `deny`、沙箱或 `PreToolUse` Hook；不要把“请勿读取密钥”只写在记忆文件里。

## CLAUDE.md 的作用域

常见位置可以这样分工：

| 位置 | 作用域 | 典型内容 |
|------|--------|----------|
| 组织托管文件 | 组织所有用户 | 安全、合规和统一工作要求 |
| `~/.claude/CLAUDE.md` | 当前用户的所有项目 | 个人语言和交互偏好 |
| 项目根目录 `CLAUDE.md` 或 `.claude/CLAUDE.md` | 项目协作者 | 技术栈、构建命令、架构约定 |
| `CLAUDE.local.md` | 当前项目的个人配置 | 本地服务地址、个人测试数据，不提交 Git |
| 子目录下的 `CLAUDE.md` | 该目录及其子目录 | 子模块专属约束 |

Claude Code 会从当前工作目录向上读取可用的项目指令。访问子目录文件时，子目录里的 `CLAUDE.md` 可能在会话中按需加入。项目文件是累加关系，不是简单的“后一份覆盖前一份”；如果上下文互相冲突，越具体的目录通常越有针对性，所以更好的办法是从结构上消除冲突。

项目里如果已经有 `AGENTS.md`，不必复制内容。默认情况下，项目没有可加载的 `CLAUDE.md` 时 Claude Code 会读取 `AGENTS.md`；团队也可以在设置中选择同时读取两类文件，或明确导入：

```markdown
# CLAUDE.md

@AGENTS.md

## Claude Code 专用约定
- 修改后运行 `just check`
- 未经确认不要提交或推送
```

`@` 导入适合共享一份跨工具规则。导入文件本身也会占用上下文，所以不要把一整套历史文档递归塞进每次会话。

## 一份好的 CLAUDE.md 应该很短

判断一条内容是否应该放进去，可以问自己：“如果 Claude 今天只做另一个任务，这条信息还需要知道吗？”答案为“是”才适合放在项目级文件里。

```markdown
# 项目说明

## 命令
- 安装：`pnpm install`
- 开发：`pnpm dev`
- 检查：`pnpm check`
- 测试：`pnpm test`

## 约定
- API 变更需要同步更新 OpenAPI 类型
- 文章修改后运行 `just validate-content`
- 不要提交 `.env.local`

## 边界
- `legacy/` 只读，除非任务明确要求迁移
- 数据库迁移必须先生成计划并由人确认
```

比“请写出高质量代码”更有效的规则，是能在 diff 或命令结果中被验证的规则。项目结构、依赖版本和普通命名习惯能从代码推断出来，就不必重复写；真正值得记录的是工具不容易猜到的约束、失败经验和决策原因。

## Rules 让规则靠近代码

当一份 `CLAUDE.md` 开始塞进大量语言规范、测试约定和目录细节，可以把它们拆到 `.claude/rules/`：

```text
.claude/
├── settings.json
└── rules/
    ├── typescript.md
    ├── tests.md
    └── content.md
```

普通规则文件适合项目里大多数会话。需要按路径加载的规则，在 frontmatter 中写 `paths`：

```markdown
---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# TypeScript 规则

- 公共函数必须有明确的输入和输出类型
- 修改数据访问层时补充失败分支测试
```

路径模式应该尽量准确。规则写得过宽，会让不相关任务也背上额外上下文；写得过窄，则可能在关键文件上没有生效。用户级 `~/.claude/rules/` 可以放个人偏好，项目级 Rules 则应该能被团队共同接受并提交到仓库。

## Auto Memory 记录“代码之外的经验”

Auto Memory 适合保存 Claude 在工作中发现、而项目文件本身不容易表达的内容，例如：

- 某个测试必须先启动本地服务；
- 一个外部 API 的错误只在特定分页参数下出现；
- 你反复纠正过的输出格式或验证习惯；
- 某个历史模块的实际边界和临时 workaround。

Auto Memory 通常位于配置目录下的项目记忆路径，不会自动进入 Git。主索引 `MEMORY.md` 在会话启动时只加载前 200 行或约 25KB，以先读到的限制为准；更详细的主题文件在 Claude 需要时再读取。索引应该像目录，不要写成一篇没有层次的长文。

你可以直接在对话里提出维护请求：

```text
记住：运行集成测试前必须先启动 `just start-core-service`。
把这条放进项目记忆索引，并删除已经失效的旧命令。
```

也可以用 `/memory` 查看当前可见的 CLAUDE.md、Rules 和 Auto Memory，打开记忆目录或切换 Auto Memory。`/context` 更适合确认当前回合实际加载了哪些上下文。

Auto Memory 不是事实数据库。它可能记录错误推断，因此涉及命令、权限和安全边界的内容仍应回写到项目规则或脚本中，并通过实际命令验证。

## Subagent 的记忆要单独设计

普通 Subagent 不会自动继承主会话的全部对话历史。自定义 Subagent 可以在 frontmatter 中设置 `memory: user`、`project` 或 `local`，让某个角色跨会话积累经验：

```markdown
---
name: test-reviewer
description: Review test changes and report missing behavior coverage
model: sonnet
memory: project
---

只审查测试和相关实现，不修改文件。记录反复出现的测试陷阱，但每次先用当前代码验证记忆是否仍然成立。
```

只有在同一种角色会反复处理同一类问题时才值得开启持久记忆。否则让它每次从项目规则和当前任务开始，边界会更清楚。

## 四种配置方式

### 个人项目

个人项目只需要项目级 `CLAUDE.md`，再配一份用户级文件保存语言和交互偏好。Auto Memory 记录临时经验，等经验稳定后再手动提升为项目规则。

### 团队仓库

团队项目可以把这些文件提交到 Git：

```text
CLAUDE.md
.claude/
├── settings.json
├── rules/
│   ├── backend.md
│   └── content.md
└── agents/
    └── reviewer.md
```

`.claude/settings.local.json` 留给个人例外，并加入 `.gitignore`。不要把 API Key、Cookie 或个人路径写进共享文件。

### Monorepo

根目录放跨包命令和公共约定，子包放自己的 `CLAUDE.md` 或带 `paths` 的 Rules。前端规则不应该因为后端任务被全量加载，数据库迁移规则也不该污染只改文案的会话。

### 多工具共用

如果仓库同时使用 OpenCode、Cursor 或其他编码代理，保留一份通用 `AGENTS.md`，让 `CLAUDE.md` 用 `@AGENTS.md` 导入，再增加 Claude Code 的专用部分。共享的是事实和边界，不是每个工具的界面命令。

## 记忆没有生效时，按加载链排查

先运行 `/memory`，确认文件路径和作用域；再运行 `/context`，确认本轮是否实际加载。之后检查：

- 当前工作目录是否在预期项目内；
- 文件名是否准确为 `CLAUDE.md`、`CLAUDE.local.md` 或 `AGENTS.md`；
- `@` 导入路径是否存在，是否触发了外部文件信任提示；
- Rules 的 `paths` 是否真的匹配目标文件；
- 项目设置是否被更高优先级的托管或用户设置影响；
- 记忆内容是否超过索引限制，关键结论是否仍在 `MEMORY.md` 前部。

如果 Claude 仍然反复违反规则，不要继续增加提醒语气。把要求改成可验证命令、权限规则或 Hook；能被程序拦截的边界，不应依赖模型“记住”。

记忆加载和 `.claude` 目录的具体规则见[记忆系统](https://code.claude.com/docs/en/memory)、[`.claude` 目录](https://code.claude.com/docs/en/claude-directory)和[上下文窗口](https://code.claude.com/docs/en/context-window)。
