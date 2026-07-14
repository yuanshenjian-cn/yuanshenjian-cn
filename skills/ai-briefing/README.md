# ai-briefing

`ai-briefing` 用于查询、起草和发布博客 AI 简报。默认只查询；明确要求“写/起草”才成稿，明确要求“发布/commit/push”才进入发布链路。

## 三种模式

- 查询：只回答，不落盘，不 commit，不 push。
- 成稿：返回 Markdown 草稿和审核摘要，不写入 `content/`。
- 发布：独立 reviewer 与确定性门禁全部通过后才允许发布。

`scripts/ai-briefing.sh` 还有一个外层编排模式：主 agent 只生成正式候选文件和 agent 证据，独立 reviewer、Git 与远端验证全部由 shell 接管。

## 所有模式都先采集

查询、成稿和普通发布不能只靠临时网页搜索。若外层未提供 `runDir`、`window.json` 和 `collection.json`，模式开始时必须创建被 Git 忽略的 `.local/ai-briefing/runs/<run-id>/`，冻结一次 `issueDate/windowEnd`，依次运行：

```text
node scripts/ai-briefing-window.js --issue-date <date> --window-end <iso> --output <runDir>/window.json
node scripts/collect-ai-briefing-feeds.js --window-file <runDir>/window.json --output <runDir>/collection.json
```

查询和成稿只可在 `.local` runDir 写证据，不写 `content/` 或 Git；普通发布完成相同初始化后继续走现有发布门禁。外层已提供窗口和采集结果时禁止重复计算或覆盖。

`scripts/ai-briefing.sh` 对 collector 另加默认 120 秒外层超时，可用 `AI_BRIEFING_COLLECTOR_TIMEOUT_SECONDS` 调整。

## 日期差窗口

窗口以 Asia/Shanghai 的本期日期和上一篇 `published: true` 简报日期计算：相差 N 个自然日就回溯 `N × 24` 小时。没有历史时回溯 24 小时，区间为 `(windowStart, windowEnd]`。

例如上一篇是昨天/前天/三天前，本期窗口分别是 24/48/72 小时。0 条确定事件时不创建简报，下一次仍从上一篇已发布日期计算，因此窗口继续扩大。公开 frontmatter 不新增 `publishedAt`。

## 候选采集

来源地址和确认策略以 `config/source-registry.json` 为程序真源。发现顺序是：

1. 官方 RSS/Atom、GitHub Release、Hugging Face。
2. 官方页面、changelog、release notes。
3. 按厂商和事件类型定向搜索。
4. 媒体 Feed 与权威媒体补漏。
5. 回溯原始源或双源确认。

Feed 的 `partial/unknown` coverage 或成功但零候选不能证明没有更新，重点厂商必须补检；registry 为重点厂商启用的每条配置路径都要有明确结果。所有路径失败时阻断。

## 事件与来源

确定性聚类先按 GUID、规范 URL、官方落地页合并，再由 agent 做有记录的语义复核。不同版本、价格、开放范围和弃用不能因为厂商相同而误合并。

来源标签固定为 `[官方]`、`[原始文件]`、`[媒体报道]`。媒体默认需要官方源或第二家独立 publisher；同一 publisher 的两个入口不算双源。媒体只有日期而无时间时不能确认正文事实。

## Markdown V2

从 `contentRulesV2EffectiveDate: 2026-07-15` 起：

- 一个事件对应一个速览 bullet、一个正文 `###`、一个同名来源分组。
- 次级确定事件可进入 `## 补充更新`。
- `## 为什么值得关注` 不参与事件计数。
- 0 条事件不发布，不拆事件凑数。

动态正文汉字数不含 `## 来源`：

- 1 条：450~800
- 2~3 条：750~1300
- 4~6 条：1100~1800
- 7+ 条：1500~2200

7 条以上时重点展开 3~5 条，其余放入补充更新，保留全部合格事件。

## 证据与 reviewer

运行证据保存在被 Git 忽略的 `.local/ai-briefing/runs/<run-id>/`，包括 `window.json`、`collection.json`、`discovery.json`、`selection.json`、`self-review.json`、主 agent 和 reviewer 原始结构化输出，以及 `verification.json`。

独立 reviewer 具有受限只读 WebFetch/WebSearch，禁止编辑和 Bash。它只访问 registry/证据包列出的 URL，网络不可用时不得伪称验证成功。

Reviewer 只运行一轮；不是 `可进入发布门禁` 就立即停止，不自动修稿，不 commit，不 push。

## 发布成功条件

发布必须同时满足：内容校验、AI 索引构建、来源策略、不可变哈希、reviewer approved、精确 stage、commit diff-tree 文件集、push 后 fetch + merge-base 远端包含验证，以及干净工作区。

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
