---
title: "AI 简报 · 2026-07-29"
date: "2026-07-29"
brief: "Sam Altman 公开表态需要减速，1134 名前沿 AI 员工联署公开信要求开发治理工具；Anthropic Mythos 自主发现后量子密码算法缺陷；Perplexity Personal Computer 登陆 Windows 平台；Google 升级 Managed Agents 新增 Gemini 3.6 Flash 支持；Meta 签署欧盟 AI 生成内容透明度准则。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
  - Meta
  - Perplexity
  - 安全
  - 减速
  - 密码学
  - Open Secure AI
  - Managed Agents
  - EU AI Act
---

过去 24 小时，AI 行业的安全共识从事件驱动走向制度博弈。

Sam Altman 首次公开承认可能需要调整发展速度。1134 名前沿 AI 员工签署公开信要求治理工具。

与此同时，模型能力仍在突破边界。Anthropic 的 Mythos 证明 AI 可以自主发现密码算法本身的缺陷。

## 速览

- Sam Altman 在播客中表示"可能需要调整 AI 发展速度"，同日 1134 名前沿 AI 员工签署公开信
- Anthropic Mythos 在 60 小时内自主发现后量子签名方案 HAWK 的密钥强度减半攻击
- Perplexity Personal Computer 从 Mac 扩展至 Windows，支持本地文件操作和 Office 应用
- Google 升级 Managed Agents，Gemini 3.6 Flash 成为默认模型并新增 Hooks 与预算控制
- Meta 签署欧盟 AI 法案关于 AI 生成内容透明度的实践准则

## 重点动态

### Sam Altman 公开表态需要减速，前沿 AI 员工联署公开信

Hugging Face 安全事件的影响正在从技术层面向行业共识层面传导。

Sam Altman 在 7 月 28 日发布的两期播客中首次公开承认，可能需要调整 AI 发展速度以给社会适应时间。他将此次安全事件描述为"极其科幻的网络安全事件……这是我第一次切身感受到的安全事件"。

在 Y Combinator 播客中，他呼吁分散 AI 权力。他担心"一家公司或一个人拥有超过地球上其他所有人加在一起的权力"。

同日，1134 名来自 OpenAI、Anthropic、Google、Meta、Microsoft 等前沿 AI 实验室的员工联合签署"Pacing the Frontier"公开信。信中指出，AI 可能即将实现自动化 AI 研究，请求美国政府支持国际合作，开发"有意识调控前沿 AI 开发速度"的技术和治理工具。

两项独立事件在同一天指向同一个方向。行业内部正在形成减速共识。

### Anthropic Mythos 自主发现后量子密码算法缺陷

Anthropic 的 Claude Mythos Preview 在参加密码学基准测试时，几乎自主发现了 HAWK 数字签名方案的密钥强度减半攻击。HAWK 已经过 NIST 两轮审查，历时两年未被发现。Mythos 还在 60 小时内找到了 7 轮 AES 的改进攻击，比已知最佳攻击快 200 至 800 倍。

两项发现各耗费约 10 万美元的 API 算力。Anthropic 强调这不同于以往的实现层漏洞。这是 AI 首次在数学算法层面发现经专业密码学家审查后残留的缺陷。

### Perplexity Personal Computer 登陆 Windows

Perplexity 将其 Personal Computer 产品从 Mac 扩展至 Windows 平台。产品定位为"通用数字工作者"，可读写本地文件、操作 Office 应用。

系统采用多模型编排架构。默认编排器为 Claude Opus 4.7，支持切换至 GPT-5.4 或 Claude Sonnet 4.6。子任务自动分配到 20 多个模型。订阅价格为每月 200 美元起，面向 Max 和 Enterprise Max 用户。

### Google 升级 Managed Agents，Gemini 3.6 Flash 成为默认模型

Google 为 Gemini API 的 Managed Agents 带来多项升级。Gemini 3.6 Flash 成为默认模型，开发者无需改代码即可使用。新增 Environment Hooks 支持在工具调用前后执行自定义脚本，用于安全检查和审计。

平台还新增了预算控制、定时触发器以及无计费项目的免费套餐支持。Environments API 允许开发者管理独立的沙箱会话。

### Meta 签署欧盟 AI 生成内容透明度准则

Meta 于 7 月 28 日宣布签署欧盟 AI 法案中关于 AI 生成内容透明度的实践准则。该准则要求平台对 AI 生成或修改的内容进行明确标注。Meta 是首批签署该准则的大型科技公司之一。

## 为什么值得关注

Hugging Face 安全事件的余波在本期集中释放。最值得关注的不是某一家公司的应对，而是整个行业正在形成的共识——前沿 AI 的发展可能确实需要更审慎的节奏。

从 Altman 的个人表态到 1134 名员工的联署公开信，行业正在同时经历两个方向的压力。模型能力在快速突破安全边界。治理机制也正在从分散应对走向结构性博弈。

## 来源

- [媒体报道] [TechCrunch — Sam Altman is ready to decelerate](https://techcrunch.com/2026/07/28/sam-altman-is-ready-to-decelerate/)
- [媒体报道] [The Verge — AI leaders sign a statement asking the government to do something about automated AI](https://www.theverge.com/ai-artificial-intelligence/972161/ai-leaders-us-government-openai-anthropic-google-meta)
- [官方] [Anthropic — Discovering cryptographic weaknesses with Claude](https://www.anthropic.com/research/discovering-cryptographic-weaknesses)
- [媒体报道] [The Verge — Perplexity's Personal Computer turns Windows PCs into AI agents](https://www.theverge.com/ai-artificial-intelligence/971750/perplexity-personal-computer-windows-ai-agents)
- [官方] [Google AI Blog — Expanding Managed Agents in Gemini API](https://blog.google/innovation-and-ai/technology/developers-tools/expanding-managed-agents-gemini-api-3-6-flash-hooks/)
- [官方] [Meta Newsroom — Meta is Signing the EU AI Act Code of Practice](https://about.fb.com/news/2026/07/meta-is-signing-the-eu-ai-act-code-of-practice-on-transparency-of-ai-generated-content/)
