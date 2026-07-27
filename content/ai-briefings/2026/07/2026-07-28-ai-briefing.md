---
title: "AI 简报 · 2026-07-28"
date: "2026-07-28"
brief: "Claude 共享聊天及 Artifacts 被 Google 索引，医疗记录和内部文件大量曝光；Microsoft 发布首个自研网络安全模型与 Agent 安全平台；Meta AI 进入 Threads 私信功能；Anthropic CEO 公开澄清对开源模型立场。"
published: true
tags:
  - AI
  - Anthropic
  - Claude
  - Microsoft
  - Meta
  - 安全
  - 隐私
  - Project Perception
---

过去 24 小时，AI 行业在隐私安全、产品扩张两个方向出现重要动向。
Claude 用户创建的共享链接被搜索引擎索引。
医疗记录和内部公司文件就此在网上公开。
Microsoft 发布了首个自研网络安全方案。

## 速览

- Claude 用户创建的共享聊天和 Artifacts 链接被 Google 等搜索引擎索引，医疗报告、公司内部文件大量曝光
- Microsoft 发布首个自研网络安全模型 MAI-Cyber-1-Flash 和 Agent 安全平台 Project Perception
- Meta AI 助手正式进入 Threads 私信功能，全球用户可在 DM 中与 AI 对话
- Anthropic CEO Dario Amodei 发表公开声明，否认主张全面禁止开源权重模型

## 为什么值得关注

本期最重要的事件是 Claude 共享聊天数据泄露。这与上周 H2 对 AI 安全的担忧形成呼应。
Microsoft 的 Project Perception 直接切入 AI 安全市场，与 Anthropic Mythos 形成竞争。
Meta AI 进入 Threads 私信功能，标志着 AI 助手向更深层的社交场景渗透。
Anthropic CEO 对开源模型的公开表态，是对上周私下游说争议的直接回应。

## 重点动态

### Claude 共享聊天与 Artifacts 被搜索引擎索引，大量敏感数据曝光

7 月 27 日，Reddit 用户发现通过 `site:claude.ai/share` 可在 Google 搜索到大量 Claude 共享对话。后续媒体报道证实，搜索页还包含 Artifacts 中生成的交互式应用、文档和仪表盘。

被曝光的资料包括患者的详细医疗报告、包含姓名的临床试验结果、小学儿童姓名和电话号码。
还有标注为内部专用的公司文件，以及员工评价中的个人信息。
Futurism 和 Fortune 均确认了这些内容。

问题源于 Claude 的"共享聊天"功能。用户选择创建公开链接后，页面并未默认屏蔽搜索引擎抓取。一旦链接出现在论坛或社交媒体上，爬虫即可将其加入索引。

Anthropic 发言人回应称公司不向搜索引擎提供聊天目录或 sitemap，链接只有在用户自行公开分享后才会被索引。"任何人拥有链接即可查看"的提示意味着内容已公开。截至周一下午，相关搜索结果已被清除。

### Microsoft 发布第一个自研网络安全模型和 Agent 安全平台

Microsoft 在旧金山举办的安全活动中发布了 MAI-Cyber-1-Flash，这是其首个内部训练的网络安全专用模型。模型基于 MAI-Thinking-1 推理架构，嵌入 MDASH 漏洞发现系统，可处理约 90% 的查询，余下 10% 交由 GPT-5.4 处理。

MDASH 配合 MAI-Cyber-1-Flash 在 CyberGym 基准上达到 96%，超过 Anthropic Mythos 的 84%。Microsoft 同时声称新配置比现有方案节省近 50% 的成本。

同期发布的 Project Perception 是一个多 Agent 安全平台，协调红队（发现攻击路径）、蓝队（调查风险）和绿队（修复漏洞）三类专用 Agent。系统 8 月 3 日进入公开预览。

### Meta AI 进入 Threads 私信功能

Meta 于 7 月 27 日向全球 Threads 用户开放 Meta AI 私信功能。用户可在 DM 中向 AI 助手发送帖子、图片、链接和视频，追问细节或深入探讨话题。Meta AI 此前已入驻 Facebook、Instagram 和 WhatsApp 的私信界面。

Threads 负责人 Connor Hayes 表示，此举回应了用户希望私密使用 AI 而不在公开信息流中互动的诉求。私信回复目前仅限文本。

在阿根廷、马来西亚、墨西哥、沙特和新加坡五个市场，Meta 继续测试在 Threads 公开信息流中嵌入 AI 内容。用户无法屏蔽 @meta.ai 账号，只能选择"不感兴趣"或隐藏 AI 回复。

### Anthropic CEO 公开澄清开源权重模型立场

Anthropic CEO Dario Amodei 在官方博客发表署名文章，回应外界对其支持限制开源权重模型的说法。"Anthropic 从未主张禁止开源权重模型作为一类，"他写道。

此前 Jensen Huang 联名 50 家公司签署支持开源权重模型公开信。OpenAI 和 Google 后来加入，Anthropic 始终未签。在 CNN 和 X 平台上，这家公司遭到广泛批评。

Amodei 没有选择加入公开信，而是提出三项替代措施：将先进芯片和制造设备留在美国境外；打击工业级蒸馏操作；对所有达到一定能力门槛的模型强制安全测试，无论开源还是闭源。

## 来源

- [媒体报道] [TechCrunch — PSA: Your Claude shared chats and Artifacts may have ended up on Google](https://techcrunch.com/2026/07/27/psa-your-claude-shared-chats-and-artifacts-may-have-ended-up-on-google/)
- [媒体报道] [Fortune — Users' seemingly private conversations with Anthropic's Claude showed up in Google search results](https://fortune.com/2026/07/27/a-trove-of-users-seemingly-private-conversations-with-anthropics-claude-ai-chatbot-showed-up-in-google-search-results/)
- [媒体报道] [TechCrunch — Microsoft launches its first cybersecurity model, plus a new agentic cybersecurity system](https://techcrunch.com/2026/07/27/microsoft-launches-its-first-cyber-model-and-a-new-agentic-cybersecurity-system/)
- [媒体报道] [TechCrunch — Threads users can now chat with Meta AI in their DMs](https://techcrunch.com/2026/07/27/threads-users-can-now-chat-with-meta-ai-in-their-dms/)
- [官方] [Anthropic — Our position on open-weights models](https://www.anthropic.com/news/position-open-weights-models)
