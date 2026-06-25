---
title: "AI 简报 · 2026-06-25"
date: "2026-06-25"
brief: "OpenAI 发布首款自研推理芯片 Jalapeño；Anthropic 指控阿里巴巴大规模非法访问 Claude；Google 升级 Gemini 3.5 Flash 计算机使用能力却持续流失核心研究员。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
  - Perplexity
---

6 月 24 日，AI 竞争重心继续从模型本身向基础设施、安全边界和垂直行业延伸。OpenAI 拿出首款自研芯片，Anthropic 把矛头指向阿里巴巴，Google 一边升级 Gemini 一边流失核心研究员。

三条线索合在一起：模型层差距正被基础设施、人才与落地场景重新定义。

## 速览

- OpenAI 发布首款自研推理芯片 Jalapeño，由 Broadcom 设计制造，早期每瓦性能显著优于现有方案
- Anthropic 致信美国参议员与白宫，指控阿里巴巴借数千个欺诈账户"非法"访问 Claude
- Google 为 Gemini 3.5 Flash 增加原生"计算机使用"工具，取代独立的 Computer Use 模型
- Gemini 核心研究员 Adler 与 Pritzel 离职加入 Anthropic，延续 Google 人才流失
- Perplexity 推出 Computer for Counsel，集成 Midpage、LegalZoom 切入法律市场

## 重点动态

### OpenAI 用 Jalapeño 补全"全栈"基础设施

6 月 24 日，OpenAI 发布首款自研推理芯片 Jalapeño，由 Broadcom 设计制造，专为 OpenAI 推理系统定制。OpenAI 称自家模型也参与了芯片开发。

芯片仍在测试，但早期结果显示每瓦性能显著优于现有最先进方案。它面向推理场景，强调运行实时编码模型时的低运营成本，预训练等高负载仍依赖 Nvidia。

OpenAI 于 2025 年 10 月与 Broadcom 签署战略合作，意在降低对 Nvidia GPU 的依赖。总裁 Brockman 称公司对自身工作负载有深度理解，此次发布被定位为"全栈"战略一环：从芯片架构、内核、内存到部署与产品逐层优化。

### Anthropic 指控阿里巴巴大规模"非法"访问 Claude

6 月 24 日，Bloomberg 报道，Anthropic 致信多名美国参议员和白宫官员，指控阿里巴巴通过数千个欺诈账户"非法"访问 Claude 模型。

信件指行动与阿里 Qwen AI 实验室相关，重点针对 Claude 的软件工程与 agentic reasoning 能力。Anthropic 称这是中国公司迄今最大规模"搭便车"行为，直接削弱其将产品排除在中国之外的决策。

这一指控发生在 Fable 5、Mythos 5 因出口管制下线的背景下，把数据安全与地缘张力再次推到前台。

### Gemini 3.5 Flash 获得"计算机使用"能力

6 月 24 日，Google 宣布 Gemini 3.5 Flash 增加原生"计算机使用"工具，取代独立的 Gemini 2.5 Computer Use 模型。开发者可构建跨浏览器、移动和桌面的自定义 agent。

新版本改进了长周期与企业自动化任务表现，适用于持续软件测试和专业知识工作。企业版提供安全控制：敏感操作需用户确认，检测到间接提示注入会自动停止。

Gemini 3.5 Flash 当日在 Gemini API 上线，Chrome 149 同步推出"Select from screen"工具，允许用户把屏幕内容直接加入提示。

### Gemini 核心研究员接连出走投奔 Anthropic

6 月 24 日，TechCrunch 援引 Bloomberg 报道，Google 研究员 Jonas Adler 和 Alexander Pritzel 离职加入 Anthropic，两人是 Gemini 模型开发核心成员。

这是 Google 人才流失的延续：此前 Gemini 联合负责人 Shazeer 已转投 OpenAI，诺奖得主、AlphaFold 联合创建者 Jumper 也已加入 Anthropic。OpenAI 与 Anthropic 筹备上市带来的股权承诺，正让人才天平持续倾斜。

### Perplexity 用 Computer for Counsel 切入法律市场

6 月 24 日，Perplexity 推出 Computer for Counsel 法律平台，把"Perplexity Computer"策展式 agent 能力延伸到法律场景。

平台集成 Midpage、LegalZoom，并接入 Docusign、DeepJudge、NetDocuments、Carta、Box 与 Microsoft 365，可在 Word 起草、从 SharePoint 检索。Perplexity 强调可审计性，定位中小型律所与企业法务。此前 Gunderson Dettmer 曾全所推行 Perplexity Enterprise，八成律师使用。在 Harvey、Thomson Reuters 等玩家间，Perplexity 以多模型策展和轻量集成分切入。

## 为什么值得关注

OpenAI 把芯片纳入"全栈"战略，说明前沿模型竞争已延伸到从芯片到产品的整条链路，推理成本的微小改进在规模化下都会被放大。

Anthropic 对阿里的指控，把模型访问权与地缘政治绑定。出口管制常态化后，"谁能用"正和"谁造得强"一样重要。

Google 一边发布 Gemini agent 能力，一边持续流失研究员。能力升级与人才出走同步，让外界更难判断其真实竞争力，后续模型节奏与人才稳定性将是观察重点。

Perplexity 进军法律，显示厂商正把通用模型封装为垂直方案。法律对可审计性要求极高，能否站稳取决于准确率与企业信任。

## 来源

- [OpenAI — Jalapeño: OpenAI's first custom inference chip](https://openai.com/index/openai-broadcom-jalapeno-inference-chip/) `[官方]`
- [TechCrunch — OpenAI unveils its first custom chip, built by Broadcom](https://techcrunch.com/2026/06/24/openai-unveils-its-first-custom-chip-built-by-broadcom/) `[媒体报道]`
- [Bloomberg — Anthropic Accuses Alibaba of 'Illicitly' Accessing AI Models](https://www.bloomberg.com/news/articles/2026-06-24/anthropic-accuses-alibaba-of-illicitly-accessing-its-ai-models) `[媒体报道]`
- [Google — Introducing computer use in Gemini 3.5 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-computer-use-gemini-3-5-flash/) `[官方]`
- [9to5Google — Gemini in Chrome adds 'Select from screen' tool as Gemini 3.5 Flash gains computer use](https://9to5google.com/2026/06/24/gemini-chrome-select-screen/) `[媒体报道]`
- [Bloomberg — Google Poised to Lose Two More High-Profile AI Staffers to Anthropic](https://www.bloomberg.com/news/articles/2026-06-24/google-poised-to-lose-two-more-high-profile-ai-staffers-to-anthropic) `[媒体报道]`
- [TechCrunch — AI researchers continue to leave Google for its rivals](https://techcrunch.com/2026/06/24/ai-researchers-continue-to-leave-google-for-its-rivals/) `[媒体报道]`
- [Law.com — Perplexity AI Launches Computer for Counsel, Powered by Legal Tech Integrations](https://www.law.com/legaltechnews/2026/06/24/perplexity-ai-launches-computer-for-counsel-powered-by-legal-tech-integrations/) `[媒体报道]`
- [Above the Law — Perplexity Jumps Into Legal With 'Computer For Counsel'](https://abovethelaw.com/2026/06/perplexity-jumps-into-legal-with-computer-for-counsel/) `[媒体报道]`
