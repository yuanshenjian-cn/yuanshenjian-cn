---
title: "AI 简报 · 2026-07-08"
date: "2026-07-08"
brief: "Anthropic 把 Claude Cowork 推上手机与网页，Meta 用 Muse Image 把 Instagram 用户拉进 AI 照片，DeepSeek 被曝自研推理芯片，北京酝酿限制海外访问中国顶级 AI 模型。"
published: true
tags:
  - AI
  - Anthropic
  - Meta
  - DeepSeek
---

7 月 7 日，AI 厂商把战线拉到"谁能接管工作流"与"谁能在芯片和监管两端自立"。Anthropic 把 Claude Cowork 推上手机，Meta 让 Muse Image @ 出 Instagram 熟人。DeepSeek 被曝自研推理芯片，北京酝酿限制海外访问中国顶级模型，OpenAI 安全团队继续出血。

## 速览

- Anthropic 把 Claude Cowork 扩展到 web 与移动端，agent 可云端后台跨设备接续
- Meta 发布超级智能实验室首个图像模型 Muse Image，可在 prompt 中 @ mention Instagram 账号
- DeepSeek 被曝自研 AI 推理芯片，减少对 Nvidia 与华为依赖
- 中国商务部与阿里、字节、Z.ai 开会，讨论限制海外访问中国最先进 AI 模型
- OpenAI 首席未来学家 Achiam 通知同事本月离职，任职近九年
- Perplexity 确认使用 Nvidia 新 CPU Vera，称其在 agent 编码上比传统 CPU 快 1.5 倍

## 重点动态

### Anthropic 让 Claude Cowork 跨设备跑起来

7 月 7 日，Anthropic 把 Claude Cowork 从桌面扩展到 web 与移动端，面向 Max 订阅用户。这次更新让用户能在桌面开工、手机看进度、笔记本合上后由云端继续跑。Anthropic 同步发布使用数据：5 月最后两周 120 万匿名会话中，业务流程运营占 33.4%，软件开发仅占 8.7%。

Anthropic 给出的例子是早上六点设定客户准备任务，Cowork 夜里梳理邮件、录音与新闻，生成简报并留好跟进草稿。OpenAI 的 Codex 也在向非开发者扩展，两家都押注谁占有工作界面谁就赢。

### Meta 让 Muse Image @ 出你认识的人

7 月 7 日，Meta 发布超级智能实验室首个图像模型 Muse Image，已接入 Meta AI app、Instagram 与 WhatsApp。模型是 agentic 的，与 Muse Spark 大模型协作，会先推理 prompt、搜索网页、规划再生成。最引人注目的是 @ mention：用户在 prompt 中 @ 其他 Instagram 账号，模型用其公开照片构建视觉。

Muse Image 还能按 Facebook Marketplace 图片重新设计房间，或在照片上直接涂改后分享。Meta 同时筹备 Muse Video，由 Alexandr Wang 牵头的超级智能实验室正把 Muse 家族从图像扩展到视频。

### DeepSeek 被曝自研推理芯片

7 月 7 日，Reuters 独家报道 DeepSeek 正在自研 AI 芯片，专为推理设计而非训练。三位知情人士称项目约一年前启动，近期加大芯片设计工程师招聘。芯片旨在减少对 Nvidia 与华为的依赖，DeepSeek 此前用 H800 训练 R1，后转向华为 Ascend。

但自研芯片需数年与大量资本，且美国出口管制限制中国获取先进制程与高带宽内存。6 月 DeepSeek 刚完成 70 亿美元首轮融资，估值 520 亿至 590 亿美元，这是从模型突破走向硬件自主的重大转向。

### 北京酝酿限制海外访问中国 AI 模型

7 月 7 日，Reuters 独家报道中国商务部过去一个月与阿里、字节、Z.ai 开会，讨论限制海外访问中国最先进 AI 模型，含未发布版本。官员提出将 AI 泄露或窃取列入国安法，并可能限制外资投资国内 AI 创业公司。

据 Reuters 报道，中方担心 Anthropic Mythos 5 被用于攻击中国，此前已要求 Meta 撤销对 Manus 的 20 亿美元收购。最高法院期刊曾提出分级开源方案：基础工具备案、先进技术过安全审查、最敏感前沿模型限国内使用。

### OpenAI 首席未来学家 Achiam 离职

7 月 7 日，WIRED 报道 OpenAI 首席未来学家 Joshua Achiam 通知同事本月离职，任职近九年。他曾领导 2024 年成立的"使命对齐团队"，该团队今年 2 月解散后他转任首席未来学家。Achiam 是安全派最新一位出走高管，此前 Jan Leike、Miles Brundage 等相继离开。

据 WIRED，Achiam 曾在 Musk 诉 Altman 案出庭作证，当庭质疑马斯克搞 AGI 会牺牲安全。前白宫 AI 顾问 Dean Ball 同期入职 OpenAI 任战略未来负责人，将与 Achiam 短暂交接。

### Perplexity 押注 Nvidia 新 CPU

7 月 7 日，Perplexity 确认计划使用 Nvidia 新 CPU Vera。副总裁 Nate Kupp 称其在 agent 编码任务上比传统 CPU 快约 1.5 倍，几乎为核心工作负载量身定做。Nvidia 预计本财年末从 Vera 获得 200 亿美元收入，切入 Intel 与 AMD 主导的 CPU 市场。

Nvidia 此前披露 OpenAI、Anthropic、Oracle 也计划使用 Vera。AI agent 不像人类会休息，对 CPU 需求是持续满载，这给了 Nvidia 以 agent 工作负载切入传统 CPU 市场的机会。

## 为什么值得关注

六条动态指向同一趋势：AI 竞争正从"谁的模型更强"转向"谁让能力跑进工作流，同时握住算力与监管主动权"。Cowork 上手机、Muse Image @ 出熟人，是 agent 接管日常工作的形态，工作界面正取代跑分成为新战场。DeepSeek 自研芯片与北京限制出海，让中美 AI 互防走向双向封锁。OpenAI 安全团队持续出血，则说明能力越强，对齐人才流失代价越高。

## 来源

- [TechCrunch — Claude Cowork expands to mobile and web](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/) `[媒体报道]`
- [The Verge — Anthropic is launching Claude Cowork on mobile and web](https://www.theverge.com/ai-artificial-intelligence/961978/anthropic-claude-cowork-mobile-web) `[媒体报道]`
- [NBC News — Anthropic will make Claude Cowork available to users via the cloud](https://www.nbcnews.com/tech/tech-news/anthropic-will-make-claude-cowork-available-users-cloud-rcna353218) `[媒体报道]`
- [Anthropic — Claude Cowork](https://claude.com/product/cowork) `[官方]`
- [The Verge — Meta's new Muse Image model can pull other Instagram users into AI photos](https://www.theverge.com/tech/962485/meta-muse-image-ai-model-instagram) `[媒体报道]`
- [Reuters — Meta expands generative AI tools with Muse Image rollout](https://www.reuters.com/technology/meta-expands-generative-ai-tools-with-muse-image-rollout-2026-07-07/) `[媒体报道]`
- [Meta — Introducing Muse Image](https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/) `[官方]`
- [Reuters — China's DeepSeek developing its own AI chip, sources say](https://www.reuters.com/world/china/chinas-deepseek-developing-its-own-ai-chip-sources-say-2026-07-07/) `[媒体报道]`
- [Reuters — Beijing is looking at curbing overseas access to China's top AI models, sources say](https://www.reuters.com/world/beijing-is-looking-curbing-overseas-access-chinas-top-ai-models-sources-say-2026-07-07/) `[媒体报道]`
- [WIRED — OpenAI's Chief Futurist Is Leaving the Company](https://www.wired.com/story/openai-chief-futurist-joshua-achiam-is-leaving-the-company/) `[媒体报道]`
- [Reuters — Perplexity says it plans to use Nvidia's new CPU](https://www.reuters.com/business/perplexity-says-it-plans-use-nvidias-new-cpu-2026-07-07/) `[媒体报道]`
