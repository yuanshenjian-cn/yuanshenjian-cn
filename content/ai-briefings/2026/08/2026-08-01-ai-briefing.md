---
title: "AI 简报 · 2026-08-01"
date: "2026-08-01"
brief: "Google 在 Google Earth 上线的 AI 图像生成功能一天内被撤回；DeepSeek 发布 V4-Flash 正式版公开测试；MiniMax 发布全模态生成模型 H3 并计划开源；智谱 GLM Coding Plan 恢复开放订阅；OpenAI 披露封禁柬埔寨诈骗网络账号。"
published: true
tags:
  - AI
  - Google
  - DeepSeek
  - MiniMax
  - 智谱
  - OpenAI
  - 模型
  - 安全
---

过去 24 小时，中美厂商加速开放模型能力，Google 则在地图产品上经历快速发布与撤回。本期覆盖缺口提示：xAI 官方新闻页面访问受限。经搜索补检确认，窗口内无其官方事件。其余重点厂商官方路径均检查合格。

## 速览

- Google 在 Google Earth 上线的 AI 图像生成功能一天内被撤回，此前被指可制造误导性卫星影像
- DeepSeek 发布 V4-Flash 正式版（V4-Flash-0731）公开测试，支持 Responses API 并适配 Codex
- MiniMax 发布全模态生成模型 H3，视频生成定价 0.8 元/秒，权重近期开源
- 智谱 GLM Coding Plan 恢复开放订阅，此前因 AI 编程需求激增限售
- OpenAI 披露封禁柬埔寨诈骗网络大量账号，涉投资、婚恋与冒充执法诈骗

## 重点动态

### Google 撤下刚上线的 Google Earth AI 图像生成功能

Google 于 7 月 30 日在 Google Earth 网页端上线图像生成功能。用户可以用文本提示词修改卫星影像，底层模型为 Nano Banana 2。这是生成式图像首次直接集成进卫星影像产品，此前该能力主要用于照片编辑与艺术创作。

功能上线次日即遭批评。有研究者生成了美墨边境难民营地、加沙医院炸弹坑等影像。7 月 31 日，Google 宣布回滚该功能，称将加强护栏后再考虑恢复。官方强调生成图像带 AI 生成水印，且不会出现在主地图体验中。

卫星影像长期被记者与研究者视为可靠证据来源。本次快速撤回表明，图像生成进入高信任场景后，事实性约束正在成为产品门槛。Google 未给出恢复功能的时间表。

### DeepSeek 发布 V4-Flash 正式版公开测试

DeepSeek 于 7 月 31 日将 V4-Flash 正式版投入公开测试，版本号为 V4-Flash-0731。调用方式不变，模型名仍为 deepseek-v4-flash。新版本与预览版保持相同架构与规模，仅做了再后训练，重点增强智能体能力。

原生支持 Responses API 格式，并适配 Codex 工作流。本次更新仅涉及 V4-Flash API，V4-Pro 与 APP/WEB 端模型不受影响。媒体报道其 Terminal Bench 2.1 得分 82.7、DeepSWE 54.4。Flash 定价维持低位，兼容 OpenAI 生态是它切入编码智能体市场的策略。

### MiniMax 发布全模态生成模型 H3

MiniMax 于 7 月 31 日发布 H3，定位通用全模态生成模型。它可以统一理解文本、图像、视频与声音构成的多模态上下文。模型能输出原生双声道音视频，最高支持 15 秒 2K 分辨率。

自研高压缩 Tokenizer 有效降低了推理成本，也改善了训练与部署效率。视频生成定价为 0.8 元/秒（2K）。权重计划在未来几天内开放，企业可本地部署。

这是 MiniMax 首款开源的多模态生成模型。此前已开源三代 M 系列文本模型。H3 意味着开源策略从文本扩展到多模态，有望扩大生态并降低使用成本。

### 智谱 GLM Coding Plan 恢复开放订阅

智谱于 7 月 31 日宣布，GLM Coding Plan 恢复开放订阅。此前因 AI 编程需求爆发，名额曾阶段性限售。套餐支持 GLM-5.2、GLM-5-Turbo 与 GLM-4.7 三个模型，覆盖从轻量级到旗舰级的多个选择，适配不同强度的使用需求。

订阅服务可接入 Claude Code、OpenClaw、OpenCode 等主流编程工具。据第一财经报道，智谱已落地 1GW 级国产 AI 算力数据中心，全部采用国产 AI 芯片。算力扩容是本次恢复订阅的前提，此前限售反映 AI 编程需求强劲。

### OpenAI 披露封禁柬埔寨诈骗网络

OpenAI 披露，今年早些时候封禁了一个柬埔寨诈骗网络的大量账号。该网络据信位于波贝一带，与公开报道中的诈骗园区位置吻合。运营者用 ChatGPT 生成虚假人设、翻译诈骗消息。

诈骗类型涵盖投资、婚恋、赌博与冒充执法部门等。部分内容与人口贩卖及强迫劳动迹象相关。OpenAI 称无法独立核实每个人的处境，但已注意到相关线索。

公司还指出，诈骗人员本身也可能是剥削受害者。OpenAI 已将威胁情报共享给行业伙伴与相关执法机构，并采取措施阻止这些账号重新注册。

## 为什么值得关注

本期中国厂商动作集中在开放与降价。DeepSeek 以低价兼容现有生态，MiniMax 首次开源多模态模型，智谱用国产算力支撑订阅放量。三者的共同点是降低使用门槛、争夺开发者。

谷歌则在地图产品上经历快速发布与撤回。生成式 AI 进入高信任场景后，事实性与可信度约束正在成为产品设计的必修课。这次案例为行业提供了新的参照。

## 来源

- [媒体报道] [TechCrunch — Google nixes its Earth AI feature one day after launch, amid criticism it would spread misinformation](https://techcrunch.com/2026/07/31/google-nixes-its-earth-ai-feature-one-day-after-launch-amid-criticism-it-would-spread-misinformation/)
- [媒体报道] [The Verge — Google Earth's AI deepfake tool only lasted one day](https://www.theverge.com/tech/973943/google-earth-ai-image-generation-deepfake-tool)
- [官方] [DeepSeek API Docs — Change Log: DeepSeek-V4-Flash Update](https://api-docs.deepseek.com/updates/)
- [媒体报道] [TechNode — DeepSeek puts V4-Flash API into public beta](https://technode.com/2026/07/31/deepseek-puts-v4-flash-api-into-public-beta/)
- [官方] [MiniMax — MiniMax H3：打破任务和模态的边界](https://www.minimaxi.com/blog/minimax-h3)
- [媒体报道] [新京报 — 新一代多模态生成模型MiniMax H3发布并开源，0.8元/秒](https://www.bjnews.com.cn/detail/1785474644129260.html)
- [官方] [智谱开放平台 — GLM Coding Plan](https://www.bigmodel.cn/glm-coding)
- [媒体报道] [36氪 — 扩建算力数据中心后，智谱GLM Coding Plan开放订阅](https://36kr.com/newsflashes/3918863627988358)
- [官方] [OpenAI — Disrupting a Criminal Scam Operation](https://openai.com/index/disrupting-malicious-uses-of-ai-criminal-scam-operation)
