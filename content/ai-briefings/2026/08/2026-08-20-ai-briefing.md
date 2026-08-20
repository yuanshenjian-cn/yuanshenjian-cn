---
title: "AI 简报 · 2026-08-20"
date: "2026-08-20"
brief: "OpenAI 预告 Zero Data Retention 兼容的 Private Safety Processing，并推出 ChatGPT for Teens 与欧洲广告扩展；Anthropic 年化营收运行率突破 650 亿美元；Grok 4.6 上线 Amazon Bedrock，Meta AI 发布 Mac 应用，Google 推出开学季学习工具。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - xAI
  - Meta
  - Google
---

本期窗口（8 月 18 日至 20 日）厂商动作密集。OpenAI 在隐私、青少年产品与广告三条线上同时推进。Anthropic 披露年化营收里程碑。xAI 与 Meta 则分别完成模型渠道扩展与桌面端布局。

## 速览

- OpenAI 预告 Private Safety Processing，在 Zero Data Retention 部署下保留跨交互安全监测
- OpenAI 推出 ChatGPT for Teens 青少年专用模式，内置学习与家长控制功能
- Anthropic 年化营收运行率突破 650 亿美元，较去年底增长逾七倍
- ChatGPT Ads 扩展至欧洲 31 个市场，仅面向免费与 Go 计划用户
- Grok 4.6 在 Amazon Bedrock 正式可用，500K 上下文、输入 2 美元/百万 token
- Meta AI 发布 Mac 桌面应用，支持窗口内容理解与跨应用听写
- Google 为开学季推出 Search 与 Gemini 学习工具及学生中心

## 重点动态

### OpenAI 预告 Private Safety Processing，强化 ZDR 部署下的安全监测

OpenAI 于 8 月 19 日宣布预览 Private Safety Processing。该机制可在 Zero Data Retention（ZDR）部署下，跨多个相关交互识别潜在滥用模式。ZDR 此前承诺 OpenAI 不保留客户提示与响应，且人员无权查看客户内容，除非客户主动选择分享。

新机制的关键在于自动化系统可分析跨交互模式，而 OpenAI 人员仍拿不到底层内容。存储于客户侧基础设施时，内容继续由客户控制。使用 OpenAI 托管存储时，内容以客户持有的密钥加密。识别到风险后，系统仅向 OpenAI 返回窄范围的活动类型信号。

该方案正在与早期客户测试，9 月将发布技术白皮书并开始推广。TechCrunch 将此解读为 OpenAI 在客户隐私保护上对标 Anthropic。企业数据控制权正成为前沿模型厂商的竞争焦点。

### OpenAI 推出 ChatGPT for Teens 青少年专用模式

OpenAI 于 8 月 18 日推出 ChatGPT for Teens。系统估计用户未满 18 岁，或用户自报年龄在 13 至 17 岁之间时，会自动进入该模式。产品内置 Study Mode，以引导式提问协助理解知识点，而非直接给出答案。

新功能包括负责任作业提醒，可识别绕过作业的意图并引导至分步解题。家长可通过关联账户设置 Quiet Hours 与安全通知。针对未成年人，产品默认启用内容保护，覆盖自残、暴力、饮食障碍等高风险主题。

OpenAI 同步与 CodeAI 达成合作，为师生提供 AI 素养教育资源。公司还开始在系统卡中公布未成年人安全评估结果，覆盖自残、暴力等高风险场景。青少年 AI 使用正从"可用"转向"按年龄设计"。

### Anthropic 年化营收运行率突破 650 亿美元

据 Bloomberg 报道，Anthropic 年化营收运行率在 7 月底达到 650 亿美元。该数据较去年底的约 90 亿美元增长逾七倍，CNBC 与 TechCrunch 均独立确认。公司在上周末的投资者沟通中披露了该数字。

报道称 Anthropic 正与投行筹备 IPO，最早或于秋季上市。其 5 月融资时估值已达 9650 亿美元。公司第二季度初步营收超过 115 亿美元。营收高速增长反映了企业端对 Claude 系列的需求。

需要注意的是，运行率是按近期月度表现年化推算的指标，并非审计后的正式收入。公司将在后续财报中披露审计后数据。若上市成行，Anthropic 将先于 OpenAI 登陆公开市场。

### ChatGPT Ads 扩展至欧洲 31 个市场

OpenAI 于 8 月 18 日宣布，ChatGPT Ads 将于下周扩展至欧洲 31 个国家。覆盖市场包括德国、法国、西班牙、意大利与荷兰等。美国试点始于 2 月，此前已扩展至 8 个市场，本次为迄今最大规模扩展。

广告仅展示给 Free 与 Go 计划用户，Plus、Pro 与 Enterprise 订阅保持无广告。广告与答案明确区分，且不影响回答内容。用户可控制广告个性化程度，也可选择付费计划避免广告。

OpenAI 称已有数万名营销人员在 ChatGPT 投放广告。平台已支持转化优化、地域定向与自定义受众。自服务 Ads Manager 将于夏季晚些时候上线。免费模式的商业化路径正在成形。

### Grok 4.6 上线 Amazon Bedrock

xAI 于 8 月 19 日宣布，Grok 4.6 在 Amazon Bedrock 正式可用。该模型提供 500K 上下文窗口，支持低、中、高、超高四档推理强度。定价为输入每百万 token 2 美元，输出每百万 token 6 美元，企业客户可在支持的 AWS 区域直接调用。

Grok 4.6 于 8 月 12 日发布，此前已进入 Cursor、Grok Build、OpenRouter 等渠道。Bedrock 的加入补齐了云服务商渠道，AWS 用户可直接通过托管服务调用，无需自行部署。模型面向长时程 Agent 任务与多模态交互设计。

此举延续了 xAI 的渠道扩张节奏。模型发布后一周内完成云平台落地，渠道铺开速度明显快于此前的模型版本。云上客户可直接进入生产环境使用，进一步扩大 Grok 4.6 的企业触达范围。

### Meta AI 发布 Mac 桌面应用

Meta 于 8 月 19 日发布 Meta AI 的 Mac 应用，当前为 1.0 beta 版。应用支持共享窗口内容，AI 可基于屏幕上的内容提供建议与生成内容。内置的听写功能可跨其他 Mac 应用使用，面向 Apple Silicon 设备与 macOS 15 及以上版本。

应用面向企业与创作者，可连接 Instagram、Facebook 专业账户与 Google Workspace。基于业务数据，AI 可分析帖子表现并提出发布建议，还可生成文档与定期报告。桌面端竞争已进入白热化阶段。

相比 OpenAI 与 Anthropic 的桌面应用，Meta 版本目前只读屏、不能操作电脑。Google 的 Gemini 应用同样仅支持窗口共享。据媒体报道，应用体积约 16MB，为原生构建而非网页封装。Meta 正在追赶竞品的桌面布局。

### Google 为开学季推出学习工具与学生中心

Google 于 8 月 19 日发布开学季学习工具更新。Search、Lens 与 AI Mode 新增多项学习相关能力。Gemini 应用同步推出专门的学生中心（student hub），聚合答疑、概念讲解等学习功能入口，面向即将开学的学生群体。

TechCrunch 与 The Verge 均报道了本次更新。学生中心面向 K-12 与高等教育用户，整合了答疑、概念讲解等场景。搜索侧的工具则侧重作业辅助与知识巩固。AI Mode 在此基础上提供多轮追问式辅导。

教育场景正成为 AI 产品的重要落地战场。此前 OpenAI 已推出面向教师的 ChatGPT 服务。各大厂商正围绕学生与教师群体展开功能竞争。开学季因此成为产品更新的关键节点。

## 为什么值得关注

本期最突出的是 OpenAI 的三线并行：隐私合规、青少年产品与广告商业化。Private Safety Processing 回应了企业客户对数据控制权的核心诉求。ChatGPT for Teens 则提前卡位未成年人市场。广告扩展则验证免费模式的可持续性。

Anthropic 的营收数字值得放在行业坐标里看。650 亿美元运行率使 Claude 厂商成为营收口径下的领跑者。与 OpenAI 约 400 亿美元运行率对比，两家公司的商业节奏已拉开身位。IPO 预期将放大这一对比，资本市场的注意力也将随之迁移。

桌面端与渠道端的竞争同步升温。Meta 补上 Mac 应用，xAI 打通 AWS，Google 强化教育场景。前沿模型之外，分发渠道与垂直场景正在成为新的胜负手。对开发者与企业用户而言，模型可及性比模型本身更早兑现。

## 来源

- [官方] [OpenAI — Offering Zero Data Retention for frontier models](https://openai.com/index/offering-zero-data-retention-for-frontier-models)
- [媒体报道] [TechCrunch — OpenAI seeks to one-up Anthropic with new customer privacy protections](https://techcrunch.com/2026/08/19/openai-seeks-to-one-up-anthropic-with-new-customer-privacy-protections/)
- [官方] [OpenAI — Introducing ChatGPT for Teens: Built for learning, backed by protections](https://openai.com/index/chatgpt-for-teens)
- [媒体报道] [TechCrunch — OpenAI launches a safer ChatGPT for teens](https://techcrunch.com/2026/08/18/openai-launches-a-safer-chatgpt-for-teens-years-after-teens-started-using-it/)
- [媒体报道] [The Verge — ChatGPT is getting a dedicated mode for teens](https://www.theverge.com/ai-artificial-intelligence/981333/openai-chatgpt-teen-mode)
- [媒体报道] [Bloomberg — Anthropic's Annualized Revenue Tops $65 Billion Before IPO](https://www.bloomberg.com/news/articles/2026-08-17/anthropic-revenue-run-rate-surpasses-65-billion-ahead-of-ipo)
- [媒体报道] [CNBC — Anthropic says annualized revenue climbed to $65 billion in July](https://www.cnbc.com/2026/08/17/anthropic-says-annualized-revenue-climbed-to-65-billion-in-july.html)
- [媒体报道] [TechCrunch — Anthropic's annualized revenue surges to $65B](https://techcrunch.com/2026/08/17/anthropics-annualized-revenue-surges-to-65b/)
- [官方] [OpenAI — ChatGPT Ads expands across Europe](https://openai.com/index/chatgpt-ads-expands-across-europe)
- [官方] [xAI — Grok 4.6 on Amazon Bedrock](https://x.ai/news/grok-4-6-amazon-bedrock)
- [媒体报道] [The Verge — Meta AI is getting a Mac app](https://www.theverge.com/tech/982270/meta-ai-mac-app)
- [媒体报道] [The Next Web — Meta launched a Mac app to put its AI to work for businesses](https://thenextweb.com/news/meta-ai-mac-app)
- [官方] [Google — 5 new ways to level up your learning with Search](https://blog.google/products-and-platforms/products/search/back-to-school-study-tools/)
- [媒体报道] [TechCrunch — Google packs Search and Gemini with new AI study tools](https://techcrunch.com/2026/08/19/google-launches-new-study-tools-for-students-across-search-and-gemini/)
- [媒体报道] [The Verge — Google Gemini is getting a dedicated student hub](https://www.theverge.com/ai-artificial-intelligence/982425/google-gemini-student-hub)