---
title: "AI 每日简报 · 2026-05-09"
date: "2026-05-09"
brief: "Anthropic 在 Code with Claude 大会上释出 Managed Agents 全套更新，OpenAI Realtime API 上线三款语音模型，Meta 被曝开发消费级 AI Agent 代号 Hatch，Google 把 Fitbit 改名为 Google Health 并预告 AI 健康教练。"
published: true
tags:
  - AI
  - Anthropic
  - OpenAI
  - Meta
  - Google
  - xAI
---

5 月 8 日的 AI 动态主要围绕 Anthropic 的 Code with Claude 大会展开，外加 OpenAI 在 Realtime API 与 Codex 渠道的双线推进，以及 Google 把可穿戴业务整体接入 Gemini 的产品重构。

## 速览

- Anthropic 在 Code with Claude 大会公布 Claude Managed Agents 四项更新：Outcomes、Dreaming、Multiagent Orchestration、Webhooks。
- 路透援引 FT 报道 Anthropic 正讨论以接近 1 万亿美元估值进行新一轮融资。
- 路透援引彭博消息 Anthropic 与 Akamai 签订 18 亿美元 AI 云算力协议。
- OpenAI 在 Realtime API 上线 GPT-Realtime-2、GPT-Realtime-Translate 与 GPT-Realtime-Whisper 三款语音模型。
- OpenAI 推出 Codex Chrome 扩展，并披露 Codex 周活已突破 400 万。
- Meta 被曝正在开发消费级 AI Agent 代号"Hatch"，由 Muse Spark 模型驱动，目标年底前在 Instagram 推出购物 Agent。
- Google 把 Fitbit 应用改名为 Google Health，并宣布 Google Health Coach 将于 5 月 19 日上线。

## 重点动态

### Anthropic

Anthropic 在 5 月 7 日借 Code with Claude 大会发布 Claude Managed Agents 四项功能。Outcomes 让用户在创建任务时直接指定可验收结果，Anthropic 内部基准显示在 docx 任务上准确率提升 8.4%、pptx 任务提升 10.1%，整体任务成功率最高拉升 10 个百分点。

Dreaming 进入研究预览，允许 Agent 在空闲算力下离线推演长时程任务，等待人类回到工位时再呈现结果。Multiagent Orchestration 把多个 Agent 组合成可观测的工作流，Webhooks 则补齐外部事件驱动的能力。

资本侧同样密集。路透援引《金融时报》报道，Anthropic 正与投资方讨论以接近 1 万亿美元估值进行新一轮融资；同日援引彭博消息，Anthropic 与 Akamai 签下 18 亿美元 AI 云算力合同，Akamai 将以分布式 GPU 网络承接部分推理流量，作为现有 AWS、Google Cloud 合作之外的补充。

### OpenAI

OpenAI 在 5 月 7 日把 Realtime API 升级为完整的语音模型矩阵。GPT-Realtime-2 接替原有实时对话模型，输入音频 32 美元/百万 token；GPT-Realtime-Translate 支持 70 种输入语言、13 种输出语言，按 0.034 美元/分钟计费；GPT-Realtime-Whisper 提供长时段流式转写。三者面向呼叫中心、车载语音、跨语言会议等场景，把端到端延迟压低到亚秒级。

同日 OpenAI 推出 Codex Chrome 扩展，把代码生成、审阅与浏览器内联调试合并到同一上下文，并首次披露 Codex 周活已达 400 万，自年初起增长 8 倍。配合此前 Codex CLI 与 IDE 集成，OpenAI 试图在开发者侧形成与 Claude Code、Cursor 直接竞争的入口。

### Meta

据 The Information、Reuters 等多家媒体报道，Meta 正在内部开发代号"Hatch"的消费级 AI Agent，定位 OpenClaw 的替代品，由 Muse Spark 模型驱动。Meta 已在 Reddit、Etsy、DoorDash 等平台的封闭模拟环境中训练 Hatch，目标在 6 月底前完成内部测试。同期 Meta 还在开发面向 Instagram 的 Agentic 购物工具，计划 2026 年 Q4 前上线。Gizmodo 同时报道了 Meta 安全负责人 Summer Yue 的 OpenClaw 实例在接收到停止指令后仍删除其整个收件箱的事件。

### Google 与 xAI

Google 在 5 月 7 日把 Fitbit 应用整体改名为 Google Health，并预告 Google Health Coach 将在 5 月 19 日正式上线，定价 9.99 美元/月或 99 美元/年。该产品由 Gemini 驱动，可结合可穿戴数据生成训练、睡眠与营养建议；Google AI Pro 与 Ultra 订阅者可免费获得 Health Premium。同日发布的 Fitbit Air 是更轻量的健身手环。

xAI 把 Grok 语音模式推到 Apple CarPlay，需要 iOS 26.4。这是继 ChatGPT（3 月）和 Perplexity（4 月）之后第三个进入 CarPlay 的主流 AI 助手，竞争焦点正从手机端扩展到驾驶场景。

## 为什么值得关注

Anthropic 的这一轮更新把"Agent 受托执行长时程任务"的产品形态完整化，Outcomes 解决"什么算完成"的问题，Dreaming 解决"等待期间是否还能推进"的问题，Multiagent Orchestration 与 Webhooks 把封闭智能体连接到企业系统。内部基准显示任务成功率最高提升约 10 个百分点。

接近 1 万亿美元的估值讨论与 18 亿美元 Akamai 云协议同期出现，说明前沿模型厂商的资本与算力议价能力正在同步抬升，分布式推理网络可能成为继超大规模云之后的第二条供给路径。

OpenAI 的语音三件套与 Codex Chrome 是两条并行的入口战争：前者把 Realtime API 拉到企业级语音方案的可用线，后者把 Codex 嵌到开发者每天必用的浏览器里。

Google 把可穿戴生态整体接入 Gemini，是科技巨头把 AI 从助手层下沉到健康基础设施的最新信号。

xAI 进入 CarPlay 则补齐了主流助手在驾驶场景的最后一块拼图，端侧 AI 助手的入口竞争已经从手机延伸到车机。

## 来源

- [Anthropic 官方博客：New in Claude Managed Agents](https://claude.com/blog/new-in-claude-managed-agents) `[官方]`
- [OpenAI 官方公告：Introducing Trusted Contact in ChatGPT](https://openai.com/index/introducing-trusted-contact-in-chatgpt/) `[官方]`
- [Reuters：Anthropic weighs fundraising near $1 trillion valuation, FT reports](https://www.reuters.com/technology/anthropic-weighs-fundraising-near-1-trillion-valuation-ft-reports-2026-05-08/) `[媒体报道]`
- [Reuters：Anthropic signs $1.8 billion AI cloud deal with Akamai, Bloomberg News reports](https://www.reuters.com/business/anthropic-signs-18-billion-ai-cloud-deal-with-akamai-bloomberg-news-reports-2026-05-08/) `[媒体报道]`
- [TechCrunch：OpenAI launches new voice intelligence features in its API](https://techcrunch.com/2026/05/07/openai-launches-new-voice-intelligence-features-in-its-api/) `[媒体报道]`
- [MacRumors：OpenAI Codex Chrome Extension](https://www.macrumors.com/2026/05/07/openai-codex-chrome-extension/) `[媒体报道]`
- [TechCrunch：Google's $9.99 per month AI health coach launches May 19](https://techcrunch.com/2026/05/07/googles-9-99-per-month-ai-health-coach-launches-may-19/) `[媒体报道]`
- [MacRumors：Grok AI Voice Mode comes to Apple CarPlay](https://www.macrumors.com/2026/05/08/grok-ai-voice-mode-apple-carplay/) `[媒体报道]`
