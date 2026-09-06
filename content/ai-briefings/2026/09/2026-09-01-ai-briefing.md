---
title: 2026-09-01 AI 简报：OpenAI 为 Astra 加强网络安全防护；Anthropic 推出企业安全方案；Google 推 TimesFM-3
date: "2026-09-01"
published: true
brief: 本期聚焦 4 件官方动态：OpenAI 公布 Astra 的关键网络安全能力与发布前防护，并为 ChatGPT for Healthcare 接入 EHR 和公共医疗数据；Anthropic 推出 Enterprise Frontier Safeguards；Google Research 发布 TimesFM-3 多变量时间序列基础模型。
tags:
  - AI
  - OpenAI
  - Anthropic
  - Google
  - 网络安全
  - 企业安全
  - 医疗 AI
  - 时间序列
---

## 速览

- OpenAI 表示 Astra 达到 Critical 网络安全能力门槛，并加强发布前防护。
- ChatGPT for Healthcare 接入 Epic 电子病历与九类官方公共医疗数据。
- Anthropic 推出 Enterprise Frontier Safeguards，兼顾企业隐私与滥用检测。
- Google Research 发布 TimesFM-3，支持多变量零样本时间序列预测。

> 覆盖说明：本期 OpenAI、Anthropic、Google 和 Meta 等官方路径完成核验。xAI 官方新闻页返回 403，窗口内动态因此未能独立确认。Meta 官方 Feed 检查成功，但未发现窗口内入选事件。

## 重点动态

### OpenAI 公布 Astra 的关键网络安全能力与发布前防护

OpenAI 于 9 月 1 日公布 Astra 的最新安全评估。官方表示，Astra 达到 Preparedness Framework 的 Critical 网络安全能力门槛。这意味着模型在具备工具和权限时，能够发现未知漏洞。它还可以在没有人逐步指导的情况下形成攻击链。

官方称，Astra 是 OpenAI 首个达到该门槛的模型。公司因此延后部分开发与发布工作。同时增加拒答训练、滥用检测、对齐评估和生产监控。文章还称，Astra 在一项网络安全拒答评测中的拒答率为 91.5%。

Astra 计划很快开放，但最先进的网络安全能力不会立即全面可用。首批访问对象是小范围测试者，Daybreak Blue 随后扩大防御性使用。更强的安全检查也可能暂停或阻止部分正常任务。

### ChatGPT for Healthcare 接入 EHR 与公共医疗数据

OpenAI 于 9 月 1 日宣布更新 ChatGPT for Healthcare。产品新增 Epic 电子病历集成。获得授权的医疗团队可以在 ChatGPT 中查看患者病历上下文。他们还可以梳理就诊记录、检验结果、用药变化和后续事项。

同时上线的 Healthcare Public Data 插件连接九类官方公共医疗数据源。覆盖范围包括 PubMed、DailyMed、ClinicalTrials.gov、CMS Coverage 和 RxNorm。团队可以按记录、字段、标识符与版本检索信息。

这次更新把患者上下文、医学证据和公共医疗数据放进同一受治理工作区。官方披露，医生在 27 个临床用例中评估了 4363 条结果。其中 99.1% 被评为安全。个人账户的 EHR 集成仍不开放。

### Anthropic 推出 Enterprise Frontier Safeguards

Anthropic 同日推出 Enterprise Frontier Safeguards。该方案把客户数据存放在客户控制的云基础设施中。同时使用自动化系统检测跨会话和跨账户的严重滥用信号。

EFS 面向需要零数据保留的受监管企业。触发风险信号后，数据与告警直接交给客户团队处理。Anthropic 不要求其员工进行人工复核，客户可以自行控制存储、加密密钥、访问策略和审计日志。

方案将从今年秋季开始分阶段推出。支持 Claude Code、Claude Enterprise 和 Claude Platform。也支持 Amazon Bedrock、Google Agent Platform 与 Microsoft Foundry。Anthropic 表示，EFS 不额外收取费用，但客户云服务商仍会收取存储和数据传输费用。

### Google Research 发布 TimesFM-3 多变量时间序列基础模型

Google Research 页面标注 8 月 31 日发布 TimesFM-3。按北京时间计入本期窗口。新模型原生支持多变量零样本预测。它可以同时预测多个相关序列，并利用历史协变量和已知未来事件。

TimesFM-3 包含 3.3 亿参数，预训练语料超过 1 万亿个时间点。模型通过交替的时间注意力与变量注意力捕捉跨序列关系。它还在一次前向传播中生成完整预测区间，减少自回归误差累积。

官方在 Gift-Eval、FEV-Bench 和 Time 三个公开基准上评测。TimesFM-3 在点预测和概率预测的平均排名均居预训练基础模型之首。模型已发布到 GitHub 和 Hugging Face，BigQuery 集成计划后续上线。

## 为什么值得关注

本期动态显示，前沿模型的能力扩张正在与更细的访问控制同步推进。OpenAI 把 Astra 的网络安全能力直接纳入发布门槛。Anthropic 则把企业安全设计放到产品架构中。

企业部署的竞争也从模型效果延伸到数据治理。Anthropic 的 EFS 将客户自有存储、密钥与人工复核权放在方案中心。OpenAI 的医疗更新则把受权限控制的病历上下文和公共数据连接到同一工作流。

Google 的 TimesFM-3 代表另一条路径。基础模型不再只服务文本和图像，也开始直接处理带有外部变量的业务时间序列。模型能力、数据边界和部署责任，正在成为同一产品决策的三个部分。

## 来源

- [官方] [OpenAI — Path to Astra: critical capabilities and frontier safeguards](https://openai.com/index/path-to-astra)
- [官方] [OpenAI — Healthcare organizations can now connect EHR and additional industry data to ChatGPT](https://openai.com/index/chatgpt-connects-health-records-and-healthcare-sources)
- [官方] [Anthropic — Developing Enterprise Frontier Safeguards with our customers](https://www.anthropic.com/news/enterprise-frontier-safeguards)
- [官方] [Google Research — TimesFM-3: A zero-shot foundation model for multivariate forecasting](https://research.google/blog/timesfm-3-a-zero-shot-foundation-model-for-multivariate-forecasting/)
