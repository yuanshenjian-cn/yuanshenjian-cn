---
title: "小米 MiMo 模型谱系档案：这条线值得关注，不只是因为国产新玩家"
date: '2026-05-15'
tags:
  - AI前沿
  - LLM
  - 小米MiMo
  - 模型评测
  - 开源权重
published: true
brief: >-
  这是一份按代际持续维护的小米 MiMo 模型档案。首版覆盖 MiMo-V2.5-Pro、MiMo-V2.5、MiMo-V2、MiMo-V2-Flash 和 MiMo-7B 系列，重点记录官方发布时间、已公开能力、Agent 长任务特征与官方价格缺口，后续只追加新模型信息。
---

> 我会把 MiMo 放进这个专栏，不是为了凑国产名单，而是因为它已经开始走出一条很清晰的路线：长上下文、Agent 长任务、多模态和工程执行。这条线还年轻，但它的方向已经足够具体，值得单独盯。

MiMo 的问题和 Kimi 有点像。

不是没有料，而是资料分散，而且价格透明度不够高。

所以这篇我同样会保守处理：只写官方站点、官方 Hugging Face、官方 GitHub 与官方论文里能确认的代际。

## 我用同一套 5 个维度看 MiMo

| 维度 | 我重点看什么 |
|------|-------------|
| 编码 | 长程工程任务和编译器/系统级任务能不能真跑下来 |
| 推理与知识工作 | reasoning 和复杂任务规划能力 |
| 多模态与电脑操作 | 文本、图像、视频、音频有没有真正原生融合 |
| 上下文与 Agent 续航 | 1M context、千次工具调用、长时间稳定性 |
| 成本透明度 | 官方有没有把输入、缓存、输出价格讲清楚 |

## MiMo 最近几代主线总表

| 模型 | 官方发布日期 | 输入价格 | 缓存命中 | 输出价格 | 这一代最该记住的事 |
|------|-------------|---------|---------|---------|------------------|
| MiMo-V2.5-Pro | 2026-04-22 | 官方未公布 | 官方未公布 | 官方未公布 | 1M context、42B active、明显冲长程 Agent 与复杂软件工程 |
| MiMo-V2.5 | 2026-04-22 | 官方未公布 | 官方未公布 | 官方未公布 | omnimodal 主线模型，1M context，往通用多模态 Agent 走 |
| MiMo-V2 | 2026-03-18 | 官方未公布 | 官方未公布 | 官方未公布 | V2 系列通用主线，承上启下 |
| MiMo-V2-Flash | 2025-12 | 官方未公布 | 官方未公布 | 官方未公布 | 309B 轻量 MoE，强调速度与 Agentic workflow |
| MiMo-7B 系列 | 2025-05-12（论文公开）/ 2025-05-30（RL-0530） | 官方未公布 | 官方未公布 | 官方未公布 | 7B 小模型 reasoning 线，适合看这家训练路线的早期风格 |

<small>*数据来源：MiMo 官方站点、官方 Hugging Face、官方 GitHub 与官方论文页面，查询日期 2026-05-14。官方页面暂未公开稳定的模型级输入/缓存/输出单价，因此统一记为“官方未公布”。*</small>

## MiMo-V2.5-Pro：最值得记的是“长程工程执行”而不是参数数字

V2.5-Pro 在 2026 年 4 月 22 日发布。

官方给出的很多案例都很有辨识度：

- 672 次工具调用、4.3 小时做编译器
- 1868 次工具调用、11.5 小时做视频编辑器
- 强调 thousand+ tool calls 和 1M context coherence

这说明 MiMo 最想证明的不是“我也有前沿模型”，而是“我能把长程 Agent 这件事认真做出来”。

我觉得这很重要。

因为真正会改变工作流的，往往不是一次漂亮回答，而是模型能不能在几个小时里持续把事往前推。

## MiMo-V2.5：把 omnimodal 和 Agent 放在了一起

V2.5 在 2026 年 4 月 22 日发布。

从官方资料看，它更像“通用多模态主线”，而 V2.5-Pro 则像更偏长程和工程任务的旗舰补强版。

这代值得记三点：

- native visual and audio understanding
- 1M context
- frontier-level agentic capability

也就是说，小米这条线不是简单做一个会看图的大模型，而是想把多模态能力直接接进 Agent 执行链条里。

## MiMo-V2：V2 系列的通用主线

MiMo-V2 在 2026 年 3 月 18 日发布。

这代在 MiMo 的谱系里扮演着"承上启下"的角色：它把 V2-Flash（2025-12）已经验证过的速度优化和 Agentic workflow 能力，与 V2.5（2026-04）即将推出的 omnimodal 能力做了一个衔接。

从官方资料看，V2 更像一个"完整版"的 V2-Flash：同样的 MoE 架构，但能力更全面，上下文窗口从 256K 扩展到 1M，Agent 任务的稳定性也有明显提升。

V2 本身没有引起特别大的关注，因为它前后分别是 V2-Flash 和 V2.5 两个更吸睛的版本。但从谱系视角看，V2 是 MiMo 从"证明概念"走向"产品化"的关键一步。

## MiMo-V2-Flash：如果你想知道这家是不是只会做大模型，看它就够了

V2-Flash 的价值，在于它不是最顶格的旗舰，却很能说明团队思路。

它强调：

- 高速推理
- Agentic workflow
- 256K context
- MTP 带来的生成速度提升

这说明 MiMo 在体系设计上已经不是只做一个“最强型号”，而是在考虑：

- 哪个型号跑主力工作流
- 哪个型号承担高频低成本任务
- 哪个型号适合 Agent 编排

这是一家模型体系开始成熟的信号。

## MiMo-7B：别因为它小就把它当成陪跑

MiMo-7B 系列不是今天最值得部署的主力，但它很适合看这家训练方法和路线偏好。

官方很强调：

- reasoning-first small model
- RL 强化
- 数学和代码推理
- 25T 预训练 + rule-based verifier

也就是说，MiMo 从一开始就不是只想做“大而全”。

它在小模型上也在尝试用推理和 RL 拉出差异。

## 我对 MiMo 这条线的实际判断

MiMo 现在还不算头部格局里最稳的那一档。

但它已经明显不是“看看就好”的新玩家。

我关注它的原因主要有三个：

- 它在长程 Agent 任务上的目标很明确
- 它在多模态与工程任务之间没有割裂叙事
- 它不只做单个旗舰，还在搭模型体系

如果未来它把价格透明度和官方资料留存做得更好，这条线的可观察性会明显增强。

到那时，MiMo 可能会变成一个更值得拿来横向选型的主流选手。

## 官方来源

- MiMo-V2.5-Pro: `https://mimo.xiaomi.com/mimo-v2-5-pro`
- MiMo-V2.5-Pro HF: `https://huggingface.co/XiaomiMiMo/MiMo-V2.5-Pro`
- MiMo-V2.5: `https://mimo.xiaomi.com/mimo-v2-5`
- MiMo-V2.5 HF: `https://huggingface.co/XiaomiMiMo/MiMo-V2.5`
- MiMo-V2-Flash HF: `https://huggingface.co/XiaomiMiMo/MiMo-V2-Flash`
- MiMo-V2-Flash Technical Report: `https://github.com/XiaomiMiMo/MiMo-V2-Flash/blob/main/paper.pdf`
- MiMo GitHub: `https://github.com/XiaomiMiMo/MiMo`
- MiMo-7B-RL HF: `https://huggingface.co/XiaomiMiMo/MiMo-7B-RL`
- MiMo-7B-RL-0530 HF: `https://huggingface.co/XiaomiMiMo/MiMo-7B-RL-0530`
- MiMo Paper: `https://arxiv.org/abs/2505.07608`
