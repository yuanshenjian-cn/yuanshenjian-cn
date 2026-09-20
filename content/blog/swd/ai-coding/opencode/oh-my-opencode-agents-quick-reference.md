---
title: "Oh My OpenAgent（OpenCode 版）：Agent 速查手册"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
  - Oh My OpenAgent
published: true
brief: >-
  OpenCode 版 Oh My OpenAgent 同时提供 Sisyphus、Hephaestus、Prometheus、Atlas 等核心 Agent，以及 Oracle、Librarian、Explore 等受限研究 Agent。它们分别承担编排、实现、规划、执行和只读研究，Category Worker 则负责具体工作单元。
---

> OpenCode 版的 Agent 不是一组同级的聊天角色：Sisyphus 负责主编排，Prometheus 负责计划，Atlas 负责执行已批准的计划，Category Worker 才是具体任务的执行单元。

## OpenCode 版 Agent 由三层组成

当前 OpenCode edition 的运行时 Agent 可以分成三层：

| 层次 | Agent | 主要责任 |
| --- | --- | --- |
| 核心入口 | Sisyphus、Hephaestus、Prometheus、Atlas | 主编排、实现、规划和计划执行 |
| 专业子 Agent | Oracle、Librarian、Explore、Multimodal Looker、Metis、Momus | 架构咨询、资料研究、代码探索、多模态分析和计划审查 |
| 工作单元 | Sisyphus-Junior、Category Worker | 承接 Category 分派的具体任务 |

OpenCode edition 的 Tab 循环默认顺序是 Sisyphus、Hephaestus、Prometheus、Atlas。其他 Agent 通常由核心 Agent 通过 task 调用，也可以使用 @ 提及。

共享的通用文档还会提到 explore、librarian、plan-consultant 和 plan-reviewer。使用 OpenCode 版时，要以 OpenCode edition 的 Agent 注册表和 agent_order 为准，不要把两套名称表混成一个列表。

## 核心 Agent

### Sisyphus：主编排者

Sisyphus 是 OpenCode 版的主编排 Agent，负责：

- 解析用户目标和约束；
- 探索代码库，维护任务记录；
- 选择 Category、Skill 和专业子 Agent；
- 收集结果、安排验证并推动任务完成。

在 prompt 中加入 ulw 或 ultrawork，会让 Sisyphus 采用更主动的探索、并行委派和验证方式：

```text
ulw 重构用户权限模块，保持公开 API 不变，完成后运行相关测试。
```

Sisyphus 的模型有官方 fallback chain。配置时可以覆盖 agents.sisyphus 的 model、models 或 reasoning，不需要把 provider 链硬编码到每个 prompt。

### Hephaestus：实现型入口

Hephaestus 面向端到端的代码实现，适合已经明确范围、需要持续修改和验证的任务。官方路由对它有 GPT 模型约束，遇到模型不匹配时应先检查 provider 和 doctor 输出，不要只换一个任意模型继续运行。

它更像“把确定的设计落成代码”的入口，不负责替代 Prometheus 做需求访谈，也不应该被用来掩盖未解决的架构选择。

### Prometheus：规划 Agent

Prometheus 负责 ulw-plan 工作流。它会先读取项目、调用研究 Agent，再把需求整理成可以执行的计划。

Prometheus 有一个必须保留的 planner prompt。自定义 prompt 或 prompt_append 会追加在官方基础提示之后，不能用自定义文件把规划约束完全替换掉。

计划文件只能写入受控的 .omo 计划路径。需要开始规划时使用：

```text
/ulw-plan
```

它会先给出 brief，等用户确认后才写入 .omo/plans/。

### Atlas：计划执行和持续编排

Atlas 是 OpenCode 版执行已批准计划的核心入口。运行：

```text
/ulw-execute
```

插件会选择 Prometheus 生成的计划，注入 boulder、worktree 或 PR 上下文，然后把会话切换到 Atlas 执行。Atlas 负责按计划推进、登记目标和 todo、收集验证证据，并在会话空闲时处理未完成的 boulder 工作。

如果 Atlas 没有注册，官方 hook 会回退到 Sisyphus。Atlas 不是普通的“只读协调器”，也不是 Category Worker；它是 OpenCode edition 的计划执行层。

## 专业子 Agent

### Oracle：架构和调试咨询

Oracle 是只读的架构、调试和复杂逻辑顾问。它适合回答“这个拆分是否合理”“根因可能在哪里”，不能修改文件，也不能继续委派任务：

```text
@oracle 审查这个缓存方案，指出模块边界、失败场景和可验证的改进方向。
```

### Librarian：官方资料和依赖研究

Librarian 负责远程仓库、官方文档和依赖源码研究。它是只读 Agent，适合在实现前查清真实 API：

```text
@librarian 查找这个依赖的官方认证配置，并返回适用文档链接。
```

### Explore：本地代码搜索

Explore 专门查找文件、符号、调用链和配置来源：

```text
@explore 找出所有写入订单状态的代码，并返回文件路径和调用关系。
```

Explore 不能写文件，也不能再调用其他 Agent。它的结果需要交回 Sisyphus、Hephaestus 或 Atlas 决定如何使用。

### Multimodal Looker：图片和 PDF 分析

Multimodal Looker 只读媒体内容，适合分析截图、图片、PDF 和流程图。它的工具范围更窄，默认只允许读取媒体文件，不应被当成通用实现 Agent。

### Metis 和 Momus：计划检查

Metis 用于计划前的缺口分析，帮助发现隐藏意图、范围膨胀和缺少的验收条件。Momus 用于检查计划的清晰度、完整性和可验证性。

它们不是普通的 Explore 替代品。计划流程会在需要时调用它们；如果用户直接使用 @ 提及，应清楚自己是在请求计划咨询，而不是要求它们修改代码。

## Sisyphus-Junior 和 Category Worker

Category 回答的是“这是什么类型的工作”。Sisyphus-Junior 是插件为 Category 任务准备的受限执行器，Category Worker 则是按当前配置创建的具体工作会话。

调用 Category：

```typescript
task({
  category: "quick",
  prompt: "修复这个单文件中的类型错误，并运行对应测试。",
});
```

常见 Category：

| Category | 适合的任务 |
| --- | --- |
| quick | 单文件、机械性、低风险修改 |
| visual-engineering | 前端、UI、样式和动画 |
| deep | 复杂研究、浏览器、后端和算法 |
| ultrabrain | 单个高难度逻辑或架构问题 |
| architect | 模块边界和设计取舍 |
| writing | 文档和技术写作 |

Category Worker 不能继续用 task 无限向下委派。这样可以避免任务树失控，并让一个 Worker 对一个明确交付物负责。

## 模型参考

OpenCode edition 的官方配置给出了各 Agent 的参考路由。模型注册和 provider 可用性会变化，实际结果应以 doctor 和 opencode models 为准：

| Agent | 默认模型参考 | 主要工作 |
| --- | --- | --- |
| Sisyphus | claude-opus-5 | 主编排和 ultrawork |
| Hephaestus | gpt-5.6-sol | 代码实现 |
| Oracle | gpt-5.6-sol | 架构和调试咨询 |
| Librarian | gpt-5.6-luna-fast | 文档和依赖研究 |
| Explore | gpt-5.6-luna-fast | 本地代码探索 |
| Multimodal Looker | gpt-5.6-sol | 媒体分析 |
| Prometheus | claude-fable-5-1 | 规划 |
| Metis | claude-fable-5-1 | 计划缺口 |
| Momus | gpt-6-astra | 计划审查 |
| Atlas | claude-sonnet-5 | 执行计划 |
| Sisyphus-Junior | claude-sonnet-5 | Category 任务 |

检查当前模型：

```bash
opencode models
bunx oh-my-openagent doctor --verbose
```

不要把模型名称当成 Agent ID。Agent ID 是工作流的稳定接口，模型只是可覆盖的路由配置。

## 统一配置

Oh My OpenAgent 的统一配置位于：

- 用户级 ~/.omo/omo.jsonc；
- 项目级 .omo/omo.jsonc；
- OpenCode edition 的字段放在 [opencode] 区块。

示例：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/omo.schema.json",
  "[opencode]": {
    "agent_order": [
      "sisyphus",
      "hephaestus",
      "prometheus",
      "atlas"
    ],
    "agents": {
      "sisyphus": {
        "model": "provider/orchestrator-model"
      },
      "explore": {
        "model": "provider/fast-read-model"
      },
      "oracle": {
        "model": "provider/reasoning-model",
        "reasoning": "high"
      }
    },
    "disabled_agents": [
      "multimodal-looker"
    ]
  }
}
```

Sisyphus 的任务总开关和规划器配置可以单独设置：

```jsonc
{
  "[opencode]": {
    "sisyphus_agent": {
      "disabled": false,
      "planner_enabled": true,
      "replace_plan": true
    }
  }
}
```

OpenCode 自身的 model、permission、MCP 和 TUI 配置仍然写在 opencode.json 与 tui.json。不要把 OpenCode 原生 Agent 字段和插件 Agent 字段混在同一个配置层里。

## 速查选择

| 需求 | 入口 |
| --- | --- |
| 复杂任务自动拆解和持续推进 | Sisyphus + ulw |
| 已知设计，直接实现 | Hephaestus |
| 需要访谈和书面计划 | Prometheus + /ulw-plan |
| 执行已批准的计划 | Atlas + /ulw-execute |
| 架构和调试咨询 | Oracle |
| 本地找代码 | Explore |
| 查官方文档和依赖 | Librarian |
| 图片或 PDF 分析 | Multimodal Looker |
| 计划缺口和计划审查 | Metis、Momus |
| 执行一个具体工作类型 | Category Worker |

## 官方参考

- [Oh My OpenAgent OpenCode edition 配置](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/opencode-config.md)
- [Oh My OpenAgent 功能参考](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/features.md)
- [Oh My OpenAgent 编排系统指南](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/orchestration.md)
- [OpenCode Agents](https://opencode.ai/docs/agents/)
