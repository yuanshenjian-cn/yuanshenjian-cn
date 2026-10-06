---
title: "2026-10-06 AI 简报：OpenAI 为欧盟文本加水印并测试视觉广告；特朗普宣布 Super Intelligence Force"
date: "2026-10-06"
published: true
brief: "本期确认 5 件动态：OpenAI 为欧盟文本输出添加隐形水印，并测试图片生成结果旁的视觉广告；特朗普宣布 Super Intelligence Force。"
tags:
  - AI
  - OpenAI
  - 政策
  - 广告
  - Agent
  - Google
  - Wikimedia
---

10 月 4 日至 5 日（当地时间），合规与商业化同日压向 OpenAI，政策与安全侧出现机构化动作。本期确认五件动态，覆盖文本水印、广告形态、政策机构与 Agent 行为成本。

> 覆盖说明：本期 coverage 为 degraded。MiniMax 官方新闻页重定向至未登记域名且无日期化条目，未能完成合格官方检查。OpenAI 官网文章页 403、API changelog 证书校验失败，官方动态改由官方 News RSS 与 SDK Release Feed 确认。Perplexity changelog 仅到月份粒度。Reflection Beam 相关报道因确认链不满足，本期未入选。上述缺口不等于厂商无更新。

## 速览

- OpenAI 为 ChatGPT 与 Codex 的欧盟文本输出添加 textGrain 隐形水印。
- OpenAI 测试在图片生成结果旁展示视觉广告，本月起在美国面向免费用户。
- 特朗普宣布 Super Intelligence Force，由国家情报总监 Jay Clayton 牵头。
- 据报道，Wikimedia 指 OpenAI Agent 异常请求或与 5 月部分宕机相关。
- 据报道，Google 因 AI 生成提交激增冻结开源漏洞赏金计划。

## 重点动态

### OpenAI 为欧盟文本输出添加隐形水印

OpenAI 于当地时间 10 月 5 日公布欧盟文本溯源方案。ChatGPT 与 Codex 的合资格文本输出将加入 textGrain 隐形水印，以落实欧盟 AI 法案的透明度义务。公司同步说明了水印的技术与使用边界。

该水印并非全球默认配置，API 用户可自行选择启用。OpenAI 同时提示水印不保证可靠检测，编辑文本也可能降低其可识别性。对下游应用而言，合规要求从监管条文落到了具体输出层。

### OpenAI 测试图片生成结果旁的视觉广告

OpenAI 同日发布面向 AI 使用方式的广告方案。视觉广告将出现在图片生成结果旁，与模型的独立回答分区展示。官方同时推出配套的衡量工具，首批广告来自合作广告主的产品与服务。

新格式本月起在美国测试，先面向免费用户开放。TechCrunch 与 The Verge 均确认其与 9 月的广告主工具属于不同层面。商业化正从广告主后台推进到用户界面本身。

### 特朗普正式宣布 Super Intelligence Force

据 TechCrunch 报道，特朗普于当地时间 10 月 4 日宣布 Super Intelligence Force。该白宫 AI 工作组由国家情报总监 Jay Clayton 牵头。成员名单与职责范围一并公布，人事安排此前一天已由 WSJ 率先披露。

Reuters 援引报道称，工作组需在 120 天内提交 AI 风险报告。9 月 30 日的行政令统一了联邦文件的 Super Intelligence 表述。本期动作标志着该议程进入机构化阶段，报告需回应公众与业界此前的风险关切。

### Wikimedia 指 OpenAI Agent 异常请求或涉 5 月宕机

据媒体报道，Wikimedia Foundation 于 10 月 5 日披露 OpenAI Agent 的异常活动。该基金会运营着维基百科等全球头部开放知识项目。相关 Agent 曾向其基础设施发出数百万次 API 请求，部分行为被标记为 rogue bots。

基金会认为，这些活动可能与 5 月一次数据服务的部分中断相关。OpenAI 表示正在核查相关发现，但未确认与宕机的直接关联。无论归因是否成立，Agent 请求的规模治理已被提上日程，Agent 的外部成本正由公共平台承担。

### Google 因 AI 提交激增冻结开源漏洞赏金计划

据 TechCrunch 10 月 4 日报道，Google 已冻结其开源漏洞赏金计划。该计划用于收集其开源生态中的漏洞报告。官方将冻结归因于 AI 生成提交的显著增加，自动化报告挤占了人工评审资源。

赏金计划依赖人工评审，而 AI 大幅降低了生成报告的边际成本。两者相遇时，漏洞披露生态的筛选成本被显著抬高。对防御方而言，信号噪声比成了新问题，人工评审的产能成为稀缺资源。

## 为什么值得关注

监管与商业化在同一周压向同一家公司。水印是 OpenAI 对欧盟文本溯源义务的正式回应，广告则把免费用户的使用量转化为收入入口。两者共同划定 ChatGPT 未来的产品边界。

Agent 的运行成本开始外溢给平台以外的世界。Wikimedia 的归因披露与 Google 的赏金冻结指向同一现象：AI 流量与 AI 生成内容正在抬高公共基础设施的负担。这类成本过去由爬虫协议与robots条款消化，现在需要新的分配方式。

## 来源

- [官方] [OpenAI — Our approach to EU text provenance rules](https://openai.com/index/eu-text-provenance)
- [媒体报道] [TechCrunch — OpenAI will start watermarking ChatGPT's text in the EU](https://techcrunch.com/2026/10/05/openai-will-start-watermarking-chatgpts-text-in-the-eu/)
- [媒体报道] [The Verge — OpenAI is adding text watermarking in ChatGPT and Codex](https://www.theverge.com/ai-artificial-intelligence/1004880/openai-chatgpt-text-watermarks-eu-ai-act)
- [官方] [OpenAI — Building advertising for the way people use AI](https://openai.com/index/new-chatgpt-ads-format-and-measurement)
- [媒体报道] [TechCrunch — OpenAI launches visual ads that appear alongside image generation results](https://techcrunch.com/2026/10/05/openai-launches-visual-ads-that-appear-alongside-image-generation-results/)
- [媒体报道] [The Verge — OpenAI is sticking more ads in ChatGPT](https://www.theverge.com/ai-artificial-intelligence/1004655/openai-chatgpt-visual-ads)
- [媒体报道] [TechCrunch — Trump unveils his new Super Intelligence Force](https://techcrunch.com/2026/10/04/trump-unveils-his-new-super-intelligence-force/)
- [媒体报道] [Reuters — Trump names intelligence chief Clayton as AI czar, to head task force, deliver report in 120 days](https://www.reuters.com/world/us/jay-clayton-lead-trumps-ai-task-force-deliver-report-120-days-wsj-reports-2026-10-03/)
- [媒体报道] [The Verge — Wikipedia operator says OpenAI's 'rogue' bots may be linked to a May outage](https://www.theverge.com/news/1004929/wikipedia-openai-rogue-bots-wikimedia-foundation-outage)
- [媒体报道] [Reuters — Wikipedia operator says OpenAI's rogue agents possibly tied to data service](https://www.reuters.com/technology/wikipedia-operator-says-openais-rogue-agents-possibly-tied-data-service-2026-10-05/)
- [媒体报道] [TechCrunch — Google froze its open source bug bounty program due to a 'significant rise' in AI submissions](https://techcrunch.com/2026/10/04/google-froze-its-open-source-bug-bounty-program-due-to-a-significant-rise-in-ai-submissions/)
