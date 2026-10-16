---
title: "2026-10-16 AI 简报：Meta 发布开放权重模型 Muse Spark Open；xAI 发布 Grok Voice 3.0"
date: "2026-10-16"
published: true
brief: "本期确认 6 件动态：Meta 发布开放权重多模态模型 Muse Spark Open，可在 Mac 本地运行；xAI 发布 Grok Voice 3.0；Google DeepMind 与新加坡共建端侧诈骗检测模型；OpenAI 推出 Rosalind 学术计划；Anthropic 公布独立评估方访问方案，并为美国中期选举补充保障。"
tags:
  - AI
  - Meta
  - xAI
  - Google
  - OpenAI
  - Anthropic
  - 模型
  - 安全
---

北京时间 10 月 14 日至 16 日，模型发布继续向本地化与新形态延伸。Meta 用开放权重把大模型带进 Mac，xAI 与 Google 分别押注语音与端侧安全。治理侧，Anthropic 与 OpenAI 同一天公布评估开放与科研支持安排。

> 覆盖说明：本期 coverage 为 degraded。Perplexity 变更日志仅月粒度；智谱官方新闻页条目无日期、z.ai 博客无法读取；MiniMax 官方页重定向至未登记域名。三家未完成合格官方检查，缺口不等于对应厂商本期无更新。Meta 新模型的官方发布页位于未被来源注册表收录的新域名，本条以 TechCrunch 与 The Verge 双源报道确认。

## 速览

- Meta 发布开放权重多模态模型 Muse Spark Open，与 Apple 合作实现 Mac 本地运行。
- xAI 发布 Grok Voice 3.0，官方称其登顶语音对话评测榜。
- Google DeepMind 与新加坡政府共建端侧诈骗检测模型，对话数据不出设备。
- OpenAI 推出 Rosalind 学术计划，向学术实验室提供 GPT-Rosalind 赞助访问。
- Anthropic 向 METR 等独立评估方开放接近员工的访问权限。
- Anthropic 为 2026 美国中期选举接入官方投票数据并部署新分类器。

## 重点动态

### Meta 发布开放权重模型 Muse Spark Open

据 The Verge 与 TechCrunch 报道，Meta 于当地时间 10 月 15 日发布开放权重模型 Muse Spark Open，参数量为 8160 亿。报道称，Meta 与 Apple 合作，通过 Apple 的 MLX 框架让模型可在 Mac 上本地运行；通过该框架，两台 M5 Ultra Mac Studio 即可在桌面运行整个模型。

开放权重意味着开发者可以直接下载权重并本地部署，不必依赖云端 API。与 10 月 12 日发布、未开放权重的 Muse Wonder 相比，这次发布的路线明显不同。在云端之外，Meta 把大模型带到了端侧，部署成本与数据流向将随之改变。

### xAI 发布语音模型 Grok Voice 3.0

xAI 于当地时间 10 月 14 日发布 Grok Voice 3.0。官方称该模型是全球最具智能的语音模型，在 Speech-to-Speech Index 上以 86.9 分排名第一。定价为 API 每分钟 0.08 美元，官方同时称其端到端延迟低于一秒、成本低于其他前沿模型。

官方还称，该模型已支撑 Tesla 与 SpaceX 每天数百万次对话，语音能力正在进入车机与实时服务场景。在把 Grok 打包进整合订阅之后，xAI 又把语音单列为独立模型线，订阅与模型的分工变得更清晰。

### Google DeepMind 与新加坡共建端侧诈骗检测模型

Google DeepMind 与新加坡政府科技局合作，发布面向诈骗检测的端侧模型。该模型基于轻量化的 Gemma 微调，可在用户设备上本地分析对话内容；官方于当地时间 10 月 14 日公布这一合作。

官方称，系统会在对话中实时识别操控意图，并在用户转账或提供凭证前发出提醒。模型完全在设备端运行，新加坡政府与 Google 都无法访问用户对话；训练使用主权沙箱内的匿名数据，后续与政府分阶段推广。

### OpenAI 推出 Rosalind 学术计划

OpenAI 发布 Rosalind 学术计划，面向符合条件的学术实验室提供 GPT-Rosalind 的赞助访问。该模型聚焦生命科学领域，计划同时提供推进研究的配套工具。消息于北京时间 10 月 16 日凌晨公布。

对高校研究者而言，这条通道降低了使用专业模型的门槛。具体的名额规模与申请条件，以官方页面后续说明为准。把专业模型放进学术场景，也意味着厂商开始经营科研生态。

### Anthropic 向独立评估方开放接近员工的访问

Anthropic 于当地时间 10 月 15 日公布独立评估方安排的更新。按官方说明，METR 研究者获得接近员工的访问权限，包括硬件与内部工具。该权限覆盖对风险、事件记录与内部实践的审查。

官方说明显示，METR 可以独立发布评估发现。Anthropic 同时保留对架构与客户信息等敏感数据删节的权利。除 METR 外，SecureBio 与 Accenture 等机构也在分层访问框架内参与。TechCrunch 称，这相当于把员工级视角开放给外部评估者。

### Anthropic 为 2026 美国中期选举补充保障

Anthropic 于当地时间 10 月 14 日发布面向美国中期选举的保障安排。Claude 将接入 Democracy Works 的官方投票数据，并在选举夜及随后数日展示更新的结果；政策层面，使用规范新增了禁止欺骗性竞选的条款。

10 月初 Anthropic 曾更新使用政策，禁止选举干扰。本次公告把要求落到具体选举场景，并配上数据接入与检测手段；官方还部署了针对多步滥用行为的新分类器。厂商的选举保障正在从政策声明走向产品与数据层面的具体动作。

## 为什么值得关注

模型竞争的主战场正在扩展。Meta 把开放权重与 Mac 本地运行绑定，xAI 把语音单列为模型线，Google 把检测模型放进端侧设备。能力形态与部署位置，正在成为新的差异点。

治理与评估也在机构化。Anthropic 向外部评估者开放权限，并为选举场景加装数据与分类器；OpenAI 用学术计划扩展科研入口。厂商正把安全与信任议题，变成可展示的产品安排。

对行业而言，开放权重加本地运行会改写部署成本的算法；对用户而言，模型正被封装进更多硬件与日常场景。这一轮更新里，能力、成本与信任被同时放上了台面。

## 来源

- [媒体报道] [TechCrunch — Meta launches an open-weight AI model that runs on Macs](https://techcrunch.com/2026/10/15/meta-launches-an-open-weight-model-that-runs-on-macs/)
- [媒体报道] [The Verge — Meta and Apple team up to make Muse AI models run better on Macs](https://www.theverge.com/news/1012293/meta-apple-muse-spark-open-ai-model-mlx)
- [官方] [xAI — Introducing Grok Voice 3.0](https://x.ai/news/grok-voice-3)
- [官方] [Google DeepMind — Google DeepMind and Singapore Government collaborate to build fine-tuned AI model for scam detection](https://deepmind.google/blog/on-device-ai-scam-detection-mddi/)
- [官方] [OpenAI — Bringing GPT-Rosalind to academic research labs](https://openai.com/index/introducing-the-rosalind-academic-plan)
- [官方] [Anthropic — An update on independent evaluators](https://www.anthropic.com/news/an-update-on-independent-evaluators)
- [媒体报道] [TechCrunch — Anthropic is letting METR researchers look under the hood with employee-level access](https://techcrunch.com/2026/10/15/anthropic-is-letting-metr-researchers-look-under-the-hood-with-employee-level-access/)
- [官方] [Anthropic — Preparing for the 2026 US midterms](https://www.anthropic.com/news/2026-us-midterms)
