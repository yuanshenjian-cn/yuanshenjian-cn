---
title: "AI 每日简报 · 2026-05-03"
date: "2026-05-03"
brief: "Mistral 发布 128B 旗舰模型与远程编码 Agent，DeepSeek V4 正式开放，Amazon 和 Cloudflare 分别推出购物代理与自主部署能力，AI 编码代理安全漏洞引发关注。"
published: true
tags:
  - AI
  - Mistral
  - DeepSeek
  - Amazon
  - Cloudflare
---

5 月 2 日到 5 月 3 日，模型层和应用层同时出现密集更新。Mistral 把编码、推理和通用能力合并进一个 128B 开源模型；DeepSeek V4 正式面向开发者和企业开放；Amazon 和 Cloudflare 分别在电商和基础设施两端推进 Agent 落地；与此同时，一组针对 AI 编码代理的安全漏洞研究暴露出当前工具链的薄弱环节。

## 速览

- Mistral 发布 Medium 3.5 128B 旗舰模型，合并了此前分离的通用、推理和编码能力，支持 256K 上下文。
- Mistral 同步推出 Vibe 远程编码 Agent，支持云端异步编码会话。
- DeepSeek V4 正式发布，Pro 版 1.6 万亿参数、49B 激活，Flash 版 284B 参数、13B 激活，API 输入定价 $0.14/百万 token。
- Amazon 上线对话式 AI 购物代理，覆盖数百万商品页面。
- Cloudflare 允许 AI 代理在其基础设施上自主部署和启动应用。
- 研究人员发现六个漏洞可绕过主流 AI 编码代理的防御，所有厂商补丁均被二次绕过。

## 重点动态

### Mistral

Mistral 在 5 月 3 日发布 Medium 3.5，这是一个 1280 亿参数的稠密模型，而非 MoE 架构。该模型最大的特点是合并了 Mistral 此前分散的三条产品线：Medium 3.1（通用对话）、Magistral（推理）和 Devstral 2（编码）。

开发者可以通过同一组权重，用"reasoning effort"参数在快速回复和深度 agentic 任务之间切换。在 SWE-Bench Verified 上，Medium 3.5 达到 77.6%，超过其前身 Devstral 2。上下文窗口为 256K token，可在 4 张 GPU 上自托管。

同步推出的 Vibe Remote Agents 支持云端异步编码会话，开发者可以提交长时间运行的编程任务并在完成后接收结果。

### DeepSeek

DeepSeek 在 5 月 3 日正式开放 V4 系列模型。V4-Pro 采用 1.6 万亿参数 MoE 架构，每 token 激活 490 亿参数，支持 100 万 token 上下文；V4-Flash 为 2840 亿参数，每 token 激活 130 亿。

技术亮点包括压缩稀疏注意力（CSA）和强压缩注意力（HCA）的混合架构，在 100 万 token 场景下计算量降至 V3.2 的 27%。API 定价极具侵略性：V4-Flash 输入 $0.14/百万 token，V4-Pro 输入 $1.74/百万 token。该模型基于华为 Ascend 950 芯片训练，标志着中国前沿模型首次摆脱对 Nvidia GPU 的完全依赖。

### Amazon 与 Cloudflare

Amazon 在 5 月 3 日上线对话式 AI 购物代理，覆盖数百万商品页面。用户可以通过自然语言询问商品特性、比较不同型号，并让代理直接完成下单流程。这标志着 Amazon 正在把生成式 AI 从搜索辅助推向交易闭环。

Cloudflare 同日宣布 AI 代理可以在其边缘基础设施上自主部署和启动应用。开发者只需描述应用需求，代理即可完成代码编写、容器化、部署和域名配置。这一能力把"AI 写代码"推进到了"AI 运营代码"的层面。

### 安全研究

5 月 3 日披露的一组安全研究显示，六个精心设计的漏洞可以绕过主流 AI 编码代理的防御机制，包括 Cursor、GitHub Copilot 和 Replit Agent。研究人员的攻击目标并非模型本身，而是代理运行时的凭证和环境访问权限。

更令人担忧的是，每个厂商在收到披露后都迅速发布了补丁，但所有补丁都在数小时内被二次绕过。这提示当前 AI 编码工具的安全模型尚未成熟。

## 为什么值得关注

Mistral 的"三合一"模型策略代表了一种新的产品哲学：不再为不同场景维护多个模型，而是让同一组权重通过配置参数适应不同任务。

DeepSeek V4 的华为 Ascend 训练路线则具有地缘政治意义，它证明了在美国芯片出口管制下，中国仍然可以训练出接近前沿水平的模型。

Amazon 和 Cloudflare 的 Agent 产品分别代表了消费端和企业端的两条落地路径。

而编码代理的安全漏洞则是一个警示：当 AI 被赋予写代码和部署应用的权限时，攻击面也相应扩大，安全防御必须跟上能力的扩张。

## 来源

- [AIToolsRecap：AI News May 3 2026 — Mistral 128B Flagship, GPT-5.5 API Rollout, Agentic AI Enterprise Wave](https://aitoolsrecap.com/Blog/ai-news-may-3-2026) `[媒体报道]`
- [claude-news.today：Claude Code Daily Briefing - 2026-05-03](https://claude-news.today/en/briefings/briefing-2026-05-03/) `[媒体报道]`
- [jiangren.com.au：AI日报 2026-05-03](https://jiangren.com.au/blog/ai-daily-2026-05-03) `[媒体报道]`
