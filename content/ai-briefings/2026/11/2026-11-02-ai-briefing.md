---
title: "2026-11-02 AI 简报：OpenAI 上线 GPT-6 Rosalind；Mistral 开放 Le Chonk 权重"
date: "2026-11-02"
published: true
brief: "本期确认 5 件动态：OpenAI 上线生命科学模型 GPT-6 Rosalind；Mistral 开放 Le Chonk 权重；Google 将 Computer Use 推向正式可用；OpenAI 支持共享 robots.txt 训练偏好信号；Meta 与 CNIB 合作推广 AI 眼镜。"
tags:
  - AI
  - OpenAI
  - Mistral
  - Google
  - Meta
  - 模型
  - 生命科学
  - 开源
  - Agent
  - 无障碍
---

北京时间 10 月 29 日至 11 月 2 日，AI 厂商在模型开放与能力准入上给出两种答案。OpenAI 把生命科学模型锁进审核名单，Mistral 则把 1T 参数模型的权重直接开放。Google 推进代理工具，Meta 与 OpenAI 分别处理使用门槛与内容授权。

> 覆盖说明：本期 coverage 为 degraded。OpenAI News、Google DeepMind 与 Google Research 的 Feed 为 partial，Google AI RSS 覆盖完整；OpenAI 训练偏好条目正文返回 403，正文仅依据官方 RSS 摘要；Perplexity 变更日志只有月份粒度；小米 MiMo 页面只有相对更新时间；智谱官方页无日期化条目，z.ai 博客无可读内容；MiniMax 官网只有导航与模型入口。上述缺口不代表对应厂商本期无更新。

## 速览

- OpenAI 上线 GPT-6 Rosalind，生命科学模型仅限受控机构使用。
- Mistral 开放 Le Chonk 权重，1T 参数模型支持自托管。
- Google 将 Gemini API 的 Computer Use 工具推向正式可用。
- OpenAI 将遵守共享 robots.txt 信号，网站可表达训练偏好。
- Meta 与 CNIB 合作，向加拿大无障碍社区推广 AI 眼镜。

## 重点动态

### OpenAI 上线 GPT-6 Rosalind，生命科学模型转向受控 API

OpenAI 于当地时间 10 月 30 日在 API 变更日志中上线 GPT-6 Rosalind。官方称该模型面向复杂生命科学研究，强化生物推理与科学工具调用，价格高于此前的 Rosalind 研究型号。

该模型不向公众开放。只有通过 Rosalind Research 审核、加入 trusted-access 计划的机构，才能用于内部研究。OpenAI 会逐家审核授权用户，开放范围没有放宽。标准价格按每百万 token 计算，短上下文输入 15 美元，缓存输入 1.50 美元，输出 75 美元。

长上下文价格更高，输入 30 美元，输出 112.50 美元。这延续了 9 月的 Rosalind 研究与 10 月的学术计划。此次新增独立的 GPT-6 型号与公开价目，但使用门槛没有放宽。外部研究者仍需由机构申请，个人用户无法直接调用。

### Mistral 开放 Le Chonk 权重，1T 参数模型可自托管

Mistral 于 10 月 29 日宣布开放 Mistral Large 4 的权重，昵称 Le Chonk。该模型有 1 万亿参数，原生支持多模态，此前只提供公开预览。此次开放意味着企业可以把模型部署在自己的基础设施上。

Mistral 称三周强化学习后，模型在编码与防御性网络安全上有明显提升。它提供低、中、高三档推理模式，默认高档，便于在性能与成本间取舍。官方还强调模型在 token 效率上的优势。

官方给出的 FrontierCode 2.0 得分为 19.7%，Terminal-Bench 4.0 为 41%。在 Artificial Analysis 的编码代理指数上，它与 GLM-5.3 基本持平，但每个任务少用 47% token。Mistral 称这使其更适合大规模编码代理，这组数据覆盖编码、终端与真实仓库任务。

权重可从 Hugging Face 下载，采用修改版 MIT 许可。经营模型即服务业务的公司若对外提供该模型，需另行获得商业许可。API 价格为输入 0.70 美元、缓存输入 0.07 美元、输出 2.10 美元，均按每百万 token 计。

### Google 把 Gemini API 的 Computer Use 工具推向正式可用

Google 于 10 月 30 日宣布，Gemini API 的 Computer Use 工具正式可用。该工具同时覆盖 Interactions 与 GenerateContent 两套接口，开发者不必再依赖预览版本。这标志着 Gemini 的界面操作能力进入生产阶段，此前该工具以预览形式提供。

正式可用意味着该工具不再只是预览能力。对已经使用 Gemini API 的团队而言，可以在现有接口中评估 Computer Use，而不必切换到另一套 API。这降低了迁移成本，Google 也没有要求团队更换接口。

Google 把该工具同时放在两套接口下，覆盖不同的调用方式。已有 GenerateContent 工作流的团队可以继续使用原接口，采用 Interactions 的团队也能接入同一工具。团队可以按现有架构选择接口，不必为了一个工具重写调用层。

Computer Use 的接入仍取决于具体模型与环境。Google 在变更日志中只确认了 GA 范围，更多实现细节需要查阅链接的官方文档。不同模型与运行环境的能力边界可能不同，接入前应做小范围验证。

### OpenAI 将遵守共享 robots.txt 信号，网站可表达训练偏好

OpenAI 于 10 月 30 日宣布，将遵守一项共享的 robots.txt 信号。网站运营方可用它向参与的 AI 服务商表达训练偏好。官方 RSS 摘要称，这一信号用于帮助网站与参与的服务商沟通。

该信号让网站继续用 robots.txt 表达偏好，不必为每家服务商单独维护一套规则。对内容网站而言，这提供了更统一的表达入口。具体执行仍取决于参与服务商的遵守程度。

OpenAI 的正文页面返回 403，本期只能依据官方 RSS 摘要。摘要没有披露参与方名单与实施时间，也没有说明协议字段。本文不把这项承诺扩展成完整的行业标准。

但 robots.txt 本身依赖服务商自愿遵守，执行力度仍取决于各家。这项约定能否形成统一标准，还要看后续落地。对网站而言，信号的实际效果仍取决于参与方的覆盖范围。

### Meta 与 CNIB 合作，把 AI 眼镜带进加拿大无障碍社区

Meta 于当地时间 10 月 29 日宣布与加拿大 CNIB 合作。双方要让盲人、聋盲人与低视力人群更容易接触 AI 眼镜，并把社区经验带入产品设计。CNIB 是加拿大历史悠久的盲人服务机构。

Meta 提供资金，支持 CNIB 开展社区调研、同伴培训与无障碍指南。社区反馈会进入 Meta 的无障碍与产品团队，影响后续设计。这比单纯捐赠设备更接近长期协作。Meta 没有披露资金规模。

Meta 还会通过 CNIB 的 Come to Work 计划捐赠 AI 眼镜。参与者可用它探索阅读、识别物体与求职等场景。Meta 称这类功能可帮助用户更独立地生活，但未公布具体设备数量。设备捐赠与培训由 CNIB 落地。

这是 Meta 无障碍捐赠计划的延续。此前它已向美国盲人退伍军人与爱尔兰视障人士提供 Ray-Ban Meta 眼镜。此次合作没有公布时间表，也没有说明是否覆盖加拿大以外地区。

## 为什么值得关注

这五条动态显示，AI 竞争正从模型参数转向可用性与准入。OpenAI 把最强生命科学模型锁进审核名单，Mistral 则把 1T 模型权重直接开放。两种路线代表不同的分发逻辑，也反映厂商对风险的不同判断。

Google 把 Computer Use 推向正式可用，代理开始进入生产环境。OpenAI 的 robots.txt 信号与 Meta 的无障碍合作，则分别处理内容授权与使用门槛。厂商都在扩大场景，同时收紧高风险能力的入口。

谁能把准入规则做成标准，谁就掌握下一阶段的分发权。模型能力仍重要，但开放范围、许可与执行机制，正在决定谁能真正用上这些能力。对开发者而言，选择模型时要同时看能力、价格与可部署性。这也是本期五条动态的共同背景。

## 来源

- [官方] [OpenAI — API Changelog](https://platform.openai.com/docs/changelog)
- [官方] [Mistral — Le Chonk: Built for Coders, Trusted by Defenders](https://mistral.ai/news/mistral-large-4-oss/)
- [官方] [Google — Gemini API Release notes](https://ai.google.dev/gemini-api/docs/changelog)
- [官方] [OpenAI — Making it easier for websites to express AI training preferences](https://openai.com/index/helping-websites-express-ai-training-preferences)
- [官方] [Meta — The Future Is for Everyone: Meta and CNIB Partner](https://about.fb.com/news/2026/10/the-future-is-for-everyone-meta-and-cnib-partner-to-support-canadians-who-are-blind-deafblind-or-have-low-vision/)
