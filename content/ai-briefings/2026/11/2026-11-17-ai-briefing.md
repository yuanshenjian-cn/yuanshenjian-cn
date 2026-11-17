---
title: "2026-11-17 AI 简报：OpenAI 发布 GPT-6 Cyber；Anthropic 推出 Fable 5.2 与 Mythos 5.2"
date: "2026-11-17"
published: true
brief: "本期确认 6 件动态：OpenAI 发布网络安全模型 GPT-6 Cyber；Anthropic 发布 Fable 5.2 与 Mythos 5.2；Google 把 Gemini 4 Hydrogen 接入 Search；OpenAI 推出代理支付钱包 ChatGPT Wallet；Anthropic 启动 IPO 路演并披露发行条款；OpenAI 发布 Images 2.6。"
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
  - 模型
  - 网络安全
  - 代理支付
  - IPO
---

北京时间 11 月 2 日至 11 月 17 日，AI 厂商在能力开放上继续分层。OpenAI 与 Anthropic 各推新模型，并把高风险能力锁进审批名单。Google 把新模型装进搜索主入口，支付与资本市场也出现新动作。

> 覆盖说明：本期 coverage 为 degraded。xAI、Perplexity、Mistral 的官方页面请求失败；小米 MiMo、DeepSeek、MiniMax 的官网没有可核验的日期化条目。OpenAI 与 Gemini 的 API 变更日志读取不稳定，已改用各自厂商的官方正文与 RSS 补检。上述缺口不代表这些厂商本期无更新。

## 速览

- OpenAI 发布 GPT-6 Cyber，先向获批的 Daybreak Red 客户开放。
- Anthropic 发布 Fable 5.2 与 Mythos 5.2，按安全护栏分层开放。
- Google 把 Gemini 4 Hydrogen 接入 Search，称史上最大模型升级。
- OpenAI 推出 ChatGPT Wallet，让代理在逐笔授权后代为付款。
- Anthropic 启动 IPO 路演，披露发行价区间与挂牌代码。
- OpenAI 发布 Images 2.6，生成提速五成并支持 GIF 动画。

## 重点动态

### OpenAI 发布 GPT-6 Cyber，把漏洞挖掘代理交给获批防御者

OpenAI 于 11 月 5 日发布 GPT-6 Cyber，定位是网络安全研究代理。它能发现并验证可被利用的漏洞，同时尽量停在研究者划定的授权范围内。

访问采取审批制。模型初期通过 API 与 Codex，向部分获批的 Daybreak Red 客户开放。OpenAI 表示会逐步扩到全部 Daybreak Red 客户，并为关键基础设施防御者设了单独分组。

官方给出一组基准数字。ExploitGym 得分从上一代的 32.1% 升到 48.5%。模型在 Firefox 找出 81 个此前未知的高危漏洞，在 Linux 开发出 948 个可用利用。

在 Preparedness 框架下，它被列为网络安全 Critical，高于上一代的 High。模型没有公开定价。OpenAI 提到一项 10 亿美元的一线防御者补助计划，用来补贴政府组织与服务提供商等资源受限团队。

### Anthropic 发布 Fable 5.2 与 Mythos 5.2，双模型分层开放

Anthropic 于 11 月 9 日发布 Claude Fable 5.2 与 Claude Mythos 5.2。两者基于同一个底层模型，差别在安全护栏的松紧。官方称输出速度最高比上一代快 30%。

Fable 5.2 带较强的网络安全与生物安全护栏，面向所有用户。它已覆盖 AWS、Google Cloud 与 Azure 等平台。护栏会拦下多数高风险任务，被拦时由其他模型接管回答。

Mythos 5.2 放宽了部分网络与生物限制，只面向通过验证的机构。申请入口是 Cyber 与 Life Sciences 两套 Verification Programs。官方称它是网络安全工程能力最强的模型。

价格同步下调。标准模式为每百万 token 输入 8 美元、输出 40 美元。可选的 fast 模式把生成速度提高最多 2.5 倍，价格为输入 16 美元、输出 80 美元。

### Google 把 Gemini 4 Hydrogen 接入 Search，称史上最大模型升级

Google 于 11 月 12 日宣布，把 Gemini 4 Hydrogen 接入 Google Search。官方把它称为 Search 有史以来最大的一次模型升级，并在当日向全球所有用户开放。

升级集中在理解与呈现。Search 能处理更复杂、多部分、含拼写错误的问题，并按用户真实意图逐项回应。更强的推理让 query fan-out 同时围绕子主题发起查询。

用户会看到更多图片、结构化回答与比较表格。回答覆盖所有当前受支持的 AI Mode 语言，范围比"所有语言"更窄。官方没有给出性能提升百分比或基准分数。

Hydrogen 此前已作为独立模型出现。这次把它设为搜索默认底座，意味着 Gemini 的能力直接进入使用量最大的入口。效果仍取决于真实查询中的表现。

### OpenAI 推出 ChatGPT Wallet，让代理在授权后代为付款

OpenAI 于 11 月 13 日推出 ChatGPT Wallet，用于代理支付。它与 American Express、Chase、Mastercard 和 Visa 合作构建，目标是让代理付款时不接触用户的真实卡号。

机制上，用户先添加卡片，之后每笔购买都要审核商品、总额与所用卡，并用 Face ID 或指纹确认。批准后，支付网络生成一个 payment token 代替真实卡号完成扣款。

用户保留原卡片的积分与争议保护，商家仍与用户直接交易。入口初期放在 dots 中，让用户的 dot 代为完成购买。完全委托购买仍需设定额度与品类等参数，目前不是默认能力。

可用范围很窄。它只面向美国 18 岁以上、持有合格美国发行卡片的 ChatGPT Pro 用户，且标注为小范围推出。部分网站的风控可能误拦代理支付，OpenAI 称正与商家和银行协商解决。

### Anthropic 启动 IPO 路演，披露发行价区间与挂牌代码

Anthropic 于 11 月 10 日启动拟议首次公开发行的路演，发行的是 A 类普通股。这比 10 月递交 S-1 时更进一步，首次给出具体的发行条款。

公司拟发行 8.25 亿股 A 类普通股。其中 801,351,354 股由 Anthropic 发行，23,648,646 股由部分现有股东出售，出售所得不归公司。承销商还有 30 天期权，可增购最多 1.2375 亿股。

发行价预计在每股 70 至 78 美元之间。公司已申请在纳斯达克全球精选市场挂牌，代码 ANT。这些数字都来自官方公告，公告没有给出公司估值。

公告同时强调交易前提。相关注册声明已递交美国证交会，但尚未生效，生效前不得销售或接受购买要约。这份公告本身也不构成销售要约。

### OpenAI 发布 Images 2.6，生成提速五成并支持 GIF 动画

OpenAI 于 11 月 4 日发布 Images 2.6，覆盖 ChatGPT、Codex 与 API。官方称生成速度比上一代提升 50%。在 quality 设为 low 时，Flare 模型最快 6 秒出图。

新版本支持把静态图做成 GIF 动画，用于品牌吉祥物、社媒表情或产品循环展示。官方称简单草图也能变成可用角色，不必先有精细设计稿。

编辑能力也做了加强。角色、产品与品牌细节在多次编辑中更容易保持一致。API 新增 image markup，可指定修改位置，同时支持 SVG 导出，以及控制规划量的 complexity 参数。

API 提供 Flare 与 Sunburst 两个模型。Flare 偏速度和专业排版，Sunburst 在中高画质下追求更高细节与一致性。两者已全球开放给所有订阅层级。官方未列具体价格，只给出定价页链接。

## 为什么值得关注

这一期的主线仍是能力分层。OpenAI 用审批制开放 GPT-6 Cyber，Anthropic 用护栏把 Fable 与 Mythos 分开。模型不再是单一入口，而是按风险和对象切成不同版本。分发方式正在成为产品本身的一部分。

另一条线是入口之争。Google 把新模型直接装进 Search，OpenAI 把支付装进代理。谁控制了入口，谁就决定能力被谁用、怎么用。资本市场也在同步推进，Anthropic 的路演把前沿模型的商业化推到新阶段。

对开发者而言，选择标准在变。能力之外，还要看访问门槛、护栏、价格与可部署性。本期六条动态共同指向一个判断：模型能力仍重要，但开放范围和落地机制正变得同样关键。

## 来源

- [官方] [OpenAI — GPT-6 Cyber: Advancing the frontier of aligned cybersecurity agents](https://openai.com/index/introducing-gpt-6-cyber)
- [官方] [Anthropic — Introducing Claude Fable 5.2 and Claude Mythos 5.2](https://www.anthropic.com/news/claude-fable-and-mythos-5-2)
- [官方] [Google — Google Search gets a major upgrade with Gemini 4 Hydrogen](https://blog.google/products-and-platforms/products/search/gemini-4-hydrogen-search-upgrade/)
- [官方] [OpenAI — Introducing ChatGPT Wallet](https://openai.com/index/introducing-chatgpt-wallet)
- [官方] [Anthropic — Anthropic launches roadshow for proposed initial public offering](https://www.anthropic.com/news/roadshow-launch)
- [官方] [OpenAI — Introducing Images 2.6](https://openai.com/index/introducing-images-2-6)
