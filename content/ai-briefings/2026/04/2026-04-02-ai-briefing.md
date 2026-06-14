---
title: "AI 简报 · 2026-04-02"
date: "2026-04-02"
brief: "Anthropic 意外泄露约 51.2 万行 Claude Code TypeScript 源代码，同时曝光了未发布的 Claude Mythos 模型；OpenAI 关闭 Sora 公共 API。"
published: true
tags:
  - AI
  - Anthropic
  - OpenAI
---

4 月 2 日，AI 行业在安全保密和产品战略两个方向同时发生重大变化。Anthropic 意外泄露了 Claude Code 的完整源代码和未发布的 Mythos 模型信息，OpenAI 则正式关闭了 Sora 的公共 API。

## 速览

- Anthropic 意外泄露约 51.2 万行 Claude Code TypeScript 源代码。
- 泄露内容包含未发布的 Claude Mythos 模型信息，被称为 Anthropic 开发过的最强模型。
- Anthropic 尝试从 GitHub 移除数千个包含泄露代码的仓库。
- OpenAI 关闭 Sora 公共 API，因推理成本过高无法维持。
- 计算资源将转向代号为 SPUD 的下一代模型。

## 重点动态

### Anthropic

Anthropic 在 4 月 2 日意外通过 npm 发布泄露了约 51.2 万行 Claude Code 的 TypeScript 源代码。这次泄露还暴露了 Claude Mythos 模型的存在，被描述为"Anthropic 开发过的最强大的 AI 模型"。

泄露发生后，Anthropic 尝试从 GitHub 上移除数千个包含泄露代码的仓库，称这是一次"意外"。公司强调没有客户数据或凭证被泄露。这次事件引发了关于 AI 公司代码安全实践的广泛讨论，也首次向公众揭示了 Mythos 模型的存在。

### OpenAI

OpenAI 在 4 月 2 日正式关闭了 Sora 的公共 API。关闭的直接原因是视频生成的推理成本过高，每分钟的生成成本使产品无法持续。此前与 Disney 在 2025 年 12 月达成的 10 亿美元 Sora 合作也被实质性冻结。

OpenAI 表示，Sora 相关的计算资源将转向代号为 SPUD 的下一代模型。这一决定标志着 OpenAI 从独立内容生成工具向 Agent 化平台转型的加速。

## 为什么值得关注

Anthropic 的代码泄露是 AI 行业最严重的安全事件之一。当一家以安全著称的 AI 实验室意外泄露其旗舰产品的完整源代码时，这不仅暴露了内部流程的漏洞，也让外界首次看到了前沿模型的内部架构。

Mythos 模型的曝光更是引发了关于能力与安全平衡的深层讨论。

对于开发者而言，这次泄露提供了一个罕见的机会来审视 Claude Code 的实现细节。51.2 万行 TypeScript 代码中包含了模型交互层、工具调用框架和上下文管理机制，这些都是构建 AI 应用的核心组件。

虽然直接使用泄露代码存在法律和道德风险，但其架构设计思路可以为开源社区提供有价值的参考。

同时，这也提醒所有 AI 工具开发者：供应链安全（如此次涉及的 npm 发布流程）需要与模型安全同等重视。

OpenAI 关闭 Sora API 则揭示了生成式 AI 商业化的残酷现实：技术突破不等于经济可持续。当推理成本超过收入时，即使是最先进的技术也需要面对商业取舍。

Sora 的关闭对视频生成领域的创业者是一个警示。在推理密集型应用中，成本结构往往比模型能力更能决定产品的生死。SPUD 作为接替项目，暗示 OpenAI 正在将视频生成能力整合到更广泛的 Agent 平台中，而非作为独立产品运营。

对于正在评估视频生成技术的团队，这一决策表明：将视频生成嵌入工作流而非作为独立工具，可能是更可持续的商业模式。

从行业层面看，这两起事件共同指向一个趋势：AI 产业正在从"技术展示"阶段进入"经济核算"阶段。无论是代码安全还是产品可持续性，2026 年的 AI 公司面临的核心挑战已经从"能否做到"转变为"能否在合理成本内做到并持续运营"。

## 来源

- [AI Roundup：Anthropic's Claude Code leak](https://www.ai-roundup.dev/roundup/2026-04-02/) `[媒体报道]`
