---
title: "AI 简报 · 2026-08-21"
date: "2026-08-21"
brief: "Mistral 发布面向企业复杂文档的 Agentic Search；OpenAI 在 ChatGPT 桌面端推出 Apple Messages 插件；Google 为 Discover 与 Search 上线自然语言调优和 Preferred Sources；OpenAI API 新增 Prompt Caching 仪表板与 gpt-image-2 透明背景。"
published: true
tags:
  - AI
  - Mistral
  - OpenAI
  - Google
---

8 月 20 日厂商动作密集，产品层与 API 层同步更新。Mistral 用 Agentic Search 重新定义企业文档检索；OpenAI 把 ChatGPT 的触角伸入 macOS 原生消息应用；Google 则继续围绕搜索分发做个性化升级。

## 速览

- Mistral 发布 Agentic Search，用五类工具在多步推理中检索复杂企业文档
- OpenAI 在 ChatGPT macOS 桌面应用推出 Apple Messages 插件，可代发短信
- Google 推出 Discover 自然语言调优与 Preferred Sources，让信息流更贴合偏好
- OpenAI API 新增 Prompt Caching 仪表板，并预览 gpt-image-2 透明背景输出
- OpenAI 启动 AI Futures 博客，聚焦变革性 AI 的社会影响

## 重点动态

### Mistral 发布 Agentic Search，企业文档检索进入多步推理时代

Mistral 于 8 月 20 日发布 Agentic Search，把传统 RAG 的一次性检索升级为可迭代的多步检索。系统给模型五个工具：search 找文档、open 打开、navigate 跳转、read 读取、grep 匹配。

模型因此能在长文档、跨文档或表格密集的内容里主动查找并验证答案。官方基准显示，在 FinanceBench 的 368 份 SEC 文件上，Agentic Search 把 Mistral Medium 3.5 的正确率从 26.7% 提升到 86%。

在 OfficeQA Pro 的 696 份美国财政部公报上，GLM-5.2 的正确率从 6.3% 提升到 51.9%。同时 p90 延迟降低 39.6%，token 消耗减少最多三分之一。

该能力通过 Mistral Search Toolkit 和 Libraries 提供，支持本地或云端部署，面向金融、法律、政府等敏感数据场景。这意味着检索质量不再只受限于切块策略，而是随模型推理能力同步提升。

### OpenAI 推出 Apple Messages 插件，ChatGPT 可代发短信

OpenAI 在 ChatGPT macOS 桌面应用中推出 Apple Messages 插件。用户可在 Codex 或 ChatGPT Work 里让 ChatGPT 读取、搜索、起草、删除和发送 iMessage、SMS 与 RCS 消息。

默认情况下，每次发送前都需要用户确认消息内容和收件人。该插件仅包含在 Apple Silicon 版本的 ChatGPT 桌面应用中，不会把完整消息索引上传到云端。

OpenAI 文档强调，Apple Messages 在 Mac 本地运行，普通网页或移动端无法使用。管理员也可通过 Computer Use 控制禁用该插件。

这件事标志着 ChatGPT 的"代理半径"继续向操作系统原生应用扩展。从浏览器、IDE 到邮件和消息，桌面 AI 代理正在接管越来越多需要跨应用上下文的工作流。

### Google 推出 Discover 自然语言调优与 Preferred Sources

Google 于 8 月 20 日宣布在 Search、Discover 和 Google News 上线新的个性化功能。用户将可以用自然语言描述自己想在 Discover feed 里看到的内容，Google 会实时调整并记住偏好。

同时，出版商可以在自家网页上嵌入"Preferred Sources"按钮。读者点击后就能让该媒体在 Search 的 Top Stories、AI Overviews 和 AI Mode 中获得更高优先级。

Android 版 Google News 也支持定制每日音频简报的主题。这些功能的核心是把内容分发的主导权从算法单向推荐，部分交还给用户和出版商。

对内容生态而言，这既是回应 AI 摘要争议的举措，也可能改变媒体流量的分配逻辑。

### OpenAI API 上线 Prompt Caching 仪表板与 gpt-image-2 透明背景

OpenAI API 平台在 8 月 20 日更新两项功能。一是 Prompt Caching dashboard，开发者可以在平台查看缓存命中率、每写入缓存读取次数，以及缓存读/写/未缓存 token 的拆分。

该仪表板帮助开发者优化成本。二是 gpt-image-2 和 gpt-image-2-2026-04-21 在 Images API 与 Responses API 图像生成工具中预览支持透明背景。输出格式需设为 png 或 webp，jpeg 不支持该功能。

这两项更新都不算革命性。但它们分别对应生产环境最关心的两个指标：成本控制和多模态输出可控性。对正在规模化部署图像生成应用的团队，透明背景支持会直接解锁 overlay、合成等设计工作流。

### OpenAI 启动 AI Futures 博客

OpenAI 同日推出新博客栏目 AI Futures。它的定位是探讨变革性 AI 如何重塑权力、治理、经济和个人自由。首篇文章由 OpenAI 研究团队撰写。它试图把公司内部的技术、政策与社会影响讨论，转化为可公开参与的长期对话。

这不是一次产品发布，而是一次叙事尝试。随着 GPT-5.6 家族、Codex、ChatGPT Work 等产品不断扩展能力边界，OpenAI 需要同时建立一个讨论 AI 社会后果的公共平台。

AI Futures 的角色更接近于政策与社会研究的发布渠道。

## 为什么值得关注

本期最突出的主线是"AI 代理正在进入更细的协作缝隙"。Mistral 的 Agentic Search 解决的是企业知识库内部的信息检索问题。OpenAI 的 Apple Messages 插件解决的是个人消息工作流。Google 的 Discover 个性化解决的是信息流分配。

三件事分别对应企业数据、个人数据、公共数据三种场景。它们的共同点是 AI 不再只是回答问题，而是在原有应用结构里执行更复杂的任务。

Mistral 的 Agentic Search 尤其值得关注。它把检索从"一次性切块 + 顶层匹配"变成"模型驱动的主动探索"。它明确声明支持本地或云端部署，不会跨越企业的隔离边界。这种设计对企业市场非常有吸引力，可能让 Mistral 在企业 RAG/Agent 领域获得差异化优势。

OpenAI 的桌面插件策略则在继续推进"ChatGPT 作为操作系统层"的愿景。Messages 插件本身价值有限，但它证明 OpenAI 愿意且能够把代理能力注入 macOS 原生应用。未来几个月，类似的插件可能会覆盖更多系统级数据入口。

## 来源

- [官方] [Mistral — Agentic Search](https://mistral.ai/news/agentic-search/)
- [官方] [OpenAI Developers — Plugins: Use Apple Messages from Codex](https://learn.chatgpt.com/docs/plugins?surface=app)
- [媒体报道] [TechCrunch — ChatGPT can now send texts for you with new Apple Messages plug-in](https://techcrunch.com/2026/08/20/chatgpt-can-now-send-texts-for-you-with-new-apple-messages-plugin/)
- [官方] [Google — Personalize the content you see on Search, Discover, and News](https://blog.google/products-and-platforms/products/search/personalize-search-discover-news/)
- [媒体报道] [The Verge — Google Discover is getting an AI chatbot-tuned feed](https://www.theverge.com/tech/983088/google-discover-ai-chatbot-feed)
- [官方] [OpenAI API Changelog](https://platform.openai.com/docs/changelog)
- [官方] [OpenAI API Changelog](https://platform.openai.com/docs/changelog)
- [官方] [OpenAI — Introducing AI Futures](https://openai.com/index/introducing-ai-futures)
