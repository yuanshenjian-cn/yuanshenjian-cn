# AI 简报日期窗口与柔性发布流程修复执行计划

> 步骤使用复选框（`- [ ]`）语法，便于跟踪进度。

**目标：** 将 AI 简报完整迁移到日期级重叠窗口、可证明的无事件结论、覆盖配额、候选级隔离、审核后晋升和唯一确定性发布收尾流程。

**架构：** 窗口脚本只产生自然日范围和冻结观察时刻；采集器保留来源内唯一候选并隔离坏条目；verifier 统一执行日期资格、coverage、selection、reviewer 与 no-events 契约；provider 各自负责生成/审核，共享 finalizer 负责公开文件晋升、内容构建和 Git 发布证明。Markdown validator 只保留结构与宽松硬上限，编辑质量交给 reviewer。

**技术栈：** Node.js 20 CommonJS、Bash、Vitest 3、JSON Schema 2020-12、gray-matter、fast-xml-parser、现有 `just` 门禁。

**来源设计文档：** [`docs/specs/2026-07-15-ai-briefing-flexible-publication-design.md`](../specs/2026-07-15-ai-briefing-flexible-publication-design.md)

**工作流审核模式（Workflow Review Mode）：** `lightweight`

**规格审核状态（Spec Review Status）：** `lightweight`

**计划审核状态（Plan Review Status）：** `lightweight`

**主要验收标准：**
- [x] 上一期为昨天/前天时分别输出 nominalDays=1/2，上一篇发布日期包含在 coverage 中，精确时间只排除 observedAt 之后的未来证据。
- [x] `no_events` 必须经过 discovery、selection、自审、coverage 和不可变哈希验证；覆盖不足只能 blocked。
- [x] `checked-empty`、候选级 rejectedItems、多来源不同 candidateId/同 cluster 和 source URL prefix 均有确定性测试。
- [x] Reviewer 拒绝或内容门禁失败不会在 `content/` 留下本轮文件；OpenCode 与 Claude 发布路径共用 finalizer。
- [x] 查询、成稿和 DRY_RUN 不执行发布 Git preflight；正式发布继续保留精确 stage、diff-tree、禁止危险 Git 参数和远端包含验证。
- [x] 所有局部测试、内容校验、AI 数据构建、主站检查和 `git diff --check` 通过，且不触碰现有未跟踪的 2026-07-15 简报。

---

## 实现摘要

实现分为八个依赖有序的任务。先迁移窗口与配置真源，再修正 Feed 时间、候选身份和坏条目隔离；随后重写 verifier 的日期/coverage/no-events 契约；接着调整 Markdown validator 与历史去重；之后统一 reviewer schema 和两套 reviewer 策略；再把正式稿写入改为 runDir candidate，并抽出共享 finalizer；最后同步 Skill、README、来源地图、Eval 与命令，执行局部和全量回归。

所有行为变化先写失败测试。实现期间不执行真实 AI 简报发布、commit 或 push。Shell 状态机测试继续使用临时 Git 仓库和 fake runner。当前工作区的 `content/ai-briefings/2026/07/2026-07-15-ai-briefing.md` 被视为用户文件，任何步骤不得修改、删除、stage 或覆盖。

## 设计决策到任务的映射

| 设计需求/决策 | 实现任务 | 验证方式 |
|---|---|---|
| 自然日包含式重叠窗口 | 任务 1 | window 单测与 CLI JSON 断言 |
| timestamp 只排除未来、date-only 使用本地日区间 | 任务 2、3 | collector/verifier DST、跨时区、未来证据测试 |
| candidateId 与 cluster key 分离 | 任务 2 | 多来源端到端聚类测试 |
| 坏 item 进入 rejectedItems | 任务 2、3 | 单条坏数据不阻断 source/run 测试 |
| checked-empty 与 coverage quorum | 任务 1、3 | registry/coverage 参数化测试 |
| no_events 完整证据门禁 | 任务 3、6 | verifier CLI 与 shell 状态机测试 |
| 历史去重覆盖重点/补充、materialDelta 结构化 | 任务 3、4 | selection contract 与 validator 去重测试 |
| URL host + prefix/owner 限制 | 任务 1、3 | 非官方 GitHub/HF URL 拒绝测试 |
| Reviewer 输出可证明核验范围 | 任务 5 | schema 分支测试与同步测试 |
| 候选先写 runDir，审核后晋升 | 任务 6 | reviewer blocked/门禁失败无正式文件测试 |
| Provider 共享 finalizer | 任务 6、7 | shell 文本与临时仓库调用链测试 |
| 查询/成稿/DRY_RUN 不执行发布 preflight | 任务 6、7 | dry-run/targeted mode shell 测试 |
| 字数建议范围、宽松 hardMax、单事件可省略综合章节 | 任务 4、7 | Markdown validator 参数化测试 |
| 保留来源与 Git 安全门禁 | 任务 3、5、6 | verifier、shell 与现有安全回归测试 |

## 文件结构

### 新建文件

| 文件 | 职责 |
|---|---|
| `scripts/finalize-ai-briefing-run.sh` | 共享确定性发布收尾：preflight、证据/reviewer 校验、candidate 晋升、构建、精确 stage、commit、push、远端验证和失败清理 |
| `skills/ai-briefing/references/reviewer-policy.md` | Claude/OpenCode reviewer 共用的 canonical 审核规则 |

### 修改文件

| 文件 | 修改内容 |
|---|---|
| `scripts/ai-briefing-window.js` | 输出日期级 coverage、nominalDays、observedAt 和扩展搜索日期，不再计算精确小时下界 |
| `scripts/collect-ai-briefing-feeds.js` | 时间精度分类、source-local date、candidateId/cluster key 分离、rejectedItems、日期级 coverage |
| `scripts/verify-ai-briefing-run.js` | 新窗口契约、日期区间相交、checked-empty、coverage quorum、URL prefix、结构化 delta/history、no-events、candidate 路径和 reviewer 结果验证 |
| `scripts/validate-post.js` | candidate logical path、速览顺序映射、可选为什么值得关注、hardMax、重点/补充统一去重 |
| `scripts/ai-briefing.sh` | 生成 runDir candidate、无事件验证、DRY_RUN 分层、调用共享 finalizer |
| `scripts/briefing-skill-config.js` | 加载新增/调整后的配置字段与 reviewer policy（如需要） |
| `skills/ai-briefing/config/briefing.json` | `calendar-date-overlap`、initialLookbackDays、recommended/hardMax、coverage 策略 |
| `skills/ai-briefing/config/focus-companies.json` | 对齐 MiniMax 等重点名单和 coverage 语义 |
| `skills/ai-briefing/config/source-registry.json` | coverageRole、allowedUrlPrefixes、移除宽泛 GitHub/HF 官方授权、同步真实路径 |
| `skills/ai-briefing/config/generator-result.schema.json` | candidatePath、selection/selfReviewPath、coverageConclusion 和 no-events 证据字段 |
| `skills/ai-briefing/config/reviewer-result.schema.json` | networkStatus、checkedEvidenceIds、uncheckedHighRiskItems |
| `skills/ai-briefing/SKILL.md` | 新日期窗口、模式分层、coverage、candidate/finalizer、柔性编辑规则 |
| `skills/ai-briefing/README.md` | 同步可操作说明与状态语义 |
| `skills/ai-briefing/references/source-map.md` | 只描述 registry 中真实独立路径，解释 primary/supplemental/discovery |
| `skills/ai-briefing/evals/evals.json` | 新增日期重叠、checked-empty、no-events、degraded、新 revision 和柔性篇幅场景 |
| `.claude/agents/ai-briefing-reviewer.md` | 引用 canonical policy，要求新 reviewer 结构化字段 |
| `.opencode/agents/ai-briefing-reviewer.md` | 引用 canonical policy，保持只读权限并同步输出要求 |
| `.opencode/commands/publish-ai-briefing.md` | 禁止自行复制 Git，改为生成/审核后调用 finalizer |
| `scripts/tests/ai-briefing-window.test.ts` | 日期窗口和同一时刻冻结测试 |
| `scripts/tests/collect-ai-briefing-feeds.test.ts` | date/unknown time、ID、rejectedItems、日期 coverage 测试 |
| `scripts/tests/verify-ai-briefing-run.test.ts` | 日期资格、checked-empty、quorum、no-events、prefix、delta/history、reviewer schema 测试 |
| `scripts/tests/validate-post.test.ts` | 柔性篇幅、可选章节、速览摘要、补充更新去重、logical path 测试 |
| `scripts/tests/ai-briefing-shell.test.ts` | candidate/finalizer、失败清理、dry-run 分层、no-events 证据、状态报告测试 |
| `scripts/tests/briefing-skill-config.test.ts` | 新配置与 registry role/prefix 约束 |
| `skills/tests/ai-skill-sync.test.ts` | 新文件镜像、Skill/reviewer/command 关键规则同步 |
| `scripts/tests/fixtures/ai-briefing/*` | 更新结构化结果和证据 fixture |

## 关键接口与代码形态

### 日期窗口

```javascript
function calculateBriefingWindow({
  issueDate,
  observedAt,
  briefingsRoot,
  initialLookbackDays = 1,
}) {
  const previous = findPreviousPublishedBriefing({ issueDate, briefingsRoot });
  const nominalDays = previous
    ? differenceInCalendarDays(issueDate, previous.date)
    : initialLookbackDays;
  const coverageStartDate = previous?.date ?? addCalendarDays(issueDate, -initialLookbackDays);
  return {
    issueDate,
    previousIssueDate: previous?.date ?? null,
    nominalDays,
    coverageStartDate,
    coverageEndDate: issueDate,
    observedAt: new Date(observedAt).toISOString(),
    searchStartDate: addCalendarDays(coverageStartDate, -1),
    searchEndDateExclusive: addCalendarDays(issueDate, 2),
    timezone: "Asia/Shanghai",
    strategy: previous ? "calendar-date-overlap" : "initial-calendar-date-lookback",
  };
}
```

### 候选时间与身份

```javascript
function classifySourceTime(value, sourceTimezone) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { timePrecision: "date", sourceDate: value, sourceTimezone };
  }
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    const eventAt = new Date(value).toISOString();
    return { timePrecision: "timestamp", eventAt, sourceTimezone };
  }
  return { timePrecision: "unknown", sourceTimezone };
}

const candidateId = sha256(`${source.id}\n${sourceItemIdentity}`);
const clusterKeys = getDeterministicClusterKeys({ guid, canonicalUrl, officialLandingUrl });
```

### Discovery 状态

```javascript
const SOURCE_STATUSES = new Set([
  "success",
  "checked-empty",
  "degraded",
  "failed",
  "not-configured",
]);

function isSuccessfulCheck(result) {
  return result.status === "success" || result.status === "checked-empty";
}
```

### 日期资格

```javascript
function resolveEvidenceDateRange(evidence, source) {
  if (evidence.timePrecision === "timestamp") {
    return { eventAt: evidence.eventAt, eventDate: getShanghaiDate(new Date(evidence.eventAt)) };
  }
  if (evidence.timePrecision === "date") {
    return sourceLocalDateInterval(evidence.sourceDate, source.sourceTimezone);
  }
  return null;
}

function isEvidenceWithinCoverage(evidence, source, window) {
  const range = resolveEvidenceDateRange(evidence, source);
  if (!range) return false;
  if (range.eventAt) {
    return range.eventAt <= window.observedAt &&
      range.eventDate >= window.coverageStartDate &&
      range.eventDate <= window.coverageEndDate;
  }
  return intervalsOverlap(range, shanghaiCoverageInterval(window.coverageStartDate, window.observedAt));
}
```

### Coverage 结论

```javascript
function evaluateCoverage(collection, discovery, focusCompanies, sourceRegistry) {
  const companies = focusCompanies.filter((company) => company.priorityFocus);
  const companyResults = companies.map((company) => evaluateCompanyCoverage(company, collection, discovery, sourceRegistry));
  const unavailable = companyResults.filter((item) => item.status === "failed");
  const anyOfficialCheck = companyResults.some((item) => item.hasOfficialCheck);
  return {
    status: !anyOfficialCheck ? "insufficient" : unavailable.length > 0 ? "degraded" : "sufficient",
    companies: companyResults,
  };
}
```

`draft_ready` 可以使用 sufficient 或 degraded；`no_events` 只允许 sufficient。

### 结构化 material delta

```json
{
  "kind": "material-update",
  "summary": "价格从每百万 token 10 美元降至 8 美元",
  "evidenceIds": ["page:openai-pricing-2026-07-15"]
}
```

```json
{
  "file": "content/ai-briefings/2026/07/2026-07-14-ai-briefing.md",
  "eventTitle": "OpenAI 更新模型价格",
  "fingerprint": "sha256:...",
  "conclusion": "material-update"
}
```

### Generator 与 reviewer 结果

```json
{
  "status": "draft_ready",
  "issueDate": "2026-07-15",
  "candidatePath": ".local/ai-briefing/runs/<run-id>/candidate.md",
  "selectionPath": ".local/ai-briefing/runs/<run-id>/selection.json",
  "selfReviewPath": ".local/ai-briefing/runs/<run-id>/self-review.json",
  "coverageConclusion": "degraded",
  "selfReviewConclusion": "通过"
}
```

```json
{
  "status": "no_events",
  "issueDate": "2026-07-15",
  "selectionPath": ".local/ai-briefing/runs/<run-id>/selection.json",
  "selfReviewPath": ".local/ai-briefing/runs/<run-id>/self-review.json",
  "coverageConclusion": "sufficient",
  "reason": "所有候选均为历史重复或证据不足"
}
```

```json
{
  "status": "approved",
  "conclusion": "可进入发布门禁",
  "networkStatus": "online",
  "checkedEvidenceIds": ["page:openai-api-changelog"],
  "uncheckedHighRiskItems": [],
  "evidenceQuality": {
    "authority": "官方来源匹配",
    "authenticity": "已读取原始页面",
    "timeliness": "日期位于本期 coverage"
  }
}
```

### Shared finalizer

```text
scripts/finalize-ai-briefing-run.sh \
  --run-dir <runDir> \
  --candidate <runDir>/candidate.md \
  --reviewer-output <runDir>/reviewer-output.json \
  --expected-window-hash sha256:... \
  --expected-collection-hash sha256:...
```

finalizer 只接受已经存在的 runDir/candidate/reviewer output，不调用生成 agent，也不自动复审。

## 执行任务

### 任务 1：迁移窗口和机器配置真源

**文件：**
- 修改：`scripts/ai-briefing-window.js`
- 修改：`skills/ai-briefing/config/briefing.json`
- 修改：`skills/ai-briefing/config/focus-companies.json`
- 修改：`skills/ai-briefing/config/source-registry.json`
- 修改：`scripts/tests/ai-briefing-window.test.ts`
- 修改：`scripts/tests/briefing-skill-config.test.ts`

**设计关联：** 日期级重叠窗口、coverage role、URL prefix、MiniMax 重点名单、搜索日期扩展。

**验收标准：**
- [x] window JSON 不再含 `windowHours/windowStart/windowEnd`，包含设计定义的新字段。
- [x] 昨天/前天分别得到 nominalDays 1/2，coverageStartDate 等于上一篇日期。
- [x] 无历史使用 initialLookbackDays=1。
- [x] 所有 priority company 至少一个 enabled official primary source。
- [x] page source 不再通过整个 github.com/huggingface.co host 冒充官方扩展路径。

- [x] **步骤 1：更新窗口测试接口并写失败场景**

```typescript
interface BriefingWindow {
  previousIssueDate: string | null;
  nominalDays: number;
  coverageStartDate: string;
  coverageEndDate: string;
  observedAt: string;
  searchStartDate: string;
  searchEndDateExclusive: string;
  strategy: "calendar-date-overlap" | "initial-calendar-date-lookback";
}

it("includes the previous issue date instead of subtracting exact hours", () => {
  writeBriefing("2026-07-14", true);
  const result = calculateBriefingWindow({
    issueDate: "2026-07-15",
    observedAt: "2026-07-15T12:00:00.000Z",
    briefingsRoot: tempRoot,
    initialLookbackDays: 1,
  });
  expect(result).toMatchObject({
    nominalDays: 1,
    coverageStartDate: "2026-07-14",
    coverageEndDate: "2026-07-15",
  });
  expect(result).not.toHaveProperty("windowStart");
});
```

- [x] **步骤 2：运行窗口和配置测试确认失败**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/ai-briefing-window.test.ts \
  scripts/tests/briefing-skill-config.test.ts
```

期望：旧 `windowHours/windowStart` 断言或缺少新配置字段导致失败。

- [x] **步骤 3：实现日期加减、同一 observedAt 冻结和新窗口输出**

增加并导出 `addCalendarDays()`；CLI 使用单个 `now` 同时派生 issueDate/observedAt。保留同日/未来 published 阻断。

- [x] **步骤 4：迁移 briefing/focus/source registry 配置**

`briefing.json` 使用：

```json
{
  "windowStrategy": "calendar-date-overlap",
  "initialLookbackDays": 1,
  "coveragePolicy": {
    "requiredPrimaryChecksPerPriorityCompany": 1,
    "allowDegradedDraft": true,
    "requireSufficientForNoEvents": true
  }
}
```

为来源增加 `coverageRole` 和 `allowedUrlPrefixes`。已知 page URL 只允许自身路径/同一官方站点明确前缀；现有独立 SDK/HF source 使用精确仓库/owner 前缀；从 page source 的宽泛 GitHub/HF allowlist 移除未注册入口。将 MiniMax 与 Skill 跟踪重点语义对齐。

- [x] **步骤 5：运行窗口与配置测试**

运行同步骤 2。期望全部通过。

### 任务 2：修复 Feed 时间、候选身份和坏条目隔离

**文件：**
- 修改：`scripts/collect-ai-briefing-feeds.js`
- 修改：`scripts/tests/collect-ai-briefing-feeds.test.ts`
- 修改：`scripts/tests/fixtures/ai-briefing/rss.xml`
- 修改：`scripts/tests/fixtures/ai-briefing/atom.xml`

**设计关联：** date/unknown timestamp、禁止 updatedAt 回退、candidateId/clusterKey 分离、rejectedItems、日期级 feed coverage。

**验收标准：**
- [x] 纯日期保持 date precision；无 offset 的日期时间为 unknown。
- [x] 缺 published time 不自动使用 updatedAt。
- [x] 同 GUID 的两个 source 具有不同 candidateId 且同 cluster。
- [x] 一条缺 URL/时间异常 item 进入 rejectedItems，其他 item 保留。
- [x] coverage 使用 coverageStartDate 和最早自然日。

- [x] **步骤 1：写时间精度和 updatedAt 失败测试**

```typescript
it("keeps date-only values as source dates", () => {
  const items = parseFeedXml(buildRss([{ pubDate: "2026-07-14" }]), rssSource);
  expect(items[0]).toMatchObject({
    timePrecision: "date",
    sourceDate: "2026-07-14",
    sourceTimezone: rssSource.sourceTimezone,
  });
  expect(items[0]).not.toHaveProperty("eventAt");
});

it("does not use updatedAt when published time is missing", () => {
  const items = parseFeedXml(buildAtom([{ published: null, updated: "2026-07-14T12:00:00Z" }]), atomSource);
  expect(items[0].timePrecision).toBe("unknown");
});
```

- [x] **步骤 2：写 ID、聚类和 rejectedItems 失败测试**

```typescript
it("uses source-scoped candidate ids and cross-source cluster keys", () => {
  expect(first.candidateId).not.toBe(second.candidateId);
  expect(clusterDeterministicCandidates([first, second])).toHaveLength(1);
});

it("rejects a bad item without failing the source", async () => {
  const result = await collectSingleFeed(source, window, deps);
  expect(result.status).toBe("success");
  expect(result.candidates).toHaveLength(1);
  expect(result.rejectedItems).toEqual([
    expect.objectContaining({ reasonCode: "missing-url" }),
  ]);
});
```

- [x] **步骤 3：运行 collector 测试确认失败**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/collect-ai-briefing-feeds.test.ts
```

- [x] **步骤 4：实现 classifySourceTime、source-scoped ID 和 item 隔离**

规范化单 item 时捕获可预期校验错误并返回 rejected 记录；网络/XML/source 级错误仍由现有 allSettled 隔离。缓存同步保存 candidates 与 rejectedItems 摘要，但坏 item 不进入确认候选。

- [x] **步骤 5：将 coverage 改为日期比较并运行 collector 测试**

期望所有解析、缓存、SSRF、timeout、聚类和新日期测试通过。

### 任务 3：重写证据、coverage、selection 与 no-events verifier

**文件：**
- 修改：`scripts/verify-ai-briefing-run.js`
- 修改：`skills/ai-briefing/config/generator-result.schema.json`
- 修改：`scripts/tests/verify-ai-briefing-run.test.ts`
- 修改：`scripts/tests/fixtures/ai-briefing/claude-generator-results.json`

**设计关联：** 日期区间、checked-empty、coverage quorum、selected-only 严格验证、URL prefix、结构化 delta/history、no-events 门禁。

**验收标准：**
- [x] verifier 不再读取 `(windowStart, windowEnd]`。
- [x] 官方 date-only 可在观察到后确认，媒体 date-only 不可确认。
- [x] checked-empty 不需要 evidence，success 仍需要 evidence。
- [x] draft_ready 可 degraded，no_events 只允许 sufficient。
- [x] 未选坏候选不阻断，入选证据严格校验。
- [x] URL 不匹配 source prefix 时拒绝。
- [x] materialDelta/historyMatches 具有结构化字段。
- [x] 新 `verify-no-events` CLI 能阻断缺失覆盖和副作用。

- [x] **步骤 1：迁移 generator schema fixture 和判别联合测试**

为 draft_ready/no_events 增加计划定义字段；断言旧 `filePath` 分支失败、新 candidatePath 分支通过。

- [x] **步骤 2：写日期资格测试**

```typescript
it("accepts an observed official date without waiting for source day end", () => {
  expect(isEvidenceWithinCoverage(officialDateEvidence, officialSource, dateWindow)).toBe(true);
});

it("rejects timestamps after observedAt", () => {
  expect(isEvidenceWithinCoverage(futureEvidence, officialSource, dateWindow)).toBe(false);
});

it("keeps media date-only evidence ineligible for confirmation", () => {
  expect(isEvidenceEligibleForConfirmation(mediaDateEvidence, mediaSource, dateWindow)).toBe(false);
});
```

- [x] **步骤 3：写 checked-empty、quorum 与 no-events 失败测试**

```typescript
it("accepts checked-empty as a successful primary check", () => {
  expect(evaluateCoverage(collection, discoveryWithCheckedEmpty, companies, registry).status).toBe("sufficient");
});

it("allows degraded coverage for a draft but not no_events", () => {
  expect(() => validateCoverageForStatus("draft_ready", degradedCoverage)).not.toThrow();
  expect(() => validateCoverageForStatus("no_events", degradedCoverage)).toThrow("no_events 要求 sufficient coverage");
});
```

- [x] **步骤 4：写 prefix、delta/history 和 selected-only 测试**

非允许 GitHub owner 被拒绝；未入选 rejected item 不进入严格 sourceRef 验证；materialDelta 缺 evidenceIds 或 history match 缺 file/conclusion 时失败。

- [x] **步骤 5：运行 verifier 测试确认失败**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/verify-ai-briefing-run.test.ts
```

- [x] **步骤 6：实现新契约和 evaluateCoverage**

拆分纯函数：`sourceLocalDateInterval`、`shanghaiCoverageInterval`、`intervalsOverlap`、`isEvidenceWithinCoverage`、`evaluateCompanyCoverage`、`evaluateCoverage`、`validateCoverageForStatus`。保留既有 source/publisher/authority 安全检查。

- [x] **步骤 7：实现 verify-no-events CLI**

命令：

```text
verify-no-events --run-dir <dir> --expected-window-hash <hash> --expected-collection-hash <hash>
```

它必须读取 discovery/selection/self-review，校验 included=0、coverage sufficient、候选排除统计、无 candidate/正式文件副作用，并写 verification.json。

- [x] **步骤 8：运行 verifier 测试**

期望全部通过。

### 任务 4：放宽 Markdown 编辑门禁并增强历史去重

**文件：**
- 修改：`scripts/validate-post.js`
- 修改：`skills/ai-briefing/config/briefing.json`
- 修改：`scripts/tests/validate-post.test.ts`

**设计关联：** recommended/hardMax、速览独立摘要、单事件可选综合章节、重点/补充统一历史去重、candidate logical path。

**验收标准：**
- [x] 低于建议字数不失败，超过 hardMax 失败。
- [x] 速览数量/顺序与事件一致，但文本不必等于标题。
- [x] 单事件缺少为什么值得关注仍通过。
- [x] 多事件继续要求跨事件综合章节，除非配置明确允许省略。
- [x] 补充更新参与最近历史去重。
- [x] runDir candidate 可用 logical final path 校验日期和目录规则。

- [x] **步骤 1：写柔性篇幅与章节失败测试**

```typescript
it("allows a concise one-event briefing below the recommended minimum", () => {
  const result = validateFixture({ eventCount: 1, chineseChars: 320, includeWhy: false });
  expect(result.errors).toEqual([]);
});

it("rejects content above the configured hard maximum", () => {
  const result = validateFixture({ eventCount: 1, chineseChars: 1201 });
  expect(result.errors[0].message).toContain("硬上限 1200");
});
```

- [x] **步骤 2：写速览摘要、补充去重和 logical path 测试**

速览使用不同摘要仍通过；历史补充事件与当前重点事件重复时失败；candidate 物理路径位于 runDir，但 logical path 为正式路径时日期校验通过。

- [x] **步骤 3：运行 validator 测试确认失败**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/validate-post.test.ts
```

- [x] **步骤 4：实现配置与 validator 调整**

`dynamicBodyLengthRules` 改为 `recommendedMin/recommendedMax/hardMax`。`validateAiBriefingV2` 只检查 event/overview 数量、来源精确映射、hardMax 和必要章节；`validateRecentBriefingDuplicates` 从重点和补充统一提取事件。

CLI 增加：

```text
node scripts/validate-post.js --path <candidate> --logical-path <content/...md>
```

- [x] **步骤 5：运行 validator 测试与全内容校验**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/validate-post.test.ts
just validate-content
```

期望测试通过，历史内容不受新版柔性规则追溯影响。

### 任务 5：统一 Reviewer policy 与结果契约

**文件：**
- 新建：`skills/ai-briefing/references/reviewer-policy.md`
- 修改：`skills/ai-briefing/config/reviewer-result.schema.json`
- 修改：`.claude/agents/ai-briefing-reviewer.md`
- 修改：`.opencode/agents/ai-briefing-reviewer.md`
- 修改：`scripts/verify-ai-briefing-run.js`
- 修改：`scripts/tests/verify-ai-briefing-run.test.ts`
- 修改：`skills/tests/ai-skill-sync.test.ts`
- 修改：`scripts/tests/fixtures/ai-briefing/claude-reviewer-results.json`

**设计关联：** reviewer 可证明联网状态与证据覆盖、两套配置一致、单 revision 单轮审核。

**验收标准：**
- [x] approved 必须有 networkStatus、checkedEvidenceIds、空 uncheckedHighRiskItems。
- [x] offline/partial 可以返回 needs_changes/blocked；approved 仅在高风险项均有可接受依据时成立。
- [x] 两套 reviewer 都读取 canonical policy，保持 edit/bash deny。
- [x] reviewer policy 使用日期级 coverage 和 recommended/hardMax，不再引用 timestamp 开区间与严格字数。

- [x] **步骤 1：更新 reviewer schema 测试并确认失败**

```typescript
expect(() => validateReviewerResult({
  status: "approved",
  conclusion: "可进入发布门禁",
  networkStatus: "online",
  checkedEvidenceIds: ["page:openai"],
  uncheckedHighRiskItems: [],
  evidenceQuality,
})).not.toThrow();
```

缺少 checkedEvidenceIds 或存在 uncheckedHighRiskItems 的 approved 必须失败。

- [x] **步骤 2：创建 canonical reviewer policy**

Policy 明确日期范围、coverage conclusion、selected evidence、source prefix、recommended/hardMax、历史重点/补充、联网边界和单轮 revision 规则。

- [x] **步骤 3：精简两套 reviewer wrapper 并引用 policy**

Claude 保留只读 tools；OpenCode 保留 task/edit/bash deny 与 webfetch/websearch allow。两者输出字段完全一致。

- [x] **步骤 4：运行 verifier 与同步测试**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/verify-ai-briefing-run.test.ts \
  skills/tests/ai-skill-sync.test.ts
```

### 任务 6：候选晋升、共享 finalizer 与 Shell 状态机

**文件：**
- 新建：`scripts/finalize-ai-briefing-run.sh`
- 修改：`scripts/ai-briefing.sh`
- 修改：`scripts/verify-ai-briefing-run.js`
- 修改：`scripts/tests/ai-briefing-shell.test.ts`
- 修改：`scripts/tests/verify-ai-briefing-run.test.ts`

**设计关联：** runDir candidate、失败不污染 content、共享 deterministic finalizer、DRY_RUN 分层、准确发布状态。

**验收标准：**
- [x] Generator 只写 runDir/candidate.md。
- [x] blocked/failed/no_events 不允许产生正式文件。
- [x] no_events 调用 verify-no-events 后才返回 3。
- [x] Reviewer blocked、candidate 校验失败、build 失败时正式目录干净。
- [x] finalizer 是唯一执行 stage/commit/push 的脚本。
- [x] DRY_RUN 不 fetch、不检查 branch/upstream/clean worktree。
- [x] push 成功但后置验证失败时输出“已推送、验证状态未知”。

- [x] **步骤 1：扩展临时仓库 harness**

Harness 同时复制 shell、finalizer 与 verifier stub，fake generator 写 `$RUN_DIR/candidate.md` 而不是 content 文件。

- [x] **步骤 2：写失败清理和 finalizer 调用测试**

```typescript
it("keeps the public directory clean when reviewer blocks", () => {
  const result = runOrchestrator({ reviewerStatus: "blocked" });
  expect(result.status).not.toBe(0);
  expect(fs.existsSync(briefingFile)).toBe(false);
  expect(findRunFile("candidate.md")).toBeTruthy();
});

it("validates no_events evidence before returning 3", () => {
  const result = runOrchestrator({ generatorStatus: "no_events", noEventsEvidenceValid: false });
  expect(result.status).not.toBe(3);
  expect(readVerificationCalls()).toContain("verify-no-events");
});
```

- [x] **步骤 3：写 DRY_RUN 和发布状态测试**

DRY_RUN 在非 main、无 upstream、脏工作区 fixture 中仍可运行且不调用 git fetch。Push stub 成功、post-push verifier 失败时 stderr/stdout 明确包含“已推送、远端验证状态未知”。

- [x] **步骤 4：运行 shell/verifier 测试确认失败**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/ai-briefing-shell.test.ts \
  scripts/tests/verify-ai-briefing-run.test.ts
```

- [x] **步骤 5：实现 finalizer**

Finalizer 解析参数，执行发布 preflight；调用 verifier 校验 pre-review/reviewer；使用 logical path 校验 candidate；原子复制/rename 到正式路径；构建 index；精确 stage/commit/push/verify。用 trap 跟踪 `PROMOTED=1`、`COMMITTED=1`、`PUSHED=1`，只清理本轮已知生成物。

禁止出现 `--no-verify`、`git push --force` 或 `git add .`。

- [x] **步骤 6：简化 ai-briefing.sh**

把 Git preflight 移到 finalizer；普通生成流程创建 candidate；no_events 调 verify-no-events；approved 后调用 finalizer。DRY_RUN 在创建证据前不执行 Git fetch/branch/upstream 检查。

- [x] **步骤 7：运行 shell、verifier 和 bash 语法测试**

```bash
bash -n scripts/ai-briefing.sh
bash -n scripts/finalize-ai-briefing-run.sh
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/ai-briefing-shell.test.ts \
  scripts/tests/verify-ai-briefing-run.test.ts
```

### 任务 7：同步 Skill、文档、来源地图、Eval 与 OpenCode 命令

**文件：**
- 修改：`skills/ai-briefing/SKILL.md`
- 修改：`skills/ai-briefing/README.md`
- 修改：`skills/ai-briefing/references/source-map.md`
- 修改：`skills/ai-briefing/evals/evals.json`
- 修改：`.opencode/commands/publish-ai-briefing.md`
- 修改：`skills/tests/ai-skill-sync.test.ts`
- 修改：`scripts/tests/briefing-skill-config.test.ts`

**设计关联：** 所有用户可见规则和执行真源同步；OpenCode 不再复制发布状态机。

**验收标准：**
- [x] 文档不再出现 `windowStart/windowEnd` 开区间、日期差小时窗口、日期日末 convention 或全路径硬阻断。
- [x] 明确查询 scope、checked-empty、coverage sufficient/degraded/insufficient、no-events 门禁和 candidate/finalizer。
- [x] 明确 recommended/hardMax、可选为什么值得关注和 7+ 可编辑筛选。
- [x] source-map 只列 registry 中真实独立路径。
- [x] OpenCode command 生成/审核后调用 finalizer，不自行 commit/push。
- [x] Eval 覆盖设计文档列出的关键新场景。

- [x] **步骤 1：先更新同步测试文本断言**

断言包含 `calendar-date-overlap`、`checked-empty`、`coverageConclusion`、`candidate.md`、`finalize-ai-briefing-run.sh`、`hardMax`；断言不包含 `(windowStart, windowEnd]`、`日期差 × 24 小时`、`不得丢弃合格事件`。

- [x] **步骤 2：运行同步测试确认失败**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  skills/tests/ai-skill-sync.test.ts \
  scripts/tests/briefing-skill-config.test.ts
```

- [x] **步骤 3：更新 Skill/README/source-map/Eval/command**

保持 registry 是程序真源；文档解释但不复制易漂移的完整 URL 规则。OpenCode command 不递归调用生成编排器，只调用共享 finalizer 收尾。

- [x] **步骤 4：运行同步和配置测试**

期望全部通过。

### 任务 8：全量回归与完成检查

**文件：**
- 检查：本计划所有修改文件
- 保护：`content/ai-briefings/2026/07/2026-07-15-ai-briefing.md`

**设计关联：** 所有验收标准与仓库质量门禁。

**验收标准：**
- [x] 局部 AI 简报测试全部通过。
- [x] 全内容校验与 AI 数据构建通过。
- [x] site 质量门禁通过。
- [x] Bash 语法和危险命令扫描通过。
- [x] 未跟踪用户简报内容和状态保持不变。

- [x] **步骤 1：记录用户文件保护基线**

实现开始前只记录文件是否存在和 SHA-256；不得读取后改写。完成后比较同一路径 hash 和 Git 状态。

- [x] **步骤 2：运行 AI 简报局部测试**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/briefing-skill-config.test.ts \
  scripts/tests/ai-briefing-window.test.ts \
  scripts/tests/collect-ai-briefing-feeds.test.ts \
  scripts/tests/verify-ai-briefing-run.test.ts \
  scripts/tests/validate-post.test.ts \
  scripts/tests/ai-briefing-shell.test.ts \
  skills/tests/ai-skill-sync.test.ts
```

- [x] **步骤 3：运行内容和站点门禁**

```bash
just validate-content
just build-site-ai-data
just check-site
```

- [x] **步骤 4：运行 Shell 和 diff 检查**

```bash
bash -n scripts/ai-briefing.sh
bash -n scripts/finalize-ai-briefing-run.sh
git diff --check
```

并确认修改脚本中不存在 `--no-verify`、force push 和宽泛 `git add .`。

- [x] **步骤 5：检查工作区与保护文件**

确认 2026-07-15 未跟踪简报 hash 未变化，仍保持用户原始 Git 状态；列出所有本次修改文件和任何无法通过的门禁。

## 最终验收清单

- [x] `window.json` 使用日期级 coverage，上一篇日期包含式重叠。
- [x] 日期、timestamp、unknown 和 updatedAt 行为与设计一致。
- [x] 多来源候选 ID/cluster 不冲突，坏 item 被隔离。
- [x] checked-empty 和 coverage quorum 生效。
- [x] no_events 无法绕过证据门禁。
- [x] selected evidence 使用 source prefix、authority、publisher 和日期资格严格验证。
- [x] materialDelta/historyMatches 为结构化契约，补充更新参与历史去重。
- [x] Reviewer approved 可证明网络和核验范围，两套 reviewer 一致。
- [x] Reviewer/门禁失败不污染公开目录。
- [x] OpenCode/Claude 共用 finalizer，查询/成稿/DRY_RUN 不执行发布 preflight。
- [x] Markdown 柔性规则生效，来源映射和硬上限仍可靠。
- [x] Git 发布安全门禁没有放宽。
- [x] 全部测试和仓库门禁通过。
- [x] 用户未跟踪简报未被触碰。
