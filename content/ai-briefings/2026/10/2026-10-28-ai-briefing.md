---
title: "2026-10-28 AI 简报：OpenAI 发布 GPT-6.1 Terra；DeepMind 推出 Genie 4"
date: "2026-10-28"
published: true
brief: "本期确认 6 件动态：OpenAI 发布 GPT-6.1 Terra；Google DeepMind 推出 Genie 4 世界模型；Anthropic 递交 S-1 启动上市流程；月之暗面发布 Kimi K3.1 Pro；OpenAI 模型进入 Google Cloud Model Garden；Mistral 发布 Voxtral 3 语音家族。"
tags:
  - AI
  - OpenAI
  - Google
  - Anthropic
  - 月之暗面
  - Mistral
  - 模型
  - IPO
  - 开源
  - API
---

北京时间 10 月 20 日至 28 日，前沿模型的更新节奏明显加快。OpenAI 用更低价格补上视觉与电脑操作档位，DeepMind 把世界模型推向实时交互。资本与分发层面的变化也在同步发生。

> 覆盖说明：本期 coverage 为 degraded。xAI 官方新闻页返回 403，Perplexity 变更日志只有月份粒度，智谱官方页无条目日期，MiniMax 官网重定向后无日期化更新。上述厂商未完成合格官方检查，缺口不代表本期无更新。Google DeepMind 的 Feed 解析失败，已用其官方博客页人工补看。

## 速览

- OpenAI 发布 GPT-6.1 Terra，105 万 token 上下文，输入每百万 token 1 美元。
- Google DeepMind 推出 Genie 4 世界模型，支持实时语音与画面联动。
- Anthropic 向 SEC 递交 S-1，拟以代码 ANT 在纳斯达克上市。
- 月之暗面发布 Kimi K3.1 Pro，3T 级开放权重，权重计划 11 月 4 日前放出。
- OpenAI 的前沿模型与 Codex 工作流将进入 Google Cloud 的 Gemini Model Garden。
- Mistral 发布 Voxtral 3 语音家族，配套一套语音代理 SDK。

## 重点动态

### OpenAI 发布 GPT-6.1 Terra，把电脑操作压到更低价格

OpenAI 于 10 月 26 日发布 GPT-6.1 Terra，定位为速度与成本优先的通用模型。官方称其面向视觉推理、精确电脑操作与自然写作三类任务。

该模型上下文窗口为 105 万 token，单次最多输出 12.8 万 token。定价为输入每百万 token 1 美元，缓存输入 0.05 美元，输出 5 美元。

接口层面，Terra 支持 Chat Completions、Responses 与 Batch 三种调用方式。推理强度可以从关闭一路调到 max 档。

对开发者来说，关键变化是价格档位下移。视觉理解与电脑操作此前多集中在中高端模型，现在可以用更低单价批量运行。

### Google DeepMind 推出 Genie 4，世界模型开始实时响应语音

Google DeepMind 于 10 月 27 日发布 Genie 4，这是其新一代世界模型。官方称它能在实时交互中生成画面、环境音与角色对话。

与上一代相比，Genie 4 增加了实时语言操控。用户可以用自然语言改变天气、机位、物体或人物。Gemini 负责把这些指令转成场景变化。

官方把可用范围限定为研究预览。首批开放给可信测试者，随后扩展至 Google AI Ultra 订阅者与 Gemini API、AI Studio 的早期伙伴。

限制同样明确。官方承认长会话一致性、物体持久性、复杂物理、音频准确度与文字可读性仍不理想。

世界模型的价值在于让模型预测动作后果。实时性若能稳定，机器人与游戏内容生产的试错成本会明显下降。Google 也在把 Genie 4 与 Gemini 4 Argon 一起用于机器人仿真。

### Anthropic 递交 S-1，正式启动上市流程

Anthropic 于 10 月 26 日向美国证券交易委员会递交 S-1 注册声明。这标志着其首次公开募股流程正式启动。

公司计划在纳斯达克全球精选市场上市，股票代码为 ANT。发行股数与价格区间尚未确定，注册声明也还未生效。

承销商为高盛与摩根士丹利。招股书需要通过正式渠道获取，当前不得视为可售证券。

对依赖 Claude 的企业客户来说，上市会改变信息披露节奏。财务与治理细节将逐步公开，模型路线的可预期性随之提高。

### 月之暗面发布 Kimi K3.1 Pro，权重计划 11 月 4 日前开放

月之暗面于 10 月 24 日发布 Kimi K3.1 Pro，官方称其为迄今最强的 3T 级开放权重模型。该模型基于 Kimi K3 做后训练，上下文窗口为 100 万 token。

官方公布的终端任务成绩为 65.7%，高于 GPT-6 Astra 的 58.2%，略低于 Claude Opus 5.5 的 66.4%。长程编码基准为 61.2%，高于 K3 的 55.95%。

权重尚未放出。官方表示完整权重将在 11 月 4 日前开放，API 已提供 kimi-k3.1-pro 与高速版两个模型名。企业访问默认关闭，需要管理员开启。

另一个细节值得注意。官方称通过数据清理刻意降低了网络安全能力，受限版本该项基准为 81.0%，未受限检查点为 90.5%。

### OpenAI 模型进入 Google Cloud 的 Model Garden

OpenAI 于 10 月 21 日宣布，其前沿模型与 Codex 工作流将进入 Google Cloud 的 Gemini Model Garden。客户可通过 Google Cloud Marketplace 采购并合并计费。

OpenAI 强调微软仍是其主要云合作伙伴。此举意味着 OpenAI 模型同时出现在美国三家主要云厂商的货架上。

对采购方来说，模型选择与云承诺可以放进同一张账单。这降低了多模型策略的采购摩擦，也让云厂商的竞争从模型转向分发。

### Mistral 发布 Voxtral 3，语音能力打包成一套接口

Mistral 于 10 月 20 日发布 Voxtral 3 语音模型家族，包含转录、实时转录与语音合成三类模型。官方同时提供一套基于 LiveKit 的语音代理 SDK。

转录覆盖 50 多种语言，实时版本延迟低于 500 毫秒。语音合成覆盖 35 种以上语言与 50 种以上方言，支持情感、语速与重音控制。

定价按分钟与字符计价。批量迷你转录为每分钟 0.0035 美元，实时转录为 0.008 美元，语音代理为每分钟 0.04 至 0.08 美元。

语音栈的整合度是这次的重点。把听、想、调用工具与说话放进同一条流式管线，能减少自建拼接的工程量。对要做客服与语音助手的中小团队，省下的主要是集成时间与延迟调优成本。

## 为什么值得关注

本期六件事指向同一条线：模型能力在降价，分发在变宽。Terra 把视觉与电脑操作拉到低价档，Kimi 把开放权重的上限继续抬高。

当同一批模型可以在三家云上买到，竞争重心会从“有没有”转向“多少钱、多快”。世界模型与语音栈的成熟，则把交互从文字推向实时环境。

对使用方来说，选型窗口在扩大。代价是评估成本上升，团队需要更明确的场景基准，而不是只看榜单名次。

## 来源

- [官方] [OpenAI API Changelog](https://developers.openai.com/api/docs/changelog)
- [官方] [OpenAI — Introducing GPT-6.1 Terra](https://openai.com/index/introducing-gpt-6-1-terra)
- [媒体报道] [TechCrunch — Google's Genie 4 world model adds audio, more realistic worlds, and real-time steering](https://techcrunch.com/2026/10/27/googles-genie-4-world-model-adds-audio-more-realistic-worlds-and-real-time-steering/)
- [媒体报道] [The Verge — Google's next Genie AI model generates more realistic experiences](https://www.theverge.com/tech/1019076/google-genie-4-ai-model)
- [官方] [Anthropic — Anthropic files S-1 with the SEC for proposed initial public offering](https://www.anthropic.com/news/s1-sec)
- [媒体报道] [TechCrunch — Anthropic officially files for its public debut](https://techcrunch.com/2026/10/26/anthropic-officially-files-for-its-public-debut/)
- [官方] [Kimi — Introducing Kimi K3.1 Pro](https://www.kimi.com/blog/kimi-k3-1-pro)
- [官方] [OpenAI — OpenAI models are coming to Google Cloud](https://openai.com/index/openai-models-google-cloud)
- [官方] [Mistral — Voxtral 3](https://mistral.ai/news/voxtral-3/)
