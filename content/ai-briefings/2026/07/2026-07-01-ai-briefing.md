---
title: "AI 简报 · 2026-07-01"
date: "2026-07-01"
brief: "Anthropic 同日发布 Sonnet 5 与 Claude Science，Meta 推出 Brain2Qwerty v2 实时脑机解码，Google 用 Nano Banana 2 Lite 拼图像生成速度与成本。"
published: true
tags:
  - AI
  - Anthropic
  - Meta
  - Google
---

6 月 30 日，AI 厂商把竞争重心从"谁的模型更强"推向"谁能让能力落到场景"。Anthropic 同日发布 Sonnet 5 与科研工作台 Claude Science，一手压低 agentic 价格，一手切进药物发现。Meta FAIR 拿出 Brain2Qwerty v2，把脑活动实时解码成文字。Google 用 Nano Banana 2 Lite 拼图像生成的速度与成本。

模型层差距在缩小，落地方的差距正在拉开。

## 速览

- Anthropic 发布 Claude Sonnet 5，性能接近 Opus 4.8，入门价 $2/$10 每百万 token，成为 Free 与 Pro 默认模型
- Anthropic 推出 Claude Science 科研工作台，并启动面向"被忽视疾病"的药物发现计划
- Meta FAIR 发布 Brain2Qwerty v2，非侵入式 MEG 实时解码脑活动为句子，平均词准确率 61%
- Google 发布 Nano Banana 2 Lite，4 秒出图、每千张 $0.034，同日扩大 Gemini Omni Flash 开放

## 重点动态

### Anthropic 用 Sonnet 5 把旗舰能力下放到中端

6 月 30 日，Anthropic 发布 Claude Sonnet 5，定位为"最 agentic 的 Sonnet 模型"。它能制定计划、调用浏览器与终端、自主运行，性能接近 Opus 4.8，价格更低。相比上一代 Sonnet 4.6，推理、工具使用、编码均有明显提升。

定价上，Sonnet 5 推出入门价每百万 token 输入 $2、输出 $10，至 8 月 31 日后回到 $3/$15。它即日起成为 Free 与 Pro 计划默认模型，并进入 Claude Code 与 Claude Platform。安全上，其网络攻击能力弱于 Opus 4.8 与 Mythos 5，默认开启网络防护。

这一定位说明，Anthropic 在把旗舰级 agentic 能力下放的同时，有意压低其安全风险口径，让中端模型也能大规模跑 agent。

### Anthropic 推 Claude Science 切入科研与药物发现

同日，Anthropic 推出 Claude Science，一个面向科研人员的工作台应用。它把研究者常用的工具与包整合进同一环境，可产出可审计产物，并灵活调度计算资源。TechCrunch 指出，它赌的是工作流而非新模型。

Claude Science 重点瞄准生命科学。Anthropic 同时宣布一项药物发现计划，聚焦被市场忽视的疾病，CEO Dario Amodei 表示要"从根本上重塑生命科学"。

这意味着 Anthropic 正从模型供应商向垂直科研平台延伸，把 Sonnet 5 的能力封装进制药与科研工作流。

### Meta 用 Brain2Qwerty v2 把脑机接口推进到实时

6 月 30 日，Meta FAIR 发布 Brain2Qwerty v2，一个端到端的非侵入式脑机接口管道。它用 MEG 技术读取脑活动，无需手术植入，就能把人脑"想打出"的句子实时解码成文字。

Meta 称这是迄今性能最高的实时句子解码管道，平均词准确率 61%，部分场景达 78%，目标是帮助失去交流能力的人。它是 Brain2Qwerty v1 之后的下一个里程碑。

非侵入路线安全门槛低，但精度受颅骨信号衰减限制。这项研究仍在实验室阶段，却已把"用意念打字"从概念验证推向实时可用。

### Google 用 Nano Banana 2 Lite 拼图像生成速度与成本

6 月 30 日，Google 发布 Nano Banana 2 Lite，定位为高吞吐、低延迟图像生成模型。它能在 4 秒内出图，每千张收费 $0.034，适合快速批量迭代图像。原版 Nano Banana 被改称 legacy model，由新模型接替。

新模型已在 Google AI Studio、Gemini API 和 Gemini Enterprise Agent Platform 上线，与更贵的 Nano Banana Pro 区分：前者拼速度，后者拼质量。

同日 Google 还扩大 Gemini Omni Flash 视频模型开放范围，每秒视频输出 $0.10，并发布 Omni Product Studio demo，可把静态图转成电商短片。

## 为什么值得关注

四条动态共同指向一个趋势：模型层差距在缩小，落地方的差距正在拉开。Sonnet 5 性能逼近 Opus 4.8 却只卖中端价，旗舰与中端的界限开始模糊；Claude Science 把模型封装成科研工作流，竞争从参数转向场景。

Meta 的 Brain2Qwerty v2 显示，AI 外延正从屏幕延伸到神经接口，非侵入式实时解码让脑机接口从科幻进入工程里程碑。Google 用 Nano Banana 2 Lite 拼速度与成本，则说明生成媒体正从"能不能做"进入"能不能便宜地大规模做"。

AI 竞争正从单一跑分，转向价格分层、垂直工作流、神经接口与生成媒体规模化四条赛道同时展开。谁能把模型能力落到具体场景，谁才在下一阶段占先。

## 来源

- [Anthropic — Introducing Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) `[官方]`
- [TechCrunch — Anthropic launches Claude Sonnet 5 as a cheaper way to run agents](https://techcrunch.com/2026/06/30/anthropic-launches-claude-sonnet-5-as-a-cheaper-way-to-run-agents) `[媒体报道]`
- [AWS — Introducing Claude Sonnet 5 on AWS](https://aws.amazon.com/blogs/machine-learning/introducing-claude-sonnet-5-on-aws-anthropics-most-capable-sonnet-model) `[官方]`
- [Anthropic — Claude Science, an AI workbench for scientists, is now available](https://www.anthropic.com/news/claude-science-ai-workbench) `[官方]`
- [STAT News — Anthropic releases Claude Science, a product aimed at researchers, the pharma industry](https://www.statnews.com/2026/06/30/anthropic-release-claude-science-ceo-dario-amodei/) `[媒体报道]`
- [TechCrunch — Anthropic's Claude Science bets on workflow, not a new model, to win over scientists](https://techcrunch.com/2026/06/30/anthropics-claude-science-bets-on-workflow-not-a-new-model-to-win-over-scientists/) `[媒体报道]`
- [CNBC — Anthropic launches AI drug discovery program, joining tech giants in betting on healthcare](https://www.cnbc.com/2026/06/30/anthropic-launches-ai-drug-discovery-program-claude-science.html) `[媒体报道]`
- [Meta AI — From Brain Waves to Words: Brain2Qwerty Offers a New Path to Human Communication](https://ai.meta.com/blog/brain2qwerty-brain-ai-human-communication) `[官方]`
- [MarkTechPost — Meta AI Releases Brain2Qwerty v2: A Non-Invasive MEG Brain-to-Text Pipeline](https://www.marktechpost.com/2026/06/30/meta-ai-releases-brain2qwerty-v2-a-non-invasive-meg-brain-to-text-pipeline-decoding-typed-sentences-at-61-word-accuracy) `[媒体报道]`
- [Google — Gemini Omni Flash and Nano Banana 2 Lite](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-flash-nano-banana-2-lite/) `[官方]`
- [TechCrunch — Google introduces a faster, cheaper image generator with Nano Banana 2 Lite](https://techcrunch.com/2026/06/30/google-introduces-a-faster-cheaper-image-generator-with-nano-banana-2-lite/) `[媒体报道]`
