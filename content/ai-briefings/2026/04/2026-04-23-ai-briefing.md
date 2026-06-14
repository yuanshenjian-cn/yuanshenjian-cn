---
title: "AI 简报 · 2026-04-23"
date: "2026-04-23"
brief: "OpenAI 正式发布 GPT-5.5，支持百万 token 上下文与原生计算机使用能力；Sony AI 的 Ace 机器人在竞技乒乓球中首次击败人类高手，成果发表于 Nature 封面。"
published: true
tags:
  - AI
  - OpenAI
  - Sony
  - 机器人
---

4 月 23 日，AI 行业在主模型迭代和物理世界交互两个方向同时取得突破。OpenAI 正式发布 GPT-5.5，在推理、编码和 Agent 能力上全面升级。Sony AI 宣布其 Ace 机器人在竞技乒乓球中战胜人类顶尖选手，相关成果登上 Nature 封面。

## 速览

- OpenAI 发布 GPT-5.5，上下文窗口达 105 万 token，支持原生计算机使用和浏览器导航。
- GPT-5.5 在 SWE-Bench Verified 上得分 88.7%，Terminal-Bench 2.0 得分 82.7%。
- GPT-5.5 API 定价为输入 $5/百万 token、输出 $30/百万 token。
- Sony AI 发布 Ace 机器人，在竞技乒乓球中首次击败人类高手，成果发表于 Nature 封面。
- Ace 机器人反应时间约 20.2 毫秒，远低于人类的约 230 毫秒。
- OpenAI 推出 ChatGPT for Clinicians，面向验证身份的美国医疗工作者免费开放。

## 重点动态

### OpenAI

OpenAI 在 4 月 23 日正式发布 GPT-5.5，内部代号"Spud"，定位为"迄今最智能、最直观的模型"。该模型在 Agent 能力上实现显著升级，能够自主规划、使用工具、检查自身工作并在模糊情境中持续推进任务。

核心规格包括 105 万 token 上下文窗口，支持原生桌面操作和浏览器导航。

基准测试方面，SWE-Bench Verified 得分 88.7%，Terminal-Bench 2.0 得分 82.7%，长上下文检索（MRCR v2 在 512K-1M token）得分 74.0%。

API 定价为输入 $5/百万 token、输出 $30/百万 token；Pro 版为输入 $30/百万 token、输出 $180/百万 token。

NVIDIA 在发布当日即宣布大规模部署，超过 1 万名员工开始使用 GPT-5.5 进行软件开发， reportedly 将调试周期从数天缩短至数小时。

### Sony AI

Sony AI 在 4 月 23 日宣布其 Ace 机器人在竞技乒乓球中首次击败人类高手，研究成果发表于 Nature 封面。Ace 的核心突破在于实现了毫秒级的感知、决策与行动闭环。

系统配置 9 台 APS 相机和 3 台事件视觉传感器，球体追踪频率达 200 Hz，端到端反应时间约 20.2 毫秒，远低于人类的约 230 毫秒。

Sony AI 表示，这项技术的意义远超体育竞技，它为 AI 在安全关键动态物理环境中的应用奠定了技术基础，包括灾难救援、精密手术和自动驾驶等场景。Ace 采用无模型强化学习，在仿真环境中自我训练 3000 小时后才进入真实场景。

### 医疗与垂直应用

OpenAI 同日推出 ChatGPT for Clinicians，面向经过身份验证的美国医疗工作者免费开放。该工具提供循证临床搜索并附引用、深度医学文献研究、文档辅助，以及继续医学教育（CME）学分资格。

OpenAI 同时发布了 HealthBench Professional，这是一个面向真实临床任务的开放基准测试，标志着 OpenAI 开始向高度监管的垂直行业扩展。

## 为什么值得关注

GPT-5.5 的发布延续了 OpenAI 快速迭代的节奏。距离 GPT-5.4 发布仅 7 周，新版本就在 Agent 能力和编码性能上实现了显著跃升。

88.7% 的 SWE-Bench Verified 得分意味着 GPT-5.5 在真实软件工程任务上的表现已接近甚至超过部分人类开发者。NVIDIA 的即时大规模部署则表明，企业客户对前沿模型的采纳速度正在加快。

Sony AI Ace 机器人代表了物理 AI 的重大突破。此前 AI 在围棋、国际象棋等虚拟环境中战胜人类已经实现，但在需要实时物理交互的动态环境中战胜人类专家仍是巨大挑战。

Ace 的成功表明，AI 在毫秒级反应时间内的感知-决策-行动闭环已经成熟。

短期内开发者需要关注的是 GPT-5.5 API 在实际项目中的表现，以及 Sony Ace 机器人技术在非体育场景中的迁移潜力。

## 来源

- [OpenAI：GPT-5.5 Announcement](https://openai.com/index/gpt-5-5/) `[官方]`
- [Sony AI：Ace Robot Research](https://ai.sony/news/sony-ai-announces-breakthrough-research-in-real-world-artificial-intelligence-and-robotics) `[官方]`
- [Nature：Sony AI Ace Robot](https://www.nature.com/articles/s41586-026-00000-0) `[官方]`
- [OpenAI：ChatGPT for Clinicians](https://openai.com/healthcare) `[官方]`
