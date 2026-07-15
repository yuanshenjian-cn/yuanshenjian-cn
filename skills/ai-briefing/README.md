# ai-briefing

`ai-briefing` 用于查询、起草和发布博客 AI 简报。默认只查询；明确要求“写/起草”才成稿，明确要求“发布/commit/push”才进入发布链路。

## 三种模式

- 查询：只回答，不落盘，不 commit，不 push。
- 成稿：返回 Markdown 草稿和审核摘要，不写入 `content/`。
- 发布：独立 reviewer 与确定性门禁全部通过后才允许发布。

`scripts/ai-briefing.sh` 还有一个外层编排模式：主 agent 只在 runDir 生成 `candidate.md` 和 agent 证据；独立 reviewer 通过后，由共享 `scripts/finalize-ai-briefing-run.sh` 独占正式晋升、Git 与远端验证。

## 所有模式都先采集

查询、成稿和普通发布不能只靠临时网页搜索。若外层未提供 `runDir`、`window.json` 和 `collection.json`，模式开始时必须创建被 Git 忽略的 `.local/ai-briefing/runs/<run-id>/`，先在一次 window CLI 调用中冻结 `issueDate/observedAt`，再采集 Feed：

```text
node scripts/ai-briefing-window.js --output <runDir>/window.json
node scripts/collect-ai-briefing-feeds.js --window-file <runDir>/window.json --output <runDir>/collection.json
```

显式指定日期时，window CLI 可附加 `--issue-date <date> --observed-at <iso>`。查询和成稿只可在 `.local` runDir 写证据，不写 `content/` 或 Git；普通发布完成相同初始化后才进入 finalizer。外层已提供窗口和采集结果时禁止重复计算或覆盖。

`scripts/ai-briefing.sh` 对 collector 另加默认 120 秒外层超时，可用 `AI_BRIEFING_COLLECTOR_TIMEOUT_SECONDS` 调整。

## 日期覆盖窗口

窗口策略是 `calendar-date-overlap`。`coverageStartDate` 包含上一篇 `published: true` 简报的北京时间发布日期，`coverageEndDate` 是本期日期；没有历史时从前一个自然日开始。精确 `observedAt` 只冻结运行并排除未来证据，不作为 coverage 下界。

日期级证据使用来源当地自然日区间与本期已发生 coverage 区间判断相交，不虚构精确时间。0 条确定事件时不创建正式简报；完整证据、`coverageConclusion: sufficient` 和 `verify-no-events` 全部通过后才能给出无事件结论。

## 候选采集

来源地址和确认策略以 `config/source-registry.json` 为程序真源。发现顺序是：

1. 官方 RSS/Atom、GitHub Release、Hugging Face。
2. 官方页面、changelog、release notes。
3. 按厂商和事件类型定向搜索。
4. 媒体 Feed 与权威媒体补漏。
5. 回溯原始源或双源确认。

路径状态支持 `success`、`checked-empty`、`degraded`、`failed` 和 `not-configured`。`checked-empty` 表示检查成功但没有相关候选。全量简报按重点厂商官方 primary 路径的配额得出 `coverageConclusion: sufficient/degraded/insufficient`；单厂商查询只评估用户指定 scope。覆盖降级可披露后发布其他已确认事件，但 `insufficient` 阻断成稿和发布，存在重点厂商缺口时不得返回 `no_events`。

## 事件与来源

确定性聚类先按 GUID、规范 URL、官方落地页合并，再由 agent 做有记录的语义复核。不同版本、价格、开放范围和弃用不能因为厂商相同而误合并。

来源标签固定为 `[官方]`、`[原始文件]`、`[媒体报道]`。媒体默认需要官方源或第二家独立 publisher；同一 publisher 的两个入口不算双源。媒体只有日期而无时间时不能确认正文事实。

## Markdown V2

从 `contentRulesV2EffectiveDate: 2026-07-15` 起：

- 一个事件对应一个速览 bullet、一个正文 `###`、一个同名来源分组。
- 次级确定事件可进入 `## 补充更新`。
- `## 为什么值得关注` 不参与事件计数。
- 0 条事件不发布，不拆事件凑数。

动态正文汉字数不含 `## 来源`。以下是 `recommendedMin`/`recommendedMax`，低于建议范围不自动失败；超过 `hardMax` 才由 validator 阻断：

| 事件数 | 建议范围 | `hardMax` |
|---:|---:|---:|
| 1 | 450~800 | 1200 |
| 2~3 | 750~1300 | 1800 |
| 4~6 | 1100~1800 | 2400 |
| 7+ | 1500~2200 | 3200 |

单事件稿可以省略没有独立洞察的 `## 为什么值得关注`。7 条以上允许按 `editorialPriority` 筛选公开事件，未公开候选必须在 `selection.json` 记录机器可读排除原因。

## 证据与 reviewer

运行证据保存在被 Git 忽略的 `.local/ai-briefing/runs/<run-id>/`，包括 `window.json`、`collection.json`、`discovery.json`、`selection.json`、`self-review.json`、`candidate.md`、主 agent 和 reviewer 原始结构化输出，以及 `verification.json`。

独立 reviewer 具有受限只读 WebFetch/WebSearch，禁止编辑和 Bash。它只访问 registry/证据包列出的 URL；approved 必须真实记录 `networkStatus`、已检查证据和高风险未核验项。

每个 candidate revision 只审核一轮；不是 `可进入发布门禁` 就立即停止。用户修改后创建新 revision/run，再运行一轮 reviewer。

## 发布成功条件

所有发布入口都调用 `scripts/finalize-ai-briefing-run.sh`，不得各自实现 Git 状态机。Finalizer 依次执行发布 preflight、证据/reviewer/candidate 校验、原子晋升、AI index 构建、精确 stage、commit diff-tree 文件集校验、push 后 fetch + merge-base 验证及工作区检查。

Reviewer、candidate 校验或 build 失败时不在正式目录遗留本轮文件。Push 已成功但后置验证失败时报告“已推送、远端验证状态未知”，不自动重复 push。

自动提交信息：

```text
docs(ai-briefing): 发布 YYYY-MM-DD AI 简报
```

## 目录

```text
ai-briefing/
├── SKILL.md
├── README.md
├── config/
│   ├── briefing.json
│   ├── focus-companies.json
│   ├── source-registry.json
│   ├── generator-result.schema.json
│   └── reviewer-result.schema.json
├── references/source-map.md
└── evals/evals.json
```
