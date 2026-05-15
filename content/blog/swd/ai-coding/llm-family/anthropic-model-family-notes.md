---
title: "Anthropic 模型谱系档案：Claude 为什么越来越像长跑型 Agent"
date: '2026-05-14'
tags:
  - AI前沿
  - LLM
  - Anthropic
  - Claude
  - 模型评测
published: true
brief: >-
  这是一份按代际持续维护的 Anthropic 模型档案。首版覆盖 Claude Opus 4.7、Claude Opus 4.6、Claude Opus 4、Claude 3.7 Sonnet、Claude 3.5 Sonnet 和 Claude 3 Opus 等最近几代主力，重点记录官方发布时间、API 价格、编码与 Agent 侧能力，以及后续追加维护规则。
---

> 如果 OpenAI 这条线给人的感觉是“越来越会干活”，那 Anthropic 这条线更像“越来越能把长活干稳”。Claude 这几年最明显的差异，不是某一个跑分突然炸裂，而是它在长任务、长上下文和代码 Agent 上的稳定性一路被做厚了。

Anthropic 的代际节奏和 OpenAI 不太一样。

OpenAI 更像频繁重组产品线，Anthropic 则更像在一条主线上持续打磨：长上下文、指令遵循、编码 Agent、工具协同、文件系统记忆。

这篇也是长期档案。

首版先整理从 Claude 3 Opus 到 Claude Opus 4.7 的完整主线代际，后面新模型继续追加，不删旧记录。

## 我用同一套 5 个维度看 Claude

| 维度 | 我重点看什么 |
|------|-------------|
| 编码 | 在真实工程任务里是否更稳、更能长跑 |
| 推理与知识工作 | 是否能把复杂分析做扎实而不是只会解释 |
| 多模态与电脑操作 | 视觉能力、复杂界面理解、文档理解怎样 |
| 上下文与 Agent 续航 | 长上下文、一致性、记忆和工具链配合如何 |
| 成本透明度 | 输入、缓存命中、输出价格是否长期清晰 |

## Anthropic 主线模型总表

| 模型 | 官方发布日期 | 输入价格 | 缓存命中/读 | 输出价格 | 这一代最该记住的事 |
|------|-------------|---------|-------------|---------|------------------|
| Claude Opus 4.7 | 2026-04-16 | $5 / 1M | $0.50 / 1M | $25 / 1M | 当前 Claude 主力旗舰，继续强化长程编码和高分辨率视觉 |
| Claude Opus 4.6 | 2026-02-05 | $5 / 1M | $0.50 / 1M | $25 / 1M | 1M context + Adaptive Thinking + Agent Teams 预览 |
| Claude Opus 4.5 | 2025-11-24 | $5 / 1M | $0.50 / 1M | $25 / 1M | Claude 旗舰价格首次直接砍到 1/3，编码能力同步补强 |
| Claude Opus 4 | 2025-05-22 | $15 / 1M | $1.50 / 1M | $75 / 1M | 把 Claude 4 系列正式推上台面，主打世界最佳 coding model |
| Claude 3.7 Sonnet | 2025-02-24 | $3 / 1M | 官方未公布 | $15 / 1M | 第一代 hybrid reasoning Claude，思考与快答合一 |
| Claude 3.5 Sonnet | 2024-06-20 | $3 / 1M | 官方未公布 | $15 / 1M | 用 Sonnet 定位打出接近甚至超过旧旗舰的性价比拐点 |
| Claude 3 Opus | 2024-03-04 | $15 / 1M | 官方未公布 | $75 / 1M | Claude 3 家族旗舰，把长上下文和多模态能力打进前沿区 |

<small>*数据来源：Anthropic 官方新闻页与官方 Pricing 页面，查询日期 2026-05-14。部分旧代缓存读价格官方发布页未单列，按“官方未公布”处理。Claude Opus 4.7 的缓存读价格沿用官方 pricing 当前页与“pricing remains the same as Opus 4.6”口径。*</small>

## Claude Opus 4.7：这代真正补强的是“高难任务不掉链子”

Anthropic 在 2026 年 4 月 16 日发布 Claude Opus 4.7。

从官方表述看，它不是一次方向大改，而是一次很典型的旗舰补强：

- 更强的 advanced software engineering
- 更高分辨率的视觉输入
- 更好的 instruction following
- 更稳的长程任务一致性

这类升级如果只看宣传标题，容易觉得不够刺激。

但如果你真在做 Agent 编码、复杂工作流、长会话文档处理，这种升级往往最值钱，因为它修的不是“能不能做”，而是“做的时候会不会半路跑偏”。

Anthropic 给出的信号也很一致：长跑、验证、严格遵循、长上下文、文件系统记忆。

我对 Opus 4.7 的理解是，它把 Claude 的核心卖点继续往“可托付的复杂执行者”这个方向推了一大步。

## Claude Opus 4.6：1M 上下文和 Agent Teams 的预览

Claude Opus 4.6 是 2026 年 2 月 5 日发布的。

这代最大的变化是上下文窗口从 200K 扩到了 **1M tokens**，这是一个 5 倍的跃升。同时引入了 **Adaptive Thinking**（自适应思考），取代了之前手动的 extended thinking 开关，让模型自己决定什么时候需要深度推理。

另外，这代还推出了 **Agent Teams（预览）**：多个 Claude 实例可以并行处理同一项目的不同部分。

以及 **Context Compaction**：当上下文接近上限时，自动进行服务端摘要。

Opus 4.6 延续了 Opus 4.5 的 $5/$25 价格。这件事的真正分水岭其实发生在 Opus 4.5：Anthropic 把旗舰从 Opus 4 的 $15/$75 直接砍到 $5/$25，4.6 把这条更低的价格线稳了下来。

## Claude Opus 4.5：编码能力的持续补强

Claude Opus 4.5 是 2025 年 11 月 24 日发布的。

这代看起来像一个”小版本”，但实际上有两个重要信号：

- SWE-bench Verified 提升到接近 81%，编码能力继续往前推
- 价格直接从 Opus 4 的 $15/$75 砍到 $5/$25，是 Claude 4 系列最激进的一次降价

放在谱系里看，Opus 4.5 不只是 Opus 4 到 Opus 4.6 之间的过渡，它就是真正把 Claude 旗舰价格门槛打下来的那一代。后面 Opus 4.6 的 1M context 能在同样价位推出来，前提就是 4.5 已经先把价格降到了 $5/$25。

## Claude Opus 4：Claude 4 系列的定调之作

Claude Opus 4 是 2025 年 5 月 22 日发布的。

这一代最重要的意义，不只是分数，而是把 Claude 4 的产品哲学讲明白了：

- 编码和 Agent 是主舞台
- extended thinking 要和 tool use 结合
- 模型不是只回答，而是要长期协作

Anthropic 在这代里第一次非常明确地把”memory files””parallel tool execution””long-running tasks”这些东西摆在台前。

如果你要理解后面为什么会有 Opus 4.5、4.6、4.7，这一代是不能跳过的。

它定义了 Claude 后续旗舰的方向。

## Claude 3.7 Sonnet：Sonnet 从高性价比助手变成混合推理主力

Claude 3.7 Sonnet 是 2025 年 2 月 24 日发布的。

这代最关键的是“hybrid reasoning”。

Anthropic 没有单独再分一条 reasoning 产品线，而是把普通回答和 extended thinking 放在同一个模型里，还允许 API 用户控制 thinking budget。

这个设计非常重要。

它意味着 Claude 在使用体验上更连贯，不会像有些模型那样，你得先想清楚自己是要一个“快模型”还是一个“深想模型”。

对于开发者来说，这样的统一模型更容易接进工作流，也更像一个连续协作对象。

## Claude 3.5 Sonnet：真正把 Sonnet 级别推成主流选择的一代

Claude 3.5 Sonnet 的意义，我认为远大于它看起来像一次中档升级。

因为从这代开始，Anthropic 把一个原本不是旗舰命名的位置，做成了很多团队日常的首选。

3.5 Sonnet 当时最打人的地方，不是“参数更大”这种故事，而是它在价格没上去的情况下，把能力直接打到了可以越级挑战旧旗舰的水平。

这也是后来很多人形成“Claude 日常主力更适合写代码”的直觉来源。

## Claude 3 Opus：Claude 进入真正前沿档位的起点

Claude 3 Opus 是 2024 年 3 月 4 日发布的。

如果今天回看，它已经不再是 Anthropic 最值得部署的主力。

但在谱系里，它的价值很大：

- 明确把多模态和长上下文带进旗舰叙事
- 把 Claude 从“安全但保守”的形象推向真正前沿竞争位
- 给后面的 Sonnet 3.5、3.7、4 系列打了能力地基

很多后来被人默认是 Claude 优势的东西，比如长上下文稳定性、复杂文档理解，其实都能在这一代看到雏形。

## 我对 Anthropic 这条线的实际判断

Anthropic 从 Claude 3 Opus 到 Claude Opus 4.7 的完整主线，核心不是”功能越来越花”，而是”复杂任务越来越稳”。

这是 Claude 和其他头部厂商最值得单独看的地方。

OpenAI 更像在扩工作面。

Google 更像在扩上下文和多模态边界。

Anthropic 则更像在把一位高水平工程师的工作习惯做厚：

- 更谨慎
- 更能持续
- 更会按指令做
- 更愿意自己校验

从谱系看，这条线的演进很清晰：

- Claude 3 Opus：把长上下文和多模态带进旗舰叙事
- Claude 3.5 Sonnet：用性价比打破”旗舰一定贵”的假设
- Claude 3.7 Sonnet：把 hybrid reasoning 做成统一体验
- Claude Opus 4：把 Agent、memory、long-running task 正式扶正
- Claude Opus 4.5：编码能力补强 + 把旗舰价格砍到 $5/$25
- Claude Opus 4.6：1M context + 自适应思考 + Agent Teams 预览
- Claude Opus 4.7：继续推高长程编码和视觉分辨率

所以如果你的问题是”Claude 这家最适合拿来干嘛”，我的答案会很集中：

- 长程编码 Agent
- 复杂多步工作流
- 对长上下文和一致性要求高的任务
- 希望模型少自作主张的场景

如果你只是想追求最低单价，Claude 不一定是最优。

但如果你要的是”交给它以后，它能稳稳把长活干下去”，Anthropic 这条线一直都很有竞争力。

## 官方来源

- Anthropic Pricing: `https://claude.com/pricing#api`
- Introducing Claude Opus 4.7: `https://www.anthropic.com/news/claude-opus-4-7`
- Introducing Claude Opus 4.6: `https://www.anthropic.com/news/claude-opus-4-6`
- Introducing Claude Opus 4.5: `https://www.anthropic.com/news/claude-opus-4-5`
- Introducing Claude 4: `https://www.anthropic.com/news/claude-4`
- Claude 3.7 Sonnet and Claude Code: `https://www.anthropic.com/news/claude-3-7-sonnet`
- Claude 3.5 Sonnet: `https://www.anthropic.com/news/claude-3-5-sonnet`
- Claude 3 family: `https://www.anthropic.com/news/claude-3-family`
