---
title: "AI 简报 · 2026-06-10"
date: "2026-06-10"
brief: "Anthropic 发布最强公开模型 Claude Fable 5，OpenAI 正式提交 IPO 申请，Google 推出实时语音翻译 Gemini 3.5 Live Translate。"
published: true
tags:
  - AI
  - Anthropic
  - OpenAI
  - Google
  - Perplexity
---

这是 AI 竞争白热化的一天。

Anthropic 把 Mythos 级模型首次向公众开放。OpenAI 向 SEC 秘密提交上市文件。Google 则让实时语音翻译跨过了"回合制"的门槛。

三家公司，三条不同的主线，却指向同一个信号：AI 正在从实验室演示快速走向商业化和日常基础设施。

## 速览

- Anthropic 发布 Claude Fable 5，默认支持 100 万 token 上下文，定价不到 Mythos Preview 的一半
- OpenAI 向 SEC 秘密提交 S-1 注册草案，正式启动 IPO 进程
- Google 推出 Gemini 3.5 Live Translate，实现 70+ 语言实时语音到语音连续翻译
- Perplexity CEO 确认 2028 年 IPO 计划，表示不受 OpenAI 和 Anthropic 上市节奏影响

## 重点动态

### Anthropic 首次向公众开放 Mythos 级模型

Anthropic 正式发布 Claude Fable 5。这是该公司最强的公开可用模型，属于 Mythos-class 级别。

Fable 5 默认支持 100 万 token 上下文窗口，最大输出 128k tokens。模型支持自适应思考功能。

定价为输入 $10/百万 token，输出 $50/百万 token。这个价格不到此前 Mythos Preview 的一半。

新安全分类器会在检测到网络安全、生物化学或蒸馏请求时自动回退到 Opus 4.8。95% 以上会话不会触发回退。

这种设计在增强安全性的同时，尽量保证大多数用户的正常使用体验不受影响。

Mythos 5 面向 Project Glasswing 网络安全合作伙伴开放，解除部分安全限制。同日 API 更新包括 fallbacks 参数和 Managed Agents 定时部署。

这意味着开发者可以更灵活地控制模型的推理和部署行为。

Stripe 测试显示，Fable 5 在 5000 万行 Ruby 代码库中，一天完成原本需两个多月的手工迁移。

### OpenAI 正式启动上市进程

OpenAI 向 SEC 秘密提交 S-1 注册草案。公司表示尚未决定上市时机，可能还需一段时间。

这是继 Anthropic 之后，又一家 AI 巨头启动 IPO 进程。多家权威媒体于 6 月 8 日至 9 日集中报道。

### Google 让语音翻译摆脱"回合制"

Google 发布 Gemini 3.5 Live Translate，实现实时语音到语音翻译。支持 70 多种语言，可自动检测。

与回合制翻译不同，新系统能连续生成翻译。它保留了说话者的语调、节奏和音高。

产品已部署至 Google Translate App、Google Meet（企业私测）、Gemini Live API 和 Google AI Studio。

Android 新增"listening mode"，手机贴耳即可听到翻译，无需耳机。

这一设计特别适合旅行和现场沟通的即时需求。

所有 AI 音频均带 SynthID 水印。Grab 正在测试用于司机与旅客沟通，其平台每月处理超 1000 万次通话。

如果测试顺利，这项功能可能很快覆盖东南亚数千万用户。

### Perplexity 明确 2028 年上市时间表

Perplexity CEO Aravind Srinivas 在 CNBC 采访中确认，公司仍计划在 2028 年上市。不受 OpenAI 和 Anthropic 节奏影响。

Srinivas 认为 SpaceX 本周 IPO 将是 Anthropic 和 OpenAI 上市的领先指标。两家前沿实验室的高估值合理，因为它们"处于前沿"。

## 为什么值得关注

这一天集中出现了三条看似独立、实则相互关联的主线。

模型能力正在快速接近商业化临界点。Fable 5 在 Stripe 的代码库迁移中展现了实际工程价值。这说明最强模型已能承担企业核心系统的重构任务。

这种能力意味着企业可以大幅缩短大型技术债务清理的周期。

资本市场信号同样强烈。OpenAI 提交 IPO 申请，Perplexity 明确上市时间表。这表明 AI 行业正从私募融资走向公开市场。

语音翻译实时化展示了 AI 基础设施化的另一条路径。Gemini 3.5 Live Translate 直接进入消费级应用和企业协作工具。技术正在快速下沉到日常场景。

当翻译不再需要等待回合结束，跨语言协作的流畅度将显著提升。

## 来源

- [Anthropic — Claude Fable 5 and Claude Mythos 5](https://www.anthropic.com/news/claude-fable-5-mythos-5) `[官方]`
- [TechCrunch — Anthropic's Claude Fable 5 is a version of Mythos the public can access today](https://techcrunch.com/2026/06/09/anthropics-claude-fable-5-is-a-version-of-mythos-the-public-can-access-today/) `[媒体报道]`
- [The Verge — Anthropic releases Claude Fable 5 Mythos](https://www.theverge.com/news/946725/anthropic-releases-claude-fable-5-mythos) `[媒体报道]`
- [Reuters — Anthropic rolls out public version of Mythos without cybersecurity capability](https://www.reuters.com/technology/anthropic-rolls-out-public-version-mythos-without-cybersecurity-capability-2026-06-09/) `[媒体报道]`
- [Axios — Anthropic Mythos class safeguards](https://www.axios.com/2026/06/09/anthropic-mythos-class-safeguards) `[媒体报道]`
- [OpenAI — Confidential submission of draft S-1 to the SEC](https://openai.com/index/openai-submits-confidential-s-1/) `[官方]`
- [TechCrunch — Following Anthropic, OpenAI files confidentially for IPO](https://techcrunch.com/2026/06/08/following-anthropic-openai-files-confidentially-for-ipo/) `[媒体报道]`
- [Google — Fluid, natural voice translation with Gemini 3.5 Live Translate](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-live-3-5-translate/) `[官方]`
- [The Verge — Google live AI translations phone ear](https://www.theverge.com/ai-artificial-intelligence/947035/google-live-ai-translations-phone-ear) `[媒体报道]`
- [9to5Google — Gemini 3.5 Live Translate Meet](https://9to5google.com/2026/06/09/gemini-3-5-live-translate-meet/) `[媒体报道]`
- [CNBC — Perplexity plans IPO in 2028 as Anthropic, OpenAI prepare listings](https://www.cnbc.com/2026/06/09/perplexity-ipo-2028-as-anthropic-openai-prepare-listings.html) `[媒体报道]`
