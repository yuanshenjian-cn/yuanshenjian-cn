---
title: "2026-10-20 AI 简报：Amazon 发布 TorchNeuron；据报道 Anthropic 再签巨额算力协议"
date: "2026-10-20"
published: true
brief: "本期确认 5 件动态：OpenAI 改进低资源编程语言编码；Perplexity 上线 Ultrafast Computer 档与 Decisions API；Amazon 发布 TorchNeuron；据报道 Tenstorrent 以 62 亿美元估值继续融资；据报道 Anthropic 与 Nscale 接近再签 450 亿美元算力协议。"
tags:
  - AI
  - Amazon
  - Anthropic
  - OpenAI
  - Perplexity
  - 芯片
  - 算力
  - API
---

北京时间 10 月 19 日至 20 日，AI 行业的重心同时压在基础设施与开发者接口两端。Amazon 把 PyTorch 带向自家芯片，Tenstorrent 与 Nscale 的资金故事继续膨胀。模型与产品厂商则在编码评估和代理工具上补齐细节。

> 覆盖说明：本期 coverage 为 degraded。xAI 官方新闻页被 Cloudflare 拦截、站点地图无内容，官方路径本期未完成合格检查，缺口不代表 xAI 本期无更新。智谱官方新闻页为 JS 渲染无法提取条目，z.ai 博客页返回空页，同样未完成合格官方检查。Google DeepMind 与 Google Research 的 Feed 请求失败，Google 主博客与官方 Feed 检查正常。

## 速览

- OpenAI 改进低资源编程语言编码，新增软件工程、SQLite 与 COBOL 迁移评估。
- Perplexity 上线 Ultrafast Computer 模型档、Decisions API 与按角色的 connector 访问控制。
- Amazon 发布 TorchNeuron，现有 PyTorch 代码几乎无需修改即可在 Trainium 芯片上运行。
- 据报道 Tenstorrent 以 62 亿美元估值继续融资，CEO 称将保持独立。
- 据报道 Anthropic 与 Nscale 接近再签一笔 450 亿美元算力协议。

## 重点动态

### OpenAI 改进低资源编程语言编码

OpenAI 于当地时间 10 月 19 日发布研究博客，介绍 ChatGPT 在低资源编程语言上的改进。官方称，工作重点是把主流语言上的编码能力延伸到更小众的语言。新评估覆盖软件工程、SQLite 与 COBOL 迁移三类场景。

官方未公布具体基准数字，只说明新增三组评估，用于检验模型在这些场景的表现。这类评估补上了低资源语言长期缺少的衡量标尺。对维护老系统的团队来说，这是一条值得跟进的信号。

低资源语言的改进通常进不了发布会，却能决定长尾场景的可用性。COBOL 一类老语言仍支撑着大量关键系统。若 ChatGPT 能稳定覆盖这类语言，中小团队维护旧代码的成本有望下降。

### Perplexity 上线 Ultrafast 档与 Decisions API

Perplexity 于 10 月 19 日更新 changelog，Computer 产品新增 Ultrafast 模型档。官方在条目中标注，网页版 Computer 可为 GPT-6 Astra 选择 Ultrafast 档位，主打更快速度。整条更新被官方概括为更快的选择、内容分类与权限控制三件事。

同批上线的还有 Decisions API。开发者可用它对内容做分类与评分，把判断类任务交给接口处理。connector 的访问控制也改为按角色生效，权限管理粒度更细。这类接口把内容治理从应用层下沉到了服务层。

这批更新都指向企业化。速度档位、内容判定接口与权限粒度，是代理产品进入公司内网的三件套。Perplexity 正在把消费级搜索能力改造成可治理的工作台。

### Amazon 发布 TorchNeuron

Amazon 于 10 月 19 日发布 TorchNeuron 开发工具。开发者现有的 PyTorch 代码几乎无需修改，就能在 AWS Trainium 芯片上运行。路透社称，这让 Amazon 的 AI 芯片兼容了主流编程语言框架。TechCrunch 把它称作 Amazon 对 Nvidia 的最大一击。

此前 Trainium 的主要障碍在软件生态，模型代码迁移需要额外工程投入。TorchNeuron 直接瞄准这一摩擦点。对已在用 PyTorch 的团队来说，试错成本从迁移工程变成了配置工作。

训练与推理是 AI 公司最大的开支项之一，硬件选择直接影响成本结构。TorchNeuron 移除了试用的主要摩擦点，Trainium 的潜在客户面会明显扩大。自研芯片的回报周期也会随之缩短。

### Tenstorrent 以 62 亿美元估值继续融资

据报道，AI 芯片公司 Tenstorrent 新一轮融资估值达到 62 亿美元。TechCrunch 援引 Bloomberg 的采访披露了这一数字。公司计划用新资金扩展面向开放权重模型与视频生成的服务芯片。Cadence、Fidelity 与 SanDisk 等机构参与了本轮投资。

CEO Jim Keller 对 Bloomberg 表示，公司决定保持独立并继续融资。他给出的依据是 Tenstorrent 的 Galaxy 服务器可以运行 DeepSeek 模型。在 Tenstorrent 看来，这足以证明硬件的实用性。对外部观察者而言，这也是一条罕见的能力背书。

在 Nvidia 主导的市场里，开放权重芯片是少数派路线。Tenstorrent 选择不出售、不站队，把可运行主流开源模型作为核心卖点。这一轮估值，是对该路线的最新一次定价。

### 据报道 Anthropic 与 Nscale 接近再签 450 亿美元协议

据报道，Anthropic 与 AI 基础设施商 Nscale 接近宣布第二笔 450 亿美元算力协议。Bloomberg 引述知情人士称，谈判仍在进行，细节可能变化、尚未敲定。这将是 Anthropic 近期最大的一笔基础设施支出之一。

一个多月前，双方刚宣布过一笔同为 450 亿美元的算力协议。算力支出接连刷新，让部分投资者担忧行业的投入产出比。Anthropic 仍在推进这类合作，认为投入最终会得到回报。

两家公司目前都在筹备 IPO。Anthropic 预计年内上市；Bloomberg 周一报道，Nscale 的 300 亿美元目标估值遭到投资者阻力。新协议若落地，会成为双方上市叙事的重要筹码。算力订单的节奏，已经与上市进程绑在一起。

## 为什么值得关注

五条动态看似分散，资金这条线贯穿始终。Nscale 的 450 亿、Tenstorrent 的 62 亿与 Amazon 的芯片攻势指向同一问题。三笔钱都押在同一个瓶颈上。算力需求持续上涨时，谁供应下一批芯片与数据中心。

开发者接口这条线同样清晰。OpenAI 给小众语言立标尺，Perplexity 开放判断接口，Amazon 拆掉迁移门槛。对使用者来说，这些变化的体感会先于模型升级到来。工具面的竞争节奏正在加快。

## 来源

- [官方] [OpenAI — Advancing coding in low-resource programming languages](https://openai.com/index/low-resource-programming-languages)
- [官方] [Perplexity — Changelog](https://www.perplexity.ai/changelog)
- [媒体报道] [Reuters — Amazon says its AI chips will work with popular coding language challenging Nvidia](https://www.reuters.com/business/retail-consumer/amazon-says-its-ai-chips-will-work-with-popular-coding-language-challenging-2026-10-19/)
- [媒体报道] [The Next Web — Amazon's TorchNeuron lets PyTorch code run on AWS Trainium chips](https://thenextweb.com/news/amazon-torchneuron-pytorch-trainium)
- [媒体报道] [TechCrunch — Amazon is taking its biggest shot at Nvidia yet with new TorchNeuron dev tool](https://techcrunch.com/2026/10/19/amazon-is-taking-its-biggest-shot-at-nvidia-yet-with-new-torchneuron-dev-tool/)
- [媒体报道] [TechCrunch — Tenstorrent hits $6.2B valuation to scale open-weight AI chips](https://techcrunch.com/2026/10/19/tenstorrent-hits-6-2b-valuation-to-scale-open-weight-ai-chips/)
- [媒体报道] [TechCrunch — Nscale and Anthropic are reportedly in talks for yet another $45 billion compute deal](https://techcrunch.com/2026/10/19/nscale-and-anthropic-are-reportedly-in-talks-for-yet-another-45-billion-compute-deal/)
