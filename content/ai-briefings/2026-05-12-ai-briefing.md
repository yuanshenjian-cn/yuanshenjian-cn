---
title: "AI 简报 · 2026-05-12"
date: "2026-05-12"
brief: "OpenAI 拆出独立子品牌 DeployCo 并签约收购 Tomoro，把企业落地交付包装成单独业务线；Anthropic 同日发布 Claude Code v2.1.139，引入 agent view 与 /goal、/scroll-speed 等命令；Morningstar 与 PitchBook 通过 MCP 把数据接入 Perplexity 投研工作流。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - Claude Code
  - Perplexity
  - Gemini
---

5 月 11 日的 AI 圈出现两条主线：OpenAI 把"企业落地交付"独立成一家公司，Anthropic、Perplexity、Google 则继续在开发者工具、垂直数据接入和多模态模型上同步推进。

## 速览

- OpenAI 推出独立子品牌 OpenAI Deployment Company（DeployCo），起步投入超过 40 亿美元，并签约收购应用 AI 公司 Tomoro，引入约 150 名 Forward Deployed Engineers。
- DeployCo 由 OpenAI 控股；TPG 牵头领投，Advent、Bain Capital、Brookfield 为联合首创合伙人，共 19 家投资与咨询机构参与；Bain & Company、Capgemini、McKinsey 加入咨询/系统集成阵营。
- Anthropic 在 GitHub 发布 Claude Code v2.1.139，引入 Research Preview 版 agent view、`/goal`、`/scroll-speed` 命令，并为插件提供每次会话 token 成本预估。
- Morningstar 与 PitchBook 通过 Model Context Protocol 把投研数据接入 Perplexity 工作流。
- 9to5Google 曝光名为 Omni 的 Gemini 视频生成模型早期演示，Google 尚未官方确认其与 Veo 的关系。

## 重点动态

### OpenAI 拆出独立子品牌 DeployCo，签下收购 Tomoro

OpenAI 在官网公开新独立业务公司 OpenAI Deployment Company（DeployCo）。其定位是把 OpenAI 内部用于上线 ChatGPT 与企业平台的部署工程能力打包对外，由 Forward Deployed Engineer（FDE）驻场，帮助企业把 OpenAI 模型嵌入数据、工具与业务流程，走完从用例选型到生产部署的最后一段。DeployCo 起步投入超过 40 亿美元，由 OpenAI 控股；TPG 牵头领投，Advent、Bain Capital、Brookfield 为联合首创合伙人，外加 Goldman Sachs、SoftBank Corp.、Warburg Pincus、BBVA 等共 19 家投资机构参与；Bain & Company、Capgemini、McKinsey 作为咨询与系统集成方加入。同日 OpenAI 宣布签下收购应用 AI 工程公司 Tomoro，约 150 名 FDE 与部署专家在交易完成后并入 DeployCo，交易预计在未来数月内完成。

### Anthropic 发布 Claude Code v2.1.139

Anthropic 同日在 GitHub 发布 Claude Code v2.1.139。最显眼的是 Research Preview 版 agent view：通过 `claude agents` 命令调出一张统一的会话清单，跟踪所有正在运行、等待用户输入或已完成的 Claude Code 会话。`/goal` 命令允许显式设定完成条件，让 Claude 跨多个回合持续工作直到达成目标，并在 overlay 面板中实时显示耗时、回合数与 token 用量；`/scroll-speed` 支持鼠标滚轮速度调节并实时预览。`claude plugin details` 现可列出插件组件清单与每次会话的预估 token 成本，便于在安装或调用前评估开销。底层方面，hook 新增 `args: string[]` 直接 exec 形式与 `PostToolUse` 的 `continueOnBlock`，MCP stdio 服务可读取 `CLAUDE_PROJECT_DIR`。

### Morningstar 与 PitchBook 通过 MCP 接入 Perplexity

Morningstar 在官方新闻室宣布与子公司 PitchBook 一同将上市公司基本面、基金评级与私募市场估值数据通过 Model Context Protocol（MCP）接入 Perplexity AI。符合资格的 Perplexity 用户可在 AI 投研工作流内直接调用两家厂商的分析师标注数据，并附跳转链接，向机构桌面与投研场景扩张。

### 9to5Google 曝光 Gemini "Omni" 视频模型早期演示

9to5Google 当地时间 5 月 11 日早间披露了名为 Omni 的 Gemini 视频生成模型早期演示。报道指出 Omni 与现有 Veo 系列并行存在，定位与 Gemini/Veo 的关系尚未获 Google 官方公开确认；该消息目前仅有媒体侧证据，待官方进一步说明。

## 为什么值得关注

DeployCo 是 OpenAI 第一次在公司层面把"卖模型"和"卖落地交付"分开。它显示 OpenAI 已经认定企业 AI 的瓶颈从模型能力转向部署工程，并选择直接与 Bain、McKinsey 等咨询/SI 站到同一桌——不是单纯的渠道合作，而是用 40 亿美金资本和 Tomoro 团队建立自有 FDE 交付能力。Claude Code v2.1.139 的 agent view 与 `/goal` 把代理执行从"单次回合"升级到"跨会话目标驱动"，并把可观察性、token 成本预估摆到正面，是企业级 IDE 工具下一阶段竞争的明显方向。Morningstar、PitchBook 借助 MCP 走进 Perplexity 投研工作流，则提示 MCP 正从 IDE 与代理框架的协议层向金融研究等垂直数据资产侧溢出。

## 来源

- [OpenAI launches the OpenAI Deployment Company](https://openai.com/index/openai-launches-the-deployment-company/) `[官方]`
- [Anthropic Claude Code v2.1.139 (GitHub Release)](https://github.com/anthropics/claude-code/releases/tag/v2.1.139) `[官方]`
- [Morningstar and PitchBook Expand Access to Trusted Investment Intelligence Through Perplexity](https://newsroom.morningstar.com/news/news-details/2026/Morningstar-and-PitchBook-Expand-Access-to-Trusted-Investment-Intelligence-Through-Perplexity/default.aspx) `[官方]`
- [9to5Google — Gemini 'Omni' video model shows up with some early demos](https://9to5google.com/2026/05/11/gemini-omni-video-model-shows-up-with-some-early-demos/) `[媒体报道]`
