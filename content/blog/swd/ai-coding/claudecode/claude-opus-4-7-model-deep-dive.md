---
title: "Claude Code 最新模型选择：Fable 5.1、Opus 5、Sonnet 5 怎么用"
date: '2026-09-19'
tags: ['软件开发', 'AI 编程', 'ClaudeCode', '模型评测']
published: true
brief: "Claude Code 当前的模型选择可以按任务拆成四档：Fable 5.1 负责最长的自主工作，Opus 5 负责复杂编码和知识工作，Sonnet 5 负责速度与能力的平衡，Haiku 4.5 负责轻量任务。本文结合上下文、effort、费用和安全边界给出可执行的选择方法。"
---

> 模型选择的关键不是寻找一个永远最强的答案，而是让模型的能力、上下文和任务风险相匹配。

## 当前模型阵容

Anthropic 的模型概览把 Claude Code 常用模型分成四个层级：

| 模型 | 更适合的工作 | 输入 / 输出价格（每百万 Token） | 上下文 | 思考方式 |
|------|--------------|-------------------------------|--------|----------|
| Claude Fable 5.1 | 最长的自主任务、困难推理、长链路 Agent | $10 / $50 | 1M | 自适应，始终开启 |
| Claude Opus 5 | 复杂 Agent 编码、企业知识工作 | $5 / $25 | 1M | 自适应 |
| Claude Sonnet 5 | 日常编码中速度与能力的平衡 | $2 / $10 | 1M | 自适应 |
| Claude Haiku 4.5 | 快速、简单、规模化的任务 | $1 / $5 | 200K | 扩展思考 |

这些是 Claude API 的公开价格；订阅计划、usage credits、Bedrock、Google Cloud、Microsoft Foundry 和网关的计费方式可能不同。Claude Code 的 `/model` 选择器会根据当前身份显示可用模型和费用信息。

## Fable 5.1：把任务交给它之前，先确认边界

Fable 5.1 的定位是长时间自主工作。它适合根因调查、复杂架构决策、跨模块重构、长文档研究和需要多次自我验证的任务。最适合给它的是目标、约束和验收条件，而不是把每个操作步骤都写死：

```text
把当前支付模块迁移到新的校验接口。
保持现有公共 API 和数据库结构不变，补齐回归测试。
完成后报告改动文件、测试结果、未验证的外部依赖和需要人工决定的地方。
```

Fable 5.1 可以用：

```text
/model fable
```

它不是所有账户和提供商的默认模型，可能使用 usage credits。远程控制、后台会话和 Agent Team 中，如果没有人及时处理额度确认，任务可能在等待窗口结束后停止。自动化脚本和 Agent SDK 不会显示交互式确认，因此更要在组织层明确模型和费用策略。

Fable 不是适合所有任务的“默认答案”：清理格式、解释一段函数、跑一次测试，都没有必要让最昂贵的模型承担。

## Opus 5：复杂编码的主力选择

Opus 5 面向复杂 Agent 编码和企业知识工作。Anthropic 的官方发布资料把它定位为日常使用的高能力模型，并强调它在编码、知识工作、计算机使用和自我验证方面的表现；在 Frontier-Bench 和 GDPval-AA 等官方引用的评测中，它处于领先位置。

对 Claude Code 用户来说，Opus 5 的价值主要体现在三个地方：

- 能在较长的多步任务中保持问题主线；
- 遇到模糊需求时会先调查，再决定修改路径；
- 更愿意验证自己的结果，而不是在第一次命令成功后立刻结束。

典型入口：

```bash
claude --model opus
```

如果项目有明确测试和验收命令，Opus 5 适合承担跨文件重构、难定位 Bug、生产代码审查和重要 API 设计。它仍然需要权限边界和人类审查，模型的自我验证不能替代真实测试、代码审查或部署审批。

## Sonnet 5：大多数日常任务的平衡点

Sonnet 5 更适合日常编码、局部重构、测试补齐、文档更新和常规调试。它的速度和价格更适合作为长期默认模型：

```text
/model sonnet
/effort medium
```

当任务只是修改一个组件、解释一段代码或修复已有测试暴露的错误时，Sonnet 5 通常足够。遇到连续几轮仍然无法定位根因，再切到 Opus 5，比从一开始让所有小任务使用 Opus 更容易控制费用。

如果任务需要规划但执行本身比较机械，可以使用：

```json
{
  "model": "opusplan"
}
```

`opusplan` 在 Plan 阶段使用 Opus，在执行阶段切换到 Sonnet。模型切换会影响 Prompt Cache，因此它适合规划收益明显的任务，不适合所有小修改。

## Haiku 4.5：让轻量工作离开主会话

Haiku 4.5 的价值是速度和规模化。它适合快速搜索、日志摘要、简单文件分类、格式检查和不需要复杂判断的 Subagent。可以在 Subagent 定义中指定：

```markdown
---
name: test-log-reader
description: Read test output and list failures without changing files.
model: haiku
tools: Read, Grep, Glob
---
```

把高输出但低决策密度的工作放在 Haiku Subagent 中，主会话只接收结论，往往比让主模型读取全部日志更快、更便宜。只要任务涉及架构取舍、风险判断或需要修改代码，就不要为了省钱强行使用 Haiku。

## Effort 让同一个模型有不同工作档位

模型和 effort 是两个维度。简单任务可以从 `low` 或 `medium` 开始，复杂任务用 `high`，真正需要更深推理时再使用 `xhigh` 或 `max`：

```text
/effort low
/effort medium
/effort high
/effort xhigh
/effort max
```

可用档位依赖模型。Fable 5.1、Fable 5、Opus 5 和 Sonnet 5 支持的档位更丰富，Haiku 4.5 不提供同样的 effort 选择。组织还可以用 `maxEffortLevel` 把上限设在 `medium` 或 `high`。

默认建议不是把 effort 拉到最高，而是根据失败代价来定：

| 任务 | 建议 |
|------|------|
| 查一个定义、改一处文案 | `low` 或 `medium` |
| 日常开发、测试和局部 Bug | `medium` 或 `high` |
| 跨模块重构、架构决策 | `high` 或 `xhigh` |
| 长时间开放式研究 | Opus / Fable，再考虑 `xhigh` 或 `max` |

`ultracode` 还会安排动态工作流。它优化的是复杂任务的探索和交叉验证，不是每个会话的省钱模式。

## 1M 上下文不是所有任务的必选项

Fable、Opus 5 和 Sonnet 5 都支持 1M 上下文。需要处理大仓库、长报告、跨多份设计文档或长时间保持线索时，可以在 `/model` 中选择：

```text
/model sonnet[1m]
/model opus[1m]
```

1M 会带来更大的读取和缓存空间，也可能带来更多噪音。推荐先精确搜索，再逐步扩大范围；不要因为窗口很大就让 Claude 一次读取所有目录。若团队希望隐藏扩展上下文选项，可以设置 `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`。

## 模型安全边界需要单独看

强模型在网络安全、生物和其他高风险领域可能触发安全分类器。Claude Code 可能自动回退到允许的模型，也可能拒绝请求；这由模型、提供商、组织白名单和安全策略共同决定。

“模型能理解一段漏洞代码”与“模型会执行攻击或外发数据”不是同一个能力。实际项目应同时配置：

- `permissions.deny` 阻止敏感文件和危险工具；
- Auto Mode 的可信仓库、域名和云资源；
- Bash 沙箱或隔离容器；
- 对外发消息、部署和推送的人工确认；
- CI 中的最小凭证和最小 `allowedTools`。

模型越强，越应该把这些边界写进程序配置，而不是只在提示词里提醒。

## 用项目评测而不是排行榜做最后决定

公开评测能说明模型在某些条件下的能力，不能替你判断它在当前仓库是否更好。为团队选默认模型时，准备一小组真实任务：

- 一个跨文件 Bug 修复；
- 一个需要补测试的功能；
- 一个旧模块重构；
- 一个代码审查和安全边界任务；
- 一个长文档或数据整理任务。

固定提示词、验证命令和人工评分标准，记录完成时间、工具调用次数、失败类型、人工返工量和缓存用量。模型“回答得更聪明”不等于整个任务成本更低；少一次返工，有时比输出更长的解释更有价值。

## 直接可用的选择表

| 你的任务 | 默认选择 | 何时升级 |
|----------|----------|----------|
| 局部编码、测试、文档 | Sonnet 5 | 连续两轮仍无法定位问题时用 Opus 5 |
| 复杂重构和架构 | Opus 5 | 需要更长自主推进时用 Fable 5.1 |
| 大仓库长会话 | Sonnet 5 或 Opus 5 + `[1m]` | 只有上下文确实成为瓶颈时开启 |
| 日志、搜索、分类 | Haiku 4.5 Subagent | 需要判断根因时交给 Sonnet 或 Opus |
| 高价值开放式研究 | Opus 5 | 需要长时间自主调查和验证时用 Fable 5.1 |

如果没有特别理由，先用 Sonnet 5；复杂度上升时切 Opus 5；只有任务本身需要长期自主性时才用 Fable 5.1。模型名称只是入口，真正决定结果的仍是范围、权限、上下文和验证标准。

官方参考：[模型概览](https://platform.claude.com/docs/en/models/overview)、[Claude Code 模型配置](https://code.claude.com/docs/en/model-config)、[Claude Opus 5 发布说明](https://www.anthropic.com/news/claude-opus-5)。
