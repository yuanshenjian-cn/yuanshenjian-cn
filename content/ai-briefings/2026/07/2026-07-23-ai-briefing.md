---
title: "AI 简报 · 2026-07-23"
date: "2026-07-23"
brief: "Google 发布 Gemini 3.6 Flash、3.5 Flash-Lite 和 3.5 Flash Cyber 三款新模型；AMD 向 Anthropic 投资最高 50 亿美元并供应 2GW GPU 算力；美国财政部威胁制裁，白宫指控月之暗面蒸馏 Anthropic Fable；OpenAI 发布 Presence 企业 AI Agent 平台。"
published: true
tags:
  - AI
  - Google
  - Anthropic
  - AMD
  - OpenAI
  - 月之暗面
  - Regulation
---

过去两天，AI 行业在模型能力、基础设施投资与地缘政治三个维度上同时出现重大动态。Google 发布了三款 Gemini 新模型，AMD 与 Anthropic 达成了超大规模芯片—投资捆绑协议，而华盛顿针对中国 AI 模型的制裁威胁正在升级。

## 速览

- Google DeepMind 发布 Gemini 3.6 Flash、3.5 Flash-Lite 和 3.5 Flash Cyber，定价最高降价 80%，3.6 Flash 输出 token 消耗减少 17%
- AMD 宣布向 Anthropic 投资高达 50 亿美元，Anthropic 将部署多达 2GW 的 AMD Instinct MI450 GPU
- 美国财政部部长 Bessent 威胁对涉嫌蒸馏 Anthropic Fable 的月之暗面实施制裁与实体清单，白宫 CTO Kratsios 公开指控月之暗面违规获取 Nvidia GB300
- OpenAI 发布 Presence 企业 AI Agent 平台，支持在客户服务和内部流程中部署可信语音与聊天 Agent

## 重点动态

### Google 发布 Gemini 3.6 Flash、3.5 Flash-Lite 与 3.5 Flash Cyber

Google DeepMind 于 7 月 21 日发布三款新模型。Gemini 3.6 Flash 是新一代主力模型，定价 $1.50/百万输入 token、$7.50/百万输出 token，据 Artificial Analysis Index 显示输出 token 消耗较 3.5 Flash 减少 17%，在 DeepSWE 编码基准上从 37% 提升至 49%，MLE Bench 机器学习研究基准上从 49.7% 提升至 63.9%。Gemini 3.5 Flash-Lite 为系列最快模型，输出速度达 350 token/s，定价 $0.30/$2.50 每百万 token，在编程与 Agent 任务上超越 3 Flash。Gemini 3.5 Flash Cyber 是专注于网络安全的专用模型，将在 CodeMender 中以有限访问试点形式向政府和可信合作伙伴提供。Google 同时确认 Gemini 3.5 Pro 仍在与合作伙伴测试中，尚未公测。

### AMD 向 Anthropic 投资高达 50 亿美元

AMD 于 7 月 22 日宣布与 Anthropic 达成战略合作，将向后者投资最高 50 亿美元。Anthropic 将部署多达 2GW 的 AMD Instinct MI450 GPU（基于 Helios 机架系统），首批 1GW 预计 2027 年上半年上线。双方还将启动多年工程协作，AMD 将在其软件工程与产品开发中全面采用 Claude。Anthropic 联合创始人兼首席算力官 Tom Brown 表示，该合作将帮助公司优化计算能力用于训练和部署 Claude。这是继 Google、Amazon、SpaceX、TeraWulf 之后，Anthropic 签署的又一重大基础设施协议。

### 美国 Treasury 威胁制裁，White House 指控月之暗面蒸馏 Anthropic 模型

美国白宫科技政策办公室主任 Michael Kratsios 于 7 月 22 日在 X 平台公开指控中国 AI 公司月之暗面（Moonshot）对 Anthropic 的 Fable 模型实施大规模蒸馏攻击，并质疑其获取 Nvidia GB300 服务器是否符合美国出口管制规则。财政部部长 Scott Bessent 随后跟进，称此类行为若构成知识产权盗窃，制裁与实体清单将摆上桌面。月之暗面上周刚以开源权重形式发布了表现突出的 Kimi K3 模型，其先进能力引发了业界对中美 AI 能力差距缩小的新一轮讨论。部分专家质疑 K3 能否在 Fable 发布不到三周内仅靠蒸馏达到当前水平。

### OpenAI 发布 Presence 企业 AI Agent 平台

OpenAI 于 7 月 22 日发布 OpenAI Presence，一个面向企业级场景的 AI Agent 平台。Presence 旨在帮助企业部署可信的语音和聊天 Agent，用于客户服务与内部流程自动化。该产品标志着 OpenAI 在企业级 Agent 部署领域的正式布局。

## 来源

### Google 发布 Gemini 3.6 Flash、3.5 Flash-Lite 与 3.5 Flash Cyber

- [官方] [Google DeepMind — Introducing Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber](https://deepmind.google/blog/introducing-gemini-36-flash-35-flash-lite-and-35-flash-cyber/)

### AMD 向 Anthropic 投资高达 50 亿美元

- [媒体报道] [The Verge — AMD commits up to $5 billion to Anthropic](https://www.theverge.com/ai-artificial-intelligence/969285/amd-anthropic-ai-infrastructure-deal)

### 美国 Treasury 威胁制裁，White House 指控月之暗面蒸馏 Anthropic 模型

- [媒体报道] [TechCrunch — Treasury threatens sanctions after White House claims Moonshot distilled Anthropic's Fable](https://techcrunch.com/2026/07/22/treasury-threatens-sanctions-after-white-house-claims-moonshot-distilled-anthropics-fable/)

### OpenAI 发布 Presence 企业 AI Agent 平台

- [官方] [OpenAI — Introducing OpenAI Presence](https://openai.com/index/introducing-openai-presence)
