---
title: "DeepSeek：从 V3 到 V4.1，这家最锋利的地方不只是便宜"
date: '2026-09-16'
tags:
  - AI前沿
  - LLM
  - DeepSeek
  - 模型评测
  - 开源权重
published: true
brief: >-
  这是一份按代际持续维护的 DeepSeek 模型档案。首版覆盖 DeepSeek-V4、DeepSeek-V3.2、DeepSeek-V3.2-Exp、DeepSeek-V3.1、DeepSeek-R1-0528、DeepSeek-R1、DeepSeek-V3 等最近主线，本次追加 DeepSeek-V4.1-Flash 与 DeepSeek-V4-Flash-Vision-Exp，重点记录官方发布时间、现有官方价格、Agent 与编码能力，以及后续只追加不删历史的维护规则。
---

> DeepSeek 这条线最容易被人记成“便宜”。但如果你只记住便宜，就会错过它真正锋利的地方：它是在用更低的价格，把前沿级别的 Agent 编码和推理工作负载硬生生压进更广的使用门槛里。

DeepSeek 这几年更新很快，而且型号分支也不少。

为了让这篇档案更稳，我首版只收官方资料能比较清晰确认的主线代际，不把一堆实验型号和平台更新混进来。

## 我用同一套 5 个维度看 DeepSeek

| 维度 | 我重点看什么 |
|------|-------------|
| 编码 | 真实 Agent 编码任务和仓库修复能力 |
| 推理与知识工作 | reasoning 质量、数学与复杂问题能力 |
| 多模态与电脑操作 | 这一家目前更偏文本和 Agent，视觉不是主卖点 |
| 上下文与 Agent 续航 | 1M context、tool-use、长程工作是否扎实 |
| 成本透明度 | 官方 API 是否把缓存命中和未命中都讲清楚 |

## DeepSeek 最近几代主线总表

| 模型 | 官方发布日期 | 输入价格 | 缓存命中 | 输出价格 | 这一代最该记住的事 |
|------|-------------|---------|---------|---------|------------------|
| DeepSeek-V4.1-Flash（API: `deepseek-flash`） | 2026-09-10 | Off-peak $0.15 / peak $0.30 | Off-peak $0.003 / peak $0.006 | Off-peak $0.60 / peak $1.20 | 新架构与原生视觉理解并进，旧 V4 Flash 系列调用名转为兼容路由 |
| DeepSeek-V4-Flash-Vision-Exp | 2026-08-21 | Off-peak $0.22 / peak $0.44（沿用 V4-Flash GA） | Off-peak $0.007 / peak $0.014（沿用 V4-Flash GA） | Off-peak $0.66 / peak $1.32（沿用 V4-Flash GA） | 实验性多模态 Agent 模型，现已退役并转由 V4.1-Flash 路由 |
| DeepSeek-V4-Flash / V4-Pro | Preview 2026-04-24；GA 2026-08-13 | Flash off-peak $0.22 / peak $0.44，Pro off-peak $0.66 / peak $1.32 | Flash off-peak $0.007 / peak $0.014，Pro off-peak $0.022 / peak $0.044 | Flash off-peak $0.66 / peak $1.32，Pro off-peak $1.98 / peak $3.96 | V4-Pro 正式 GA，引入 peak/off-peak 定价，输出价格大幅上调 |
| DeepSeek-V3.2 / V3.2-Speciale | 2025-12-01 | 官方现页未保留 | 官方现页未保留 | 官方现页未保留 | 把 thinking 直接并进 tool-use，明确往 agents 走 |
| DeepSeek-V3.2-Exp | 2025-09-29 | 官方现页未保留 | 官方现页未保留 | 官方现页未保留 | 引入 Sparse Attention，长上下文效率实验 |
| DeepSeek-V3.1 | 2025-08-21 | 官方现页未保留 | 官方现页未保留 | 官方现页未保留 | Hybrid Think/Non-Think 单模型架构，Agent 能力增强 |
| DeepSeek-R1-0528 | 2025-05-28 | 官方现页未保留 | 官方现页未保留 | 官方现页未保留 | reasoning 线升级，前端能力和 function calling 明显增强 |
| DeepSeek-R1 | 2025-01-20 | $0.55 / 1M | $0.14 / 1M | $2.19 / 1M | 推理线正式成型，是后来 R1-0528 的基线 |
| DeepSeek-V3 | 2024-12-26 | $0.27 / 1M（2 月 8 日后） | $0.07 / 1M（2 月 8 日后） | $1.10 / 1M（2 月 8 日后） | 后续 V3.x 演进的起点 |

<small>*数据来源：DeepSeek 官方 API News 与 Pricing 页面，首次查询日期 2026-08-17，本次查询日期 2026-09-16。DeepSeek-V4 系列于 2026-08-13 正式 GA，模型版本更新为 DeepSeek-V4-Pro-0813 与 DeepSeek-V4-Flash-0731，API 调用名保持 `deepseek-v4-pro` 与 `deepseek-v4-flash` 不变。新版 pricing 引入 peak / off-peak 结构，2026-08-16 16:00 UTC 生效：peak hours 为 01:00–04:00 与 06:00–10:00 UTC，其余为 off-peak；off-peak 价格约为 peak 的 50%。表格中 V4 价格已按 GA 后官方 pricing 图更新，旧 preview 阶段价格（Flash 未命中 $0.14、输出 $0.28；Pro 未命中 $0.435、输出 $0.87）保留在本页文字记录中。V4-Flash-Vision-Exp 发布公告说明图像按 V4-Flash 价格计费，表格沿用 2026-08-13 GA 费率；V4.1-Flash 价格取自本次查询时的官方 Pricing 页面，当前页面将旧的 `deepseek-v4-flash` 与 `deepseek-v4-flash-vision-exp` 标为退役，并说明请求由 V4.1-Flash 提供服务、按 Flash 价格计费。DeepSeek-R1 与 DeepSeek-V3 的价格取自各自发布公告；其中 DeepSeek-V3 公告只明确给出 2025-02-08 起执行的价格。其余历史型号很多价格已不在当前定价页保留，因此按“官方未公布”或“官方现页未保留”处理。*</small>

## DeepSeek-V4.1-Flash：把视觉理解并进 Flash 主线

V4.1-Flash 在 2026 年 9 月 10 日发布，API 调用名为 `deepseek-flash`。

我把它单列为新一代记录，不把它当成一次 endpoint 更名：官方把它描述为新架构家族中的最小模型，并把原生视觉理解纳入新的 Flash 主线。

它的技术路线也很有辨识度：552B 参数的 MoE，输入侧只有 8B active parameters，输出侧为 16B；官方还称，相比上一代，它的 KV cache 只需要四分之一的 HBM 和八分之一的 SSD。这个方向很清楚——不是单纯把模型做大，而是同时压低推理和长链路 Agent 的基础设施成本。

能力上，V4.1-Flash 支持 1M context、thinking / non-thinking 双模式、JSON Output、Tool Calls、Responses API、Anthropic API 和 Vision；官方公告列出的结果包括 GPQA Diamond 90.9、Terminal-Bench 2.1 90.6、DeepSWE v1.1 74.2。这里的分数是官方公告口径，适合用来理解发布定位，不等于独立复测结论。

当前官方价格（每 1M tokens；peak 仅工作日适用）：

| 时段 | 输入（缓存命中） | 输入（缓存未命中） | 输出 |
|------|----------------|------------------|------|
| Off-Peak | $0.003 | $0.15 | $0.60 |
| Peak | $0.006 | $0.30 | $1.20 |

官方随后把 `deepseek-v4-flash` 与 `deepseek-v4-flash-vision-exp` 标记为退役，旧调用名暂时路由到 V4.1-Flash。这意味着 V4.1-Flash 不只是增加一个视觉入口，而是在收拢 V4 Flash 这条产品线：新的 API 主入口变成 `deepseek-flash`，视觉和文本 Agent 能力被放进同一条主线上。

## DeepSeek-V4-Flash-Vision-Exp：一次实验性的多模态 Agent 插入

V4-Flash-Vision-Exp 在 2026 年 8 月 21 日发布，API 调用名为 `deepseek-v4-flash-vision-exp`。

官方把它定义为实验性多模态模型：文本能力对齐 V4-Flash，包括 Agent、推理和世界知识；在需要视觉理解的 Agent 基准上，相比 V4-Flash 有明显跃升，并把多模态 Agent 表现推进到接近 Opus-4.8 的位置。

这代真正值得记的是它把视觉输入接进了现有 Agent 工具链：支持混合文本与图片输入，图片可以通过 base64、外部 URL 或 Files API 提供；同时支持 Chat Completions、Messages 和 Responses。图片按 token 计费，每张最多 384 tokens，官方发布页说明按 V4-Flash 价格计算；Files API 本身免费，并支持上传一次后通过 `file_id` 复用图片。

从谱系上看，它是 V4.1-Flash 的重要前置节点；从当前 API 状态看，它已经不是独立主力。官方当前 Pricing 页面说明，`deepseek-v4-flash-vision-exp` 仍可作为兼容调用名，但对应请求已由 V4.1-Flash 提供服务并按 Flash 价格计费。我保留这条记录，是为了保留 DeepSeek 从文本 Agent 走向原生视觉 Agent 的演进节点。

## DeepSeek-V4：这代最值得记的不是“更强”，而是“更像生产模型”

V4 系列在 2026 年 4 月 24 日发布。

它最大的变化，是 DeepSeek 开始把很多以前像“高性价比选项”的东西，做成了一个更完整的主模型体系。

最直观的信号有三个：

- 1M context 成为默认口径
- Flash / Pro 分层更清楚
- 官方把 Agentic Coding 直接写成主卖点

V4-Pro 不是单纯堆参数感，它更强调复杂长任务和代理式编码。

V4-Flash 则把很多团队最关心的事情说透了：如果你不是每次都需要顶格模型，成本可以压得非常低。

这也是 DeepSeek 这家最有破坏力的地方。

它不是只想做最强模型，而是想把“能部署得起的前沿能力”做出来。

---

**2026-08-13 更新：DeepSeek-V4-Pro 正式 GA，pricing 结构改为 peak / off-peak**

DeepSeek-V4 系列在 2026 年 8 月 13 日正式 GA。模型调用名没有变，但底层版本已经更新为 `DeepSeek-V4-Pro-0813` 和 `DeepSeek-V4-Flash-0731`。同时官方公布了新的 API 定价结构，从 2026-08-16 16:00 UTC 起执行 peak / off-peak 费率。

新定价（每 1M tokens）：

| 模型 | 时段 | 输入（缓存命中） | 输入（缓存未命中） | 输出 |
|------|------|----------------|------------------|------|
| DeepSeek-V4-Flash | Off-Peak | $0.007 | $0.22 | $0.66 |
| DeepSeek-V4-Flash | Peak | $0.014 | $0.44 | $1.32 |
| DeepSeek-V4-Pro | Off-Peak | $0.022 | $0.66 | $1.98 |
| DeepSeek-V4-Pro | Peak | $0.044 | $1.32 | $3.96 |

Peak hours 为 UTC 01:00–04:00 与 06:00–10:00，其余时间均为 off-peak。

这次更新最值得注意的不是能力代际变化，而是**成本结构剧变**：与 2026-04-24 preview 阶段的价格（V4-Pro 输出 $0.87/1M、V4-Flash 输出 $0.28/1M）相比，GA 后即使是 off-peak，输出价格也上涨了 2 倍以上；peak 时段输出价更是 preview 阶段的 4.5 倍以上。输入侧（缓存未命中）涨幅相对温和，约为 1.5–3 倍。这也意味着 DeepSeek 正在从“极致低价”向“分时定价 + 生产级成本”过渡，对批量调用和长链路 Agent 的预算影响会非常明显。

能力层面，GA 版本主要强化了 Agent 相关能力：官方强调 production gains、flexible reasoning effort（low / high / max）、原生 OpenAI Responses API 支持，以及针对 Codex 的一键接入。这些都不是发布新模型，而是把 V4 这条线从 preview 推进到可稳定投产的状态。

## DeepSeek-V3.2：thinking 开始和工具绑定在一起

V3.2 在 2025 年 12 月 1 日发布。

这代虽然官方现页已经不太容易查到完整价格，但从定位上很关键。

它第一次非常明确地把 thinking 和 tool-use 直接整合在一起。

这件事看起来像实现细节，实际上非常重要。

因为很多模型的思考和工具调用还是两层逻辑，V3.2 开始试图把它们合成一个连续动作。这会直接影响 Agent 的使用体感：

- 什么时候该想
- 什么时候该调工具
- 什么时候该继续往前做

这比单一基准高几分，更像决定产品上限的变化。

## DeepSeek-V3.2-Exp：Sparse Attention 和长上下文效率的实验

V3.2-Exp 在 2025 年 9 月 29 日发布。

这代是实验性质的，但它验证了一件很重要的事：**DeepSeek Sparse Attention** 可以在长上下文场景下显著降低计算开销。

对于 DeepSeek 这样主打低成本策略的厂商来说，长上下文效率不只是技术细节，而是直接影响定价策略的核心变量。V3.2-Exp 的实验结果直接影响了后续 V3.2 正式版的设计方向。

放在谱系里，V3.2-Exp 更像一次"技术预演"，而不是面向终端用户的正式发布。但它对理解 DeepSeek 的技术路线很有帮助。

## DeepSeek-V3.1：Hybrid Think/Non-Think 的首次尝试

V3.1 在 2025 年 8 月 21 日发布。

这代最大的创新是 **Hybrid Think/Non-Think 架构**：同一个模型可以根据任务自动决定是否需要深度推理，而不需要用户手动选择。

这个设计和后来 Anthropic Claude 3.7 Sonnet 的 hybrid reasoning 有相似的味道，但 DeepSeek 的实现路径不同：它更侧重于在单一模型内通过架构设计来切换推理模式，而不是靠外部控制。

V3.1 还增强了 Agent 能力，SWE-bench Verified 达到 66.0%，并支持 Anthropic API 格式，降低了迁移成本。

这代被跳过的原因往往是"它只是 V3 的一个更新"，但从谱系视角看，V3.1 是 V3.2"thinking + tool-use"整合路线的重要铺垫。

## DeepSeek-R1-0528：这条 reasoning 线开始更像工程产品

R1-0528 在 2025 年 5 月 28 日发布。

我觉得这代最大的价值不只是“分数更好”，而是它开始把 reasoning 模型往实际工程能力上补：

- 前端能力增强
- 幻觉降低
- 支持 JSON output
- 支持 function calling

这说明 DeepSeek 已经不满足于“做一个强推理模型”，而是要把推理线接进真实开发工作流里。

如果你现在还把 R 系列理解成“只能拿来解题”的那种 reasoning model，认知已经有点旧了。

## DeepSeek-R1 和 V3：一个立住推理线，一个立住通用线

R1 是 2025 年 1 月 20 日的独立推理发布。

V3 则是 2024 年 12 月 26 日通用线的重要起点。

这两代单看今天可能都不再是最佳部署选项，但放在谱系里很重要：

- V3 让后面的 V3.1、V3.2-Exp、V3.2、V4 有了主干
- R1 让后面的 R1-0528 有了推理线基线

也就是说，DeepSeek 后来的演进不是乱长的，而是明显拆成了两条互相补强的主线：

- 通用 / Agent / 编码线
- reasoning 线

## 我对 DeepSeek 这条线的实际判断

DeepSeek 这条线最大的变量，不只是模型能力，而是成本结构。

这会带来一个非常现实的后果：很多以前只能在大厂内部或者高预算团队里跑的工作流，开始有机会被更便宜地复刻出来。

所以我看 DeepSeek，不会只问“它是不是绝对最强”，我更关心的是：

- 它是不是够强
- 它是不是够便宜
- 它是不是已经能把一些前沿工作负载从贵模型手里挪走

在这三个问题上，DeepSeek 的答案往往都挺有冲击力。

如果你做的是纯文本 Agent、批量代码处理、长链路自动化，DeepSeek 很值得进入候选名单。

如果你要最顶格的多模态、最强世界知识新鲜度、或者极稳的商业产品边界，头部闭源模型依然更稳。

但如果你问我哪家最像“显著改写前沿模型成本线”的玩家，DeepSeek 很难绕过去。

## 官方来源

- DeepSeek Pricing: `https://api-docs.deepseek.com/quick_start/pricing`
- DeepSeek-V4.1-Flash Release: `https://api-docs.deepseek.com/news/news260910`
- DeepSeek-V4-Flash-Vision-Exp Release: `https://api-docs.deepseek.com/news/news260821`
- DeepSeek News: `https://api-docs.deepseek.com/news/news260813`
- DeepSeek-V4 GA Release: `https://api-docs.deepseek.com/news/news260813`
- DeepSeek-V4 Preview Release: `https://api-docs.deepseek.com/news/news260424`
- DeepSeek-V3.2 Release: `https://api-docs.deepseek.com/news/news251201`
- DeepSeek-V3.2-Exp Release: `https://api-docs.deepseek.com/news/news250929`
- DeepSeek-V3.1 Release: `https://api-docs.deepseek.com/news/news250821`
- DeepSeek-R1-0528 Release: `https://api-docs.deepseek.com/news/news250528`
- DeepSeek-R1 Release: `https://api-docs.deepseek.com/news/news250120`
- Introducing DeepSeek-V3: `https://api-docs.deepseek.com/news/news1226`
