---
title: "GLM 5.1 的 8 小时承诺，比 SWE-Bench 分数更值得关注"
date: '2026-04-08'
tags: ['AI前沿', '大模型', 'GLM', '模型评测', '开源权重']
published: true
brief: "智谱AI发布 GLM 5.1，744B 参数的 MoE 模型在 SWE-Bench Pro 上拿下开源模型史上最高的 58.4%，超越 GPT-5.4 和 Claude Opus 4.6。但比编码分数更值得关注的是它的 8 小时长程自主任务能力。这篇文章分析它的能力边界、定价争议和真实使用场景。"
---

> 2026 年 4 月 7 日，智谱AI发布 GLM 5.1。这款 744B 参数的 MoE 模型在 SWE-Bench Pro 上拿下 58.4%，成为第一个在该基准上超越 GPT-5.4 和 Claude Opus 4.6 的开源权重模型。但比编码分数更值得关注的是它的另一个能力：在独立测试中，GLM 5.1 能够连续执行 8 小时自主任务而不偏离目标。

## 模型规格与定位

GLM 5.1 基于混合专家（MoE）架构，采用 MIT 许可证完全开源：

| 规格 | GLM 5.1 | Claude Opus 4.6 | GPT-5.4 |
|------|---------|-----------------|---------|
| 总参数 | 744B（256 专家） | 未公开 | 未公开 |
| 激活参数 | 40B | 未公开 | 未公开 |
| 上下文窗口 | 200K tokens | 200K tokens | 1M tokens |
| 最大输出 | 128K tokens | 未公开 | 未公开 |
| 许可证 | MIT（开源可商用） | 专有 | 专有 |

<small>*数据：Z.AI 官方发布，2026 年 4 月 7 日。Claude 和 GPT 参数未公开。</small>

定价方面，GLM 5.1 的 API 采用标准输入/输出结构：

| 模型 | 标准输入 | 缓存输入 | 标准输出 |
|------|---------|---------|---------|
| GLM 5.1 | $1.40 / MTok | $0.26 / MTok | $4.40 / MTok |
| Claude Opus 4.6 | $5.00 / MTok | $1.25 / MTok | $25.00 / MTok |
| GPT-5.4 | $2.50 / MTok | $1.25 / MTok | $15.00 / MTok |

<small>*数据：各厂商官方 API 文档，2026 年 4 月。GLM 5.1 中国官网定价为输入 6-8 元/百万 tokens，输出 24-28 元/百万 tokens。</small>

GLM 5.1 的 API 输入定价是 Claude Opus 4.6 的 28%，输出定价是其 17.6%。对于已经使用多模型架构的团队，这个定价意味着可以用不到五分之一的成本替换编程 Agent 的主力模型。

但订阅方案的价格涨幅引发了争议。GLM 5.1 的 Coding Plan Pro 季度订阅从上一代的约 $60 涨到了 $81。DEV Community 有开发者称年度订阅涨幅接近 3 倍，但官方目前仅公布了季度方案。

## 能力边界：哪里突破了，哪里仍受限

GLM 5.1 的能力分布呈现明显的场景分化：

**突破的部分**：

- **编程能力**：SWE-Bench Pro 58.4%，超越 GPT-5.4（57.7%）和 Claude Opus 4.6（57.3%），是开源模型史上首次在该基准上登顶
- **长程任务**：8 小时自主执行能力，能够在无人工干预的情况下构建完整 Linux 桌面环境、优化 CUDA 内核
- **Arena Code Elo**：1530 分，排名第三，仅次于 Claude Opus 4.6

**仍受限的部分**：

- **推理和数学**：GPQA-Diamond 86.2，落后于 Gemini 3.1 Pro 的 94.3
- **速度**：44.3 tokens/秒，是前沿编码模型中最慢的
- **长时间任务成功率**：独立测试显示顶级模型在 8 小时任务中的成功率仅约 25%

这种能力分布说明 GLM 5.1 不是在全维度上追赶闭源旗舰，而是在**编码和长程自主任务**这两个特定场景上实现了差异化突破。

## 媒体视角：从马拉松选手到审慎定价

VentureBeat 在 2026 年 4 月 7 日的报道标题直接将 GLM 5.1 定位为"马拉松选手"："AI joins the 8-hour work day as GLM ships 5.1 open source LLM, beating Opus 4.6 and GPT-5.4 on SWE-Bench Pro"。文章强调了中国实验室在开源 AI 领域的回归，以及 8 小时自主执行能力作为 AI 竞争下一个前沿的意义。

MarkTechPost 同日发表了详细的技术分析，指出 GLM 5.1 的架构创新不仅在于 MoE + DSA + MLA 的组合，更在于"staircase pattern"优化突破。在 VectorDBBench 测试中，模型通过 655 次迭代将性能提升了 6 倍。

DeepLearning.ai The Batch 则呈现了更审慎的视角。其分析指出，GLM 5.1 在推理和数学测试上仍落后于闭源模型，且价格比前代 GLM-5 高出约 40%。更关键的是，文章质疑了 8 小时任务能力的实际可靠性："如果 GLM-5.1 在长时间会话中识别和转向死胡同的能力在独立测试中得到验证，这将指向当前基准测试遗漏的训练目标。"言下之意，这个能力目前主要依赖厂商自我报告。

## 社区实测：编码优秀，速度是硬伤

知名开发者 Simon Willison 在发布当天测试了 GLM 5.1，让其生成"骑自行车的鹈鹕"SVG。他的评价直接："SVG was excellent, and might be my new favorite from an open weights model"。更令他印象深刻的是，模型在后续交互中修复了一个动画 bug，还解释了原因——CSS transform 覆盖了 SVG transform 属性。

但社区的另一面反馈不容忽视。一位用户在 Twitter 上的留言代表了部分开发者的失望："Just cancelled my GLM Coding Max plan. GLM 5.1 is one of the most unreliable models I've ever used. Slow. Hallucinates constantly." DEV Community 上的一篇文章标题更为直接："Re-evaluating the ROI of GLM-5.1 Pro After a Massive Price Hike to $680"。

Hacker News 上的讨论则聚焦于技术层面的质疑。有开发者指出，GLM 5.1 在处理长上下文时"you see the issue much earlier"，暗示 KV cache 机制可能存在效率问题。另一位用户算了笔账："not streaming tokens out 24/7 and at that point TCO is just drastically more expensive for self hosting"。

Reddit r/LocalLLaMA 上的反馈同样分化。正面评价认为"13 years in dev and glm-5.1 is the first budget model that actually made me reconsider my setup"，负面则质疑"The 28% coding improvement came entirely from post-training RL, no architecture change"——即进步主要来自训练而非架构创新。

## 使用场景建议

基于当前的能力和定价结构：

| 场景 | 推荐 | 理由 |
|------|------|------|
| 编程 Agent 主力 | GLM 5.1 | SWE-Bench Pro 58.4%，API 成本是 Opus 的 28% |
| 长程自主任务 | 尝试 GLM 5.1 | 8 小时执行能力是独特卖点，但成功率待验证 |
| 对延迟敏感的场景 | 不选 GLM 5.1 | 44.3 tokens/秒是前沿模型中最慢的 |
| 数学/科学推理 | 不选 GLM 5.1 | GPQA-Diamond 86.2，落后 Gemini 3.1 Pro 8 个百分点 |
| 本地部署 | GLM 5.1 | 40B 激活参数，16.8GB 量化即可本地运行 |
| 预算敏感的个人开发者 | 慎用订阅版 | 年度订阅据称涨价近 3 倍，API 按量付费更灵活 |

## 开源编码模型的新标杆

GLM 5.1 的意义不在于它是否全面超越了闭源旗舰。它的真正价值在于：**以 MIT 许可证的形式，把顶尖编码能力送到了开源社区**。

在此之前，SWE-Bench Pro 的榜首长期被 Claude Opus 和 GPT 系列垄断。GLM 5.1 的 58.4% 证明，开源模型在特定工程场景上已经具备了与闭源旗舰正面竞争的能力。对于依赖开源工具链的团队，这意味着不再需要在能力和可控性之间做妥协。

但选择 GLM 5.1 有两个前提：你的场景是编码或长程任务导向的，且你能接受 44.3 tokens/秒 的速度。如果你的应用需要低延迟交互、需要最前沿的数学推理能力、或者对订阅成本的稳定性有严格要求，三家闭源旗舰仍然是更稳妥的选择。

开源模型的竞争正在进入一个新阶段。GLM 5.1 不是终点，而是一个信号：在编码这个高价值场景上，开源和闭源的差距已经缩小到在特定场景下可以忽略不计的程度。
