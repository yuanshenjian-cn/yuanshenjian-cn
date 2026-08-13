---
title: "AI 简报 · 2026-08-13"
date: "2026-08-13"
brief: "DeepSeek V4 Pro 正式版上线；xAI 发布 Grok Bot；Google DeepMind 推出 SL2T 手语模型并在 Pixel 11 上线；OpenAI 发布企业 agentic AI 研究报告。"
published: true
tags:
  - AI 简报
---

## 速览

- DeepSeek V4 Pro 正式版上线：模型版本切换为 DeepSeek-V4-Pro-0813，支持 1M 上下文、最高 384K 输出，API 价格暂未上调
- xAI 发布 Grok Bot：定位为可委派任务的 AI teammate，拥有独立云电脑，可跨应用 7×24 完成工作
- Google DeepMind 推出 SL2T：面向听障用户的手语转文字模型，把手语识别推向实际产品
- OpenAI 发布企业 agentic AI 研究报告：揭示企业如何从"辅助工具"走向"执行任务"

> **本期覆盖说明**：xAI 官方新闻页面（https://x.ai/news）在首次采集时返回 403，但后续核验确认具体新闻页 https://x.ai/news/introducing-grok-bot 可正常访问；Anthropic Python SDK Releases Feed 请求超时，该源为 supplemental，不影响 Anthropic 主路径覆盖。

## 重点动态

### DeepSeek V4 Pro 正式版发布

DeepSeek 将 V4 Pro 从预览版更新为正式版，API 模型名仍为 `deepseek-v4-pro`。后端自动路由到新的 `DeepSeek-V4-Pro-0813` 快照，8 月 13 日官方文档已显示正式上线。

官方定价与更新日志显示，新版本支持 1M token 上下文和最高 384K 输出。同时兼容 Responses API、Anthropic API、Tool Calls 与 JSON Output。Change Log 在 7 月 31 日预告 V4 Pro 正式版将尽快发布。定价页显示当前 API 价格未变，同时预告近期将整体上调。

V4 Pro 正式版落地，意味着 DeepSeek 开始把长上下文与多 API 兼容作为核心卖点，同时维持低价策略。

### xAI 发布 Grok Bot

xAI 推出全新 agent 产品 Grok Bot，官方将其定位为 "team of always-on agents"。与传统聊天机器人不同，每个 Bot 拥有独立云电脑。它可以登录用户已有的工具和网站，持续工作到任务完成。仅在需要用户审批时返回。

Grok Bot 目前处于早期 beta。SuperGrok Heavy、Cursor Ultra 和 Cursor Teams Premium 订阅用户可体验桌面与 iOS 客户端。企业用户可申请 waitlist。The Verge 在报道中指出，用户可像给同事发消息一样把任务交给 Bot。系统会记住偏好，并在协作中持续优化。

xAI 由此从消费级聊天工具扩展到"数字劳动力"赛道。这与本周 DeepSeek、OpenAI 的企业级 Agent 动作形成呼应。

### Google DeepMind 发布 SL2T 手语模型

Google DeepMind 发布手语转文字（Sign-Language-to-Text，SL2T）模型，并已在 Pixel 11 的 Gboard 与 Live Transcribe 中上线 SL2T 1.0。该功能支持美式手语（ASL）转英文，向 Deaf 和 hard-of-hearing 用户提供手语输入。这是手语 AI 首次进入消费级产品。

官方博客介绍，SL2T 把手语视频映射为文本，直接翻译而非逐词转写。模型在超 10 万小时、50 多种手语数据上训练。隐私方面只上传手势坐标，原始视频会立即丢弃。

相比语音与图像，手语识别长期被视作多模态 AI 的边缘场景。DeepMind 把无障碍需求推到了模型能力展示的前台。

### OpenAI 发布企业 agentic AI 研究报告

OpenAI 发布研究报告《From assistance to execution: How enterprises put AI to work》，总结企业如何从简单的 AI 辅助工具过渡到 agentic 执行系统。

报告结合 ChatGPT、Codex 与平台数据。领先企业已把 agent 用于代码、运营、客户服务和研究等流程，而非仅生成内容。报告发布于北京时间 8 月 12 日，正值 DeepSeek 和 xAI 发布 Agent 产品的窗口期。

该研究本身没有发布新模型或新 API，但它为企业 Agent 落地的速度和范围提供了官方视角。

## 为什么值得关注

过去 24 小时，Agent 成为事实上的主线。DeepSeek 在 API 层强化 Agent 能力，并扩大上下文窗口。xAI 推出面向终端用户的 teammate agent。OpenAI 则从研究层面确认，企业正在加速采用 agentic 工作流。三者方向不同，但都指向同一个判断：大模型厂商正在从"回答问题"转向"完成任务"。

与此同时，Google DeepMind 的 SL2T 提醒我们，多模态竞争不限于语音和图像。手语这类长期被忽视的交流方式，也正在被模型覆盖。如果体验足够好，它可能成为 AI 无障碍应用的重要里程碑。

## 来源

- [官方] [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [官方] [DeepSeek API Change Log](https://api-docs.deepseek.com/updates)
- [官方] [SpaceXAI — Introducing Grok Bot](https://x.ai/news/introducing-grok-bot)
- [媒体报道] [The Verge — Grok is now an AI 'teammate' you can assign work](https://www.theverge.com/ai-artificial-intelligence/978666/spacexai-grok-bot-ai-agent-beta-launch)
- [官方] [Google DeepMind — Putting sign language AI into users' hands](https://deepmind.google/blog/putting-sign-language-ai-into-users-hands/)
- [官方] [OpenAI — From assistance to execution: How enterprises put AI to work](https://openai.com/index/how-enterprises-put-ai-to-work)
