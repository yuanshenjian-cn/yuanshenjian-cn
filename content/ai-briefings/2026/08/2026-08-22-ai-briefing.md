---
title: "AI 简报 · 2026-08-22"
date: "2026-08-22"
brief: "DeepSeek 发布 V4-Flash-Vision-Exp 多模态模型并上线 Files API；OpenAI GPT-5.6 Sol 降价 20%-33%，API 支持按请求选择数据处理区域；Google 一日连发三篇研究/合作动态。"
published: true
tags:
  - AI
  - DeepSeek
  - OpenAI
  - Google
---

8 月 21 日厂商动态继续围绕模型能力、API 价格与数据控制展开。DeepSeek 推出带视觉能力的新模型并补齐文件接口。OpenAI 在价格和区域合规上同时调整。Google 多条研究线并行，覆盖游戏智能体、生物医学和城市计算。

## 速览

- DeepSeek 发布 V4-Flash-Vision-Exp 多模态模型，并上线免费的 Files API
- OpenAI GPT-5.6 Sol 输入降价 20%、输出降价 33%，促销价至少持续到 11 月 21 日
- OpenAI API 支持按单个请求选择数据处理区域
- Google DeepMind 回顾 15 年游戏 AI 研究，并宣布与 EVE Online 开发商 Fenris Creations 合作
- Google Research 发布多智能体生物标志物发现框架 Biomarker Discovery Framework
- Google Research 推出 ME-POIs，用移动性数据增强语言模型对地点的理解

## 重点动态

### DeepSeek 发布 V4-Flash-Vision-Exp 并上线 Files API

DeepSeek 于 8 月 21 日在 API 平台上线 V4-Flash-Vision-Exp。该模型在文本能力上与 V4-Flash 持平，同时支持图像输入，官方称其多模态智能体性能接近 Opus-4.8。开发者可通过 `deepseek-v4-flash-vision-exp` 调用，图片按最多 384 token/张计费，沿用 V4-Flash 价格。

同日，DeepSeek Files API 也正式上线，可免费上传图片并通过 `file_id` 多次引用，减少重复上传带宽。DeepSeek Harness 0.1.1 已同步支持新模型。这标志着 DeepSeek 在视觉模型和文件管理两条产品线上同时补齐。

### OpenAI GPT-5.6 Sol 降价 20%-33%

OpenAI 在 8 月 21 日的 API changelog 中调整 GPT-5.6 Sol 价格。输入从原价降至每百万 token 4 美元，输出降至每百万 token 20 美元，分别降低 20% 和 33%。新价格以促销形式提供，至少持续到 2026 年 11 月 21 日。

这是 GPT-5.6 家族发布后的又一次价格调整。对已在生产环境使用 Sol 的企业而言，输出成本下降三分之一会直接改善高用量场景的单位经济性。价格下降也反映出推理成本持续优化的行业趋势。

### OpenAI API 支持按请求选择数据处理区域

OpenAI 同日宣布，API 客户可以为单个请求选择数据处理区域。该功能通过带前缀的域名实现，要求 API key 所在项目已启用 Global geography。现有数据保留控制、端点和模型支持要求仍然适用。

对企业客户而言，区域控制是合规流程中的关键选项。此前区域选择通常绑定在项目或组织级别，按请求粒度切换意味着更灵活的跨国部署。结合此前 Zero Data Retention 与 Private Safety Processing 的更新，OpenAI 正在围绕数据主权持续加码。

### Google DeepMind 回顾 15 年游戏 AI 并牵手 EVE Online

Google DeepMind 于 8 月 21 日发布长文，回顾从 Atari DQN、AlphaGo、AlphaStar 到 SIMA 的 15 年游戏 AI 研究。文章同时宣布与 Fenris Creations（原 CCP Games，EVE Online 开发商）达成新的研究合作，围绕 EVE Online、EVE Vanguard 和 EVE Frontier 探索持久世界中的 AI 智能体。

DeepMind 认为，EVE 的玩家驱动经济、长期联盟关系和持续演化的宇宙，是研究持续学习与长程记忆的理想环境。它也适合探索长周期规划和复杂多智能体动态。

合作先从离线沙盒开始，成熟后再考虑引入在线玩家环境。这延续了 DeepMind 用游戏作为 AI 能力试验场的路线。

### Google Research 发布多智能体生物标志物发现框架

Google Research 同日推出 Biomarker Discovery Framework。该系统通过多智能体流水线，从可穿戴设备传感器数据中迭代生成候选生物标志物。流水线还会进行统计验证和优先排序。它包含数据理解、假设生成、统计与机器学习分析、对抗性验证、文献推理和报告生成六个阶段。

研究团队在覆盖 9,279 人次观测的三个队列上测试。他们识别出 41 个心理健康候选标志物和 25 个代谢疾病候选标志物。

盲审专家评价中，该系统报告质量得分高于对比系统。它是唯一获得 "Accept" 或 "Minor Revision" 推荐的系统。这项工作强调，仅靠扩大模型规模不足以保证科学严谨性，结构化的智能体架构同样关键。

### Google Research 用移动性数据增强模型对地点的理解

同日，Google Research 还发布了 Mobility-Embedded POIs（ME-POIs）框架。它将地点的静态文本元数据与聚合匿名移动性模式结合。这种结合生成同时编码地点身份和功能节奏的向量表示。框架通过跨空间尺度传播访问量，从而缓解小商户数据稀疏问题。

在洛杉矶和休斯顿的实验中，ME-POIs 在多个下游任务上显著优于纯文本基线。访问意图预测提升 81.9%，价格等级分类提升 75.1%，繁忙程度估计提升 24.7%。该框架属于 Google Earth AI 的一部分，目标是让模型理解城市节律而非仅记忆地名。

## 为什么值得关注

本期最突出的主题是"多智能体与多模态正在进入更细分的落地场景"。DeepSeek 的视觉模型与 Files API 面向多模态 Agent。OpenAI 的价格与区域控制面向规模化企业部署。Google 三条研究线分别覆盖游戏智能体、生物医学发现和城市空间理解。

它们的共同点是：AI 不再只是生成答案，而是在特定领域中处理更复杂的结构化任务。这也说明研究节奏与产品节奏正在重叠。Google 一天内发布三项不同方向的研究，DeepSeek 同一天补齐视觉与文件能力。

对开发者而言，这意味着可选工具快速丰富。但这也意味着需要更谨慎地评估每个能力的稳定性与合规边界。

## 来源

- [官方] [DeepSeek API Docs — DeepSeek-V4-Flash-Vision-Exp Release](https://api-docs.deepseek.com/news/news260821)
- [官方] [OpenAI API Changelog — GPT-5.6 Sol 降价](https://platform.openai.com/docs/changelog)
- [官方] [OpenAI API Changelog — 按请求选择区域](https://platform.openai.com/docs/changelog)
- [官方] [Google DeepMind — From Atari to EVE Online: Building on 15 Years of AI Research in Games](https://deepmind.google/blog/from-atari-to-eve-online-building-on-15-years-of-ai-research-in-games/)
- [官方] [Google Research — An AI tool for prioritizing candidate biomarkers from wearable sensor data](https://research.google/blog/an-ai-tool-for-prioritizing-candidate-biomarkers-from-wearable-sensor-data/)
- [官方] [Google Research — How mobility gives language models a deeper understanding of place](https://research.google/blog/how-mobility-gives-language-models-a-deeper-understanding-of-place/)
