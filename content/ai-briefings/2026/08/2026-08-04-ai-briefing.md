---
title: "AI 简报 · 2026-08-04"
date: "2026-08-04"
brief: "欧盟 AI 法案第 50 条透明度义务 8 月 2 日起正式生效，不合规面临最高 1500 万欧元或全球营业额 3% 罚款；阿里巴巴发布 2.4 万亿参数 Qwen3.8-Max，视觉评测全球第二，下周开放权重上线；OpenAI 公开第三代语音系统 GPT-Live 的实时工程架构。"
published: true
tags:
  - AI
  - OpenAI
  - Alibaba
  - 欧盟
  - 模型
  - 语音
  - 监管
---

本期覆盖缺口提示：xAI 官方新闻页面访问受限，窗口内亦无 xAI 相关事件。智谱官方新闻页重定向至 Z.ai 首页，无日期化事件列表，窗口内无新增可核验事件。其余重点厂商官方路径均检查合格。

## 速览

- 欧盟 AI 法案透明度条款 8 月 2 日生效，要求披露 AI 交互并标注 AI 生成内容，违规最高罚 1500 万欧元
- 阿里巴巴发布 Qwen3.8-Max，2.4 万亿参数、激活约 95B，视觉评测全球第二，下周开放权重上线
- OpenAI 公开第三代语音系统 GPT-Live 工程架构，用全双工语音模型替代回合制方案

## 重点动态

### 欧盟 AI 法案透明度义务 8 月 2 日生效

欧盟 AI 法案下的新透明度义务于 8 月 2 日起正式生效。据 The Verge 报道，提供者须在设计中告知用户正在与 AI 而非真人交互，除非情况显然可见。系统还须为合成音频、图像、视频与文本加入机器可读标记，以便自动识别生成或篡改内容。

部署方须为旨在以假乱真的 AI 生成内容添加明显标识。欧盟委员会同步发布官方透明度图标，平台可自愿采用。不合规企业将面临最高 1500 万欧元或全球营业额 3% 的罚款。8 月 2 日前已上线系统有 4 个月宽限期，至 12 月 2 日。

这是 AI 法案进入执行阶段的标志性节点。7 月 28 日，Meta 签署了 AI 生成内容透明度实践准则。本次法定义务生效后，规则从自愿签署进入强制约束。行业内披露口径与标识方式将进一步标准化，类似做法在 TikTok 等平台已先行落地。

### 阿里巴巴发布 Qwen3.8-Max

阿里巴巴于 8 月 3 日发布 Qwen3.8-Max，宣称是其最大、最强的模型。它采用混合专家架构，总参数 2.4 万亿、每次请求激活约 95B（950 亿）。上下文窗口达 100 万 token，支持文本、图像与视频多模态，规模直接对标月之暗面 Kimi K3。

据媒体报道，Qwen3.8-Max 在 Arena.AI 中文文本模型排行居首，视觉分析基准全球第二，仅落后于 Anthropic Claude Fable 5。权重将于下周通过阿里云 Model Studio 发布。

Anthropic 此前指责阿里对其模型进行大规模蒸馏，阿里方面否认相关指控。

此次发布延续 Qwen 开放权重路线，推动开源生态再次抬升水位。阿里不仅将新模型接入云端，还计划融入电商等自有业务。开源模型持续逼近闭源前沿，对定价与迭代节奏构成真实压力。

### OpenAI 公开 GPT-Live 语音系统架构

OpenAI 于 8 月 3 日发布工程文章，披露耗时约六个月构建的 GPT-Live 实时语音系统。核心是全双工前端语音模型，可同时收听与发言，取代此前依赖回合制的方案。需要更深推理或工具调用时，系统异步交给 GPT-5.5 处理，而不断开互动。

工程上团队用 Go 重写媒体前端与推理逻辑，帧交付的 p95 延迟追平旧系统 p50。新 WARP 协议把媒体连接握手从六次网络往返降至一次。当前 GPT-Live 已具备 ChatGPT Voice 基础，还支持控制电脑与协调智能体。

这套架构还计划支撑 GPT-Live API 与多设备场景，向更多应用开放实时连续的语音能力。语音交互正从一问一答的回合制走向更自然的连续对话，对语音产品带来新的架构拐点。WARP 与状态推理等成果也有望在更大范围复用，降低实时语音系统的落地成本。

## 为什么值得关注

本周线索有三条。欧盟透明度条款从自愿转向强制执行，监管门槛全面抬高的趋势愈发明显。

中国开源模型以万亿参数级别继续靠近前沿。围绕蒸馏的公开争论，放大了开源与安全之间的张力。

语音交互由回合制转向全双工实时，正改变模型互动与产品形态。

监管、开源与交互范式三重变化相互交织。合规要求在平台产品源头内化知情义务。开源竞赛抬高整体水位，也让能力安全边界问题更受关注。语音与代理类无障碍交互正在更贴近大众，其取舍将影响未来一到两年人类与模型交互的方式。

## 来源

- [媒体报道] [The Verge — Europe's AI labeling and transparency rules are now in effect](https://www.theverge.com/ai-artificial-intelligence/974571/eu-ai-act-transparency-labels-rules-deepfakes)
- [媒体报道] [The Verge — China's Alibaba takes another swipe at America's AI supremacy](https://www.theverge.com/ai-artificial-intelligence/974342/alibaba-qwen-max-open-weight-ai)
- [媒体报道] [TNW — Alibaba unveils Qwen3.8-Max, its most capable model, closing on Moonshot in size](https://thenextweb.com/news/alibaba-qwen38-max-most-capable-model)
- [官方] [OpenAI — How we built a realtime system for responsive voice AI in six months](https://openai.com/index/continuous-voice-interaction-with-gpt-live)