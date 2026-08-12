---
title: "AI 简报 · 2026-08-12"
date: "2026-08-12"
brief: "Gemini 应用月活突破 10 亿；OpenAI 广告测试扩展至 5 国并让 Daybreak 上线 AWS；Anthropic 公布文本与图片水印方案；Google AMIE 实现实时视频问诊。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
  - Mistral
---

本期覆盖缺口提示：DeepSeek 新闻页重定向回文档首页。智谱与 MiniMax 新闻页没有带日期的条目。三家厂商窗口内动态无法日期化核验。xAI 八月条目缺少精确日期。本期 coverage 结论为 degraded。

## 速览

- Google：Gemini 应用月活突破 10 亿，成为公司增长最快产品
- OpenAI：ChatGPT 广告测试扩展至英国、墨西哥、巴西、日本与韩国
- OpenAI：Daybreak 网络安全模型上线 AWS Bedrock
- Anthropic：未发布 Claude 将黎曼假设零点下界提升至 67.2%
- Anthropic：承诺为生成内容加不可见水印与 C2PA 签名
- OpenAI：前 COO Brad Lightcap 离职创业
- Google：AMIE 医疗 AI 实现实时临床视频问诊
- Mistral：发布区域推理与开放模型托管方案

## 重点动态

### Gemini 应用月活突破 10 亿

Google CEO Pichai 8 月 11 日宣布，Gemini 应用月活用户突破 10 亿。这是 Google 旗下第 14 个 10 亿级产品，也是公司历史上增长最快的一个。ChatGPT 早已进入 10 亿俱乐部，AI 助手赛道正式进入双强格局。双方都已跨过亿级门槛，竞争转入留存与商业化阶段。

TechCrunch 补充了更多使用数据：63% 的用户通过语音与 Gemini 对话，Gemini 每天生成超过 1.5 亿张图片。语音正成为手机端 AI 助手的主要交互方式，占比远超多数人的预期。多模态输入已经写进了产品的默认路径。

### ChatGPT 广告测试扩展至 5 国

OpenAI 8 月 11 日宣布，ChatGPT 广告测试扩展至英国、墨西哥、巴西、日本与韩国，面向免费用户逐步放开。官方承诺广告会清晰标注，不干预答案内容，对话内容对广告主保密。

官方强调广告与回答相互独立，用户可以在设置中控制广告体验。免费模式的广告化是行业通行做法，OpenAI 的选择是把广告与隐私承诺绑定。对免费用户而言，需要留意广告密度与投放范围的变化。

### Daybreak 模型上线 AWS Bedrock

OpenAI 8 月 11 日宣布，Daybreak 网络安全模型已在 AWS Bedrock 上线。Daybreak 是 OpenAI 的 AI 网络防御计划，10 日刚完成扩展，并发布 GPT-5.6-Cyber 系列能力。企业现在可在 AWS 云环境内直接调用这批模型，无需搭建新的调用链路，也不必自建模型运维。

AWS 是企业安全场景的主流云平台。Bedrock 托管让安全团队能在现有 AWS 环境内使用前沿防御模型，无需单独对接 API。Daybreak 由此正式进入企业级安全基础设施，落地路径变得更短。

### Anthropic 未发布模型推进黎曼假设

Anthropic 8 月 10 日发布研究结果。未发布的研究版 Claude 把满足黎曼假设的 zeta 零点占比下界，从 41.6% 提升至 67.2%。结果由两位 Anthropic 数学家验证，并使用 Lean 完成了形式化证明。这一结果把已知下界大幅前推，也刷新了外部对 AI 数学能力的判断。

研究动用了约 60 个子代理，产生约 3100 万输出 token。黎曼假设是数学界最著名的未解问题之一，Claude 并未证明它，但把已知下界大幅前推。The Verge 与 TechCrunch 都把这一进展视为 AI 数学能力加速的标志。

### Anthropic 承诺文本与图片水印

Anthropic 8 月 11 日更新支持文档，承诺为 Claude 生成内容加入机器可读标记。文本会嵌入不可见水印，文件会附加 C2PA 签名元数据。方案覆盖 Claude 系列产品、Claude Code 与 API 通道。水印对人类不可见，但机器可以识别。

2026 年 8 月 2 日之后发布的新模型将自带这些标记，AWS、Google Cloud、Microsoft Foundry 等托管通道同步生效。这一动作对应欧盟 AI 法案的透明度要求，方向与监管预期一致。内容溯源正在从可选功能变成行业默认配置。

### OpenAI 前 COO Brad Lightcap 离职

OpenAI 前 COO、现特殊项目负责人 Brad Lightcap 8 月 11 日宣布离职，将创办新公司。他在 OpenAI 任职约八年，是任职最久的高管之一。内部备忘录中，他表示会从外部视角继续支持公司使命，细节以备忘录形式通知员工。

Lightcap 现职负责特殊项目，此前主导商业运营与多个关键合作，职位由 COO 转为侧重战略与伙伴关系。近半年 OpenAI 高管变动频繁，这是又一位核心成员离开。The Verge 确认其备忘录已在 X 上公开。

### Google AMIE 实现实时视频问诊

Google 研究团队 8 月 11 日公布 AMIE 最新进展。医疗 AI 系统实现了专家级视听临床咨询。它从文本与音频问诊扩展至实时视频对话，可观察患者的面部与动作线索，据此调整追问方向。

官方在 blog.google 与研究博客同步发布了细节。视频通道让模型可以结合视听觉线索评估患者状态，这是临床对话 AI 走向真实诊室的关键一步。医疗场景对准确率要求极高，距离落地仍有距离。

### Mistral 发布主权 AI 三件套

Mistral 8 月 11 日发布主权 AI 基础设施方案。区域推理端点覆盖欧洲与美国，推理数据不出区域，现已正式上线。优先服务等级以公开预览的形式提供，面向对稳定性有要求的客户。

平台开始托管第三方开放模型，首个为 Z.ai 的 GLM-5.2。Mistral 还组建欧洲企业联盟锁定长期算力承诺，目标 2030 年前建成 1GW 容量。这是欧洲 AI 主权叙事的一次集中落地，也给中小模型厂商提供了分发入口。

## 为什么值得关注

这一天出现了多个里程碑。Gemini 追平 ChatGPT 的 10 亿用户，广告进入更多市场，安全模型进入主流云。头部玩家的竞争正从模型能力，延伸到分发渠道与商业化节奏。规模与变现能力开始决定下一轮投入。

Anthropic 在数学与透明度上的动作，是另一条积累信任的路径。对开发者而言，AWS 与区域端点降低了前沿模型的接入成本。对用户而言，广告与水印正在成为 AI 服务的默认配置。

## 来源

- [官方] [https://openai.com/index/testing-ads-in-chatgpt](https://openai.com/index/testing-ads-in-chatgpt)
- [官方] [https://openai.com/index/daybreak-models-are-now-available-on-aws](https://openai.com/index/daybreak-models-are-now-available-on-aws)
- [官方] [https://www.anthropic.com/research/riemann-zeta](https://www.anthropic.com/research/riemann-zeta)
- [媒体报道] [https://techcrunch.com/2026/08/11/an-unreleased-anthropic-model-made-progress-on-one-of-maths-biggest-unsolved-problems/](https://techcrunch.com/2026/08/11/an-unreleased-anthropic-model-made-progress-on-one-of-maths-biggest-unsolved-problems/)
- [媒体报道] [https://www.theverge.com/ai-artificial-intelligence/977273/the-ai-takeover-of-mathematics-has-begun](https://www.theverge.com/ai-artificial-intelligence/977273/the-ai-takeover-of-mathematics-has-begun)
- [媒体报道] [https://www.theverge.com/ai-artificial-intelligence/977823/anthropic-claude-ai-watermarks-c2pa-text-images](https://www.theverge.com/ai-artificial-intelligence/977823/anthropic-claude-ai-watermarks-c2pa-text-images)
- [媒体报道] [https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/](https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/)
- [媒体报道] [https://techcrunch.com/2026/08/11/googles-gemini-app-surges-to-one-billion-users/](https://techcrunch.com/2026/08/11/googles-gemini-app-surges-to-one-billion-users/)
- [媒体报道] [https://www.theverge.com/ai-artificial-intelligence/978113/chatgpt-gemini-1-billion-users](https://www.theverge.com/ai-artificial-intelligence/978113/chatgpt-gemini-1-billion-users)
- [媒体报道] [https://techcrunch.com/2026/08/11/brad-lightcap-openais-longtime-coo-is-leaving-to-start-something-new/](https://techcrunch.com/2026/08/11/brad-lightcap-openais-longtime-coo-is-leaving-to-start-something-new/)
- [媒体报道] [https://www.theverge.com/ai-artificial-intelligence/978048/brad-lightcap-openai-executive-departure](https://www.theverge.com/ai-artificial-intelligence/978048/brad-lightcap-openai-executive-departure)
- [官方] [https://blog.google/innovation-and-ai/models-and-research/google-research/amie-video-consultations/](https://blog.google/innovation-and-ai/models-and-research/google-research/amie-video-consultations/)
- [官方] [https://research.google/blog/advancing-amie-towards-expert-level-audio-visual-clinical-consultations/](https://research.google/blog/advancing-amie-towards-expert-level-audio-visual-clinical-consultations/)
- [官方] [https://mistral.ai/news/regional-inference-open-models-new-compute/](https://mistral.ai/news/regional-inference-open-models-new-compute/)
