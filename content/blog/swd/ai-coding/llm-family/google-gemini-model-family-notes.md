---
title: "Google Gemini：从长上下文到 agentic era 的主线怎么走"
date: '2026-08-17'
tags:
  - AI前沿
  - LLM
  - Google
  - Gemini
  - 模型评测
published: true
brief: >-
  这是一份按代际持续维护的 Google Gemini 模型档案。覆盖 Gemini 3.7 Flash、Gemini 3.6 Flash、Gemini 3.5 Flash、Gemini 3.1 Flash-Lite、Gemini 2.5 Pro、Gemini 2.5 Flash、Gemini 2.0 Flash 和 Gemini 1.5 Pro，重点记录官方发布时间、Gemini API 定价、上下文与多模态能力，以及 Google 这条线从长上下文走向 Agent 的演化重点。
---

> Google 这条线最容易让人记住的两个词，一个是长上下文，一个是原生多模态。但如果你把最近几代串起来看，会发现它真正的主线是：先把“能吃下更多信息”做好，再把“能带工具去做事”推出来。

Gemini 的代际叙事和 OpenAI、Anthropic 都不太一样。

Google 不是每一代都把“编码最强”挂在最前面，它更像是在搭一个越来越完整的 agent 基座：长上下文、原生多模态、搜索、代码执行、浏览器与研究代理。

这篇先覆盖从 Gemini 1.5 Pro 到 Gemini 2.5 Pro 的完整主线代际。

如果后面 Gemini 再出新的主力代，我也会继续往上追加，不删旧代。

## 我还是用同一套 5 个维度看 Gemini

| 维度 | 我重点看什么 |
|------|-------------|
| 编码 | 代码基准和 Agent 编码是否进入前沿区 |
| 推理与知识工作 | thinking model 的实际收益有多大 |
| 多模态与电脑操作 | 图像、音频、视频、工具是否真正打通 |
| 上下文与 Agent 续航 | 长上下文是不是主线能力，不只是宣传点 |
| 成本透明度 | Gemini API 对输入、缓存、输出是否给清楚 |

## Gemini 主线模型总表

| 模型 | 官方发布日期 | 输入价格 | 缓存相关价格 | 输出价格 | 这一代最该记住的事 |
|------|-------------|---------|-------------|---------|------------------|
| Gemini 3.7 Flash | 2026-08-13 | Intro $0.75 / 1M（至 2026-12-31）；标准 $1.50 / 1M | 官方未公布 | Intro $3.75 / 1M（至 2026-12-31）；标准 $7.50 / 1M | Flash 系新主力：coding/agent/web dev 全面超越 3.6 Flash，intro 价格反而比 3.6 Flash 便宜一半 |
| Gemini 3.6 Flash | 2026-07-21 | $1.50 / 1M | Context caching $0.15 / 1M，storage $1.00 / 1M tokens / hour | $7.50 / 1M | Flash 系原最新主力：输出 token 少 17%、输出单价从 $9 降到 $7.50，computer use 变内置工具 |
| Gemini 3.5 Flash-Lite | 2026-07-21 | $0.30 / 1M | Context caching $0.03 / 1M，storage $1.00 / 1M tokens / hour | $2.50 / 1M | 350 output tokens/s 的 3.5 系最快模型，agentic 流程规模化选择 |
| Gemini 3.5 Flash | 2026-05-19 | $1.50 / 1M | Context caching $0.15 / 1M，storage $1.00 / 1M tokens / hour | $9.00 / 1M | Gemini 3 系列当前主力，agentic 和 coding 任务上的持续前沿表现 |
| Gemini 3.1 Flash-Lite | 2026-05-07 | $0.25 / 1M（text/image/video）或 $0.50 / 1M（audio） | Context caching $0.025 / 1M 或 $0.05 / 1M，storage $1.00 / 1M tokens / hour | $1.50 / 1M | Gemini 3 系列开端，主打速度、规模和成本效率 |
| Gemini 2.5 Pro | 2025-03-25 | $1.25 / 1M（200K 及以下）或 $2.50 / 1M（200K 以上） | Context caching $0.125 / 1M 或 $0.25 / 1M，storage $4.50 / 1M tokens / hour | $10 / 1M 或 $15 / 1M | Google 当前 thinking 主力，1M context，推理和代码一起冲顶 |
| Gemini 2.5 Flash | 2025-05-20 | $0.30 / 1M | Context caching $0.03 / 1M，storage $1.00 / 1M tokens / hour | $2.50 / 1M | 可控制思考预算的混合推理模型，平衡质量、成本和延迟 |
| Gemini 2.0 Flash | 2024-12-11 | $0.10 / 1M（text/image/video）或 $0.70 / 1M（audio） | Context caching $0.025 / 1M 或 $0.175 / 1M，storage $1.00 / 1M tokens / hour | $0.40 / 1M | 正式把 Gemini 推向 agentic era，原生工具调用和多模态输出上台面 |
| Gemini 1.5 Pro | 2024-02-15 | 官方未公布 | 官方未公布 | 官方未公布 | 1M context 的分水岭，Google 长上下文路线真正成型 |

<small>*数据来源：Google 官方 Gemini API Changelog、Gemini API Pricing 页面与官方博客，查询日期 2026-08-17。Gemini 3.7 Flash 于 2026-08-13 发布，官方定位为 Flash 系新主力；intro 定价 $0.75/$3.75 per 1M（有效期至 2026-12-31），2027-01-01 起恢复标准价 $1.50/$7.50 per 1M；其 context caching / storage 价格官方博客未直接公布，按“官方未公布”处理。Gemini 3.6 Flash 与 Gemini 3.5 Flash-Lite 于 2026-07-21 同日发布，均为 GA；官方同时宣布 Gemini 3.5 Pro 仍在与合作伙伴测试中。3.5 Flash Cyber 为限定试点模型（仅面向政府与受信合作伙伴），不在公开 API 定价中。Gemini 1.5 Pro 首发阶段官方只说明测试期与后续 pricing tiers，未给稳定模型级单价。Gemini 3.1 Flash-Lite 的 preview 版本发布于 2026-03-03，GA 版本发布于 2026-05-07。*</small>

## Gemini 3.7 Flash：把 Flash 系的“工作模型”身份再往前推一代

Gemini 3.7 Flash 发布于 2026 年 8 月 13 日。Google 对它的官方定位非常直接：**"our most intelligent workhorse model yet for coding and agents"**——Flash 系里最能干活的一代。

这代最值得记的是两件事同时发生：

- **能力明显提升**：在 FrontierCode 1.1 Main（43.6% vs 3.6 Flash 34.4%）、DeepSWE v1.1（65.3% vs 49.0%）、WebDev Arena Elo（1588 vs 1538）、GDP.pdf（34.0% vs 22.0%）、AutomationBench（30.4% vs 17.0%）等 coding / agent / 知识工作基准上全面超过 3.6 Flash。
- **intro 价格反而更低**：2026-12-31 前输入 $0.75/1M、输出 $3.75/1M，比 3.6 Flash 的 $1.50/$7.50 便宜一半；2027-01-01 起恢复标准价 $1.50/$7.50，与 3.6 Flash 持平。

另外几个值得注意的变化：

- 更强调“首次通过准确率”和“生产级代码”生成，减少开发者反复纠正的次数
- 多步规划和 tool call 的执行力更稳，更善于在遇到障碍时澄清意图
- Gemini Spark（Google 的 24/7 个人 AI agent）从发布当天起改用 3.7 Flash
- 安全侧继续沿用了 Frontier Safety 对 CBRN 和网络攻击滥用的防护

我的判断：3.7 Flash 不是一次小版本迭代，而是 Google 在 Flash 这条主工作模型线上明确放出的一次代际升级。它在能力上把 3.6 Flash 的“cost-per-task”叙事又往前推了一步：性能更强、intro 价格反而更低。对实际做 agent 和 coding 工作流的开发者来说，它是目前 Gemini Flash 系列里最值得优先接入的一代。

## Gemini 3.6 Flash：Flash 系主力从“便宜好用”转向“便宜且更能干活”

Gemini 3.6 Flash 于 2026 年 7 月 21 日发布（GA），官方博客的标题口径是“效率、延迟、可靠性都为了规模化 AI agent”。

这代最该记住的不是某个单项基准，而是两个结构性变化同时发生：

- **输出侧明显变便宜**：输入仍为 $1.50/1M，输出从 3.5 Flash 的 $9.00 降到 $7.50 / 1M，官方同时给出 Artificial Analysis Index 上输出 token 用量减少 17% 的说法（部分基准如 DeepSWE 官方称降幅可达 65%）。
- **computer use 成为内置工具**：不再是开发者自己接的客户端方案，而是 Gemini API 与 Gemini Enterprise 直接提供，配合 OSWorld-Verified 83.0%（3.5 Flash 为 78.4%）的分数。

官方给出几个关键对比：

- DeepSWE：3.6 Flash 49% vs 3.5 Flash 37%（更少无效编辑与执行循环）
- MLE Bench：63.9% vs 49.7%（ML research 显著提升）
- GDPval-AA v2：1421 vs 1349（知识工作）

安全侧，官方称 3.6 Flash 内置增强的 Frontier Safety 防护（CBRN 与 cyber offense 滥用域），同时训练目标是最小化对有益用途的拒绝。

我的判断：3.6 Flash 是 Google 把“主工作模型”叙事进一步推向 cost-per-task 的一代：能力提升 + token 更省 + 输出再降价，三件事绑在一次发布里。

## Gemini 3.5 Flash-Lite：3.5 系最快的模型，面向规模化 agent 流程

Gemini 3.5 Flash-Lite 与 3.6 Flash 同日（2026-07-21）发布，GA。

它的定位非常直白：低延迟、高吞吐，面向 agentic search、文档处理这类高频流程。

- 官方定价 $0.30 / 1M 输入、$2.50 / 1M 输出，是 3.5 系里最便宜的一档
- Artificial Analysis Index 上约 350 output tokens/s，是 3.5 系列里最快的
- 官方称在 agentic 和 coding 评测上大幅超越上一代 3.1 Flash-Lite：Terminal-Bench 2.1 54% vs 31%、GDM-MRCR v2 72.2% vs 60.1%、GDPval-AA v2 1140 vs 642
- 许多 agentic/coding 评测上甚至反超体积更大的 Gemini 3 Flash：SWE-Bench Pro 54.2% vs 49.6%、OSWorld-Verified 74.0% vs 65.1%
- computer use 同样是内置工具，支持 subagent 多步工作流

官方的定位气质很清晰：3.5 Flash-Lite 是“跑量”选项，3.6 Flash 是“主力干活”选项，两者共享同一套 agent 生态。

我的判断：Flash-Lite 这条线第一次在轻量档里也有了 agentic 能力背书，不再是单纯的便宜模型。

## Gemini 3.5 Flash：Gemini 3 系列把 agentic 和 coding 做成持续前沿表现

Gemini 3.5 Flash 发布于 2026 年 5 月 19 日。

Google 对它的官方定位非常直接："our most intelligent model for sustained frontier performance on agentic and coding tasks"。

这句话值得拆开看：

- **sustained**：不是单次跑分强，而是长程任务里保持高水平
- **agentic and coding**：主线明确指向 Agent 和编码
- **frontier performance**：Google 认为它处在前沿区

从价格也能看出它填补了 2.5 Pro 和 2.5 Flash 之间的空档：输入 $1.50/1M、输出 $9.00/1M，比 2.5 Pro 贵但比 2.5 Flash 更能打复杂任务。

这一代我还注意到了一个背景信号：同一天 Gemini API 推出了 Managed Agents 的 public preview，以及一个通用的 Antigravity Agent。Google 显然不只想卖模型，而是想把"模型 + 托管 Agent 运行时"一起推出来。

所以 3.5 Flash 不只是一次模型升级，它更像是 Google 把 Gemini 从"能调工具的模型"往"能长期自主运行的 Agent 平台"推进的又一个节点。

## Gemini 3.1 Flash-Lite：Gemini 3 系列从轻量路线开始

Gemini 3.1 Flash-Lite 的 GA 版本发布于 2026 年 5 月 7 日（preview 版本早在 2026 年 3 月 3 日就已推出）。

它的定位非常清晰：speed、scale、cost efficiency。输入 $0.25/1M、输出 $1.50/1M，是 Gemini 3 系列里最便宜的主力模型。

我把这代放进主线档案，不是因为它是性能最强，而是因为它是 Gemini 3 系列的开端。从命名上也能看出 Google 的产品线开始分叉：

- 3.5 Flash 走"持续前沿表现"
- 3.1 Flash-Lite 走"轻量、低成本、规模化"

这意味着 Gemini 的产品矩阵不再只是 Pro / Flash 两档，而是在 Flash 内部也分出了性能档和成本档。

对于开发者来说，3.1 Flash-Lite 很可能是 Gemini 3 系列里最先被大规模接入日常任务的那一款。

## Gemini 2.5 Pro：Google 把 thinking model 正式扶正

Gemini 2.5 Pro 发布于 2025 年 3 月 25 日。

这代最关键的变化，是 Google 不再只是强调“原生多模态”或者“超长上下文”，而是开始明确把 thinking model 当成主力模型来讲。

它在官方口径里几乎就是最强复杂任务模型，主打推理、代码和长上下文。

这一代我最看重三件事：

- 1M context 继续保留，而且是主打能力，不是边缘特性
- thinking model 变成主线，不再只是特殊模式
- Gemini 在编码和 Agent 化上开始真正接近头部竞争区

如果你过去对 Google 模型的印象还是”会看很多内容、但工程味不够浓”，2.5 Pro 是很值得重看的那一代。

## Gemini 2.5 Flash：可控制思考预算的混合推理中坚

Gemini 2.5 Flash 发布于 2025 年 5 月 20 日。

这代的价值在于它填补了 2.5 Pro 和 2.0 Flash 之间的空白：它既有 thinking 能力，又能让用户控制”思考预算”，在质量、成本和延迟之间做权衡。

对于开发者来说，这非常重要。因为不是每个任务都需要 Pro 级别的深度推理，但也不是每个任务都能接受纯快模型的表面输出。2.5 Flash 的定位就是”需要推理，但不需要顶配”的场景。

它的核心卖点：

- 1M context 保留
- 可控制的 thinking budget
- 比 2.5 Pro 更快、更便宜
- 支持 tool use 和 function calling

如果你在做 Gemini 选型，2.5 Flash 很可能是实际用得最多的那款，因为它在能力和成本之间找到了一个更实用的平衡点。

## Gemini 2.0 Flash：Google 真正喊出 agentic era 的那一代

Gemini 2.0 Flash 是 2024 年 12 月 11 日发布的。

如果要找 Google 路线里的一个标志性节点，这代比 2.5 Pro 还关键。

因为“agentic era”这句话，就是在这里被正式喊出来的。

Google 在这代里做了几件很重要的事：

- 原生 image/audio output
- 原生 tool use
- Search、code execution、第三方函数一起进模型工作流
- Project Astra、Project Mariner、Jules 这些研究原型开始和 Gemini 主线绑得更紧

这说明 Gemini 不再只是一个更会理解多模态的大模型，而是在往“能调工具、能跨界面、能长期协作”的方向走。

## Gemini 1.5 Pro：别低估它在历史里的位置

很多人今天回看 Gemini 1.5 Pro，会先想到“1M context”。

这没错，但还不够。

它更重要的意义是，Google 在这一代真正把“长上下文”做成了自己的品牌性优势。

当时不少模型也在谈长文本，但 Gemini 1.5 Pro 把 1M tokens、长视频、长音频、长代码仓和 NIAH 99% 这些概念一起打包，让“超长上下文”第一次显得真的能落地。

如果没有 1.5 Pro，后面的 2.0 Flash 和 2.5 Pro 不会这么自然。

因为 Google 后面几代的 Agent 叙事，本质上都建立在“模型能先吃下更多上下文”这件事上。

## 我对 Google 这条线的实际判断

Google 从 Gemini 1.5 Pro 到 Gemini 3.5 Flash 的完整主线，我会概括成三步：

- 先把超长上下文做成硬差异
- 再把多模态和工具链组织成 Agent 能力
- 然后在 Gemini 3 系列里把 agentic/coding 表现和轻量成本效率同时推出来

这条路线和 OpenAI、Anthropic 都不一样。

它不一定每一代都给你”最会写代码”的第一印象，但它很擅长把模型放进一个更完整的生态里：

- Gemini API
- Search
- code execution
- research assistant
- browser / assistant 原型
- Managed Agents

从谱系看，这条线的演进很清晰：

- Gemini 1.5 Pro：把 1M context 做成品牌性优势
- Gemini 2.0 Flash：正式喊出 agentic era，原生工具调用和多模态输出
- Gemini 2.5 Flash：引入可控制思考预算的混合推理
- Gemini 2.5 Pro：把 thinking model 扶正，编码和推理一起冲顶
- Gemini 3.1 Flash-Lite：Gemini 3 系列从轻量、规模化路线开始
- Gemini 3.5 Flash：把 agentic 和 coding 的 sustained frontier performance 做成主线
- Gemini 3.5 Flash-Lite：3.5 系最快的轻量档，agentic 流程规模化选项
- Gemini 3.6 Flash：输出更省更便宜，computer use 内置于 API
- Gemini 3.7 Flash：Flash 系新主力，coding / agent / web dev 全面超越 3.6 Flash，intro 价格反而更低

所以如果你的问题是”Gemini 最适合什么场景”，我会优先想到这些：

- 长文档、长代码仓、长音视频理解
- 需要多模态 + 搜索 + 工具一起配合的任务
- 想在 Google 生态里搭 Agent 或研究工作流
- 需要控制推理成本的中等复杂度任务（2.5 Flash / 3.1 Flash-Lite）
- 想要 Gemini 3 系列里更偏前沿 agentic/coding 表现的场景（3.5 Flash）

如果是极纯粹的终端编码 Agent 竞赛，Gemini 不一定是第一反应。

但如果你要的是”信息量大、模态多、工具多、需要系统协同”的场景，Google 这条线一直很有自己的味道。

## 官方来源

- Gemini API Pricing: `https://ai.google.dev/gemini-api/docs/pricing`
- Gemini API Changelog: `https://ai.google.dev/gemini-api/docs/changelog`
- Introducing Gemini 3.7 Flash: `https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/`
- Introducing Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber: `https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/`
- Gemini 2.5: Our most intelligent AI model: `https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-model-thinking-updates-march-2025/`
- Introducing Gemini 2.0: our new AI model for the agentic era: `https://blog.google/innovation-and-ai/models-and-research/google-deepmind/google-gemini-ai-update-december-2024/`
- Our next-generation model: Gemini 1.5: `https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/`
