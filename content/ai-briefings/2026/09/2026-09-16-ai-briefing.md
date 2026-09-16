---
title: "2026-09-16 AI 简报：OpenAI 测试 Sponsored Agents；Google 发布 Gemini 3.8 Live；Mistral 接入 Firefox"
date: "2026-09-16"
published: true
brief: "本期确认 6 件动态：OpenAI 展开 ChatGPT Ads 与 GPT-6 Astra 客户案例；Google 发布实时语音模型并介绍检索方法；Meta 推出 Meta One；Mistral 与 Mozilla 合作。"
tags:
  - AI
  - OpenAI
  - Google
  - Meta
  - Mistral
  - GPT-6 Astra
  - Agent
  - AI产品
---

9 月 14 日至 16 日（北京时间），重点厂商的更新集中在 AI Agent、实时语音、商业化和浏览器入口。OpenAI 同时推进广告平台与生产系统案例，Google 和 Mistral 则把模型能力接入更具体的工作流。

> 覆盖说明：12 家重点厂商均完成至少一条官方 primary 路径检查，coverage 为 sufficient。本轮 10/10 Feed 成功。Kimi、智谱和 MiniMax 的部分入口存在重定向或动态正文限制。Perplexity 的 9 月 Changelog 只有月份，相关候选因日期不明未入选。DeepSeek 的 V4 Pro 路由说明存在官方页面冲突，本期未将其写入动态。

## 速览

- OpenAI 展示 Perplexity 用 GPT-6 Astra 执行端到端系统任务
- Google 发布 Gemini 3.8 Live 与 Live Extended Thinking
- Meta 推出 Meta One 订阅服务，扩大 AI 使用额度
- Google Research 用 Retrieve-for-Train 降低复杂搜索推理开销
- OpenAI 测试 Sponsored Agents，并推出 ChatGPT Ads 商业工具
- Mistral 与 Mozilla 合作，把开放模型带入 Firefox Smart Window

## 重点动态

### OpenAI 展示 Perplexity 用 GPT-6 Astra 执行端到端系统任务

OpenAI 于 9 月 14 日发布 Perplexity 客户案例。Perplexity 使用 GPT-6 Astra 编写通信、修改软件并监控生产系统。官方还称，团队可以更少频率地检查模型执行结果。

案例还覆盖端到端测试。模型会为应用生成测试程序，并模拟其他服务的响应。Perplexity 因此可以检查从输入到结果的完整工作流。

这不是新模型或 API 发布。它与上一期 Cognition 案例不同。新案例把 Astra 的应用从软件自测扩展到生产系统操作。

### Google 发布 Gemini 3.8 Live 与 Live Extended Thinking

Google DeepMind 于 9 月 15 日发布 Gemini 3.8 Live。同步发布的 Live Extended Thinking 面向复杂任务。两款模型都强调实时对话和近实时推理。

Live 可处理近实时视觉输入，并在对话继续时后台执行工具和 API 调用。Extended Thinking 可以边说边推理，并播报多步任务进度。

Gemini 3.8 Live 正在通过 Gemini API、AI Studio 和 Search Live 推出。企业端先在 Gemini Enterprise 私有预览，并将扩展到 Customer Experience。

Live Extended Thinking 同样提供 Gemini API 和 AI Studio 接入。企业端先在 Gemini Enterprise 私有预览，并将扩展到 Customer Experience 和 Workspace。普通用户可在 Gemini Live 中使用，Workspace 则需要符合条件的 Google AI 订阅。

Google 还披露 97 种语言切换、工具调用和多个基准成绩。相关数字来自官方自述，实际效果仍需独立测试。

### Meta 推出 Meta One 订阅服务，扩大 AI 使用额度

Meta 于 9 月 15 日推出 Meta One。服务覆盖 Instagram、Facebook、WhatsApp 和 Meta AI。它把更多 AI 使用额度、表达功能和创作者工具放入订阅方案。

Meta One 目前分为单产品、个人组合以及创作者和企业方案。官方称已上线超过 50 项功能，并称订阅和试用累计达到 1500 万。

价格从单产品每月 2.99 美元起。个人 Core 组合为 7.99 美元，Premium 为 19.99 美元。企业方案最高还包括每月 499 美元的 Max 档位。

Meta 表示，应用和 Meta AI 的核心体验仍保持免费。收费方案主要扩大生成图片、视频、语音效果和 Meta Business Agent 的使用额度。

### Google Research 用 Retrieve-for-Train 降低复杂搜索推理开销

Google Research 于 9 月 15 日介绍 Retrieve-for-Train。方法先用离线强化学习训练查询扩展模型。再把优化后的查询行为编译成轻量扩散检索器。

该检索器一次生成完整的结果集合，而不是逐个生成查询。研究团队称，它在固定数据库中兼顾多样性、相关性和结果互补性。

官方实验使用 5390 万参数的扩散模型。文章称其推理速度比自回归方法快 12 至 20 倍。大批量场景的延迟也从接近 50 秒降到亚秒至数秒。

这是一项研究方法，不是面向公众的新产品。它的价值在于把复杂搜索的思考成本前置到训练阶段。检索系统因此可以更快生成互补结果。

### OpenAI 测试 Sponsored Agents，并推出 ChatGPT Ads 商业工具

OpenAI 于 9 月 16 日发布 ChatGPT Ads 的新广告体验。公司正在测试 Sponsored Agents。用户点击广告后，可以与带有明确标识的商家 Agent 对话。

Sponsored Agent 的对话与 ChatGPT 独立回答分开。当前测试仅面向美国部分广告主。OpenAI 没有把它描述为所有用户已获得的功能。

广告主现在可以用自然语言创建、更新和分析广告。Ads Manager 还会根据落地页和目标提供文案与图片建议。广告主可在投放前审核和修改这些建议。

ChatGPT Ads 同时接入 HubSpot 和 Shopify。美国 Shopify 商户可从今天起使用相关应用。其他市场预计从 9 月 23 日起按可用地区陆续开放。

这标志 OpenAI 将对话入口、商家 Agent 和广告管理工具放进同一平台。对用户而言，广告与独立回答的边界是否清晰，将成为体验和治理重点。

### Mistral 与 Mozilla 合作，把开放模型带入 Firefox Smart Window

Mistral 于 9 月 16 日宣布与 Mozilla 合作。Firefox Smart Window beta 已开始由 Mistral 模型提供能力。它可帮助用户理解复杂搜索、记住浏览线索并整理标签页信息。

首批支持法国和北美用户。英国和德国预计在今年晚些时候跟进。Mistral 称双方会围绕区域语言、方言和文化语境继续调优模型。

Mozilla 方面强调，Smart Window 默认不会把对话保存在其服务器上。Mistral 还同意零数据留存。该合作把开放模型带入浏览器分发渠道。

这不是单纯的模型授权消息。它同时涉及浏览器入口、隐私承诺和地域化模型服务。开放权重模型能否获得稳定分发，取决于这些产品和治理安排。

## 为什么值得关注

本期动态共同指向 AI 从模型能力转向入口和流程。OpenAI 将 Agent 放进广告交易与生产系统。Google 把语音模型接入工具调用和企业工作。

Meta 通过订阅扩大 AI 使用额度。Mistral 则借助 Firefox 触达浏览器用户。模型公司的竞争因此同时发生在能力、分发、计费和隐私边界。

Google Research 的方法说明，推理成本也可以被重新分配。把复杂搜索的探索过程放到训练阶段，可能降低线上延迟。官方结果仍需在更多数据集和生产环境中复现。

## 来源

- [官方] [OpenAI — Perplexity trusts GPT-6 Astra with end-to-end systems](https://openai.com/index/perplexity-improving-accuracy-with-astra/)
- [官方] [Google DeepMind — Introducing Gemini 3.8 Live and 3.8 Live Extended Thinking](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/)
- [官方] [Meta — Introducing Meta One: A Subscription Service With More Features and AI to Create, Connect, and Stand Out](https://about.fb.com/news/2026/09/introducing-meta-one-subscription-service-more-features-ai/)
- [官方] [Google Research — Bypassing inference bottlenecks: Accelerating complex AI search with Retrieve-for-Train](https://research.google/blog/bypassing-inference-bottlenecks-accelerating-complex-ai-search-with-retrieve-for-train/)
- [官方] [OpenAI — Reimagining advertising with AI](https://openai.com/index/reimagining-advertising-with-ai/)
- [官方] [Mistral — Mistral and Mozilla are bringing open, private and multilingual AI to your web browser](https://mistral.ai/news/mistral-x-mozilla/)
