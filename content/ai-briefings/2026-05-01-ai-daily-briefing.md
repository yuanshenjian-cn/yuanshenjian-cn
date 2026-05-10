---
title: "AI 每日简报 · 2026-05-01"
date: "2026-05-01"
brief: "xAI 发布 Grok 4.3 推理模型与语音克隆套件，Meta 收购机器人初创公司 ARI，Anthropic 拓展 Claude 创意工具生态，Mistral 与 DeepSeek 在开源赛道持续施压。"
published: true
tags:
  - AI每日简报
  - xAI
  - Meta
  - Anthropic
  - Mistral
---

4 月 30 日到 5 月 1 日，AI 厂商在产品迭代和战略布局上同时发力。xAI 把 Grok 4.3 推上 API 并附带语音克隆功能；Meta 通过收购 ARI 正式加码人形机器人；Anthropic 将 Claude 接入创意生产管线；Mistral 和 DeepSeek 则在开源侧继续挤压闭源模型的定价空间。

## 速览

- xAI 正式发布 Grok 4.3，API 输入价格降至 $1.25/百万 token，输出 $2.50/百万 token，上下文窗口扩至 100 万 token。
- xAI 推出 Custom Voices 语音克隆套件，允许开发者用 120 秒参考音频克隆语音。
- Meta 收购圣地亚哥机器人 AI 初创公司 Assured Robot Intelligence（ARI），团队整体并入 Meta Superintelligence Labs。
- Anthropic 更新 Claude for Creative Work，支持直接连接 Adobe、Blender、Autodesk Fusion、Ableton 等创意工具。
- Mistral Medium 3.5 支持 256K 上下文。
- Alibaba Qwen3.6 27B 在开源排行榜登顶。
- DeepSeek V4 Preview 采用华为 Ascend 芯片训练。
- PyPI 和 npm 出现大规模恶意包投毒。
- Anthropic 推出针对代码库的安全扫描工具，可自动检测依赖项中的已知漏洞。
- Cursor 同步上线安全扫描功能。

## 重点动态

### xAI

xAI 在 5 月 1 日通过 VentureBeat 正式公布 Grok 4.3 的完整 API 形态。相比 Grok 4.2，输入价格降低约 40% 至 $1.25/百万 token，输出价格降低约 60% 至 $2.50/百万 token，上下文窗口从 25.6 万扩至 100 万 token。

模型采用 always-on reasoning 架构，每个查询都会先进行链式思考，在 GDPval-AA agentic 基准测试中获得 Elo 1500 分，超过 Gemini 3.1 Pro 和 GPT-5.4 mini。输出速度约 207 token/秒，知识截止日期为 2025 年 12 月。

同步上线的 Custom Voices 允许开发者用 120 秒参考音频克隆语音，定价 $3/小时。此外，Grok 4.3 首次支持原生视频输入、内置代码执行环境，以及直接在对话中生成 PPT 幻灯片。

### Meta

Meta 在 5 月 1 日宣布收购 ARI，一家专注于人形机器人基础模型的圣地亚哥初创公司。ARI 的联合创始人 Xiaolong Wang、Lerrel Pinto 和 Xuxin Cheng 将带领约 20 人的团队整体加入 Meta Superintelligence Labs。

Meta 的战略并非直接生产人形机器人硬件，而是打造一个开放的软件平台，类似于智能手机时代的 Android，向硬件制造商授权机器人智能。这一路线与特斯拉自研 Optimus、Figure AI 背靠微软和 OpenAI 的模式形成鲜明对比。

Meta CTO Andrew Bosworth 在内部沟通中强调，当前人形机器人的核心瓶颈在软件而非硬件。这距离亚马逊 3 月收购 Fauna Robotics 仅过去两个月，大厂在物理 AI 领域的竞争明显升温。据 Goldman Sachs 预测，人形机器人市场规模将从目前的约 20 亿美元增长至 2035 年的 380 亿美元。

### Anthropic

Anthropic 在 4 月 30 日更新 Claude for Creative Work，把 Claude 直接接入 Adobe、Blender、Autodesk Fusion、Ableton、Splice、SketchUp 等主流创意工具。这标志着 Claude 从文档和编码场景向创意生产管线的正式扩展。

同一天，Bloomberg 报道称 Anthropic 正在酝酿新一轮融资，估值可能突破 9000 亿美元。

### 开源与中国侧

5 月 1 日前后，开源模型阵营密集释放更新。Mistral Medium 3.5 将上下文扩展至 256K，在代码生成和推理任务上表现接近 Claude Sonnet 4.5；Alibaba 的 Qwen3.6 27B 在多个开源排行榜登顶，成为当前最具竞争力的中等规模开源模型之一。

DeepSeek V4 Preview 以 MoE 架构、1.6 万亿参数和华为 Ascend 950 芯片训练为卖点，API 输入定价 $0.145/百万 token，输出 $0.28/百万 token。

AMD 同步发布 Ryzen 395 Box 和 Halo Box，针对端侧 AI 推理的内存带宽瓶颈进行优化。

与此同时，PyPI 和 npm 出现大规模恶意包投毒事件，攻击者利用 AI 生成的代码片段传播后门。Anthropic 和 Cursor 快速上线了针对代码库的安全扫描功能，可自动检测依赖项中的已知漏洞。

## 为什么值得关注

xAI 用激进定价把 Grok 4.3 推入"低价前沿模型"区间，直接对打中国开源模型的成本优势。

Meta 收购 ARI 则表明，在 GPT-5.5 和 Claude Opus 4.7 争夺数字智能的同时，物理智能正在成为下一个战略高地。Anthropic 向创意工具的延伸，以及开源模型在上下文长度和推理成本上的持续突破，意味着模型层的竞争已经从"谁更聪明"扩散到"谁更能嵌入具体工作流"。

安全方面，PyPI 和 npm 的投毒事件揭示了 AI 代码生成工具在提升效率的同时也可能被利用来加速攻击，厂商同步推出安全扫描是对这一风险的快速响应。

短期内开发者最先感受到的是 Grok 4.3 的 API 降价和语音克隆能力，以及开源模型在本地部署时的成本优势。

## 来源

- [VentureBeat：xAI launches Grok 4.3 at an aggressively low price and a new, fast, powerful voice cloning suite](https://venturebeat.com/technology/xai-launches-grok-4-3-at-an-aggressively-low-price-and-a-new-fast-powerful-voice-cloning-suite/) `[媒体报道]`
- [TechCrunch：Meta buys robotics startup to bolster its humanoid AI ambitions](https://techcrunch.com/2026/05/01/meta-buys-robotics-startup-to-bolster-its-humanoid-ai-ambitions/) `[媒体报道]`
- [Bloomberg：Anthropic Unveils AI Agents to Field Financial Services Tasks](https://www.bloomberg.com/news/articles/2026-05-05/anthropic-unveils-ai-agents-to-field-financial-services-tasks) `[媒体报道]`
- [LinkedIn：AI Newsflash, April 27 to May 3, 2026](https://www.linkedin.com/pulse/ai-newsflash-april-27-may-3-2026-openais-idea-guy-metas-mendiratta-dqizc) `[媒体报道]`
- [ghacks：DeepSeek Releases V4 Models With 9.5x Lower Memory Requirements and Huawei Ascend Support](https://www.ghacks.net/2026/04/26/deepseek-releases-v4-models-with-9-5x-lower-memory-requirements-and-huawei-ascend-support/) `[媒体报道]`
