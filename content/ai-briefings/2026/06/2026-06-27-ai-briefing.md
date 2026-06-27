---
title: "AI 简报 · 2026-06-27"
date: "2026-06-27"
brief: "同一天，OpenAI GPT-5.6 被限速发布，Anthropic Mythos 5 被美国政府解封——前沿模型发布权已不在实验室手中。"
published: true
tags:
  - AI
  - OpenAI
  - Anthropic
---

6 月 26 日，美国政府对两大前沿实验室做出方向相反的动作。OpenAI 发布新一代 GPT-5.6 系列，却被要求仅向政府审批的少数伙伴开放。同日，商务部长致信 Anthropic，解除对 Mythos 5 长达两周的封锁。

一个被限速，一个被解封。前沿模型的发布权，已不再只掌握在实验室手里。

## 速览

- OpenAI 发布 GPT-5.6 系列（Sol/Terra/Luna），受政府要求仅向"可信伙伴"受限预览，官方称不应成为长期默认
- 美国商务部长 Lutnick 致信 Anthropic，解除 Mythos 5 出口管制，允许向 100+ 美国机构发布，Fable 5 也在走向解封
- GPT-5.6 Sol 定价 $5/$30，约为 Fable 5 一半，编码能力据称略优于 Mythos 5
- 中国 360 同日声称已开发出匹敌 Mythos 的国产工具

## 重点动态

### OpenAI 发布 GPT-5.6：受限预览下的三版本旗舰

6 月 26 日，OpenAI 发布 GPT-5.6 系列，含旗舰 Sol、均衡型 Terra 和低成本 Luna。新命名体系以数字标识代际、Sol/Terra/Luna 标识能力层级。定价为 Sol $5/$30、Terra $2.50/$15、Luna $1/$6（每百万 token），约为 Anthropic Fable 5 的一半。

Sol 引入 max 推理模式与协调子代理的 ultra 模式。OpenAI 称其在 Terminal-Bench 2.1 编码基准上创纪录，在 ExploitBench 上与 Mythos Preview 竞争力相当，仅用约三分之一输出 token。生物领域则在 GeneBench v1 上较 GPT-5.5 取得更强结果且用更少 token。

安全上，OpenAI 投入超 70 万 A100 等效 GPU 小时做自动化红队测试，安全栈直接内置于模型行为，且不跨越公司 Preparedness 框架的 Cyber Critical 阈值。新版本还引入更可预测的 prompt caching，支持显式缓存断点与 30 分钟最小缓存生命。Sol 还将于 7 月在 Cerebras 上以最高 750 tokens/秒上线。

但发布节奏不由 OpenAI 独自决定。应白宫要求，GPT-5.6 仅向"参与情况已报政府"的少数可信伙伴开放预览。OpenAI 在博客中表态："我们不认为这种政府访问流程应成为长期默认"，正与政府合作制定网络行政令框架与可复用的未来发布流程。

### 美国政府解除 Anthropic Mythos 5 封锁

6 月 26 日，Semafor 独家报道，美国商务部长 Howard Lutnick 当天下午致信 Anthropic 首席计算官 Tom Brown，宣布解除对 Claude Mythos 5 的出口管制。Anthropic 可向附件 A 名单上 100 余家美国机构及其外籍员工发布该模型，不再需要出口许可。

信件援引政府与公司每日密集谈判"取得重大进展"，Anthropic 承诺就模型协议、标准与发布与政府合作。两周前，政府因 Mythos 被指与中方关联伙伴走得太近而实施管制，导致 Mythos 5 与 Fable 5 双双下线。

信件对 Fable 5 保持沉默，但接近谈判的人士透露 Fable 5 也在走向解封，时间表尚不明确。欧洲官员对"何时能拿到模型"仍一无所知，对依赖华盛顿决策表达不满。商务部发言人 Kass 称"仅用两周就努力确保美国保持 AI 全球领导力并维护安全"。

而在监管博弈的另一侧，据 Insurance Journal 报道，中国网络安全公司 360 同日在 ISC.AI 2026 大会上声称已开发出匹敌 Mythos 的国产工具，创始人周鸿祎将美国模型定义为"中国不能缺少的战略网络能力"。若该声称属实，意味着 Mythos 被限的同时国产替代已在公开竞逐。

## 为什么值得关注

6 月 26 日可能是美国前沿模型监管框架成型的关键节点。同一天，OpenAI 新模型被限速发布，Anthropic 被封模型被解封——一收一放之间，政府而非实验室成为模型走向市场的最终裁决者。

Lutnick 的信件标志着一种新常态：前沿模型发布前需与政府谈判，获准后才能向"可信伙伴"开放。欧洲盟友的抱怨说明，这套框架的影响已外溢到美国本土之外。

OpenAI 在受限发布时公开表达不满，显示实验室与政府之间并非没有张力。与此同时，中国厂商也在公开竞逐同一赛道——360 声称已开发出匹敌 Mythos 的国产工具。

## 来源

- [OpenAI — Previewing GPT‑5.6 Sol: a next-generation model](https://openai.com/index/previewing-gpt-5-6-sol/) `[官方]`
- [TechCrunch — OpenAI limits GPT-5.6 rollout after government request, says restrictions shouldn't be the norm](https://techcrunch.com/2026/06/26/openai-limits-gpt-5-6-rollout-after-government-request-says-restrictions-shouldnt-be-the-norm/) `[媒体报道]`
- [The Verge — OpenAI unveils GPT-5.6 amid US AI regulatory drama](https://www.theverge.com/ai-artificial-intelligence/957845/openai-gpt-5-6-trump-administration-ai-preview) `[媒体报道]`
- [Axios — OpenAI releases powerful new GPT-5.6 model under restrictions](https://www.axios.com/2026/06/26/openai-gpt-sol-terra-luna-trump) `[媒体报道]`
- [Semafor — Exclusive / US releases powerful Anthropic model Mythos to some US companies](https://www.semafor.com/article/06/27/2026/us-releases-powerful-anthropic-model-mythos-to-some-us-companies) `[媒体报道]`
- [The Guardian — OpenAI staggers AI model release after Trump administration request](https://www.theguardian.com/technology/2026/jun/26/openai-ai-model-release-trump-us-sam-altman-gpt-anthropic-mythos) `[媒体报道]`
- [Insurance Journal — China's 360 Says it Has Developed Tools to Match Anthropic's Mythos](https://www.insurancejournal.com/news/international/2026/06/26/875418.htm) `[媒体报道]`
