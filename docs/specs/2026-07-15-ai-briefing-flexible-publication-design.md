# AI 简报日期窗口与柔性发布流程修复设计

**工作流审核模式（Workflow Review Mode）：** `lightweight`

**规格审核状态（Spec Review Status）：** `lightweight`

## 摘要

本设计全面修复当前 AI 简报流程中“日期差最终仍按精确小时截断、无事件状态可绕过覆盖验证、日期级证据被人为推迟到日末、路径覆盖要求过度刚性、候选脏数据拖垮整期、审核失败污染正式目录、OpenCode 与 Shell 存在两套发布实现、编辑规则被当成安全门禁”等问题。

改造后，简报窗口以北京时间发布日期差计算名义天数，但实际采用包含上一篇发布日期的自然日重叠范围，允许重叠并依赖历史事件去重，不再使用“当前时刻减去 N×24 小时”作为精确下边界。查询、成稿与发布分层执行；无事件结论也必须通过完整证据门禁；重点厂商覆盖从“每条路径都成功”改为“官方主路径覆盖配额”；正式稿先在运行目录形成候选，独立 reviewer 和确定性门禁通过后才进入公开目录。

来源真实性、媒体独立确认、网络安全、精确 Git 文件集合、禁止危险 Git 参数和远端 commit 验证继续作为硬门禁保留。严格字数下限、速览逐字等于标题、单事件强制综合章节等编辑要求改为建议或柔性规则。

## 问题与目标

### 当前问题

1. 窗口小时数虽然由发布日期差计算，但下界仍是 `windowEnd - N×24h`，不同日期的执行时刻会造成漏报或重复。
2. `no_events` 只需返回日期和原因，未经完整 coverage、selection、自审和不可变哈希验证即可退出。
3. 日期级官方证据被合成为来源时区日末，可能延迟当天已经公开的消息；跨时区日期重算还可能产生契约错误。
4. Feed 中纯日期和无时区时间可能被误识别为精确时间戳，`updatedAt` 还会自动替代发布时间。
5. `candidateId` 与跨来源聚类身份混用，多来源同事件可能在聚类后被 verifier 视为重复 ID。
6. 非 Feed 路径无法表达“检查成功但没有更新”，导致 agent 必须伪造 evidence 或把成功检查写成失败。
7. 单个无关脏候选会让整份 collection 或 discovery 无法通过验证。
8. 最近五期去重未覆盖 `## 补充更新`，`materialDelta` 与 `historyMatches` 主要依靠形式字段。
9. 多个官方 source 仅按 GitHub/Hugging Face hostname 放行，不能证明具体组织或仓库属于厂商官方。
10. Generator 在 reviewer 前直接写正式目录，审核或后续门禁失败会污染工作区并阻断下一次运行。
11. OpenCode 普通发布与 `scripts/ai-briefing.sh` 分别实现 Git 与发布状态机，行为不一致。
12. 查询、成稿和 DRY_RUN 承担了部署分支、远端同步或全厂商覆盖等不必要前置条件。
13. 每个重点厂商的每条媒体与补检路径都必须有结果，成本过高且容易因单点波动阻断整期。
14. Reviewer 的两套配置、联网边界和结构化结果不完全一致，approved 不能证明高风险证据实际核验完成。
15. 严格字数区间、速览逐字匹配、单事件固定章节和“不得丢弃全部合格事件”限制编辑判断。
16. Skill 宣称可覆盖当天文件，但自动脚本没有对应入口；失败恢复和 push 后验证不确定状态也未区分。

### 目标

1. 上一期为昨天时名义窗口为 1 天，上期为前天时名义窗口为 2 天，并且不会漏掉上一篇发布日稍晚发生的事件。
2. 时间资格只精确到自然日；精确时间戳只用于排除未来证据和保留排序能力。
3. 无事件、正常成稿和阻断三种结果都具有可验证、不可绕过的证据链。
4. 单路径、单来源或单候选故障可以降级，不无条件拖垮整份简报。
5. 只有最终引用的事实证据执行最严格真实性和确认策略验证。
6. 重点厂商仍保持可审计覆盖，但不要求每家媒体和每条补漏路径全部成功。
7. 审核失败、内容校验失败或构建失败不在公开目录留下本轮候选。
8. 所有发布入口共用同一个确定性 finalizer 和 Git 状态机。
9. 编辑规范提供目标和上限，不以机械字数或逐字相等替代内容质量判断。
10. 保持既有安全门禁，不降低来源可靠性和 Git 发布安全性。

## 上下文

- `skills/ai-briefing/` 是 Skill、来源 registry、结果 schema、来源说明和 eval 的唯一真源。
- `.claude/skills/ai-briefing` 与 `.opencode/skills/ai-briefing` 继续通过现有同步关系消费真源。
- `scripts/ai-briefing-window.js` 负责窗口计算。
- `scripts/collect-ai-briefing-feeds.js` 负责 Feed/GitHub Release 的确定性采集与缓存。
- `scripts/verify-ai-briefing-run.js` 负责证据、来源策略、结构化结果、不可变文件和 Git 后置验证。
- `scripts/ai-briefing.sh` 负责当前 Claude CLI 自动编排。
- `scripts/validate-post.js` 负责公开 Markdown 结构和内容门禁。
- 正式文件位于 `content/ai-briefings/YYYY/MM/YYYY-MM-DD-ai-briefing.md`。
- `.local/ai-briefing/runs/<run-id>/` 是运行证据目录，不进入 Git。
- 当前工作区已有未跟踪文件 `content/ai-briefings/2026/07/2026-07-15-ai-briefing.md`。本次实现不得修改、删除、stage 或覆盖该文件；所有发布状态机测试必须使用临时仓库。

## 头脑风暴记录

### 用户确认的时间口径

用户明确要求时间窗口只精确到日期，不要求每天固定发布：昨天发布则本期按名义过去 1 天，昨天未发布且最近一期是前天则按名义过去 2 天，依此类推。用户确认采用完整一体化修复，而不是仅修改窗口或分阶段保留中间态。

由于公开 frontmatter 没有上一篇的精确发布时间，如果完全排除上一篇发布日期，就会漏掉上一篇发布后、当天晚些时候发生的事件。最终设计因此采用“上一篇日期包含式重叠”：日期级覆盖允许多扫一天，重复由最近历史事件去重消除。这是无精确发布时间前提下优先避免漏报的取舍。

### 安全门禁与编辑规则分离

用户要求解决流程过于死板的问题，但没有要求降低事实可靠性。设计将来源身份、确认策略、未来时间、网络安全、内容格式基本完整性和 Git 发布证明继续设为硬门禁；把路径全部成功、固定字数下限、速览逐字一致、单事件固定综合章节和全部事件必须公开改为 coverage 或编辑建议。

### 完整修复范围

用户选择完整一体化方案，因此本次同时修复窗口、采集、证据契约、无事件状态、覆盖模型、历史去重、reviewer、候选晋升、统一 finalizer、内容规则和测试，不保留新旧证据模型长期并存的中间状态。历史已发布 Markdown 不批量改写。

### 审核模式

用户选择 `lightweight`。设计文档、执行计划和代码实现不自动运行 subagent 审核，但仍必须执行确定性测试、内容校验和静态自检。

## 考虑过的方案

### 方案 A：完整一体化修复

一次性统一日期窗口、证据模型、状态机、内容规则和测试。优点是最终契约唯一、不会长期保留新旧规则冲突；缺点是改动范围较大，需要按模块实施并进行完整回归。用户确认采用此方案。

### 方案 B：分两期修复

第一期只修窗口、日期证据和 `no_events`，第二期再修覆盖配额、候选晋升、统一发布和编辑规则。优点是单次风险更小；缺点是中间状态仍存在两套时间或发布语义，测试和文档需要重复迁移。未采用。

### 方案 C：最小窗口补丁

只把 `N×24h` 换成自然日判断，并放宽少量提示词。优点是最快；缺点是无事件绕过、candidate ID 冲突、脏候选整体阻断、审核失败遗留文件和双发布实现仍然存在，不满足“修复所有问题”。未采用。

## 设计决策

| 决策 | 理由 | 被拒绝的替代方案 | 影响 |
|---|---|---|---|
| 使用包含上一篇发布日期的自然日重叠窗口 | 没有上一篇精确发布时间时优先避免漏报 | `observedAt-N×24h`、排除上一篇日期 | 允许预期重叠，必须增强历史去重 |
| 精确时间只排除未来事件，不作为日期下界 | 符合只精确到日期的用户要求 | 所有证据继续使用开闭 timestamp 区间 | 简化日期级证据，保留排序能力 |
| 日期级证据保存 `sourceDate` 和本地自然日区间 | 避免虚构日末并正确处理 DST/跨时区 | 合成 `23:59:59.999` | verifier 需要日期区间相交判断 |
| `no_events` 与成稿执行同等级证据门禁 | 防止未检索就声称无更新 | 只检查未创建文件 | 无事件运行需要 selection/self-review |
| 引入 `checked-empty` | 合法表达检查成功但无相关更新 | success 强制 evidence、failed 强制 error | coverage 不再迫使伪造候选 |
| 重点厂商采用官方主路径 coverage quorum | 保持覆盖同时降低单点波动阻断 | 每条 registry 路径都成功 | 需要标记 source 的 coverage role |
| 候选 ID 与 cluster key 分离 | 多来源同事件既要证据唯一又要可聚类 | GUID/URL 同时充当 candidateId | selection 映射更清晰 |
| 未入选脏条目进入 `rejectedItems` | 候选级错误不应拖垮整期 | collection 中所有条目完全严格 | 最终引用证据仍严格验证 |
| 候选先写 runDir，审核后晋升 | 失败不污染公开目录 | reviewer 前写 content | finalizer 负责原子晋升和回滚 |
| Provider 可各自生成/审核，但共用确定性 finalizer | 避免 OpenCode 与 Shell 各自实现 Git | 强制所有平台调用同一 agent CLI | 新增共享发布收尾入口 |
| 最近历史去重覆盖重点与补充事件 | 重叠窗口和补充更新都可能重复 | 只比较重点动态 | 需要统一事件提取和结构化历史引用 |
| URL 采用 host + prefix/owner 约束 | GitHub/HF 整站 host 不能证明官方身份 | 只检查 hostname | registry 增加允许路径前缀 |
| 字数范围改为建议区间与宽松硬上限 | 避免机械填充和少量越界阻断 | 保留严格 min/max | reviewer 负责低质量短稿判断 |
| 单事件允许省略“为什么值得关注” | 没有独立洞察时避免填充 | 所有稿件固定四节 | required sections 按事件数/内容调整 |
| 自动 reviewer 每个 revision 只运行一次 | 防止无人值守循环消耗和隐藏修改 | 自动修稿并循环审核 | 用户可显式启动新 revision |
| Git 严格预检只在发布 finalization 执行 | 查询和成稿不应依赖部署状态 | 所有模式 fetch/检查 main | DRY_RUN 和草稿可在普通工作区运行 |

## 最终设计

### 1. 日期级窗口

#### 1.1 窗口结果

`window.json` 改为以自然日为核心：

```json
{
  "issueDate": "2026-07-15",
  "previousIssueDate": "2026-07-14",
  "nominalDays": 1,
  "coverageStartDate": "2026-07-14",
  "coverageEndDate": "2026-07-15",
  "observedAt": "2026-07-15T04:00:00.000Z",
  "timezone": "Asia/Shanghai",
  "strategy": "calendar-date-overlap"
}
```

- `nominalDays` 是本期日期与上一篇已发布简报日期的北京时间自然日差。
- `coverageStartDate` 等于上一篇已发布简报日期，包含该日期作为重叠日。
- `coverageEndDate` 等于本期日期。
- `observedAt` 是任务开始时捕获一次的精确当前时刻，只用于冻结运行和排除未来证据。
- 不再输出或依赖精确 `windowStart = observedAt - N×24h`。
- Shell 必须用同一个 Node 进程/调用同时生成 `issueDate` 与 `observedAt`，避免跨北京时间午夜的两个独立调用竞态。

没有已发布历史时：

- 使用 `initialLookbackDays: 1`。
- `coverageStartDate = issueDate - 1 个北京时间自然日`。
- `previousIssueDate = null`。
- strategy 使用 `initial-calendar-date-lookback`。

同日或未来日期已有 `published: true` 简报时继续阻断。

#### 1.2 证据时间资格

精确 timestamp：

1. 必须包含明确 UTC offset 或可验证时区。
2. 解析后不得晚于 `observedAt`。
3. 转换为北京时间 `eventDate`。
4. 仅按 `coverageStartDate <= eventDate <= coverageEndDate` 判断日期资格。

日期级证据：

1. 必须保存 `sourceDate: YYYY-MM-DD` 和 registry 的 `sourceTimezone`。
2. 将来源当地自然日表示为 `[当地 00:00, 次日 00:00)`，正确处理 DST 的 23/25 小时日。
3. 将简报已发生覆盖范围表示为 `[coverageStartDate 北京时间 00:00, observedAt]`。
4. 两个区间相交即满足日期资格，不生成虚构的日末 `effectiveAt`。
5. 官方日期级页面还必须证明在 `checkedAt <= observedAt` 时真实可见。
6. 媒体 date-only 继续只能作为线索，不参与 standalone 或双源确认。

无时区的日期时间字符串不得由 Node 按本机时区静默解析。registry 未提供明确解析规则时标记 `timePrecision: unknown`，不能用于最终确认。

`updatedAt` 不自动替代事件发布时间。只有来源 registry 明确声明更新时间代表发布事件，或 selection 记录了可核验的实质更新和 `materialDelta` 时，才可成为本期事件时间。

### 2. 采集器与候选模型

#### 2.1 候选身份

每条来源证据拥有唯一候选 ID：

```text
candidateId = sha256(sourceId + sourceItemIdentity)
```

`sourceItemIdentity` 优先使用来源内 GUID/ID，其次使用规范 URL，最后使用标题与来源时间组合。

跨来源聚类另行生成：

```text
clusterKeys = guid / canonicalUrl / officialLandingUrl
```

相同 cluster key 可以把不同 candidateId 聚成同一事件，不再产生 verifier 的重复证据 ID 冲突。

#### 2.2 候选级隔离

collection 增加：

```json
{
  "candidates": [],
  "rejectedItems": [
    {
      "sourceId": "...",
      "itemIdentity": "...",
      "reasonCode": "missing-url",
      "reason": "候选缺少可验证 URL"
    }
  ]
}
```

- 单 item 解析失败、URL 不合法或时间未知时进入 `rejectedItems`。
- 来源请求和解析主体成功时，单 item 被拒绝不把整个 source 标记为 failed。
- coverage 使用原始条目数、截断状态、可比较日期和 rejected 计数共同判断。
- 最严格的 URL、时间和确认策略只应用于 selection 最终引用的 candidate/evidence。

#### 2.3 Feed 时间解析

- `YYYY-MM-DD` 明确识别为 `timePrecision: date`。
- 只有带 `Z`、UTC offset 或 registry 明确时区的日期时间才识别为 timestamp。
- 无时区日期时间标记 unknown，除非 source registry 有显式解析约定。
- `publishedAt` 缺失时不得自动使用 `updatedAt`。
- Feed coverage 按最早可比较自然日与 `coverageStartDate` 判断，不再按精确 timestamp 下界判断。

### 3. Source registry 与覆盖模型

#### 3.1 路径角色

registry 中可用于厂商覆盖的来源增加：

```json
{
  "coverageRole": "primary",
  "allowedUrlPrefixes": ["https://github.com/deepseek-ai/"]
}
```

`coverageRole`：

- `primary`：厂商官方主检查路径，可满足基本 coverage。
- `supplemental`：官方次级入口、GitHub、Hugging Face、产品页等补检路径。
- `discovery`：媒体 Feed 和搜索，只负责补漏。

source-map 中声称为独立检查入口的页面、GitHub、Hugging Face 必须满足二选一：

1. 在 registry 中拥有独立 source ID 和 URL/prefix；或
2. 从 source-map 的独立路径声明中移除。

不再用一个 page source ID 加整个 `github.com`/`huggingface.co` host 表示多个独立路径。

#### 3.2 路径执行状态

非 Feed 和确定性来源统一支持：

- `success`：检查成功并发现相关候选。
- `checked-empty`：检查成功但本窗口没有相关候选。
- `degraded`：检查完成但覆盖不完整或部分能力不可用。
- `failed`：检查失败，必须记录 error。
- `not-configured`：该路径未配置，不计入成功或失败。

`success` 和 `checked-empty` 均可满足 coverage。`checked-empty` 必须记录实际请求 URL 或 query、checkedAt 和 candidateCount=0，但不要求伪造事件 evidence。

#### 3.3 覆盖结论

全量 AI 简报按以下规则判断：

- 每个 `priorityFocus: true` 厂商应至少有一个 `coverageRole: primary` 的官方路径为 `success` 或 `checked-empty`。
- Feed partial/unknown 时，要求该厂商任意一个合格 primary/supplemental 非 Feed 路径成功检查；不要求所有媒体搜索成功。
- 单个厂商所有路径失败时标记全局 `coverageConclusion: degraded`，允许发布其他已确认事件，但公开审核摘要必须披露该厂商覆盖缺口。
- 如果所有官方主路径整体不可用，结论为 `insufficient`，阻断成稿和发布。
- 如果没有确认事件，只要任一重点厂商完全没有合格官方覆盖，就不得返回 `no_events`，应返回 `blocked`。
- 对定向单厂商查询，只评估用户指定范围，并明确输出 coverage scope。

全局媒体搜索不再要求 Reuters、Bloomberg、36Kr 对每个厂商全部执行。媒体路径按重大候选、组织/监管事件或官方覆盖不足时按需补漏。

搜索 query 必须由确定性 helper 展开并记录模板、实际 query 和日期范围。由于搜索引擎的 `before` 常为排他语义，搜索范围可向前后各扩展一个自然日，最终由本地日期资格规则过滤。

### 4. Discovery、Selection 与自审契约

#### 4.1 Discovery

每条路径记录：

```json
{
  "sourceId": "openai-api-changelog",
  "companyId": "openai",
  "method": "page",
  "status": "checked-empty",
  "checkedAt": "...",
  "request": {
    "url": "https://platform.openai.com/docs/changelog",
    "query": null
  },
  "candidateCount": 0,
  "error": null,
  "evidence": []
}
```

只有 success 要求至少一个 evidence；checked-empty 合法使用空 evidence。

#### 4.2 Selection

selection 同时记录 included 与 excluded 事件/候选。每个 included event 必须包含：

- `eventId`
- `title`
- `eventType`
- `candidateIds`
- `sourceRefs`
- 结构化 `materialDelta`
- 结构化 `historyMatches`
- `editorialPriority`

`materialDelta`：

```json
{
  "kind": "new-event",
  "summary": "首次确认的新发布",
  "evidenceIds": ["..."]
}
```

后续进展使用 `kind: material-update`，必须列出支持新增事实的 evidenceIds。不能只写任意非空字符串。

`historyMatches` 至少记录历史文件、历史事件标题或 fingerprint、匹配结论和是否存在实质增量。历史事件提取必须同时覆盖 `重点动态` 和 `补充更新`。

Excluded 候选允许使用简化证据，但必须有机器可读原因，例如：

- `duplicate-history`
- `no-material-delta`
- `insufficient-sources`
- `outside-date-range`
- `low-editorial-value`
- `invalid-candidate`

#### 4.3 Self review

self-review 必须包含：

- 日期窗口已检查。
- coverage 结论与缺口。
- 最近历史重点/补充事件均已检查。
- included 事件全部满足确认策略。
- 高风险未确认项。
- `no_events` 时对所有候选的排除统计。
- 最终结论。

### 5. Generator 状态与无事件门禁

Generator 结构化结果继续使用 `draft_ready/no_events/blocked/failed`，但增加证据路径：

`draft_ready`：

- `candidatePath`
- `selectionPath`
- `selfReviewPath`
- `coverageConclusion`

`no_events`：

- `selectionPath`
- `selfReviewPath`
- `coverageConclusion: sufficient`
- reason

`blocked` 和 `failed` 不得产生公开目录副作用；verifier 必须检查它们是否误写正式文件。

新增 `verify-no-events`：

1. 校验 window/collection 哈希未变。
2. 校验 discovery、selection、自审契约。
3. 校验 selection included 数为 0。
4. 校验候选均有排除或拒绝原因。
5. 校验 coverageConclusion 为 sufficient。
6. 校验没有正式文件和 Git 副作用。

`no_events` 只有以上条件全部成立才返回退出码 3。

### 6. 模式分层

#### 查询模式

- 不写公开内容，不执行 Git 写操作。
- 可以在 `.local` 生成窗口和证据，因此文档统一表述为“无公开文件/Git 副作用”，不再声称完全不落盘。
- 用户指定厂商或事件时只运行对应 scope。
- 只有用户要求全量简报查询时才执行全量重点厂商 coverage。

#### 成稿模式

- 冻结日期窗口并形成完整证据包。
- 草稿写入 runDir 或只在对话返回，不进入 `content/`。
- 不要求部署分支、upstream、远端同步或干净工作区。
- Reviewer 可按用户要求运行，但不进入 Git finalization。

#### 发布模式

- 生成候选与证据后才进入发布 preflight。
- Git 分支、upstream、ahead/behind、干净工作区、精确 stage 和远端验证只在 finalizer 执行。
- DRY_RUN 不 fetch、不检查部署分支、不要求干净工作区。

### 7. Reviewer

两套 reviewer 使用同一份 canonical 审核策略文本或共享必需规则，并由同步测试验证。

Reviewer 结果增加：

```json
{
  "status": "approved",
  "conclusion": "可进入发布门禁",
  "networkStatus": "online",
  "checkedEvidenceIds": ["..."],
  "uncheckedHighRiskItems": [],
  "evidenceQuality": {
    "authority": "...",
    "authenticity": "...",
    "timeliness": "..."
  }
}
```

- `networkStatus` 只允许 `online/partial/offline`。
- approved 要求 `uncheckedHighRiskItems` 为空。
- included 高风险事实必须出现在 checkedEvidenceIds，或有明确结构化离线依据。
- 若 reviewer 只能访问 registry/证据 URL，则以 WebFetch 为主；WebSearch 只用于验证已知事实时的受控发现，新 URL 不能直接成为正式证据，必须先进入 discovery 并通过 allowlist。
- 每个候选 revision 自动 reviewer 只运行一次；不通过时停止本轮，不自动修稿循环。
- 用户明确修改后可启动新的 revision/run，再执行一轮 reviewer。

### 8. 候选晋升与统一发布 finalizer

Generator 写入：

```text
.local/ai-briefing/runs/<run-id>/candidate.md
```

不在 reviewer 前写正式 `content/` 文件。

新增共享确定性 finalizer，供 Claude Shell 与 OpenCode 发布命令共同调用。Provider 可以各自完成生成和 reviewer 调用，但以下步骤只能由 finalizer 执行：

1. 发布 Git preflight。
2. 校验 immutable window/collection。
3. 校验证据、coverage、selection 和 reviewer 结果。
4. 使用逻辑正式路径对 candidate 执行 Markdown 内容校验。
5. 原子晋升 candidate 到正式路径。
6. 构建 AI index。
7. 验证只产生正式简报和 index 两个预期文件。
8. 精确 stage。
9. commit 并使用 diff-tree 验证文件集合。
10. push。
11. fetch + merge-base 验证远端包含 commit。

`scripts/ai-briefing.sh` 调用该 finalizer，不再内联另一套 Git 收尾逻辑；`.opencode/commands/publish-ai-briefing.md` 也不得自行复制 commit/push 流程。

内容 validator 增加“逻辑正式路径”参数，使 runDir candidate 能在晋升前按最终文件路径、日期和 frontmatter 完整校验。

失败处理：

- Reviewer、证据或 candidate 校验失败：正式目录没有本轮文件，candidate 保留在 runDir。
- 晋升后、commit 前构建或门禁失败：finalizer 只回滚本轮晋升文件和本轮生成 index，candidate 与证据保留。
- commit hook 失败：取消本轮精确 stage，回滚本轮生成物；不删除未知副作用，明确报告。
- commit 成功但 push 失败：保留本地 commit，报告“本地已提交、尚未推送”，不得自动重做 commit。
- push 成功但远端 fetch/验证暂时失败：报告“已推送、远端验证状态未知”，不得笼统称为未发布，也不得自动重复 push。

### 9. 当天文件冲突

- 同日或未来已有 `published: true` 简报继续硬阻断。
- 正式路径存在但未发布时，默认阻断。
- 只有用户明确提供 `--replace-existing` 且文件不是 `published: true` 时才允许替换；finalizer 必须记录原始 hash 并在 commit 前失败时恢复。
- Skill、Shell、OpenCode command 对该规则保持一致。

### 10. Markdown 与编辑规则

继续保留：

- 至少一条确认事件才成稿。
- 一个事件只对应一个正文事件标题。
- 正文事件与来源分组标题精确对应。
- 来源标签、HTTPS URL、registry source 身份和确认策略一致。
- 禁止拆分同一事件凑数量。

调整：

- `## 速览` bullet 数与正文事件数一致，并按顺序映射；bullet 可以是独立摘要，不要求逐字等于事件标题。
- `## 为什么值得关注` 对单事件稿变为可选；只有存在独立跨事件或行业判断时使用。
- `## 补充更新` 继续可选，并完整参与历史去重。
- 7 条以上不再要求公开全部合格事件；可按 editorialPriority 选择高价值事件，未公开项在 selection 中记录 `low-editorial-value` 等原因。
- 当前动态字数区间保留为 recommended range，不再执行硬下限。
- validator 只执行非空、结构完整和宽松 hardMax；短稿质量由 reviewer 判断。

默认 hardMax：

| 独立事件数 | 建议范围 | 硬上限 |
|---:|---:|---:|
| 1 | 450～800 | 1200 |
| 2～3 | 750～1300 | 1800 |
| 4～6 | 1100～1800 | 2400 |
| 7+ | 1500～2200 | 3200 |

低于建议范围不自动失败，但 reviewer 必须判断是否遗漏关键事实；超过 hardMax 才由 validator 阻断。

### 11. 保留的硬门禁

以下规则不因“柔性发布”而放宽：

- 明确发布意图。
- selected evidence 的 registry 身份、URL prefix、authority 与公开标签一致。
- 媒体双源 publisher 独立性。
- 媒体 date-only 不独立确认。
- Feed HTTPS、SSRF、DNS 绑定、重定向、XML、体积和 timeout 安全。
- window/collection 不可变哈希。
- reviewer 独立只读且 approved 才发布。
- 内容结构和来源分组完整。
- 精确 stage 与 commit diff-tree 文件集合。
- 禁止 `--no-verify` 和 force push。
- push 后远端 commit 包含关系验证。

### 12. 配置、文档与 Eval 同步

需要同步更新：

- `skills/ai-briefing/SKILL.md`
- `skills/ai-briefing/README.md`
- `skills/ai-briefing/config/briefing.json`
- `skills/ai-briefing/config/focus-companies.json`
- `skills/ai-briefing/config/source-registry.json`
- generator/reviewer schema
- `references/source-map.md`
- `evals/evals.json`
- 两套 reviewer
- OpenCode 发布 command
- scripts、validator 和相关测试

Eval 必须覆盖日期重叠、checked-empty、no-events 证据门禁、单厂商查询 scope、degraded 允许发布、reviewer 新 revision 和编辑规则放宽。

## 不在范围内

- 不增加公开 `publishedAt`、`windowStart` 等精确时间 frontmatter。
- 不批量改写历史 AI 简报正文。
- 不新增数据库、消息队列、常驻抓取服务或外部 RSS SaaS。
- 不实现自动无限修稿或 reviewer 循环。
- 不降低媒体确认、来源身份或网络安全标准。
- 不修改当前未跟踪的 2026-07-15 AI 简报文件。
- 不修改站点 UI、core-service 或 admin-console。
- 不在本次实现中执行真实简报 commit、push 或发布。

## 未决问题

无。时间窗口采用日期级包含式重叠，完整一体化范围和 `lightweight` 工作流均已由用户确认。

## 测试与验收

### 窗口与时间

1. 上一期昨天/前天/三天前时 nominalDays 分别为 1/2/3。
2. 上一期日期始终包含在 coverageStartDate，不再计算精确小时下界。
3. 上一期昨天早于今天执行时刻时，上一篇发布日稍晚事件仍在本期日期范围内。
4. 精确时间戳晚于 observedAt 时拒绝。
5. Feed `YYYY-MM-DD` 保持 date precision。
6. 无时区时间不按运行机器时区静默解释。
7. 美西官方 date-only 页面在实际可见后无需等待当地日末。
8. DST 日期使用本地午夜区间，不固定加 24 小时。

### 采集、覆盖与证据

1. 同 GUID/URL 的多来源候选拥有不同 candidateId，但形成同一 cluster。
2. 单个坏 item 进入 rejectedItems，不阻断其他候选。
3. checked-empty 合法通过 discovery contract。
4. Feed partial 时一个合格官方补检路径即可满足补充覆盖。
5. 不要求 Reuters、Bloomberg、36Kr 对每个厂商全部成功。
6. 单厂商覆盖失败使有事件稿降级并披露；无事件结论则阻断。
7. GitHub/HF 非允许 owner/prefix 不能被标为官方来源。
8. updatedAt 不自动成为事件发布时间。

### 无事件与去重

1. 缺 discovery、selection、自审或 coverage 的 no_events 必须失败。
2. 有重点厂商覆盖缺口时不能返回 no_events。
3. selection included=0 且候选全部具有排除原因时才允许 no_events。
4. 重点动态和补充更新都参与最近历史去重。
5. material-update 必须引用新增证据，任意非空字符串不能满足契约。

### Reviewer 与发布

1. approved 必须包含 networkStatus、checkedEvidenceIds 且无高风险未核验项。
2. 两套 reviewer 的必需规则和 schema 一致。
3. reviewer 拒绝后正式目录不出现本轮文件。
4. 用户显式启动新 revision 时允许重新审核。
5. OpenCode 与 Claude 路径最终调用同一 finalizer。
6. 查询、成稿和 DRY_RUN 不执行 Git fetch 或部署分支预检。
7. finalizer 只 stage 正式简报和 AI index。
8. commit/push/远端验证状态被准确区分。
9. 当天 published 文件始终阻断；未发布文件只有显式 replace 才允许。

### Markdown

1. 速览可使用独立摘要，但数量和顺序与正文事件一致。
2. 来源分组仍与正文事件标题完全一致。
3. 单事件可省略为什么值得关注。
4. 低于建议字数不自动失败，超过 hardMax 失败。
5. 7 条以上允许编辑筛选，未公开候选具有 selection 排除原因。

### 验证命令

实现计划应至少执行：

```bash
bash -n scripts/ai-briefing.sh
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/ai-briefing-window.test.ts \
  scripts/tests/collect-ai-briefing-feeds.test.ts \
  scripts/tests/verify-ai-briefing-run.test.ts \
  scripts/tests/ai-briefing-shell.test.ts \
  scripts/tests/validate-post.test.ts \
  skills/tests/ai-skill-sync.test.ts
just validate-content
just build-site-ai-data
just check-site
git diff --check
```

测试和实现不得修改、删除或 stage 当前未跟踪的 `content/ai-briefings/2026/07/2026-07-15-ai-briefing.md`。
