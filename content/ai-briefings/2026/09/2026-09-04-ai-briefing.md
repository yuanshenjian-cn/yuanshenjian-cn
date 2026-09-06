---
title: "2026-09-04 AI 简报：OpenAI Responses API 增加长任务控制"
date: "2026-09-04"
brief: "本期确认 1 件动态：OpenAI 为 GPT-6 Astra 的 Responses API 增加异步工具调用、中途转向和动态调整推理强度。"
published: true
tags:
  - AI
  - OpenAI
  - GPT
  - API
  - Agent
---

9 月 3 日至 4 日（北京时间），本期确认 1 件官方动态。OpenAI 为 GPT-6 Astra 的 API 增加长任务控制。在已完成合格检查的官方路径中，未再确认其他可发布事件。

> 覆盖说明：OpenAI、Anthropic、Google、Meta、Perplexity、Mistral、Kimi、MiMo、DeepSeek、智谱和 MiniMax 完成官方路径检查。xAI 新闻页返回 403，google-gemini-api-changelog 页面请求超时，Meta AI Blog 返回 400。三项缺口使本期覆盖结论为 degraded。Google Gemini Spark、Meta Muse Spark、Astra rollout 和德国 wiki 事件仅有媒体线索，均已排除。

## 速览

- OpenAI 为 GPT-6 Astra 的 Responses API 增加长任务控制

## 重点动态

### OpenAI 为 GPT-6 Astra 的 Responses API 增加长任务控制

OpenAI 在 9 月 3 日更新 API Changelog。更新为 GPT-6 Astra 的 Responses API 增加三项控制。这些控制面向需要持续运行的工具任务。开发者可以异步发起工具调用。响应进行中也可以追加指令。执行状态可以保持连续。

应用还可以在同一轮对话中调整 `reasoning effort`。常规步骤可以使用较低强度。遇到复杂环节时，再提高计算投入。这个调整不要求重新提交完整的提示前缀。因此，应用能够在质量和成本之间动态切换。

官方说明这些能力随 GPT-6 Astra 提供。Astra 不支持 `none` 推理努力级别。工具调用应使用 Responses API。开发者需要重新检查 WebSocket 指令。还要处理工具结果回传和状态恢复。这些变化需要纳入客户端日志。

对长任务 Agent 而言，更新改变了执行方式。任务不再只能等待首次请求结束。异步调用减少工具等待的耦合。中途转向可以响应新的任务信息。动态推理强度则把质量和成本放进同一条控制链。

## 为什么值得关注

这组控制让 Agent 不必在首次请求时锁定全部路径。应用可以先启动工具工作，再根据新结果调整方向。推理强度也能随任务难度变化，减少简单步骤的额外开销。

接入重点不只是更换模型名称。客户端还要处理 WebSocket 指令、工具结果回传和中途失败。长任务能否稳定恢复，将取决于状态管理、重试设计和权限边界。

## 来源

- [官方] [OpenAI Developers — API Changelog](https://developers.openai.com/api/docs/changelog)
