---
title: "AI 每日简报 · 2026-04-22"
date: "2026-04-22"
brief: "Google 召开 Cloud Next '26 大会，发布 Gemini Enterprise Agent Platform 与第八代 TPU；Sundar Pichai 称 75% 的 Google Cloud 客户已使用 AI 工具。"
published: true
tags:
  - AI
  - Google
  - Cloud
  - TPU
---

4 月 22 日，Google 在拉斯维加斯召开 Cloud Next '26 大会，主题聚焦"Agentic Cloud"，强调面向企业工作流的自主 AI Agent。同日发布的 Gemini Enterprise Agent Platform 和第八代 TPU 标志着 Google 正在将竞争焦点从模型能力转向企业级 Agent 基础设施。

## 速览

- Google 在 Cloud Next '26 发布 Gemini Enterprise Agent Platform，四大模块覆盖构建、扩展、治理和优化。
- Google 推出第八代 TPU 双芯片策略，TPU 8t 面向训练、TPU 8i 面向推理，训练性能达 Ironwood 的 3 倍。
- Gemini Enterprise Agent Platform 在发布当日全面可用，现有 Vertex AI 客户自动迁移。
- Google 宣布 7.5 亿美元合作伙伴基金，用于加速 Agent 生态发展。
- Sundar Pichai 披露 75% 的 Google Cloud 客户已使用 Google 的 AI 工具。

## 重点动态

### Google

Google 在 4 月 22 日于拉斯维加斯召开的 Cloud Next '26 大会上发布了 Gemini Enterprise Agent Platform。该平台基于 Vertex AI 演进而来，分为构建、扩展、治理和优化四大模块。Agent Studio 提供低代码自然语言界面用于快速构建 Agent，Agent Runtime 支持在安全的云沙箱中运行长时间自主 Agent，Agent Registry 提供加密身份管理，Agent Inbox 则是集中监控和管理 Agent 的统一仪表盘。

硬件层面，Google 首次采用双芯片策略推出第八代 TPU。TPU 8t 面向训练场景，单集群可扩展至 9600 颗芯片，共享内存达 2PB，处理能力为 Ironwood 的 3 倍，能效比提升 2 倍。TPU 8i 面向推理场景，单 Pod 配置 1152 颗芯片，片上 SRAM 增加 3 倍，每美元性能提升 80%。配套发布的还有 Virgo 网络系统，用于跨数据中心连接超大规模计算集群。

Sundar Pichai 在大会上强调，Google 已将 AI Agent 用于代码库迁移等实际场景，实现了 6 倍于传统方式的迁移速度。配套发布的还有 GKE Agent Sandbox，为安全执行不可信 AI 生成代码提供硬化环境；以及 GKE Inference Gateway，可将 time-to-first-token 延迟降低最高 70%。Workspace AI 方面，Gemini 驱动的 Docs、Sheets、Slides 功能正式走出 beta。Google 同时宣布 7.5 亿美元合作伙伴基金，用于加速 Agent 生态发展。目前 75% 的 Google Cloud 客户已使用 Google 的 AI 工具，330 家组织在过去一年中各自处理了超过 1 万亿 token。

## 为什么值得关注

Gemini Enterprise Agent Platform 的发布表明 Google 正在将竞争焦点从模型能力转向企业级 Agent 基础设施。当平台同时集成 200 余个模型、提供从构建到治理的端到端工具链、并配套 7.5 亿美元生态基金时，企业客户选择 AI 供应商的决策标准将从"哪个模型最强"转向"哪个平台最完整"。

TPU 8i 的推理优化也释放了一个明确信号：Google 预计未来的 AI 负载将从训练转向推理，尤其是大规模并发 Agent 的持续运行。TPU 8t 的训练性能提升则意味着前沿模型的训练周期可能从数月压缩至数周。

短期内开发者需要关注的是 Gemini Enterprise Agent Platform 与现有 Vertex AI 工作负载的迁移兼容性，以及 TPU 8i 在实际推理任务中的成本效益表现。

## 来源

- [Google Blog：7 highlights from Google Cloud Next '26](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/google-cloud-next-26-recap/) `[官方]`
- [Google Blog：Cloud Next '26 Momentum and innovation](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cloud-next-2026-sundar-pichai/) `[官方]`
- [ZDNet：How Google just revamped Gemini Enterprise](https://www.zdnet.com/article/google-cloud-next-enterprise-agent-platform-ai/) `[媒体报道]`
