---
title: "Kimi 模型谱系档案：月之暗面这条线最特别的地方，是 Agent 味越来越重"
date: '2026-06-28'
tags:
  - AI前沿
  - LLM
  - 月之暗面
  - Kimi
  - 模型评测
published: true
brief: >-
  这是一份按代际持续维护的 Kimi 模型档案。首版覆盖 Kimi K2.6、Kimi K2.5、Kimi K2、Kimi K2 Thinking、Kimi K2-0905、Kimi K2-0711 和 Moonshot V1，集中记录官方价格、上下文、Agent 能力和官方资料可确认的代际变化，后续新模型只追加不删历史。
---

> 如果说 DeepSeek 让人先想到低价，Kimi 这条线更容易让人先想到“Agent 感”。它不是简单在卷聊天效果，而是在把模型往长程执行、工具编排、前端生成和群体代理这些方向上持续推。

Kimi 的问题不是能力不够，而是官方代际资料在不同页面分散得比较厉害。

所以这篇首版我会更保守：只写官方文档、官方博客、官方定价页和官方模型列表里能确认的主线。

## 我用同一套 5 个维度看 Kimi

| 维度 | 我重点看什么 |
|------|-------------|
| 编码 | 长程编码、前端生成、代码 Agent 稳不稳 |
| 推理与知识工作 | thinking 模式和复杂分析是否有清晰增益 |
| 多模态与电脑操作 | 图片、视频、浏览、工具链是否融合得自然 |
| 上下文与 Agent 续航 | 256K context、多步工具、agent swarm 能力 |
| 成本透明度 | 官方是否把输入、缓存、输出价讲清楚 |

## Kimi 最近几代主线总表

| 模型 | 官方发布日期 | 输入价格 | 缓存命中 | 输出价格 | 这一代最该记住的事 |
|------|-------------|---------|---------|---------|------------------|
| Kimi K2.7 Code | 2026-06-25 | ¥6.50 / 1M | ¥1.30 / 1M | ¥27.00 / 1M | Kimi 迄今最智能的 Coding 模型，仅思考模式，支持文本/图片/视频输入，thinking token 减少 30% |
| Kimi K2.6 | 2026-04-20 | ¥6.50 / 1M | ¥1.10 / 1M | ¥27.00 / 1M | 当前主力开源 coding/agent 模型，长程执行能力明显拉升 |
| Kimi K2.5 | 2026-01-27 | ¥4.00 / 1M | ¥0.70 / 1M | ¥21.00 / 1M | 视觉 Agent 与多步工具能力成型，Agent Swarm 100 并行 |
| Kimi K2 Thinking | 2025-11-06 | ¥4.00 / 1M | ¥1.00 / 1M | ¥16.00 / 1M | thinking 专门型号，支持 reasoning_content 与多步工具 |
| Kimi K2-0905 | 2025-09-05 | 官方页面未保留 | 官方页面未保留 | 官方页面未保留 | Agentic Coding 增强，256K context（2026-05-25 已下线） |
| Kimi K2 | 2025-07 | ¥4.00 / 1M | ¥1.00 / 1M | ¥16.00 / 1M | Open Agentic Intelligence 的公开起点（2026-05-25 已下线） |
| Kimi K2-0711 | 2025-07-11 | 官方页面未保留 | 官方页面未保留 | 官方页面未保留 | K2 基础模型预览版，128K context（2026-05-25 已下线） |
| Moonshot V1 | 官方页面未直接标注 | ¥2 / ¥5 / ¥10 每 1M | 官方未公布 | ¥10 / ¥20 / ¥30 每 1M | K 系列之前的经典生成线，更像老一代基础盘 |

<small>*数据来源：Kimi 官方平台文档、官方 pricing 页面、官方博客与官方资源页，查询日期 2026-06-28。Kimi K2.7 Code 的官方发布日期 2026-06-25 来自官方资源页（kimi.com/resources/kimi-k2-7-code）标注的“8 min read 2026-06-25”。K2 系列（kimi-k2、kimi-k2-0905-preview、kimi-k2-0711-preview 等）已于 2026-05-25 下线。若官方博客页未直接给发布日期，则明确写“官方页面未直接标注”。*</small>

## Kimi K2.7 Code：Kimi 把 Coding 专门模型推到新高点

Kimi K2.7 Code 在 2026 年 6 月 25 日发布，官方资源页（kimi.com/resources/kimi-k2-7-code）有专门介绍，但官方博客目前没有专门的发布文章。

从官方模型说明看，它的定位非常聚焦：

- **Kimi 迄今最智能的 Coding 模型**
- 上下文 256K，在长上下文中更可靠地遵循指令
- 支持文本、图片、视频输入
- **仅支持思考模式**，适合需要深度推理的编程任务
- 支持自动上下文缓存、ToolCalls、JSON Mode、Partial Mode

相比 K2.6，官方给出两组关键数据：

- **编码基准明显提升**：Kimi Code Bench v2 +21.8%（62.0 vs 50.9）、Program Bench +11.0%、MLS Bench Lite +31.5%
- **thinking token 减少约 30%**：在更高分的同时消耗更少 token，这对开发者的 API 成本和交互延迟都是直接利好

价格方面，K2.7 Code 和 K2.6 保持一致：输入 ¥6.50/1M、输出 ¥27.00/1M，但缓存命中价略高（¥1.30/1M 对比 K2.6 的 ¥1.10/1M）。这说明它的定位不是“更便宜的替代”，而是“在同一价位上把 Coding 专门化做得更好”。

我把 K2.7 Code 放进主线档案，是因为 Kimi 明显在把 Coding 这条线独立出来做专门优化。它不是 K2.6 的简单复用，而是同一个上下文价位下、面向编程场景的深度特化版本。

## Kimi K2.6：这代已经不只是“会写代码”，而是“能长时间把代码活跑下去”

K2.6 的官方博客标题就很直接：Advancing Open-Source Coding。

但我认为它最大的看点，不只是开源 coding，而是长程执行。

官方给了很多非常具体的案例：

- 4000+ tool calls
- 12 小时连续执行
- 13 小时改造老系统
- 1000+ tool calls 去完成复杂工程优化

这些案例可能有宣传成分，但至少说明一件事：Kimi 已经把“持续执行”和“工具循环”视作主能力，而不是锦上添花的展示项。

这也是为什么我觉得 K2.6 是月之暗面这条线非常值得看的模型之一。

它的重点不是一两次漂亮输出，而是比较长的、需要不断推进的工程过程。

## Kimi K2.5：把视觉 Agent 和多模态工作流拉进主线

K2.5 在 2026 年 1 月 27 日发布，官方定位很清楚：Visual Agentic Intelligence。

这代是 Kimi 从”会做 Agent”继续往”会在多模态环境里做 Agent”推进的一步。

如果 K2 偏向于把 Open Agentic Intelligence 这个旗子插起来，K2.5 更像是在补实际使用里的多模态和视觉能力短板。它引入了 MoonViT-3D 视觉架构，支持 Agent Swarm（100 个并行子 Agent）。

它很适合拿来理解 K2.6 为什么会继续往长程 coding 和 agent swarm 走。

因为两代的方向是一致的，只是 K2.6 更成熟、执行更长（Agent Swarm 扩展到 300 子 Agent）。

## Kimi K2：Open Agentic Intelligence 这句话不是修辞，它就是路线图

K2 这一代最值得记住的是标题本身。

Open Agentic Intelligence。

很多厂商会说自己支持 Agent，但 Kimi 从 K2 开始，是把 Agent 直接写进模型代际的核心身份里。

从官方模型列表也能看出来，K2 的升级不是只在聊天能力上，而是明显往：

- Agent 任务
- 代码工作
- 多步工具调用
- 长上下文

这些东西上靠。

所以如果你后面再看 K2-0905、K2 Thinking、K2.5、K2.6，会发现它们并不是横跳，而是一路沿着同一方向推进。

## Kimi K2-0905：Agentic Coding 的关键补强

K2-0905 在 2025 年 9 月 5 日发布。

这代是 K2 基础模型的一个重要补丁升级，核心改进是 **Agentic Coding 能力增强** 和上下文窗口从 128K 扩到 256K。

虽然官方没有把它当成一个独立的”大版本”来推，但从谱系视角看，K2-0905 是 K2 到 K2 Thinking 之间的关键过渡。它验证了 Kimi 在编码 Agent 上的投入方向，也为后续 K2.5 的视觉 Agent 能力打下了基础。

对于做长期档案的人来说，K2-0905 的价值在于：它说明 Kimi 的迭代不是只等大版本，中间的小版本也在持续积累 Agent 能力。

## Kimi K2-0711：K2 系列的起点预览

K2-0711 在 2025 年 7 月 11 日发布。

这是 Kimi K2 系列的第一个公开版本，一个 Preview 版。它的定位很清晰：验证 Open Agentic Intelligence 路线的基础设施——128K context、基础工具调用、MoE 架构（1T 总参数，32B 激活）。

K2-0711 本身的能力还不算成熟，但它定义了后面整个 K2 系列的技术基座。从 0711 到 0905 再到 K2 正式版，你可以看到 Kimi 如何在一个季度内把 Agent 能力从”能跑”做到”能用”。

## Kimi K2 Thinking：Kimi 也开始把”思考模式”做成独立选择

K2 Thinking 在 2025 年 11 月 6 日发布。

它的意义，不是它单独多了一套价格，而是它让 Kimi 的 reasoning 路线显式化了。

这说明月之暗面也在面对和其他头部厂商相同的问题：

- 有些任务要更快
- 有些任务要想更久
- 有些任务还要边想边调工具

把 thinking 独立出来，会让开发者更容易控制这些权衡。

## Moonshot V1：今天已经不前沿，但很适合拿来当分水岭

Moonshot V1 系列更像老一代基础盘。

它的区别主要在上下文长度，而不是效果代际差异。

这恰恰说明 K 系列为什么值得单独看：

从 V1 到 K2，再到 K2.6，月之暗面的重心已经从“基础生成模型”明显转向“Agent 和长程执行模型”。

## 我对 Kimi 这条线的实际判断

Kimi 这条线最特别的地方，是它越来越不像单纯对话模型。

很多时候它更像一个面向多步任务的工作引擎。

它的关键字已经越来越固定了：

- 长程编码
- 工具调用
- Agent Swarm
- 前端生成
- 多模态执行

如果你的任务是：

- 要做比较长的开发自动化
- 要让模型多次调工具
- 要兼顾前端生成和后端小型流程
- 想看一条更激进的 Agent 路线

那 Kimi 这家非常值得盯着。

它的短板也同样明显：官方发布日期和历史资料留存没有 OpenAI、Anthropic 那么整齐。做长期档案时要格外克制，不能替它补脑。

## 官方来源

- Kimi Models: `https://platform.kimi.com/docs/models.md`
- Kimi K2.7 Code Resource: `https://www.kimi.com/resources/kimi-k2-7-code`
- Kimi K2.7 Code Pricing: `https://platform.kimi.com/docs/pricing/chat-k27-code`
- Kimi K2.6 Quickstart: `https://platform.kimi.com/docs/guide/kimi-k2-6-quickstart.md`
- Kimi K2.6 Pricing: `https://platform.kimi.com/docs/pricing/chat-k26.md`
- Kimi K2.6 Blog: `https://www.kimi.com/blog/kimi-k2-6`
- Kimi K2.5 Pricing: `https://platform.kimi.com/docs/pricing/chat-k25.md`
- Kimi K2 Pricing: `https://platform.kimi.com/docs/pricing/chat-k2.md`
- Kimi K2 Thinking Guide: `https://platform.kimi.com/docs/guide/use-kimi-k2-thinking-model.md`
- Kimi K2 Blog: `https://www.kimi.com/blog/kimi-k2`
- Moonshot V1 Pricing: `https://platform.kimi.com/docs/pricing/chat-v1.md`
