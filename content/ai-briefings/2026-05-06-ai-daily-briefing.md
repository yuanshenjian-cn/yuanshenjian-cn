---
title: "AI 每日简报 · 2026-05-06"
date: "2026-05-06"
brief: "xAI 通知 API 用户 Grok 4.3 正式上线并宣布 8 个旧模型退役，Anthropic 举办 Code with Claude 大会公布 SpaceX 算力合作，DeepSeek 融资估值跃升。"
published: true
tags:
  - AI每日简报
  - xAI
  - Anthropic
  - DeepSeek
  - OpenAI
---

5 月 5 日到 5 月 6 日，AI 厂商在算力合作、API 治理和资本动态上集中释放信号。xAI 向所有 API 用户发邮件，确认 Grok 4.3 正式上线并给旧模型设定 9 天退役期限；Anthropic 在 Code with Claude 大会上宣布与 SpaceX/xAI 的算力合作和 Managed Agents 升级；DeepSeek 的融资估值传出跳升消息，反映出资本市场对自主 AI 基础设施的持续看好。

## 速览

- xAI 发邮件通知 API 用户 Grok 4.3 正式上线，8 个旧模型将于 5 月 15 日退役，迁移窗口仅 9 天。
- Anthropic 在 Code with Claude 大会上宣布接管 SpaceX Memphis 的 Colossus 1 算力。
- Anthropic 升级 Managed Agents 平台，新增 dreaming、outcomes 与 multiagent orchestration 功能。
- DeepSeek 被曝正在洽谈首轮 VC 融资，估值有望从 200 亿美元跃升至 450 亿至 500 亿美元区间。
- OpenAI GPT-5.5 Instant 继续向免费用户和移动端滚动推出，默认模型切换进入收尾阶段。

## 重点动态

### xAI

xAI 在 5 月 6 日向所有 API 用户发送邮件，主题"Grok 4.3 release and xAI API model retirement"。邮件确认 Grok 4.3 正式上线 API，同时宣布 8 个旧模型将于 5 月 15 日 12:00 PM PT 退役，包括 grok-4-fast、grok-4-0709、grok-3、grok-code-fast-1 和 grok-imagine-image-pro 等。

开发者仅有 9 天迁移窗口，这在生产环境中引发一定争议。Grok 4.3 的 API 定价为输入 $1.25/百万 token、输出 $2.50/百万 token，上下文窗口 100 万 token，输出速度约 207 token/秒。

xAI 在邮件中将其描述为"我们构建过的最快、最智能的模型"。

### Anthropic

Anthropic 在 5 月 6 日举办 Code with Claude 大会，释放两条分量接近的消息。一是与 xAI、SpaceX 签下 Colossus 1 算力协议，独家接入位于 Memphis 的超过 22 万块 NVIDIA H100、H200 与 GB200，用于直接扩大 Claude Pro 和 Claude Max 的容量；Anthropic 同步表达了与 SpaceX 共建多吉瓦轨道算力的意向。

二是在 Managed Agents 平台上线 dreaming、outcomes 与 multiagent orchestration：dreaming 让代理回看历史会话并提炼记忆，outcomes 用独立 grader 对照开发者写的 rubric 评估输出，multiagent orchestration 允许主代理把任务拆派给带各自模型与工具的子代理；同时新增的 webhooks 用于异步任务回调。

### DeepSeek

DeepSeek 在 5 月 6 日被 TechCrunch 和华尔街日报透露正在洽谈首轮 VC 融资，潜在估值从此前的 200 亿美元跃升至 450 亿至 500 亿美元区间。此轮融资被认为将由中国国家队和私募资金共同参与。

DeepSeek V4 系列模型此前已凭借华为 Ascend 950 训练和极具侵略性的 API 定价在开源社区引起广泛关注，估值跳升反映出资本市场对"自主 AI 基础设施"这一叙事的高度认可。

### OpenAI

OpenAI 在 5 月 6 日继续推进 GPT-5.5 Instant 的默认模型切换，向免费用户和移动端滚动推出。

该模型在前一日取代 GPT-5.3 Instant 成为 ChatGPT 默认模型后，用户反馈集中在"回答更简洁"和"幻觉明显减少"两个维度。Plus 和 Pro 用户的增强个性化功能也在同期扩展覆盖范围。

## 为什么值得关注

xAI 给旧模型只留 9 天迁移窗口，显示出其以产品迭代速度优先于向后兼容的策略。这种做法对快速迭代的初创团队有利，但对拥有大规模生产依赖的企业客户则提出了更高的运维要求。

Anthropic 与 SpaceX 的算力合作是 2026 年最大的 AI 基础设施交易之一，超过 22 万块 GPU 的独占接入将直接决定 Anthropic 未来 12 个月的容量天花板。

Managed Agents 的三件套升级则把"代理"从单轮工具调用推向具备记忆、评估与多角色协作的完整工作流平台。

DeepSeek 的估值跳升则揭示了中国 AI 市场的另一条逻辑：当技术自主性与成本优势叠加时，资本愿意给出接近甚至超过美国闭源厂商的溢价。

短期内开发者需要关注的是 xAI 的模型退役时间表和 Anthropic 的 API 扩容节奏。

## 来源

- [Apiyi：Grok 4.3 Launches on xAI API: Complete Migration Guide for 8 Legacy Models Retiring on May 15](https://help.apiyi.com/en/grok-4-3-release-xai-api-model-retirement-en.html) `[媒体报道]`
- [xAI 官方公告：New Compute Partnership with Anthropic](https://x.ai/news/anthropic-compute-partnership) `[官方]`
- [Anthropic 官方博客：New in Claude Managed Agents - dreaming, outcomes, and multiagent orchestration](https://claude.com/blog/new-in-claude-managed-agents) `[官方]`
- [TechCrunch：DeepSeek could hit $45B valuation from its first investment round](https://techcrunch.com/2026/05/06/deepseek-could-hit-45b-valuation-from-its-first-investment-round/) `[媒体报道]`
