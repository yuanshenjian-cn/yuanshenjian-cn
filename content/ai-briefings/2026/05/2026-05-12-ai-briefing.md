---
title: "AI 简报 · 2026-05-12"
date: "2026-05-12"
brief: "OpenAI 推出 DeployCo 并签约收购 Tomoro，Anthropic 发布 Claude Code v2.1.139，Morningstar 与 PitchBook 通过 MCP 接入 Perplexity。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - Claude Code
  - Perplexity
  - Gemini
---

5 月 11 日的 AI 动态分成两条线。OpenAI 把企业交付从模型销售中拆出来，Anthropic 则继续把 Claude Code 做成更可观察的 agent 工具。另一条线来自数据与多模态。

Morningstar、PitchBook 借 MCP 进入 Perplexity 投研流程，Gemini “Omni” 视频模型仍停留在媒体曝光阶段。

## 速览

- OpenAI 推出 OpenAI Deployment Company（DeployCo），起步投入超过 40 亿美元，并签约收购 Tomoro。
- Anthropic 发布 Claude Code v2.1.139，加入 agent view、`/goal`、`/scroll-speed` 与插件 token 成本预估。
- Morningstar 与 PitchBook 通过 MCP 把投研数据接入 Perplexity。
- 9to5Google 曝光 Gemini “Omni” 视频模型早期演示，但 Google 尚未确认其与 Veo 的关系。

## 重点动态

### OpenAI 把企业交付单独公司化

OpenAI 在官网公开 OpenAI Deployment Company（DeployCo）。这是一家由 OpenAI 控股的新独立业务公司，目标是把模型部署工程能力包装成对企业交付的服务。DeployCo 起步投入超过 40 亿美元，由 TPG 牵头领投。

Advent、Bain Capital、Brookfield 是联合首创合伙人，Bain & Company、Capgemini、McKinsey 则加入咨询与系统集成阵营。同日，OpenAI 签下收购应用 AI 工程公司 Tomoro。

交易完成后，约 150 名 Forward Deployed Engineers 与部署专家将并入 DeployCo，交易预计在未来数月内完成。

### Claude Code 开始强化跨会话 agent 管理

Anthropic 在 GitHub 发布 Claude Code v2.1.139。Research Preview 版 agent view 可以通过 `claude agents` 调出会话清单，跟踪正在运行、等待输入或已完成的 Claude Code 会话。

`/goal` 命令用于显式设定完成条件，让 Claude 跨多个回合持续工作。overlay 面板会显示耗时、回合数和 token 用量，`/scroll-speed` 则用于调节滚轮速度并实时预览。插件侧也补上了成本可见性。

`claude plugin details` 现在会列出插件组件清单，并估算每次会话的 token 成本；

hook 和 MCP stdio 服务也有底层更新。

### Morningstar 与 PitchBook 通过 MCP 接入 Perplexity

Morningstar 在官方新闻室宣布，已与子公司 PitchBook 一起把上市公司基本面、基金评级和私募市场估值数据接入 Perplexity。这次接入使用 Model Context Protocol（MCP）。

符合资格的 Perplexity 用户可以在 AI 投研工作流里调用两家机构的数据，并通过链接回到原始分析页面。

### Gemini “Omni” 仍处在媒体曝光阶段

9to5Google 当地时间 5 月 11 日披露了名为 Omni 的 Gemini 视频生成模型早期演示。报道称，Omni 与现有 Veo 系列并行存在。但 Google 尚未公开确认 Omni 与 Gemini、Veo 的关系，因此本期只把它作为媒体报道动态处理。

## 为什么值得关注

### DeployCo 是否会把 OpenAI 推向咨询和系统集成一线

DeployCo 的重点不只是“多卖模型”。它显示 OpenAI 正在把企业 AI 的瓶颈看作部署工程问题，并用资本、FDE 团队和咨询伙伴补齐最后一公里。后续要看 Tomoro 团队并入后，DeployCo 能否形成可复制的交付方法，而不是只服务少数大型客户。

### Claude Code 的竞争点转向可观察和可控

agent view、`/goal` 和 token 成本预估，把 Claude Code 从单次对话工具推向目标驱动的开发代理。如果这些能力稳定下来，企业级 IDE agent 的竞争会更依赖会话管理、成本透明和执行可控性。

### MCP 正从开发者工具外溢到垂直数据

Morningstar 与 PitchBook 的动作说明，MCP 不只服务 IDE 或 agent 框架。金融研究这类高价值数据场景，也可能成为协议扩散的下一站。未来值得观察的是，更多数据供应商是否会把 MCP 当成进入 AI 工作流的标准接口。

## 来源

- [OpenAI launches the OpenAI Deployment Company](https://openai.com/index/openai-launches-the-deployment-company/) `[官方]`
- [Anthropic Claude Code v2.1.139 (GitHub Release)](https://github.com/anthropics/claude-code/releases/tag/v2.1.139) `[官方]`
- [Morningstar and PitchBook Expand Access to Trusted Investment Intelligence Through Perplexity](https://newsroom.morningstar.com/news/news-details/2026/Morningstar-and-PitchBook-Expand-Access-to-Trusted-Investment-Intelligence-Through-Perplexity/default.aspx) `[官方]`
- [9to5Google — Gemini 'Omni' video model shows up with some early demos](https://9to5google.com/2026/05/11/gemini-omni-video-model-shows-up-with-some-early-demos/) `[媒体报道]`
