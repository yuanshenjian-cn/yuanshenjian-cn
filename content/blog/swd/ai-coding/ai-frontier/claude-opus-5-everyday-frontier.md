---
title: "Claude Opus 5：半价 Fable，编程基准反超"
date: '2026-07-25'
tags:
  - AI前沿
  - 大模型
  - Anthropic
  - Claude
published: true
brief: >-
  2026 年 7 月 24 日，Anthropic 发布 Claude Opus 5。它不是 Anthropic 最强的模型——Fable 5 仍然是——但在编程和知识工作基准上已超越 Fable 5，价格只有后者的一半。Opus 5 的定位是「每天都用的模型」，强调单位成本下的产出效率，而不是极限能力。这篇文章梳理它的核心数据、真实能力边界和适用场景。
---

> Opus 5 不是 Anthropic 的天花板，但它可能是大多数人日常工作中投入产出比最高的模型。

2026 年 7 月 24 日，Anthropic 发布了 Claude Opus 5。发布时间距离上一代 Opus 4.8（5 月 28 日）仅两个月，距离 Fable 5 和 Sonnet 5（6 月）也不过一个多月。最近Claude 4.7 和 4.8 的口碑下滑是否可以得到缓解呢，看看这次的 Claude Opus 5有啥变化。

Opus 5 的定位：**接近 Fable 5 的智力水平，一半的价格**。在编程和知识工作评测上，它甚至超过了 Fable 5。Anthropic 自己的说法是，Opus 5 作为「日常驱动模型」，Fable 5 可以留给最有野心的长期自主项目。

## 基准数据：在「有边界的任务」上超越 Fable 5

Opus 5 在多个编程和知识工作基准上拿到了新的最高分：

| 基准 | Opus 5 | Fable 5 | Opus 4.8 |
|------|--------|---------|----------|
| Frontier-Bench v0.1（终端编程） | **43.3%** | 33.7% | 18.7% |
| CursorBench 3.2（IDE 编程） | 与 Fable 5 峰值差距 < 0.5% | 峰值最高 | — |
| ARC-AGI 3（新颖问题求解） | **3 倍于次高模型** | — | — |
| OSWorld 2.0（计算机使用） | 超越 Fable 5 最佳成绩 | 基线 | — |
| Zapier AutomationBench（业务自动化） | **通过率约 1.5 倍于次高模型** | — | — |
| GDPval-AA v2（知识工作） | **SOTA** | — | — |

<small>*数据：Anthropic 官方发布公告，2026 年 7 月 24 日。Frontier-Bench 数据来自内部运行，mini-SWE-agent 框架，GKE 后端，每任务 5 次平均。*</small>

Frontier-Bench v0.1 上 Opus 5 得分 43.3%，是 Opus 4.8（18.7%）的 2.3 倍，也高于 Fable 5（33.7%）将近 10 个百分点。CursorBench 3.2 上，Opus 5 在最高 effort 下与 Fable 5 峰值仅差 0.5%，但每个任务的成本只有 Fable 5 的一半。

Anthropic 也坦诚提到：**Opus 5 赢的都是有明确目标的有边界任务，这也是基准能衡量的。Fable 5 的优势在于基准衡量不了的「持续时长」 —— 跨越数小时甚至数天的长期自主项目，需要模型在大量关联步骤中保持连贯。**

这个区分很关键。如果你的工作主要是一个个可拆分的编程任务、分析任务、文档处理，Opus 5 的性价比更高。如果你需要模型连续几天自主推进一个复杂项目，Fable 5 更佳。

## 自我验证：从「给答案」到「确认答案对了」

Opus 5 最让人印象深刻的行为变化不是分数更高，而是**它会主动检查自己的工作**。

Anthropic 给了几个例子：

- 在 Frontier-Bench 的一个任务中，模型需要根据一张机械零件图纸生成 3D CAD 模型，但故意没有给它查看图纸的工具。Opus 5 自己写了一个计算机视觉 pipeline，从原始像素提取几何信息，然后重建了完整零件。重复测试中它都能做到，其他竞品模型五次尝试均失败。
- 给定一个开源包管理器的真实 Bug，Opus 5 找到了根因并修复了社区补丁遗漏的边界情况。竞品模型只修了表面症状就报告完成。
- 一位交易公司的工程师用 Opus 5 在一次会话中构建了一个新交易所的市场数据 feed。找不到现成的 live feed 做验证，模型自己造了测试工具来检查解析代码的正确性。

Stripe 的一位工程师 Cristian Rivera 说，他在一个周末让 Opus 5 担任开发环境的「幕僚长」 —— 它自己搭了监控、驱动每台机器，只在需要判断的时候才拉他进来。

这些案例指向同一个能力：**模型不再满足于生成一个看起来合理的输出，而是会验证输出是否正确，并在发现问题时迭代修复**。对于企业用户来说，这可能比基准分数更有实际价值 —— 因为 AI 落地的最大隐性成本不是调用费用，而是人工审查机器输出的时间。

## 效率而非极限：每个 token 做更多事

Opus 5 的定价与 Opus 4.8 完全一致：$5/MTok 输入、$25/MTok 输出。以 Frontier-Bench 为例，同样的价格买到了 2.3 倍的性能。

再看看更早期客户的反馈：

- **Harvey（法律 AI）**：在最高推理模式下，Opus 5 达到与 Opus 4.8 相当的性能，但平均生成的 token 数减少了 26%。
- **Fundamental Research Lab**：在高难度金融建模任务上，Opus 5 平均准确率高出 9 个百分点，同时使用的轮次和工具调用减少了约三分之一，耗时减少了 60%。
- **Zapier**：Opus 5 在 AutomationBench 排行榜上拿了第一，而且没有比之前的 Claude 模型花更多 token。一个从未被完成的端到端客户流失预防工作流，Opus 5 做到了 100% 通过率。
- **Lovable**：在最难的 agentic 编程任务上比 Opus 4.7 提升了 22%，且运行间方差大幅降低。
- **Box**：整体比 Opus 4.8 高出 8%，数据分析场景提升 11%，尽职调查场景提升 17%。

Opus 5 提供了可调节的 effort 等级。开发者可以像调旋钮一样控制模型在每个问题上投入多少思考资源——需要快速响应时降低 effort 节省 token，需要深度推理时拉到最高。即使在最低 effort 下，Opus 5 在 AutomationBench 上通过的任务也比其他模型在最高 effort 下更多。

## Fast 模式和新 API 特性

Opus 5 还推出了几个实用更新：

**Fast 模式**（研究预览）：输出 token 生成速度提升 2.5 倍，价格为标准 Opus 5 的 2 倍。Claude Code 用户可以通过额外用量额度使用。对需要快速迭代的编程场景来说，这个模式在速度和成本之间提供了新的权衡点。

**自动回退（Automatic Fallbacks）**：当安全分类器拦截了 Opus 5（或 Fable 5）的请求时，API 可以自动将请求路由到另一个模型（默认回退到 Opus 4.8），而不是直接返回拒绝。开发者不再需要自己处理被拦截后的重试逻辑。

**对话中途切换工具**：开发者可以在对话过程中更改 Claude 可用的工具集，而不会使 prompt cache 失效。这意味着 Agent 的每个阶段只暴露给它需要的工具，既安全又省钱。

## 安全：刻意保留的能力缺口

Anthropic 在 Opus 5 的安全策略上采用了一个有意思的方法：**故意不教它某些技能**。

和 Opus 4.8 一样，Opus 5 没有在网络安全任务上做过专项训练。但由于通用能力的提升，它在**发现**软件漏洞方面已经接近 Mythos 5（OSS-Fuzz 漏洞识别率 79.4% vs Mythos 5 的 80%）。然而在**利用**漏洞方面，Opus 5 远远落后 —— Opus 5 只成功开发了 4 个漏洞利用，而 Mythos 5 做到了 13 个。

这是刻意设计的不对称性：擅长防御性发现，不擅长攻击性利用。

在自动化行为审计中，Opus 5 的整体错误对齐行为得分为 2.3，低于 Opus 4.8、Sonnet 5 和 Fable 5，是 Anthropic 目前对齐程度最高的模型。Anthropic 预计 Opus 5 的网络安全分类器触发频率比 Fable 5 低约 85% —— 这对日常使用来说意味着更少的误拦截。

同时，Opus 5 不受 Fable 5 和 Mythos 5 的 30 天数据保留政策约束，对数据隐私敏感的企业用户来说是一个加分项。

## Claude 模型家族的当前格局

经过 2026 年上半年的密集发布，Anthropic 的模型产品线已经形成了清晰的层级：

| 模型 | 定位 | 定价（输入/输出） |
|------|------|-----------------|
| Mythos 5 | 最强能力，限制分发 | 限制访问 |
| Fable 5 | 长期自主项目的前沿模型 | $10 / $50 |
| **Opus 5** | **日常编程和知识工作** | **$5 / $25** |
| Sonnet 5 | 规模化部署，速度和成本优先 | $2 / $10 |
| Haiku 4.5 | 子代理和即时应答 | $1 / $5 |

<small>*Sonnet 5 的 introductory pricing 截至 2026 年 8 月 31 日为 $2 / MTok 输入、$10 / MTok 输出；之后恢复为 $3 / $15。数据：Anthropic 官方模型文档，查询于 2026 年 7 月 25 日。</small>

Opus 5 在这个矩阵中的位置很有意思：它不是最强的（Fable 5 和 Mythos 5 都在上面），但在「大多数人每天面对的大多数任务」这个范围内，它的投入产出比是最高的。

## 谁应该切换到 Opus 5

根据发布数据和早期用户反馈，我的判断是：

**立刻切换**：如果你在用 Opus 4.8 或 Opus 4.7 做日常编程、代码审查、文档分析、业务自动化工作，Opus 5 在几乎所有维度上都是严格升级——更高的准确率、更少的 token 消耗、更低的方差。

**值得测试**：如果你在用 Fable 5 做有明确目标的任务（修 Bug、写功能、分析数据），可以在 Opus 5 上跑一下对比。Anthropic 官方建议「跑两个代表性的 —— 一个有边界的任务和一个长期任务」来决定。

**暂时不用换**：如果你的工作场景是长时间自主运行的 Agent 项目（比如连续几天的自动化药物设计、跨天的代码库重构），Fable 5 在长期连贯性上仍然更强。

**不适合**：如果你的主要需求是攻击性网络安全（渗透测试、漏洞利用开发），Opus 5 的安全分类器会主动拦截这类请求，Mythos 5 仍然是更合适的工具（前提是你有访问权限）。

## 一个更大的行业趋势

Opus 5 的发布和 7 月初 Google 发布更高效的 Gemini 模型、OpenAI 发布 GPT-5.6 形成了一个共同的信号：**2026 年下半年的 AI 竞争焦点正在从「谁最聪明」转向「谁最划算」**。

当旗舰模型在核心推理基准上的差距已经压缩到个位数百分点，真正决定企业采用规模的因素变成了：每完成一个任务花多少钱？每个 token 能做多少有效工作？模型在生产环境中的表现方差有多大？

Anthropic 在 Opus 5 上给出这样的回答：保持 Opus 4.8 的价格，性能翻倍，用更少的 token 完成更多的事。


## 参考资料

- [Anthropic 官方：Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)
- [VentureBeat：Anthropic launches Claude Opus 5](https://venturebeat.com/orchestration/anthropic-launches-claude-opus-5-a-cheaper-ai-model-for-coding-agents-and-enterprise-workflows)
- [The Verge：Anthropic releases Opus 5](https://www.theverge.com/ai-artificial-intelligence/970105/claude-opus-5-announced-anthropic-ai-model-release)
- [CNET：Anthropic Releases Claude Opus 5](https://www.cnet.com/tech/services-and-software/anthropic-releases-claude-opus-5-to-be-your-new-everyday-assistant/)
- [TechCrunch：Anthropic launches Opus 5](https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/)
- [CNBC：Anthropic's new AI model rivals Fable 5](https://www.cnbc.com/2026/07/24/anthropic-claude-opus-5-ai-fable-5-cost.html)
