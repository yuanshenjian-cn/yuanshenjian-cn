---
title: "AI 每日简报 · 2026-04-24"
date: "2026-04-24"
brief: "DeepSeek 发布 V4 系列模型，以 MIT 许可开源 1.6T 参数 MoE 架构；Google 宣布最高 400 亿美元投资 Anthropic，配套 5GW TPU 算力。"
published: true
tags:
  - AI每日简报
  - DeepSeek
  - Google
  - Anthropic
---

4 月 24 日，AI 行业在模型开源和资本配置两个维度同时释放重量级信号。DeepSeek 以典型的低调方式发布 V4 系列模型，Google 则以史上最大单笔 AI 投资巩固与 Anthropic 的战略合作。

## 速览

- DeepSeek 发布 V4-Pro 和 V4-Flash 两个模型，均采用 MoE 架构，上下文窗口默认为 100 万 token。
- Google 宣布向 Anthropic 投资最高 400 亿美元，其中 100 亿美元为即时到账，300 亿美元为业绩挂钩追加。
- DeepSeek V4 系列采用 MIT 开源许可，模型权重同步发布于 HuggingFace 和 ModelScope。
- Anthropic 投后估值约 3500 亿美元，Google 配套提供 5GW 专属 TPU 算力。
- DeepSeek V4-Pro 在 Codeforces 评分中达到 3206 分，API 定价不足 GPT-5.5 的十分之一。

## 重点动态

### DeepSeek

DeepSeek 在 4 月 24 日发布 V4 系列预览版，包含 V4-Pro 和 V4-Flash 两个模型。V4-Pro 总参数量 1.6 万亿、每 token 激活 490 亿参数，V4-Flash 总参数量 2840 亿、每 token 激活 130 亿参数。两者均基于混合专家架构，默认上下文窗口为 100 万 token，单次最大输出长度 38.4 万 token。V4-Pro 本地部署需要约 865GB 存储空间，V4-Flash 约 160GB。

V4 系列采用混合精度 FP4 加 FP8 训练，架构上引入 Hybrid Attention 机制，结合 CSA 和 HCA 两种注意力方式。模型采用 MIT 许可完全开源，权重同步上架 HuggingFace 和 ModelScope。API 保持对 OpenAI 和 Anthropic 格式的双重兼容，支持 Thinking、Non-thinking 和 Max 三种推理模式。定价方面，V4-Pro 缓存命中输入仅为每百万 token 0.003625 美元。官方同时宣布老版模型别名将于 7 月 24 日退役。

### Google 与 Anthropic

Google 在 4 月 24 日宣布向 Anthropic 投资最高 400 亿美元，其中 100 亿美元即时到账，剩余 300 亿美元按业绩里程碑分阶段释放。Anthropic 投后估值约 3500 亿美元。

投资协议的核心条款包括 Google 向 Anthropic 提供 5GW 专属 TPU 算力，为期 5 年，涵盖最新一代 Ironwood TPU 芯片，总可用芯片数量高达 100 万颗。Anthropic 同时承诺未来 5 年在 Google Cloud 上的总支出不低于 2000 亿美元。加上 Amazon 此前承诺的约 5GW AWS 算力，Anthropic 目前拥有总计约 10GW 的跨云算力配置。

## 为什么值得关注

DeepSeek V4 的发布延续了该公司"技术先行、低调发布"的风格。没有新闻发布会，仅在 HuggingFace 和 API 文档中同步更新。1.6T 参数的 V4-Pro 以不足 GPT-5.5 十分之一的 API 定价提供可比的代码和推理能力，在 Codeforces 评分中达到 3206 分。这种"性能接近、成本碾压"的策略正在重新定义开源模型对闭源巨头的竞争逻辑。

Google 400 亿美元投资 Anthropic 则标志着 AI 产业资本集中度达到新高度。加上 Amazon 的 250 亿美元承诺，Anthropic 在两周内获得近 650 亿美元的新增资金。5GW 的 TPU 算力配置相当于旧金山大都会区夏季峰值用电负荷，这种量级的算力垄断正在将 AI 竞争从算法创新转向能源和芯片基础设施的军备竞赛。

对于开发者而言，DeepSeek V4 的双重 API 兼容意味着迁移成本几乎为零。只需修改模型名称参数即可从 GPT-5.5 或 Claude 切换过来，而成本下降至原来的十分之一以下。

## 来源

- [DeepSeek API Docs：Pricing](https://api-docs.deepseek.com/quick_start/pricing) `[官方]`
- [DeepSeek X：V4 Announcement](https://x.com/deepseek_ai/status/2047516922263285776) `[官方]`
- [HuggingFace：DeepSeek V4 Collection](https://huggingface.co/collections/deepseek-ai/deepseek-v4) `[官方]`
- [CNBC：Google to invest up to $40 billion in Anthropic](https://www.cnbc.com/2026/04/24/google-to-invest-up-to-40-billion-in-anthropic-as-search-giant-spreads-its-ai-bets.html) `[媒体报道]`
- [Computing：Anthropic commits $200bn to Google Cloud](https://www.computing.co.uk/news-analysis/2026/anthropic-commits-200bn-to-google-cloud) `[媒体报道]`
