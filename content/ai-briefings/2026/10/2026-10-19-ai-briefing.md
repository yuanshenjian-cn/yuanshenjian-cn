---
title: "2026-10-19 AI 简报：Anthropic 设立公益基金；DeepSeek 更新开源 Flash 模型"
date: "2026-10-19"
published: true
brief: "本期确认 3 件动态：Anthropic 将 5% 股份投入公益基金；DeepSeek 发布 V4.1-Flash-1017 并开放搜索与抓取 API；OpenAI 向所有 API 客户开放文字描述定制语音。"
tags:
  - AI
  - Anthropic
  - DeepSeek
  - OpenAI
  - 模型
  - 开源
  - API
  - 治理
---

北京时间 10 月 16 日至 19 日，AI 竞争从模型能力延伸到治理、开放权重与工具接口。Anthropic 调整股权安排，DeepSeek 用开源模型和搜索工具压低成本。OpenAI 则把语音变成可配置的接口组件。

> 覆盖说明：本期 coverage 为 degraded。Perplexity 变更日志只到月份，智谱官方新闻页没有发布日期、z.ai 博客页无实质内容，MiniMax 官方页重定向至未登记域名。三家未完成合格官方检查，缺口不代表对应厂商本期无更新。

## 速览

- Anthropic 将 5% 股份投入新设公益基金，并随估值增长追加份额。
- DeepSeek 发布 V4.1-Flash-1017，开放权重并上线自有搜索与抓取 API。
- OpenAI 向所有 API 客户开放文字描述定制语音，并新增九种自然音色。

## 重点动态

### Anthropic 将 5% 股份投入公益基金

Anthropic 于当地时间 10 月 18 日宣布，将把 5% 股份投入新设的 Anthropic Public Benefit Fund。该安排仍需股东批准，基金由公司全资持有，采用 LLC 而非传统基金会结构。官方称，这一结构便于在不同捐赠形式之间调整。

官方称，公司估值每较基准上涨 50%，董事会可再追加 2% 股份。追加比例由董事会酌情决定，基金持有的股权不得用于游说或政治捐助。这一机制让基金份额随公司增长而扩大。

基金可用于向传统非营利组织大额捐赠，或直接向特定人群分配。Anthropic 已承诺为劳动力市场影响投入 2 亿美元，未来可能采取更大胆的做法。官方称，基金将提供更大的灵活性与规模。

联合创始人此前承诺捐出 80% 股权。叠加员工配捐与本次安排，约 20% 股份将用于公共利益。基金治理与估值里程碑将在未来数月公布，公司还将发布公益进展报告。

### DeepSeek 发布 V4.1-Flash-1017 并开放搜索 API

DeepSeek 于 10 月 17 日发布 DeepSeek-V4.1-Flash-1017。官方称，新模型在基准测试中更强，任务完成更快，输出也更短。性能与成本因此同步改善，更新日志将 API 模型名改为 deepseek-flash。官方将这次更新描述为性能与成本的帕累托改进。

该模型已上线官网、应用与 API，API 模型名为 deepseek-flash。官方同时针对 DeepSeek Harness、腾讯 CodeBuddy 与 WorkBuddy 做了适配，并建议 Harness 升级至 v0.2.1-rc.1 或更高版本。开发者可在这些编码工具中直接调用新模型，覆盖主流编码代理场景。

官方还开源了模型权重，发布页位于 Hugging Face 与 ModelScope。开发者可直接下载权重。DeepSeek 称，新模型通过带自我反馈的强化学习改进了端到端项目开发，演示覆盖 3D 建模与网页游戏。

DeepSeek 还向所有用户开放自有的搜索与抓取 API。每个端点每千次调用收费 0.75 美元；在 Harness、Claude Code 与 Codex 中经服务端工具调用暂免费用，10 月 31 日 16:00 UTC 起计费。官方称，搜索能力由自有引擎提供，每天处理数亿次请求。

搜索与抓取按次计价，意味着联网能力开始被单独商品化。开发者可以自部署开源权重，同时按用量购买官方工具链，成本可以分开核算。这种拆分让团队按实际调用量控制预算。

### OpenAI 向所有 API 客户开放文字描述定制语音

OpenAI 于 10 月 16 日向所有 API 客户开放 prompt-to-voice。开发者可用一段文字描述生成自定义语音，也可在语音 Playground 中创建。该功能不要求开发者提供录音样本，官方将其定位为语音应用的快速配置工具。

生成的语音可在 GPT-Live 会话中重复使用。官方称，创建语音免费，实际语音生成按常规 GPT-Live 会话计费。计费沿用现有会话规则，开发者可以先把声音配置好，再按用量付费。

OpenAI 同时为 GPT-Live 新增九种自然音色，覆盖德语、法语、印地语、日语和韩语。九种音色对应五种语言，官方同时给出每种音色的名称。德语为 Nuri、Juni 与 Flitz，法语为 Brise 与 Sillage，开发者可在 GPT-Live 的语音选项中直接选用。

印地语为 Nira，日语为 Harema 与 Shida，韩语为 Noeul。从固定音色到文字定制，语音接口的差异化开始转向品牌与角色。对应用开发者来说，声音正在成为可配置的产品组件。

## 为什么值得关注

三件事指向同一个变化。竞争从单一模型能力，转向开放权重、工具计价与治理结构的组合。模型强不强仍重要，但能否被稳定部署，越来越取决于这些配套安排。

DeepSeek 用开源权重和按次计价的搜索工具压低使用门槛，OpenAI 把语音做成可配置组件。Anthropic 则在股权安排上回应外部压力。能力之外的制度设计，正在成为厂商差异的一部分。

## 来源

- [官方] [Anthropic — Investing in the public benefit](https://www.anthropic.com/news/public-benefit-fund)
- [官方] [DeepSeek — DeepSeek-V4.1-Flash-1017 Release](https://api-docs.deepseek.com/news/news261017/)
- [官方] [DeepSeek — API Change Log: DeepSeek-V4.1-Flash-1017](https://api-docs.deepseek.com/updates/)
- [官方] [OpenAI — API Changelog, October 16, 2026](https://developers.openai.com/api/docs/changelog)
