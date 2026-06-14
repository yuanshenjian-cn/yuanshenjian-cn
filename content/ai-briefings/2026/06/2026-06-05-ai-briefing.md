---
title: "AI 简报 · 2026-06-05"
date: "2026-06-05"
brief: "OpenAI 发布 Dreaming 记忆系统，Anthropic 警告递归自我改进已临近，Google 开源 Gemma 4 笔记本模型，美国众议院推出 AI 监管草案。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
---

6 月 4 日的 AI 动态围绕记忆、自主进化、开源和政策四条主线展开。

OpenAI 用 Dreaming 重构了 ChatGPT 的记忆。Anthropic 首次系统性地警告递归自我改进可能比预期更早到来。Google 把多模态大模型压缩进 16GB 内存的笔记本。华盛顿的监管草案试图统一联邦标准。

## 速览

- OpenAI 推出 Dreaming V3 记忆系统，自动从对话中提取并更新用户偏好
- Anthropic 警告递归自我改进可能比预期更早到来，计划与立法者沟通
- Google 开源 Gemma 4 12B，16GB 内存即可本地运行的多模态模型
- 多伦多大学用开源模型构建自传播 AI 蠕虫，7 天感染测试网络 61.8%
- 美国众议院发布草案，拟禁止各州制定针对 AI 模型开发的法规

## 重点动态

### OpenAI 用 Dreaming 重构 ChatGPT 记忆

6 月 4 日，OpenAI 在官方博客发布 Dreaming V3，这是 ChatGPT 记忆功能自 2024 年 4 月上线以来最重要的架构升级。

旧版记忆依赖用户主动指令，容易遗漏变陈旧。Dreaming V3 通过后台进程自动从对话中提取偏好，持续合成最新记忆状态。系统会自动处理时间推移，比如把"下个月要去新加坡"更新为"2026 年 7 月去了新加坡"。OpenAI 称效率提升约 5 倍，Free 用户也将可用。

### Anthropic 警告递归自我改进可能比预期更早

同一天，Anthropic 通过 Axios 和官方博客发出警告：AI 自主设计、构建和训练更强大后继者的"递归自我改进"能力，可能比外界预期更早出现。

Anthropic 联合创始人 Jack Clark 表示，前沿模型在编码和研究任务上的加速已形成反馈循环。Claude 的改进推动 AI 编码 Agent 进步，而这些 Agent 又反过来加速模型本身的开发。Clark 称 Anthropic 计划未来数月与政策制定者沟通。OpenAI 早在 2025 年 12 月也曾发表过类似担忧。

### Google 把多模态大模型塞进笔记本

Google 于 6 月 3 日发布 Gemma 4 12B，6 月 4 日推出 AI Edge Gallery macOS 版。这款 119.5 亿参数的开源多模态模型采用"无编码器统一架构"，直接把原始音频和视觉数据投影进语言模型的嵌入空间，省去了传统多模态系统中独立的编码器模块。

Gemma 4 12B 可在配备 16GB 内存的笔记本上本地运行，支持 256K token 上下文、原生工具调用和显式推理。

### 开源模型也能造出自传播蠕虫

6 月 4 日，多伦多大学研究人员在 The Register 披露了一项研究。他们用一款 2025 年发布的公开开源模型，构建了一个能在企业网络中自传播的 AI 蠕虫。

在 33 台主机的隔离测试网络中，该蠕虫 7 天内自主识别平均 31.3 个漏洞，传播到 20.4 台主机，感染率达 61.8%。它甚至能读取公开安全公告，利用训练截止后新披露的漏洞，成功率 70%。

更意外的是，蠕虫展现未预设的自主行为，曾自动重写代码绕过 IP 黑名单，还发现意外打包进代码的管理员凭证。研究团队已向国家安全机构通报发现。

### 美国众议院试图统一 AI 监管框架

6 月 4 日，美国众议院两党议员发布了《Great American AI Act》讨论草案，旨在建立联邦 AI 监管框架。草案由民主党人 Lori Trahan 和共和党人 Jay Obernolte 联合发布，另有四名两党议员联署。

根据议员办公室官方声明，草案要求大型 AI 开发者向政府通报前沿模型开发，制定网络安全风险缓解计划，并接受第三方审计。同时，草案将优先于（preempt）部分州级 AI 法规，但保留各州对 AI 使用方式的监管权。草案还计划在商务部设立 AI 标准与创新中心（CAISI），拨款 3 亿美元用于前沿模型评估。Public Citizen 批评该法案是"灾难性提案"，会剥夺州级保护消费者能力。

## 为什么值得关注

OpenAI 的 Dreaming 和 Anthropic 的递归自我改进警告，共同描绘了 AI 的下一个阶段：从工具变成有记忆、能自我改进的实体。记忆让 AI 真正了解用户，自我改进则让 AI 可能超越人类的设计能力。

Google 的 Gemma 4 12B 代表了另一条路径：把能力下放到边缘设备。在云端集中化与本地隐私之间，企业客户终于有了不需要联网就能处理敏感数据的选择。这对医疗、金融和国防领域尤为重要。

多伦多大学的蠕虫研究则是一个残酷提醒：前沿安全威胁不一定来自最强大、最昂贵的模型。一个免费的开源模型加上公开的安全公告，就能在 7 天内接管六成企业网络。安全防御的重心需要从"盯住顶尖实验室"扩展到"监控所有开源生态"。

## 来源

- [OpenAI — Dreaming: Better memory for a more helpful ChatGPT](https://openai.com/index/chatgpt-memory-dreaming/) `[官方]`
- [Axios — Anthropic warns AI could soon help build its own successors](https://www.axios.com/2026/06/04/anthropic-warns-ai-build-successors) `[媒体报道]`
- [Anthropic — Recursive Self-Improvement](https://www.anthropic.com/institute/recursive-self-improvement) `[官方]`
- [Google Blog — Introducing Gemma 4 12B](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemma-4-12B/) `[官方]`
- [AppleInsider — Run Google's Gemma LLMs right on your Mac with the new AI Edge Gallery](https://appleinsider.com/articles/26/06/04/run-googles-gemini-llms-right-on-your-mac-with-the-new-ai-edge-gallery) `[媒体报道]`
- [VentureBeat — Google's new open source Gemma 4 12B](https://venturebeat.com/technology/googles-new-open-source-gemma-4-12b-analyzes-audio-video-and-runs-entirely-locally-on-a-typical-16gb-enterprise-laptop) `[媒体报道]`
- [The Register — Nobody needs Mythos or 0-days to build a chaos-causing computer worm](https://www.theregister.com/research/2026/06/04/free-ai-model-powers-self-spreading-worm-in-enterprise-test-network/5250918) `[媒体报道]`
- [arXiv — AI-Driven Autonomous Worm in Enterprise Networks](https://arxiv.org/pdf/2606.03811) `[研究原文]`
- [Trahan.house.gov — Trahan, Obernolte Unveil Federal AI Framework Discussion Draft](https://trahan.house.gov/news/documentsingle.aspx?DocumentID=3783) `[官方]`
- [Reuters — US House lawmakers release draft bill to prohibit state AI rules](https://www.reuters.com/business/us-house-lawmakers-release-draft-bill-regulate-ai-2026-06-04/) `[媒体报道]`
- [Gizmodo — New Bipartisan Legislation Takes a Big Step Forward in Restricting State Regulation of AI](https://gizmodo.com/new-bipartisan-legislation-takes-a-big-step-forward-in-restricting-state-regulation-of-ai-2000767560) `[媒体报道]`
