---
title: "AI 简报 · 2026-04-29"
date: "2026-04-29"
brief: "Cursor 开放 Agent SDK public beta；Anthropic 与 Amazon 扩大合作协议至 5GW 算力，承诺 1000 亿美元以上的 AWS 支出。"
published: true
tags:
  - AI
  - Cursor
  - Anthropic
  - Amazon
---

4 月 29 日，AI 动态从 IDE 基础设施向云分发和开源编排同步扩展。Cursor 开放其 Agent 运行时 SDK，Anthropic 则与 Amazon 扩大了战略合作协议的算力承诺。

## 速览

- Cursor 发布 SDK public beta，提供 TypeScript 接口、云沙盒虚拟机和子代理能力。
- Anthropic 与 Amazon 扩大合作协议，将算力承诺扩展至 5GW。
- Anthropic 承诺未来 10 年在 AWS 上的总支出超过 1000 亿美元。
- Amazon 追加投资 50 亿美元即时到账，最高可达 200 亿美元。
- Cursor SDK 定价基于 token 用量，支持 Claude Opus 4.7 和 GPT-5.5 等高级模型。

## 重点动态

### Cursor

Cursor 在 4 月 29 日发布 SDK public beta，包名为 `@cursor/sdk`，基于 TypeScript 构建。开发者可以通过 npm 安装，获得与 Cursor 桌面应用、CLI 和 Web 界面相同的 Agent 运行时能力。

SDK 核心能力包括代码库索引与语义搜索、MCP（Model Context Protocol）服务器支持、可复用的 Skills 行为定义、Hooks 前后置脚本，以及子代理并行多 Agent 工作流。部署模式支持本地、云端和自托管三种选项。

Rippling、Notion、Faire 和 C3 AI 等早期采用者已进入生产环境。SDK 定价基于 token 用量，Composer 2 Standard 为输入 0.50 美元/百万 token、输出 2.50 美元/百万 token。

Cursor 的 SDK 发布标志着该公司从 IDE 厂商向 AI 基础设施提供商的战略转型。

通过开放其 Agent 运行时，Cursor 试图在编码 Agent 的编排层建立标准，与 OpenAI 的 Agents SDK 和 Anthropic 的 Claude Agent SDK 直接竞争。

### Anthropic 与 Amazon

Anthropic 与 Amazon 在 4 月 29 日宣布扩大战略合作协议。核心条款包括将算力承诺从原有规模扩展至 5GW，Anthropic 承诺未来 10 年在 AWS 上的总支出超过 1000 亿美元。Amazon 追加 50 亿美元即时投资，最高可达 200 亿美元。

这一规模的算力配置相当于旧金山大都会区夏季峰值用电负荷。协议涵盖最新的 Trainium2 和 Trainium3 芯片，到 2026 年底 Trainium 容量约达 1GW。

这代表了 AI 历史上最大的基础设施锁定之一，清楚地表明前沿 AI 的经济模式现在围绕长达十年、数十亿美元的算力交叉承诺运转。

## 为什么值得关注

Cursor 开放 SDK 是其从 IDE 向"自主软件工程基础设施"转型的关键一步。当开发者可以直接调用 Cursor 的 Agent 运行时来构建自己的编码工作流时，Cursor 的商业模式从"卖编辑器"升级为"卖基础设施"。

Anthropic 与 Amazon 的扩大合作则揭示了 AI 产业资本配置的新逻辑。算力不再通过普通的云采购获得，而是通过战略交叉投资来锁定。

当 Anthropic 承诺 10 年在 AWS 上支出超过 1000 亿美元时，它实际上将自身的命运与 Amazon 的云基础设施深度绑定。加上 Google 此前承诺的 400 亿美元投资和 5GW TPU 算力，Anthropic 目前拥有约 10GW 的跨云算力配置。

短期内开发者需要关注的是 Cursor SDK 在自定义编码工作流中的灵活性，以及 Anthropic 在获得庞大算力后其模型迭代节奏是否会显著加快。

## 来源

- [Cursor 官方：SDK Public Beta](https://cursor.com/blog/sdk-public-beta) `[官方]`
- [The New Stack：Cursor SDK Harness](https://thenewstack.io/cursor-sdk-harness/) `[媒体报道]`
- [LinkedIn：SpaceX-Cursor Deal, Anthropic $100B AWS Bet](https://www.linkedin.com/pulse/copy-wealt-weekly-roundup-spacexcursor-deal-anthropic-100b-aws-wzolf) `[媒体报道]`
