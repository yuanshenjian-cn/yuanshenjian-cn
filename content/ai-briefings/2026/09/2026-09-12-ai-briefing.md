---
title: "2026-09-12 AI 简报：OpenAI 推出 Agents API 与 GPT-Live-1；Mistral 完成 30 亿欧元融资；DeepSeek 发布 V4.1-Flash"
date: "2026-09-12"
published: true
brief: "本期聚焦 9 件动态：OpenAI 推出 Agents API 和 GPT-Live-1 API；Anthropic Newsroom 列出 9 月 AI 滥用报告；Meta 发布 Muse；Mistral 完成融资并与 Cloudera 合作；Google 更新 ToolGrad 与 AlphaGenome Atlas；DeepSeek 发布 V4.1-Flash。"
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
  - Meta
  - Mistral
  - DeepSeek
  - Agent
  - AI安全
---

9 月 8 日至 12 日（北京时间），重点厂商动态集中在 Agent 产品、模型 API、企业部署和 AI 安全。Mistral 的融资与合作也显示，算力、数据和主权部署正在成为模型公司的共同议题。

> 覆盖说明：本期 OpenAI、Anthropic、Google、Meta、Perplexity、Mistral、Kimi、MiMo、DeepSeek、智谱和 MiniMax 完成至少一条官方路径检查。xAI 新闻页返回 403，Google Gemini API Changelog 超时，Meta AI Blog 返回 400，因此整体 coverage 为 degraded。本期不把这些缺口解释为厂商无更新。

## 速览

- DeepSeek 发布 V4.1-Flash，降低多模态 API 的缓存成本
- OpenAI 发布 Agents API 公测版
- OpenAI 将 GPT-Live-1 正式接入 API
- Anthropic Newsroom 列出 9 月 AI 滥用报告
- Meta 发布个人 AI Agent Muse
- Mistral 完成 30 亿欧元 D 轮融资
- Mistral 与 Cloudera 合作推进主权企业 AI
- Google Research 推出 ToolGrad，改进工具使用数据生成
- Google DeepMind 发布覆盖 90 亿变异的 AlphaGenome Atlas

## 重点动态

### DeepSeek 发布 V4.1-Flash，降低多模态 API 的缓存成本

DeepSeek 于 9 月 10 日发布 V4.1-Flash。官方介绍称，该模型采用 552B 参数的 MoE 架构。它原生支持视觉理解，并以 `deepseek-flash` 名称提供 API 服务。该版本把模型发布与开发者接入安排放在同一公告中。

这次发布还调整了 API 上线、路由和价格安排。官方同时强调更低的 KV 缓存需求。对多模态应用而言，缓存占用和调用成本会直接影响长上下文任务的部署方式。

### OpenAI 发布 Agents API 公测版

OpenAI 在 9 月 10 日的 API Changelog 中宣布 Agents API 公测。服务包含托管的 Codex harness 和持久会话。开发者可以把多步 Agent 工作流交给统一的 API 执行。官方把它定位为构建和运行长任务 Agent 的基础能力。这让状态管理成为服务的一部分。

更新还覆盖编排、上下文压缩、恢复机制、工具调用和 MCP 连接。它把长任务的状态管理放进平台能力。应用开发者仍需自行设计权限、日志和失败后的人工接管。

### OpenAI 将 GPT-Live-1 正式接入 API

OpenAI 于 9 月 10 日宣布 GPT-Live-1 进入 API。模型面向更自然的语音体验，并采用全双工交互方式。用户可以在对话继续时保持语音交流，不必等待每一轮处理结束。该能力面向需要连续响应的语音应用。

GPT-Live-1 还可以把推理和工具调用交给后端模型。这样，语音界面与复杂任务执行可以放在同一条调用链中。开发者需要同时处理实时音频、工具状态和会话恢复。

### Anthropic Newsroom 列出 9 月 AI 滥用报告

Anthropic 于 9 月 10 日在 Newsroom 列出 9 月 AI 滥用报告。页面确认了该条目的标题和日期。当前证据来自官方 Newsroom 索引，本文只引用索引可以直接核验的内容。该条目属于本期官方安全信息更新。

由于当前证据 URL 是 Newsroom 索引，而不是报告详情页，本文不扩展报告正文、案例分类或处置过程。读者可据官方索引继续追踪原始报告。这个处理避免把未直接读取的细节写成已确认事实。

### Meta 发布个人 AI Agent Muse

Meta 于 9 月 9 日发布 Muse。官方把它定位为面向普通用户的个人 AI Agent。产品可以在浏览器环境中执行连续操作，并把任务从对话推进到实际动作。它把个人用户作为 Agent 产品的主要使用场景。

Muse 的运行设计包含独立 Secure VM、Sentinel 审批、权限控制和审计轨迹。用户因此可以看到 Agent 的执行边界。个人 Agent 的竞争开始同时比较任务能力、隔离方式和可追责性。部署安全不再只是后台配置。

### Mistral 完成 30 亿欧元 D 轮融资

Mistral 于 9 月 8 日宣布完成 30 亿欧元 D 轮融资。官方称，投后估值超过 210 亿欧元。Samsung Electronics 领投了这轮融资，其他投资方共同参与。该轮融资把公司扩张计划与长期基础设施投入联系起来。

公司计划把资金用于前沿研究、算力、基础设施和国际业务扩张。Mistral 同时强调主权和开放权重 AI。融资规模说明模型公司仍需用资本投入支撑长期训练与部署能力。

### Mistral 与 Cloudera 合作推进主权企业 AI

Mistral 与 Cloudera 于 9 月 10 日宣布合作。双方将把 Mistral 模型接入 Cloudera 的混合数据平台。推理场景覆盖公有云、私有云、本地环境和完全隔离的 air-gapped 环境。合作重点是让企业按自身数据边界选择部署位置。

合作还支持受控的定制模型训练。企业可以在数据边界内安排模型部署。对受监管行业而言，模型效果之外，数据位置、网络隔离和训练控制同样决定采购可行性。

### Google Research 推出 ToolGrad，改进工具使用数据生成

Google Research 于 9 月 11 日介绍 ToolGrad。方法先生成工具调用链，再用文本“梯度”标注对应的用户查询。它据此改进工具使用数据生成，让训练样本更贴近具体任务。流程重点不是先处理答案再反推工具轨迹。

官方报告称，ToolGrad 可以降低数据生成成本。方法也提高了工具链通过率和长程工具使用能力。工具调用 Agent 的竞争因此不只取决于模型规模，也取决于训练数据如何生成。

### Google DeepMind 发布覆盖 90 亿变异的 AlphaGenome Atlas

Google DeepMind 于 9 月 8 日发布 AlphaGenome Atlas。Atlas 预计算人类基因组约 90 亿个单核苷酸变异的分子影响。它把模型预测整理成可供研究使用的基因组变异地图。这使研究人员能够从统一入口查看大规模变异预测。

官方表示，AlphaGenome Atlas 面向学术研究开放。研究人员可以据此筛选和比较潜在的调控影响。模型从单次预测扩展到大规模预计算，也改变了生物研究使用 AI 的入口。

## 为什么值得关注

Agents API、GPT-Live-1 和 Muse 分别从开发者、语音交互和个人使用场景推进 Agent。它们的共同点是把模型从回答工具变成执行系统。会话状态、工具权限、隔离环境和审计记录因此成为产品竞争的一部分。

Mistral 的融资与 Cloudera 合作连接了资本、算力和企业数据部署。DeepSeek 关注缓存效率，ToolGrad 关注训练数据效率。模型厂商正在同时压低训练和推理环节的成本，并扩大可落地的部署边界。

Anthropic 的报告条目与 AlphaGenome Atlas 代表另一组变化。前者提示 AI 滥用治理仍是厂商公开沟通的一部分，后者把研究模型转为可查询的数据基础设施。能力发布、风险披露和使用入口正在形成同一条产品链。

## 来源

- [官方] [DeepSeek — DeepSeek-V4.1-Flash: Smarter, Faster, More Efficient](https://api-docs.deepseek.com/news/news260910)
- [官方] [OpenAI — API Changelog](https://platform.openai.com/docs/changelog)
- [官方] [OpenAI — Build more natural voice experiences with GPT-Live-1 in the API](https://openai.com/index/introducing-gpt-live-1-in-the-api)
- [官方] [Anthropic Newsroom — September 2026 AI misuse report listing](https://www.anthropic.com/news)
- [官方] [Meta — Introducing Muse: The World’s First Personal AI Agent Built for Everyone](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
- [官方] [Mistral — Mistral raises €3B to make sovereign, open-weight AI the technology frontier](https://mistral.ai/news/mistral-makes-sovereign-open-weight-ai-to-frontier/)
- [官方] [Mistral — Cloudera and Mistral Partner to Bring Specialized, Sovereign Intelligence to Enterprise Data](https://mistral.ai/news/mistral-x-cloudera)
- [官方] [Google Research — ToolGrad: Efficient tool-use dataset generation with textual “gradients”](https://research.google/blog/toolgrad-efficient-tool-use-dataset-generation-with-textual-gradients/)
- [官方] [Google DeepMind — AlphaGenome Atlas: A predictive map of every possible DNA letter change in the human genome](https://deepmind.google/blog/alphagenome-atlas-a-predictive-map-of-every-possible-dna-letter-change-in-the-human-genome/)
