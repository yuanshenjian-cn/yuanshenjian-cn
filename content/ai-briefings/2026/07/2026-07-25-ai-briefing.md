---
title: "AI 简报 · 2026-07-25"
date: "2026-07-25"
brief: "Anthropic 发布 Opus 5，接近 Fable 5 能力但价格减半；Meta AI 升级 Muse Spark 1.1，从思考走向主动规划与执行。"
published: true
tags:
  - AI
  - Anthropic
  - Meta
  - Claude
  - Opus 5
---

过去 24 小时，AI 行业在模型能力与产品形态两条线上同时推进。Anthropic 用 Opus 5 把旗舰级能力价格拉到上一代水平，Meta 让 AI 助手从被动问答升级为主动行动。

## 速览

- Anthropic 于 7 月 24 日发布 Claude Opus 5，编码基准 Frontier-Bench 和 CursorBench 上接近 Fable 5 峰值性能，定价保持 Opus 4.8 不变（$5/$25 每百万 token），安全对齐评分创系列最佳
- Meta AI 升级至 Muse Spark 1.1，支持规划、日历和邮件集成、自动生成幻灯片及持续任务执行，首批在 Meta AI 应用和 meta.ai 上线


## 重点动态

### Anthropic 发布 Opus 5：接近 Fable 的智能，半价

Anthropic 于 7 月 24 日发布 Claude Opus 5，定位为 Opus 系列迄今最大的一次跃升。模型在多项基准上接近 Fable 5 的峰值能力，但定价仅为后者的一半——输入 $5/百万 token、输出 $25/百万 token，维持与 Opus 4.8 相同的价格水平。这一价格策略意味着企业用户可以在保持预算不变的情况下，获得接近业界最强模型的性能。

在 Frontier-Bench v0.1 软件工程评估中，Opus 5 超越所有非 Fable 模型，在 Opus 4.8 的基础上性能翻倍以上。在 CursorBench 3.2 上，Opus 5 在最高推理强度下与 Fable 5 的峰值分数差距在 0.5% 以内，但每次任务成本仅为 Fable 的一半。在 OSWorld 2.0 计算机使用基准上，Opus 5 以 Fable 5 约三分之一的成本实现了更高的得分，展示出显著的性价比优势。

知识工作方面同样突出：Opus 5 在 ARC-AGI 3 上的得分是次优模型的三倍，Zapier AutomationBench 的端到端任务通过率约为次优模型的 1.5 倍。在生命科学领域，它在有机化学、蛋白质结构和生物信息学等所有内部基准上均显著领先 Opus 4.8。

安全方面，Anthropic 的自动化行为审计显示 Opus 5 是迄今最对齐的模型，在欺骗性行为、被诱导滥用和不可逆操作风险上均处于最低水平。模型在制衡性网络安全能力（漏洞利用）上仍明显落后于 Mythos 5，符合其不前进危险能力前沿的安全策略。

Opus 5 即日起在所有平台上线，Claude Max 默认使用该模型，Claude Pro 用户也可选用。

### Meta AI 升级 Muse Spark 1.1：从思考到行动

Meta 于 7 月 24 日发布 Meta AI 重大更新，由 Muse Spark 1.1 驱动。新版本将 Meta AI 从问答助手升级为可主动规划、执行和跟进的智能体。

用户可让 Meta AI 制定训练计划、搜索 Marketplace 中的家具、管理日历冲突、生成每日简报，甚至完成研究深挖后自动生成演示文稿。所有输出会保存在固定位置供后续迭代。Meta AI 还支持在任务执行过程中实时调整方向——用户可以在 AI 生成报告或幻灯片时直接要求它调整重点、改变语气或删除某一段落。

该版本即日起在 Meta AI 应用和 meta.ai 上向部分市场推出，后续将扩展至 WhatsApp。与 OpenAI 的 ChatGPT Tasks 和 Google 的 Gemini Live 不同，Meta 强调了任务的可视化编排和实时协作——用户可以在 Meta AI 执行过程中随时要求调整方向。

## 为什么值得关注

今天两家厂商的动态代表了 AI 行业两类不同的竞争路径。Anthropic 用 Opus 5 证明了旗舰智能并不必然对应旗舰价格——在编码、知识工作和自动化等核心场景上接近 Fable 5 的表现，同时保持 Opus 4.8 的价格和安全水准，这让 Opus 5 成为当前性价比最突出的前沿模型之一。Meta 选择了不同的竞争路径：不追求单一模型的天花板，而是用 Muse Spark 让 AI 从对话界面渗透进用户的日程、购物、研究等日常任务链，打的是生态渗透牌。

## 来源

### Anthropic 发布 Opus 5，接近 Fable 5 能力但价格减半

- [官方] [Anthropic — Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)
- [媒体报道] [TechCrunch — Anthropic launches Opus 5](https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/)
- [媒体报道] [The Verge — Anthropic releases Opus 5 with 'close' to Fable 5's capabilities](https://www.theverge.com/ai-artificial-intelligence/970105/claude-opus-5-announced-anthropic-ai-model-release)

### Meta AI 升级 Muse Spark 1.1，转向主动规划与执行

- [官方] [Meta — Meta AI Doesn't Just Think, It Acts](https://about.fb.com/news/2026/07/meta-ai-muse-spark-doesnt-just-think-it-acts/)
- [媒体报道] [The Verge — Meta is making its AI chatbot more like an assistant](https://www.theverge.com/tech/970570/meta-ai-chatbot-productivity-update)


