---
title: "AI 简报 · 2026-08-11"
date: "2026-08-11"
brief: "OpenAI 扩展 Daybreak 并发布 GPT-5.6-Cyber；ChatGPT Business 推出 Premium 席位；Meta 开源 Muse Glimmer 并提供本地运行能力；Zuckerberg 发布个人超级智能宣言。"
published: true
tags:
  - AI
  - OpenAI
  - Meta
  - 开源
  - Agent
---

本期覆盖缺口提示：xAI 官网 x.ai/news 返回 403，已改用官方 release notes 补检。ai.meta.com/blog 返回 400。Google Gemini API changelog 超时，由官方 RSS 覆盖。DeepSeek 新闻页重定向回文档首页。智谱新闻页重定向至 Z.ai 首页。MiniMax 新闻页为 JS 渲染，无日期化列表。Perplexity changelog 仅有月份级条目。本期 coverage 结论为 degraded。

## 速览

- OpenAI：扩展 Daybreak 并发布 GPT-5.6-Cyber，声称高危任务完成率大幅领先
- OpenAI：ChatGPT Business 推出 Premium 席位，单席位 125 美元每月
- Meta：开源 Muse Glimmer，30B 参数 agentic 模型可在本地单显卡运行
- Meta：Zuckerberg 发布《The Future is for Everyone》宣言，阐述个人超级智能愿景

## 重点动态

### OpenAI 扩展 Daybreak 并发布 GPT-5.6-Cyber

OpenAI 8 月 10 日宣布扩展 Daybreak，并发布新模型 GPT-5.6-Cyber。Daybreak 是 OpenAI 的网络安全防御计划。此次扩展加入了 Blue 与 Red 两个层级，分别面向防御与红队场景。

OpenAI 称，GPT-5.6-Cyber 在评测中的高危任务完成率显著提升。官方给出的对比是 95% 对 Sol 的 1.5%。模型在一次测试中发现了 V8 的两个零日漏洞，其一编号为 CVE-2026-15903。

官方将 Preparedness 评为 High，而非最高的 Critical。同日，OpenAI 还宣布把前沿 cyber 模型交给更多受信方使用，并公布了对应的安全与使用条件。

对开发者而言，真正的信号不是单点分数。多个模型参与同一安全评测，可以在相同口径下比较能力。这比跨厂商比例换算更可靠。

### ChatGPT Business 推出 Premium 席位

OpenAI 8 月 10 日公布 ChatGPT Business 的 Premium 席位定价。单席位每月 125 美元，按年付费折合每月 100 美元。该规格是新的高端档位。

Premium 席位提供 5 倍用量，并取消了 5 小时滚动限制。团队可以在 Business 计划中混合普通与 Premium 席位，按角色分配额度。

8 月 20 日前购买可获每个席位 100 美元的返利，活动额度有限。对中小团队来说，这相当于把高阶模型用量纳入按月预算。

这一档位把大用量场景的费用转成了可预期的订阅支出，便于团队按角色分配额度。

### Meta 开源 Muse Glimmer，本地可运行 agentic 模型

Meta 8 月 10 日发布 Muse Glimmer。这是 30B 参数的开源 agentic 模型，采用 Apache 2.0 许可。官方称其可在 Mac 或 PC 的单张消费级显卡上运行。

模型支持文本与图像，覆盖 100 多种语言。它面向本地多步任务，可调用工具、读写代码、处理文件与截图。官方称其针对消费级硬件做了优化。

Muse Glimmer 可视为 Muse Spark 的开放权重版本。Meta 表示未来还将开源 Muse Spark 1.2 的权重。官方公告位于 research.meta.ai，不在本简报允许来源范围。此处依据 TechCrunch 与 CNBC 两家独立媒体报道。

本地运行意味着数据不出设备，推理成本可控。开源权重则可以自由微调与二次分发。这延续了 Meta 在 Llama 之后重新押注开源的路线。

### Zuckerberg 发布《The Future is for Everyone》宣言

Meta 8 月 10 日发布 CEO 宣言《The Future is for Everyone》。Zuckerberg 以长篇散文阐述个人超级智能愿景，主张把力量交给每一个人。

宣言的核心是三个原则：个人赋能、以发明为目的、权力平衡偏向个人。文中批评美国对开源模型的政策限制，认为这帮助了外国实验室。

The Verge 把宣言总结为 Meta 对个人 AI 路线的最高级辩护。TechCrunch 则质疑其宏大叙事与模型现实之间的落差。

这篇宣言与 Muse Glimmer 同一天发布，方向一致。Meta 要证明开源、本地、个人可控的 AI 路线可行。它以此与封闭前沿模型竞争。

## 为什么值得关注

OpenAI 与 Meta 在同一天选择了相反方向的竞争策略。OpenAI 把最强的 cyber 能力放在受控的防御体系中，Meta 则把模型权重直接放开到消费级硬件。两条路线都在争夺同一批开发者心智：谁能成为未来个人智能的默认平台。

## 来源

- [官方] [OpenAI — Expanding Daybreak as the Cyber Defense Window Narrows](https://openai.com/index/expanding-daybreak-as-the-cyber-defense-window-narrows)
- [官方] [OpenAI — Putting frontier cyber models in more trusted hands](https://openai.com/index/putting-frontier-cyber-models-in-more-trusted-hands)
- [官方] [OpenAI — Premium seats are coming to ChatGPT Business](https://openai.com/index/premium-seats-chatgpt-business)
- [媒体报道] [TechCrunch — Meta's new Glimmer AI model offers a hint at Zuckerberg's personal intelligence vision](https://techcrunch.com/2026/08/10/metas-new-glimmer-ai-model-offers-a-hint-at-zuckerbergs-personal-intelligence-vision/)
- [媒体报道] [CNBC — Meta launches Muse Glimmer open-weight AI model](https://www.cnbc.com/2026/08/10/meta-muse-glimmer-open-weight-ai.html)
- [官方] [Meta Newsroom — The Future is for Everyone](https://about.fb.com/news/2026/08/the-future-is-for-everyone/)
- [媒体报道] [The Verge — Four takeaways from Mark Zuckerberg's massive AI manifesto](https://www.theverge.com/tech/977395/meta-mark-zuckerberg-superintelligent-ai-ramble)
- [媒体报道] [TechCrunch — Mark Zuckerberg's AI manifesto is exactly why people don't like AI](https://techcrunch.com/2026/08/10/mark-zuckerbergs-ai-manifesto-is-exactly-why-people-dont-like-ai/)