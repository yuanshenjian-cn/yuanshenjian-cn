---
title: "2026-10-29 AI 简报：Google 发布 Gemini 4 Carbon；Connected Apps 平台开放预览"
date: "2026-10-29"
published: true
brief: "本期确认 5 件动态：Google 发布网络安全前沿模型 Gemini 4 Carbon；Google 开放 Connected Apps 平台预览；OpenAI 与 ServiceNow 扩大企业工作流合作；Anthropic 将 AI for Science 扩展到 20 家机构；Meta 的 Muse 在新加坡上线。"
tags:
  - AI
  - Google
  - OpenAI
  - Anthropic
  - Meta
  - 模型
  - 安全
  - Agent
  - 企业服务
---

北京时间 10 月 28 日至 29 日，AI 厂商把重点放在落地路径上。Google 推出面向网络安全的前沿模型，并开放应用接入平台。OpenAI 与 Anthropic 分别扩展企业工作流与科研资助，Meta 则把个人代理带到新加坡。

> 覆盖说明：本期 coverage 为 degraded。OpenAI News 与 Google DeepMind 的 Feed 超时，相关页面已人工补检；Perplexity 变更日志只有月份粒度；小米 MiMo 页面只有相对更新时间；智谱官方页无日期化条目，z.ai 博客无可读内容；MiniMax 官网只有导航与模型入口。上述缺口不代表对应厂商本期无更新。

## 速览

- Google 发布 Gemini 4 Carbon，网络安全基准领先，先向防御方开放。
- Google 开放 Connected Apps 平台预览，Search 与 Gemini 共用一套接入。
- OpenAI 与 ServiceNow 扩大合作，ServiceNow MCP 插件已经上线。
- Anthropic 将 AI for Science 扩展到 20 家基金会、研究机构与项目。
- Meta 的 Muse 在新加坡上线，接入 Shopee、Grab 等本地服务。

## 重点动态

### Google 发布 Gemini 4 Carbon，先向网络安全防御方开放

Google 于当地时间 10 月 28 日发布 Gemini 4 Carbon。官方称这是其最强的前沿模型，重点放在网络安全与长周期任务。它还能连续处理跨代码库的复杂工程问题，并已在内部用于定位与修补隐蔽缺陷。

在 Artificial Analysis v5.0 智能指数上，Carbon 以 59 分排名第一。官方称它在编码、代理与科学任务上均有提升，网页开发竞技场升至第四，得分 1768。Google 同时强调模型在长周期任务中的稳定性。

三项安全基准分别是 SEC-bench Pro 88.2%、ExploitGym 54.8% 与 CWE-bench 71.0%。它们覆盖漏洞发现、利用验证与补丁生成，官方称 Carbon 在网络安全防御全流程都达到领先水平。内部测试还显示，生成安全代码的成功率比 Argon 提高一倍以上。

开放范围仍然有限。本周先向部分网络安全防御方开放，再通过 Fairwind 计划扩大。发布价沿用 Argon 的介绍价，输入每百万 token 2 美元，输出 10 美元，缓存输入减免 95%；介绍期后恢复为 4 美元与 20 美元。开发者与普通用户还要等待。

### Google 开放 Connected Apps 平台预览，Search 与 Gemini 共用一套接入

同日，Google 开放 Connected Apps Platform 预览。开发者可以在一个平台里构建并管理接入 Search 与 Gemini 的应用，不必分别为两个入口开发。平台同时面向两个入口，并提供注册、测试与提交工具。

接入方式有两种。云端托管的 MCP 服务器，或基于 AppFunctions API 的 Android MCP。开发者用 Connected Console 注册、测试与提交应用，并在上线前选择进入 Search、Gemini 还是两者。平台会保留品牌标识与账号认证。上线后可查看流量、延迟与错误率。

Google 称 Search 与 Gemini 已有 50 多个 Connected Apps。Adobe、Experian、Localiza 与 Peloton 已接入 Gemini，Calm 将在两款产品上线，覆盖生产力、票务、健康与健身等场景。这些应用把外部服务的能力直接带进对话。Google 没有披露各应用的具体使用量。

平台按阶段开放，更多开发者、市场与 Google 产品会在未来数月加入。开发者需要申请预览资格，Google 没有公布审核标准与排期。预览阶段的功能与接口仍可能调整。

### OpenAI 与 ServiceNow 扩大合作，把企业工作流接进 ChatGPT

OpenAI 于当地时间 10 月 28 日宣布扩大与 ServiceNow 的合作。双方要把 OpenAI 的模型与代理接入 ServiceNow 的企业工作流，覆盖应用开发、IT 服务与安全运营。合作建立在今年 1 月已有协议之上。

新的 ServiceNow 集成会把业务上下文与操作带进 ChatGPT。IT 人员可以在对话里查找相似事件、评估变更风险，并更新 ServiceNow 记录，不必在系统之间来回切换。权限由企业自己配置。

集成通过客户自有的 ServiceNow 实例运行。ServiceNow 的 Action Fabric 会套用现有业务规则与权限，让代理执行的动作符合组织配置。这降低了权限越界的风险。ServiceNow 还在预览对话内的交互式工单体验。

ServiceNow 计划把 ChatGPT Work 与 Codex 开放给全部员工，不再只限工程团队。OpenAI 也在内部使用 ServiceNow 的工作流，合作也覆盖 OpenAI 自身的运营。可用时间分阶段推进。MCP 插件已上线，语音能力预计 2027 年第一季度。

安全能力计划在 2027 年 1 月进入早期访问，第二季度正式可用。Codex 进入 AI Workflow Factory 预计在 2027 年，具体月份尚未公布。安全与 Codex 能力仍在计划阶段。企业需要等待正式发布后再评估采用。

### Anthropic 将 AI for Science 扩展到 20 家机构

Anthropic 于 10 月 28 日宣布，AI for Science 计划扩展到 20 家科学基金会、研究机构与研究项目。计划始于 2025 年 5 月，此前主要面向个人研究者。这次扩容把资助对象转向机构与基金，合作方将获得免费额度。

这些合作方会获得免费的 Claude credits，再分配给使用 AI 做科研的团队。Anthropic 称，科学家正用 Claude 生成假设、设计实验、分析数据并沟通研究成果。许多项目会产出开放数据集、开源软件与开放标准。

基金会名单包括 Sloan、Simons、Schmidt Sciences 与美国国家科学基金会。CAS 也在其中，它长期维护化学物质登记系统。这些机构会把 credits 分发给各自筛选的研究者，名单覆盖多个学科。Anthropic 没有披露 credits 的总规模。

机构合作方包括空间望远镜研究所、Wellcome Sanger 研究所、Francis Crick 研究所、帝国理工生命科学系、EMBL 与 Gladstone Institutes。它们覆盖天文、基因组学、生物医学与气候研究。这些机构将把 Claude 接入内部科研流程。

研究项目覆盖 FlyWire、LEAP、AstroPath、gnomAD、Tau Ceti 与 Centre for Population Genomics。方向包括神经连接组、气候建模、癌症影像、罕见病基因组与数学形式化。Anthropic 称这些合作仍处早期阶段。公司会在未来分享研究成果与影响评估。

### Meta 的 Muse 在新加坡上线，接入本地常用服务

北京时间 10 月 28 日，Meta 宣布个人 AI 代理 Muse 在新加坡上线。用户可通过 iOS、Android 与网页使用，AI 眼镜版本稍后推出。这是 Muse 在全球发布后落地的具体市场。Meta 没有说明下一批市场。

Muse 可以连接 Gmail、Google Calendar 与 Instagram，也能接入 Shopee、Grab、新加坡航空、Agoda、ShopBack、Klook、Trip.com 与 Lazada。这些连接器覆盖购物、生鲜、餐饮与旅行，部分体验会在上线后逐步开放。用户可以比较商品价格、规划行程或预订餐厅。

Meta 称 Muse 运行在 Muse Secure VM 上。密码与支付方式不会直接暴露给代理，敏感操作前会向用户确认，用户也能决定开放哪些数据。Meta 称安全与隐私是这轮上线的重点。这减少了凭证泄露的暴露面。

Muse 的大部分功能免费，重度使用需要订阅。Meta 没有公布订阅价格，也没有给出新加坡以外的上线时间。Meta 表示连接器功能会分批开放。部分服务需要用户主动授权。

## 为什么值得关注

五条动态指向同一个变化：能力仍在推进，开放节奏却更谨慎。Carbon 只先给防御方，Muse 只先落地一个市场。厂商都在用更小的范围换取更稳的反馈。这种谨慎来自监管与安全压力。

平台与工作流成为竞争焦点。Google 把应用接入做成平台，OpenAI 把代理送进企业系统。谁能占据入口，谁就掌握分发。这两条路线都不依赖单一模型能力。它们争夺的是用户每天打开的工作界面。

科研与消费市场是两条长期战线。Anthropic 用 credits 换研究生态，Meta 用本地服务换用户习惯。短期看不到回报，长期决定模型的使用场景。两条战线的共同点是先建立使用惯性。

## 来源

- [官方] [Google — Gemini 4 Carbon: our next frontier model](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/)
- [官方] [Google — Build and manage Connected Apps in one place](https://blog.google/innovation-and-ai/technology/developers-tools/connected-apps-one-place/)
- [官方] [OpenAI — OpenAI and ServiceNow expand partnership across enterprise workflows](https://openai.com/index/openai-servicenow-partnership-expansion)
- [官方] [Anthropic — AI for Science expands to foundations and research institutions](https://www.anthropic.com/news/ai-for-science-expands-foundations-research-institutions)
- [官方] [Meta — Muse Is Now Available in Singapore](https://about.fb.com/news/2026/10/muse-is-now-available-in-singapore-the-worlds-first-personal-ai-agent-built-for-everyone/)
