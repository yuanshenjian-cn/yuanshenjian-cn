# AI 简报候选采集与连续日期窗口改造执行计划

> 步骤使用复选框（`- [ ]`）语法，便于跟踪进度。

**目标：** 将 AI 简报升级为“日期差窗口 + RSS/Atom 候选采集 + 事件/来源证据链 + 独立复审 + 可验证自动发布”的完整工作流。

**架构：** 根级 Node 脚本负责确定性窗口计算、Feed 采集、证据策略和发布后置验证；`ai-briefing` skill 继续负责搜索补漏、事件聚类、成稿和自审；外层 shell 单独调用只读 reviewer，并在 reviewer 通过后确定性执行内容门禁、commit、push 和远端包含关系验证。公开 Markdown 从 2026-07-15 起启用一事件一标题、来源分组和动态篇幅，历史简报保持兼容。

**技术栈：** Node.js 20 CommonJS、Bash、Vitest 3、`fast-xml-parser@5.10.0`、现有 Markdown/frontmatter 工具与 Claude Code CLI 2.1.197。

**来源设计文档：** [`docs/specs/2026-07-14-ai-briefing-collection-window-design.md`](../specs/2026-07-14-ai-briefing-collection-window-design.md)

**工作流审核模式（Workflow Review Mode）：** `explore-review`

**规格审核状态（Spec Review Status）：** `explore-reviewed`

**计划审核状态（Plan Review Status）：** `explore-reviewed`

**审核轮次约束：** 本计划最多执行一轮独立审核与修复；实现阶段同样最多一轮。

**计划审核记录：** 已完成唯一一轮独立审核，并修复 Claude `anyOf/structured_output` 接口、macOS 外层超时、DNS 绑定、证据时间契约、authority 标签映射、commit 文件集合、临时仓库状态机测试、OpenCode websearch 权限、确定性聚类和未批准状态分支问题；按用户要求不再执行第二轮计划审核。

**主要验收标准：**
- [x] 本期日期与上一篇已发布简报日期相差 N 天时，回溯窗口严格为 `N × 24` 小时；无历史时为 24 小时。
- [x] 官方 RSS/Atom 通过安全采集器进入候选池，Feed 截断、单源失败和重点厂商全路径失败均有明确状态。
- [x] 2026-07-15 起，速览、正文事件标题和来源分组一一对应，正文长度按独立事件数动态校验。
- [x] 来源确认策略由 `selection.json + source-registry.json` 联合验证，不由 Markdown validator 猜测事件类型。
- [x] 无人值守脚本不使用 `--max-turns` 或无边界权限跳过，且只有在远端分支包含本次 commit 后返回成功。
- [ ] workspace 测试、内容校验、站点检查、Feed smoke 和 `git diff --check` 全部通过。

---

## 实现摘要

实现按依赖顺序拆成八个任务：先建立配置、来源注册表和结果 schema；随后以测试驱动实现窗口计算与安全 Feed 采集；再增强 Markdown 校验和证据策略验证；之后同步 skill、reviewer、eval 与文档；最后重写无人值守 shell 并执行集成验证。每个新脚本都导出纯函数并用 `if (require.main === module)` 包住 CLI，Vitest 通过动态导入直接测试，不依赖实时网络或真实 Claude/GitHub。

本计划不修改历史简报、不改站点 UI、不改 core-service/admin-console，也不执行真实 AI 简报发布、commit 或 push。

## 设计决策到任务的映射

| 设计需求/决策 | 实现任务 | 验证方式 |
|---|---|---|
| 日期差 × 24 小时窗口，不新增 frontmatter 时间 | 任务 2、任务 6 | 窗口单测；SKILL/README 文本断言 |
| 无历史回退 24 小时，0 事件不推进 | 任务 2、任务 7 | 边界单测；shell 状态处理测试 |
| source registry 是机器真源 | 任务 1、任务 5、任务 6 | 配置加载测试；策略验证测试；镜像同步测试 |
| 首批官方 RSS/Atom 与媒体 Feed | 任务 1、任务 3 | registry 断言；本地 fixture；实时 smoke |
| Feed SSRF/XML/体积/重定向安全 | 任务 3 | 恶意 XML、私网 DNS、超限响应和重定向测试 |
| Feed 历史不足必须标记 partial/unknown | 任务 3、任务 5 | coverage 单测；重点厂商门禁测试 |
| 非 Feed 路径由 agent 记录并由 reviewer 复核 | 任务 5、任务 6、任务 7 | discovery/selection 契约验证测试；reviewer 配置断言 |
| 一事件一速览、一标题、一来源分组 | 任务 4、任务 6 | Markdown validator 测试；eval 文本用例 |
| 动态篇幅与可选补充更新 | 任务 4、任务 6 | 1/2/4/7 事件参数化测试 |
| 媒体确认策略按事件类型判断 | 任务 1、任务 5 | `resolveConfirmationPolicy` 与双源测试 |
| 证据文件写入边界与 immutable hash | 任务 5、任务 7 | 哈希篡改测试；shell 参数断言 |
| reviewer 独立只读联网核验 | 任务 6、任务 7 | agent frontmatter 测试；独立 reviewer 调用结构检查 |
| 主 agent 不 commit/push，shell 确定性发布 | 任务 6、任务 7 | 临时 Git 仓库状态机测试；后置验证测试 |
| 主 agent/reviewer 具有独立外层超时 | 任务 7 | 超时 wrapper 单测；shell 超时退出测试 |
| Claude 结果使用判别联合类型 | 任务 1、任务 5、任务 7 | generator/reviewer schema fixture 测试 |
| 远端 commit 使用 fetch + merge-base 验证 | 任务 5、任务 7 | 注入 git runner 的成功/失败测试；shell 文本断言 |
| 各阶段最多一轮独立审核修复 | 任务 6、任务 7、任务 8 | skill/shell 文本断言；实现审核只派发一次 |

## 文件结构

### 新建文件

| 文件 | 职责 |
|---|---|
| `skills/ai-briefing/config/source-registry.json` | 来源地址、方法、publisher、权威等级、事件类型确认策略和允许域名的唯一机器真源 |
| `skills/ai-briefing/config/generator-result.schema.json` | 主 agent 的 `draft_ready/no_events/blocked/failed` 结构化结果 schema |
| `skills/ai-briefing/config/reviewer-result.schema.json` | 独立 reviewer 的 `approved/needs_changes/blocked` 结果 schema |
| `scripts/ai-briefing-window.js` | 查找上一篇已发布简报并计算日期差窗口；同时提供 CLI |
| `scripts/collect-ai-briefing-feeds.js` | 安全请求、RSS/Atom 解析、条件缓存、候选规范化和 Feed coverage；同时提供 health-check CLI |
| `scripts/verify-ai-briefing-run.js` | 解析 Claude 结果、校验证据策略/不可变哈希/副作用/远端 commit；同时提供 CLI 子命令 |
| `scripts/run-command-with-timeout.js` | 使用 Node 子进程组提供 macOS/Linux 一致的外层超时和退出码 124 |
| `scripts/tests/briefing-skill-config.test.ts` | 配置加载和 registry/schema 基础约束测试 |
| `scripts/tests/ai-briefing-window.test.ts` | 24/48/72 小时和异常时间线测试 |
| `scripts/tests/collect-ai-briefing-feeds.test.ts` | RSS/Atom、缓存、coverage、SSRF 和 XML 安全测试 |
| `scripts/tests/verify-ai-briefing-run.test.ts` | 结果联合类型、来源策略、证据哈希和远端 commit 测试 |
| `scripts/tests/run-command-with-timeout.test.ts` | generator/reviewer 外层超时测试 |
| `scripts/tests/ai-briefing-shell.test.ts` | 临时 Git 仓库 + fake Claude/just/Node CLI 的代表性状态机测试 |
| `scripts/tests/fixtures/ai-briefing/rss.xml` | 合法 RSS fixture |
| `scripts/tests/fixtures/ai-briefing/atom.xml` | 合法 Atom fixture |
| `scripts/tests/fixtures/ai-briefing/doctype.xml` | 必须拒绝的 DOCTYPE fixture |
| `scripts/tests/fixtures/ai-briefing/claude-generator-results.json` | generator 各状态的本地结果 fixture |
| `scripts/tests/fixtures/ai-briefing/claude-reviewer-results.json` | reviewer 各状态的本地结果 fixture |

### 修改文件

| 文件 | 修改内容 |
|---|---|
| `site/package.json`、`site/package-lock.json` | 增加 `fast-xml-parser@5.10.0` |
| `skills/ai-briefing/config/briefing.json` | 日期差窗口、V2 生效日期、动态篇幅、缓存/证据目录和 Feed 限制 |
| `skills/ai-briefing/config/focus-companies.json` | 稳定 `id`、SpaceXAI 等别名和事件类型关键词 |
| `scripts/briefing-skill-config.js` | 加载 source registry 和两个结果 schema |
| `scripts/validate-post.js` | V2 日期/路径、事件数、来源分组、标签/域名和动态篇幅校验 |
| `scripts/tests/validate-post.test.ts` | 新增 V2 测试并将 2099 年 AI fixtures 改为 V2 合法结构 |
| `skills/ai-briefing/SKILL.md`、`README.md` | 新窗口、采集顺序、证据包、V2 写作、单轮 reviewer 与编排模式 |
| `skills/ai-briefing/references/source-map.md` | registry 真源说明和无 Feed 厂商补检入口 |
| `skills/ai-briefing/evals/evals.json` | 48 小时、多源聚类、源失败、单事件和 7+ 事件用例 |
| `skills/tests/ai-skill-sync.test.ts` | 新配置/schema 镜像与关键规则断言 |
| `.claude/agents/ai-briefing-reviewer.md` | 增加 WebFetch/WebSearch，读取证据包并使用动态规则 |
| `.opencode/agents/ai-briefing-reviewer.md` | 明确 edit/bash deny、webfetch/websearch allow 和新版审核规则 |
| `.opencode/commands/publish-ai-briefing.md` | 指向新版编排边界，不绕过 skill |
| `scripts/ai-briefing.sh` | 确定性预检、采集、主 agent、独立 reviewer、门禁、commit/push 和后置验证 |
| `justfile` | 新增 `smoke-ai-briefing-feeds` |
| `.gitignore` | 忽略 `.local/ai-briefing/` |

## 关键接口与代码形态

### 1. AI 简报配置

`skills/ai-briefing/config/briefing.json` 保留旧 `bodyLengthRules`，新增：

```json
{
  "timezone": "Asia/Shanghai",
  "windowStrategy": "calendar-day-gap-hours",
  "initialLookbackHours": 24,
  "contentRulesV2EffectiveDate": "2026-07-15",
  "dynamicBodyLengthRules": [
    { "minEvents": 1, "maxEvents": 1, "min": 450, "max": 800 },
    { "minEvents": 2, "maxEvents": 3, "min": 750, "max": 1300 },
    { "minEvents": 4, "maxEvents": 6, "min": 1100, "max": 1800 },
    { "minEvents": 7, "maxEvents": null, "min": 1500, "max": 2200 }
  ],
  "evidenceRoot": ".local/ai-briefing/runs",
  "feedCacheRoot": ".local/ai-briefing/cache",
  "feedLimits": {
    "timeoutMs": 10000,
    "maxResponseBytes": 2097152,
    "maxItemsPerFeed": 100,
    "maxRedirects": 3,
    "concurrency": 4
  }
}
```

### 2. Source registry 联合类型

CommonJS 文件通过 JSDoc 表达以下形态；JSON 中 `version` 固定为 1：

```javascript
/**
 * @typedef {'standalone'|'needs-corroboration'|'discovery-only'} ConfirmationPolicy
 * @typedef {{default: ConfirmationPolicy, byCategory: Record<string, ConfirmationPolicy>}} ConfirmationPolicyMap
 * @typedef {{
 *   id: string,
 *   companyId: string|null,
 *   publisherId: string,
 *   name: string,
 *   method: 'feed'|'github-release'|'page'|'hugging-face'|'search',
 *   format: 'rss'|'atom'|'html'|'api'|'auto',
 *   url?: string,
 *   queryTemplates?: string[],
 *   authority: 'official'|'primary-record'|'media',
 *   confirmationPolicy: ConfirmationPolicyMap,
 *   categories: string[],
 *   sourceTimezone: string,
 *   allowedRedirectHosts: string[],
 *   allowedArticleHosts: string[],
 *   enabled: boolean
 * }} SourceDefinition
 */
```

首批 registry 必须包含这些稳定 ID：

```text
openai-news-rss
google-ai-rss
google-deepmind-rss
google-research-rss
meta-newsroom-rss
openai-python-releases
anthropic-python-releases
google-genai-python-releases
techcrunch-ai-rss
the-verge-ai-rss
openai-api-changelog
anthropic-news
google-gemini-api-changelog
xai-news
meta-ai
perplexity-changelog
mistral-news
kimi-blog
mimo-home
mimo-hugging-face
deepseek-news
zhipu-news
minimax-news
reuters-media-search
bloomberg-media-search
36kr-media-search
```

TechCrunch/The Verge 的 Feed 和搜索定义共享各自 `publisherId`。Reuters、Bloomberg、36kr 使用 `method: search`、`allowedArticleHosts` 和查询模板，不登记未经验证的 Feed URL。媒体默认 `needs-corroboration`，仅对 `organization/legal/regulation/exclusive` 等明确类别按 registry 设置 `standalone`。

### 3. 窗口结果

```javascript
/**
 * @typedef {{
 *   issueDate: string,
 *   previousIssueDate: string|null,
 *   calendarDayDifference: number|null,
 *   windowHours: number,
 *   windowStart: string,
 *   windowEnd: string,
 *   timezone: 'Asia/Shanghai',
 *   strategy: 'calendar-day-gap-hours'|'initial-lookback'
 * }} BriefingWindow
 */

function calculateBriefingWindow({
  issueDate,
  windowEnd,
  briefingsRoot,
  initialLookbackHours = 24,
}) {}
```

日期差使用校验后的年月日组件和 `Date.UTC` 计算，不能用 `new Date('YYYY-MM-DD')` 的本机时区行为决定日差。

### 4. Feed parser 与安全请求

`fast-xml-parser@5.10.0` 使用 Context7 已核对的 CommonJS API：

```javascript
const { XMLParser, XMLValidator } = siteRequire("fast-xml-parser");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: false,
  htmlEntities: false,
  maxNestedTags: 50,
  strictReservedNames: true,
});
```

在调用 parser 前先执行大小写不敏感的 `<!DOCTYPE` 拒绝和 `XMLValidator.validate(xml)`。RSS/Atom 的单项/多项差异统一通过：

```javascript
function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
```

安全请求使用 Node `https.request`，并把预先验证的公网 DNS 地址绑定到实际 socket 的自定义 `lookup`；不能在 `dns.lookup` 预检后再交给全局 fetch 二次解析。接口支持依赖注入，避免测试访问网络：

```javascript
async function fetchSourceXml(source, cacheEntry, {
  resolveHost = dns.promises.lookup,
  requestImpl = https.request,
  limits,
}) {}
```

每次初始请求和重定向前都校验 HTTPS、hostname、DNS 解析出的全部 IPv4/IPv6 地址和 `allowedRedirectHosts`；从验证结果选择一个地址，并向 `https.request` 传入固定返回该地址的 `lookup` 回调，同时保留原 hostname 作为 TLS SNI/Host。响应流分块累计，超过 `maxResponseBytes` 立即 `request.destroy()`。每一跳都重新解析、重新验证并重新绑定，测试必须证明实际 request 收到的是已验证地址，而不是再次解析后的地址。

### 5. Collection 与 Selection

```javascript
/** @typedef {'success'|'degraded'|'failed'|'not-configured'} CoverageStatus */
/** @typedef {'complete'|'partial'|'unknown'} WindowCoverage */

// collection.json 中每个确定性来源
{
  "sourceId": "openai-news-rss",
  "companyId": "openai",
  "status": "success",
  "checkedAt": "2026-07-15T00:00:00.000Z",
  "windowCoverage": "complete",
  "oldestVisibleAt": "2026-07-13T00:00:00.000Z",
  "fromCache": false,
  "candidates": []
}

// collection/discovery 中每个时间证据
{
  "publishedAt": "2026-07-14T12:00:00.000Z",
  "effectiveAt": "2026-07-14T12:00:00.000Z",
  "timePrecision": "timestamp",
  "sourceTimezone": "UTC",
  "timeConvention": "exact",
  "withinWindow": true
}

// discovery.json 中每个非 Feed 路径
{
  "sourceId": "openai-api-changelog",
  "companyId": "openai",
  "method": "page",
  "status": "success",
  "checkedAt": "2026-07-15T00:05:00.000Z",
  "error": null,
  "evidence": [
    {
      "evidenceId": "page:openai-api-changelog",
      "url": "https://platform.openai.com/docs/changelog",
      "title": "API Changelog",
      "effectiveAt": "2026-07-15T06:59:59.999Z",
      "timePrecision": "date",
      "sourceTimezone": "America/Los_Angeles",
      "timeConvention": "date-end-convention"
    }
  ]
}

// selection.json 中最终事件
{
  "events": [
    {
      "eventId": "openai-model-update",
      "title": "OpenAI 更新模型 API",
      "eventType": "api",
      "included": true,
      "candidateIds": ["sha256:..."],
      "sourceRefs": [
        {
          "sourceId": "openai-api-changelog",
          "url": "https://platform.openai.com/docs/changelog",
          "evidenceId": "page:openai-api-changelog",
          "label": "官方"
        }
      ],
      "materialDelta": "新增可核验 API 能力",
      "historyMatches": []
    }
  ],
  "coverage": []
}

// self-review.json
{
  "windowChecked": true,
  "recentFiveChecked": true,
  "priorityCoverageChecked": true,
  "highRiskUnconfirmedItems": [],
  "conclusion": "通过"
}
```

统一时间规则由 verifier 执行：`effectiveAt > windowStart && effectiveAt <= windowEnd`。开始点严格排除，结束点包含。官方日期级证据按 registry `sourceTimezone` 转换到该日 23:59:59.999，并标记 `date-end-convention`；媒体日期级证据即使处于窗口也不参与任何确认策略，只能保留为待核验线索。

IANA 时区日期转换不依赖本机时区，也不新增日期库。实现 `zonedDateTimeToUtc(parts, timeZone)`：以 `Date.UTC` 作为初始猜测，用 `Intl.DateTimeFormat(..., { timeZone }).formatToParts()` 计算观测偏移并迭代校正两次。日期日末通过“来源时区次日 00:00:00.000 转 UTC 后减 1ms”得到，避免 DST 日固定加 24 小时。至少测试 `Asia/Shanghai` 和 `America/Los_Angeles`。

### 6. 来源确认策略

```javascript
function resolveConfirmationPolicy(source, eventType) {
  return source.confirmationPolicy.byCategory[eventType]
    ?? source.confirmationPolicy.default;
}

function isConfirmedEvent(event, sourceById) {
  const resolved = event.sourceRefs.map((ref) => ({
    source: sourceById.get(ref.sourceId),
    policy: resolveConfirmationPolicy(sourceById.get(ref.sourceId), event.eventType),
  }));

  if (resolved.some(({ policy }) => policy === "standalone")) return true;

  const independentPublishers = new Set(
    resolved
      .filter(({ policy }) => policy === "needs-corroboration")
      .map(({ source }) => source.publisherId),
  );
  return independentPublishers.size >= 2;
}
```

`discovery-only` 永不计入确认；两个同 publisher 的来源不能组成双源。

来源标签映射固定为：

```javascript
const AUTHORITY_LABELS = {
  official: "官方",
  "primary-record": "原始文件",
  media: "媒体报道",
};
```

`selection.sourceRefs[].label`、公开 Markdown 标签和 registry authority 必须三者一致。

### 7. 新版 Markdown 解析结果

```javascript
{
  "overviewItems": ["OpenAI 更新模型 API"],
  "eventHeadings": ["OpenAI 更新模型 API"],
  "sourceGroups": [
    {
      "heading": "OpenAI 更新模型 API",
      "sources": [
        {
          "label": "官方",
          "title": "OpenAI API Changelog",
          "url": "https://platform.openai.com/docs/changelog"
        }
      ]
    }
  ]
}
```

`## 重点动态` 和可选 `## 补充更新` 的 `###` 合并为事件标题；`## 为什么值得关注` 下的标题不参与事件数。

### 8. Claude 结果 schema

Generator 顶层使用 Claude Structured Outputs 支持的 `anyOf` 和 `status.const`；Claude CLI 的 `--json-schema` 参数传入 schema 文件内容，不传文件路径。JSON 和 stream-json 都必须从 `structured_output` 提取结果，字段缺失时立即失败：

- `draft_ready`：`issueDate`、`filePath`、`selectionPath`、`selfReviewConclusion`。
- `no_events`：`issueDate`、`reason`。
- `blocked`：`issueDate`、`reason`、`blockers[]`。
- `failed`：`issueDate`、`reason`。

Reviewer：

- `approved`：`conclusion` 必须为 `可进入发布门禁`，并包含三项证据质量摘要。
- `needs_changes`：包含 `blockers[]` 和可执行修改要求。
- `blocked`：包含阻断原因。

### 9. 无人值守编排控制流

```bash
preflight
create_run_dir
calculate_window
collect_feeds
capture_immutable_hashes
run_generator_without_git_permissions
verify_generator_result_and_side_effects
run_read_only_reviewer_once
verify_reviewer_result
just validate-content-file "$BRIEFING_FILE"
just build-site-ai-data
stage_exact_files
git commit -m "docs(ai-briefing): 发布 $ISSUE_DATE AI 简报"
git push
git fetch origin "$DEPLOY_BRANCH"
verify_remote_contains_commit
```

主 agent 工具白名单不包含 Bash；独立 reviewer 也不包含 Bash/Edit。外层脚本是唯一可以执行 Git 写操作的组件。

主 agent 和 reviewer 分别通过 `scripts/run-command-with-timeout.js` 启动，默认超时由 `AI_BRIEFING_GENERATOR_TIMEOUT_SECONDS` 和 `AI_BRIEFING_REVIEWER_TIMEOUT_SECONDS` 控制。超时 wrapper 在独立进程组中启动命令，先发送 SIGTERM，5 秒后仍未退出则 SIGKILL，并统一返回 124。

## 执行任务

### 任务 1：建立依赖、配置、来源注册表和结果 schema

**文件：**
- 新建：`skills/ai-briefing/config/source-registry.json`
- 新建：`skills/ai-briefing/config/generator-result.schema.json`
- 新建：`skills/ai-briefing/config/reviewer-result.schema.json`
- 新建：`scripts/tests/briefing-skill-config.test.ts`
- 修改：`skills/ai-briefing/config/briefing.json`
- 修改：`skills/ai-briefing/config/focus-companies.json`
- 修改：`scripts/briefing-skill-config.js`
- 修改：`site/package.json`
- 修改：`site/package-lock.json`
- 修改：`skills/tests/ai-skill-sync.test.ts`

**设计关联：** source registry 机器真源、动态篇幅配置、稳定厂商 ID、结构化 Claude 状态和单一 XML 依赖。

**验收标准：**
- [x] `loadAiBriefingSkillConfig()` 返回 `briefing`、`focusCompanies`、`sourceRegistry`、`generatorResultSchema`、`reviewerResultSchema`。
- [x] registry 中所有启用网络源使用 HTTPS；ID、publisherId 唯一；`sourceTimezone` 是有效 IANA 时区；所有 priority company 至少配置一个非 search 官方路径和一个 search 补检路径。
- [x] 首批 10 个 Feed/Atom ID 和 16 个页面/搜索 ID 全部存在。
- [x] `fast-xml-parser` 在 package 和 lockfile 中均固定解析为 5.10.0。

- [x] **步骤 1：先写配置加载失败测试**

```typescript
import { beforeAll, describe, expect, it } from "vitest";

let loadAiBriefingSkillConfig: () => {
  briefing: Record<string, unknown>;
  focusCompanies: Array<{ id: string; priorityFocus: boolean }>;
  sourceRegistry: { version: number; sources: Array<Record<string, unknown>> };
  generatorResultSchema: Record<string, unknown>;
  reviewerResultSchema: Record<string, unknown>;
};

beforeAll(async () => {
  ({ loadAiBriefingSkillConfig } = await import("../briefing-skill-config.js"));
});

it("loads the complete AI briefing machine configuration", () => {
  const config = loadAiBriefingSkillConfig();
  expect(config.briefing.contentRulesV2EffectiveDate).toBe("2026-07-15");
  expect(config.sourceRegistry.version).toBe(1);
  expect(config.generatorResultSchema.anyOf).toBeInstanceOf(Array);
  expect(config.reviewerResultSchema.anyOf).toBeInstanceOf(Array);
});
```

- [x] **步骤 2：运行测试确认缺少新配置**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/briefing-skill-config.test.ts
```

期望：失败，原因是 loader 尚未返回 `sourceRegistry` 或 schema。

- [x] **步骤 3：安装唯一新增依赖**

运行：

```bash
npm --prefix site install --save-exact fast-xml-parser@5.10.0
```

期望：`site/package.json` 出现 `"fast-xml-parser": "5.10.0"`，lockfile 的解析版本为 `5.10.0`。

- [x] **步骤 4：写入 briefing/focus/source/schema 配置**

严格使用“关键接口与代码形态”定义的字段。`focus-companies.json` 每项增加稳定小写 `id`；xAI aliases 至少包含 `SpaceXAI`、`Grok`、`xAI`。结果 schema 使用 `anyOf + status.const`，设置 `additionalProperties: false`，每个状态仅要求该分支所需字段。

- [x] **步骤 5：扩展配置 loader**

```javascript
function loadAiBriefingSkillConfig() {
  return {
    briefing: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "briefing.json"),
    focusCompanies: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "focus-companies.json"),
    sourceRegistry: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "source-registry.json"),
    generatorResultSchema: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "generator-result.schema.json"),
    reviewerResultSchema: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "reviewer-result.schema.json"),
  };
}
```

- [x] **步骤 6：扩展镜像与 registry 约束测试**

在 `mirroredFiles` 中加入三个新 JSON；增加 ID 唯一、HTTPS、priority company 路径和固定 source ID 断言。镜像目录是符号链接，只修改 `skills/ai-briefing/` 真源。

- [x] **步骤 7：运行配置和同步测试**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/briefing-skill-config.test.ts skills/tests/ai-skill-sync.test.ts
```

期望：全部通过。

### 任务 2：实现日期差窗口计算器

**文件：**
- 新建：`scripts/ai-briefing-window.js`
- 新建：`scripts/tests/ai-briefing-window.test.ts`

**设计关联：** 日期差 × 24 小时、无历史回退、同日/未来时间线阻断、不新增发布时间字段。

**验收标准：**
- [x] 2026-07-15 对 2026-07-14/13/12 分别返回 24/48/72 小时。
- [x] 只读取 `published: true` 且日期早于 issueDate 的 `.md`。
- [x] 无历史使用 24 小时；同日或未来已发布文件抛出明确错误。
- [x] CLI 能将稳定 JSON 写到 `--output`，便于 shell 生成 `window.json`。

- [x] **步骤 1：写窗口 happy-path 与异常测试**

```typescript
it.each([
  ["2026-07-14", 1, 24],
  ["2026-07-13", 2, 48],
  ["2026-07-12", 3, 72],
])("uses calendar-day gap from %s", (previousDate, dayDifference, windowHours) => {
  writePublishedBriefing(previousDate);
  const result = calculateBriefingWindow({
    issueDate: "2026-07-15",
    windowEnd: "2026-07-15T00:00:00.000Z",
    briefingsRoot: tempRoot,
    initialLookbackHours: 24,
  });
  expect(result.calendarDayDifference).toBe(dayDifference);
  expect(result.windowHours).toBe(windowHours);
});

it("rejects published briefings on or after the issue date", () => {
  writePublishedBriefing("2026-07-15");
  expect(() => calculateBriefingWindow(input)).toThrow("已存在同日或未来日期的已发布 AI 简报");
});
```

- [x] **步骤 2：运行测试确认模块不存在**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/ai-briefing-window.test.ts
```

期望：失败，找不到 `ai-briefing-window.js`。

- [x] **步骤 3：实现纯函数和递归历史扫描**

导出：

```javascript
module.exports = {
  calculateBriefingWindow,
  differenceInCalendarDays,
  findPreviousPublishedBriefing,
  getShanghaiDate,
  parseCalendarDate,
};
```

frontmatter 使用 `siteRequire("gray-matter")`；日期比较先严格验证 `YYYY-MM-DD` 和真实年月日，再使用 UTC 组件算日差。

- [x] **步骤 4：实现 CLI**

支持：

```text
node scripts/ai-briefing-window.js \
  --issue-date 2026-07-15 \
  --window-end 2026-07-15T00:00:00.000Z \
  --output .local/ai-briefing/runs/<run-id>/window.json
```

未传 issueDate/windowEnd 时按 Asia/Shanghai 当前日期和当前时刻计算。写文件前创建父目录；stdout 只输出摘要，JSON 使用两个空格缩进并以换行结束。

- [x] **步骤 5：运行单测和 CLI fixture 验证**

运行窗口测试；再由测试用临时目录调用 CLI，断言输出 JSON 的 `strategy/windowHours/windowStart/windowEnd`。

期望：全部通过，不修改真实 `content/`。

### 任务 3：实现安全 RSS/Atom 采集器、缓存与 coverage

**文件：**
- 新建：`scripts/collect-ai-briefing-feeds.js`
- 新建：`scripts/tests/collect-ai-briefing-feeds.test.ts`
- 新建：`scripts/tests/fixtures/ai-briefing/rss.xml`
- 新建：`scripts/tests/fixtures/ai-briefing/atom.xml`
- 新建：`scripts/tests/fixtures/ai-briefing/doctype.xml`

**设计关联：** RSS/Atom 候选发现、安全边界、ETag/Last-Modified、单源失败隔离和长窗口截断补检。

**验收标准：**
- [x] RSS 与 Atom 均规范化为相同 candidate 形态，时间统一为 ISO 字符串。
- [x] DOCTYPE、非 HTTPS、IP literal、私网 DNS、未授权重定向、超限响应和超时均失败。
- [x] 304 使用已有缓存；无缓存 304 失败；失败不覆盖成功缓存。
- [x] 最旧条目晚于 windowStart、缺时间或达到 100 条时为 partial/unknown。
- [x] `Promise.allSettled` 保证一个源失败时其他源仍返回。
- [x] 相同 GUID、规范 URL 或官方落地页形成同一确定性 cluster；不同版本/价格且无相同确定性键的候选保持分离。

- [x] **步骤 1：编写 RSS/Atom 规范化测试**

```typescript
it("normalizes RSS and Atom into the same candidate contract", () => {
  const rss = parseFeedXml(readFixture("rss.xml"), rssSource);
  const atom = parseFeedXml(readFixture("atom.xml"), atomSource);
  expect(rss[0]).toMatchObject({
    sourceId: rssSource.id,
    companyId: "openai",
    canonicalUrl: expect.stringMatching(/^https:\/\//),
    timePrecision: "timestamp",
  });
  expect(atom[0].contentHash).toMatch(/^sha256:/);
});

it("clusters only candidates sharing deterministic identity keys", () => {
  expect(clusterDeterministicCandidates([sameGuidA, sameGuidB])).toHaveLength(1);
  expect(clusterDeterministicCandidates([sameCanonicalUrlA, sameCanonicalUrlB])).toHaveLength(1);
  expect(clusterDeterministicCandidates([sameOfficialLandingA, sameOfficialLandingB])).toHaveLength(1);
  expect(clusterDeterministicCandidates([versionFive, versionSix])).toHaveLength(2);
});
```

- [x] **步骤 2：编写网络安全与缓存失败测试**

覆盖以下断言：

```typescript
await expect(fetchSourceXml(httpSource, null, deps)).rejects.toThrow("只允许 HTTPS");
await expect(fetchSourceXml(source, null, privateDnsDeps)).rejects.toThrow("解析到非公网地址");
expect(() => parseFeedXml(readFixture("doctype.xml"), source)).toThrow("DOCTYPE");
await expect(readResponseBody(oversizedResponse, 1024)).rejects.toThrow("响应体超过 1024 字节");
```

增加 DNS 绑定断言：`resolveHost` 返回公开地址后，fake `requestImpl` 必须收到固定 `lookup`，调用该 lookup 得到同一公开地址；重定向到第二个 host 时必须再次解析，解析到私网即失败，不能发出第二跳请求。

- [x] **步骤 3：运行测试确认失败**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/collect-ai-briefing-feeds.test.ts
```

期望：失败，采集模块尚不存在。

- [x] **步骤 4：实现 XML parser 和 candidate 规范化**

使用“关键接口与代码形态”的 parser 配置。导出：

```javascript
module.exports = {
  asArray,
  collectFeedSources,
  collectSingleFeed,
  clusterDeterministicCandidates,
  computeWindowCoverage,
  fetchSourceXml,
  getDeterministicClusterKeys,
  isPublicIp,
  normalizeFeedItem,
  normalizeUrl,
  parseFeedXml,
  readResponseBody,
  sanitizeText,
};
```

稳定 ID 优先使用 `guid/id`，否则使用规范 URL，最后使用 `sourceId + title + publishedAt`；所有 ID 和正文哈希使用 SHA-256。

确定性聚类只使用 `guid`、`canonicalUrl`、`officialLandingUrl` 三类键并采用并查集/连通分量合并；产品版本、价格和开放范围等语义字段不在此阶段模糊合并。剩余语义聚类仍由主 agent 完成，并在 selection 中写明理由和 `materialDelta`。

- [x] **步骤 5：实现绑定已验证 DNS 的安全请求和手动重定向**

每跳重新执行 URL、host、DNS 和 allowlist 检查。使用 `https.request` 的自定义 lookup 将已验证地址绑定到实际连接；保留原 hostname 供 TLS SNI 和 Host。使用 request timeout 与显式 timer，读取完成或失败后清除。响应只接受 200、3xx 受控重定向和 304；其他状态记录为 source failure。

- [x] **步骤 6：实现原子缓存和 coverage**

缓存写入 `<sourceId>.json.tmp` 后 rename。304 缓存必须包含 `items`。coverage 计算优先考虑 100 条截断，再看可比较的最旧时间；`partial/unknown` 写入 collection，不能静默变成 success-complete。

- [x] **步骤 7：实现 collection CLI 和 health-check**

常规：

```text
node scripts/collect-ai-briefing-feeds.js \
  --window-file <run-dir>/window.json \
  --output <run-dir>/collection.json
```

实时健康检查：

```text
node scripts/collect-ai-briefing-feeds.js --health-check
```

health-check 输出每个启用 Feed 的 `sourceId/status/itemCount/oldestVisibleAt`，任一启用源失败时退出非零。

- [x] **步骤 8：运行完整 collector 测试**

期望：fixture 测试全部通过且没有外网请求。

### 任务 4：为 2026-07-15 起的简报增加 V2 Markdown 门禁

**文件：**
- 修改：`scripts/validate-post.js`
- 修改：`scripts/tests/validate-post.test.ts`

**设计关联：** 一事件一标题、来源分组、允许域名、动态字数、日期/路径一致和历史兼容。

**验收标准：**
- [x] 2026-07-14 及以前继续走旧校验，不要求来源分组。
- [x] 2026-07-15 起，速览 bullet、重点/补充事件标题和来源 group 数量及标题集合相等。
- [x] 来源条目必须为 HTTPS、允许标签、registry 已知 host；每个事件至少一个来源。
- [x] 1/2/4/7 个事件分别使用 450～800、750～1300、1100～1800、1500～2200 字范围。
- [x] 文件名、目录年月和 frontmatter date 不一致时失败。

- [x] **步骤 1：先写 V2 合法单事件 fixture**

```markdown
## 速览

- OpenAI 更新模型 API。

## 重点动态

### OpenAI 更新模型 API

这里写入 450～800 个中文汉字的有效正文。

## 为什么值得关注

跨事件影响判断。

## 来源

### OpenAI 更新模型 API

- [官方] [OpenAI API Changelog](https://platform.openai.com/docs/changelog)
```

先断言合法 fixture 通过，再通过变体分别触发计数、标题、标签、HTTP、未知域名和字数错误。

- [x] **步骤 2：调整现有 2099 年 AI fixtures**

现有 AI 测试日期为 2099，会自动进入 V2。将它们改为来源分组结构，并把 `example.com` 换成 registry 允许的 `openai.com` 或 `platform.openai.com`；测试本身要触发的唯一错误保持不变。2026-05-25 等 legacy fixture 不改结构，用于证明兼容。

- [x] **步骤 3：运行测试确认新增断言失败**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/validate-post.test.ts
```

期望：V2 新测试失败，旧测试仍可识别原有错误。

- [x] **步骤 4：实现 V2 解析 helper**

新增并保持在 `validate-post.js` 内部，不重构无关投资简报逻辑：

```javascript
function extractSubsections(body, sectionHeading) {}
function extractOverviewItems(body, sectionHeading) {}
function extractAiSourceGroups(body, sourceSectionHeading) {}
function getAiEventHeadings(body) {}
function resolveDynamicAiBodyLengthRule(eventCount) {}
function validateAiBriefingV2({ file, relativeFile, parsed, dateClean }) {}
```

来源 bullet 使用严格正则解析 label/title/URL；URL 通过 `new URL()` 验证 protocol 和 hostname。允许 host 来自 registry 的 `url`、`allowedArticleHosts`、`allowedRedirectHosts`。

- [x] **步骤 5：接入生效日期和动态篇幅**

`validateBriefingFile()` 在通用 frontmatter/required sections 后分支：V2 走新结构与动态范围；旧日期继续 `resolveAiBodyLengthRule()`。`## 补充更新` 可选，不加入 requiredSections。

- [x] **步骤 6：增加路径日期一致检查**

从 `content/ai-briefings/YYYY/MM/YYYY-MM-DD-ai-briefing.md` 提取年月日并与 frontmatter date 比较，错误信息包含期望路径和实际日期。

- [x] **步骤 7：运行 validator 测试和全内容校验**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/validate-post.test.ts
just validate-content
```

期望：测试通过，现有历史内容不产生新错误。

### 任务 5：实现证据策略与发布后置验证器

**文件：**
- 新建：`scripts/verify-ai-briefing-run.js`
- 新建：`scripts/tests/verify-ai-briefing-run.test.ts`
- 新建：`scripts/tests/fixtures/ai-briefing/claude-generator-results.json`
- 新建：`scripts/tests/fixtures/ai-briefing/claude-reviewer-results.json`

**设计关联：** 事件类型确认策略、重点厂商覆盖、immutable hash、Claude 判别联合类型、副作用和远端 commit 验证。

**验收标准：**
- [x] generator/reviewer 的 JSON 与 stream-json result event 都能解析，未知或缺字段状态失败。
- [x] 一个 standalone 或两个不同 publisher 的 needs-corroboration 可以确认；同 publisher 双源不可以。
- [x] `(windowStart, windowEnd]` 严格执行；官方日期级证据采用来源时区日末，媒体日期级证据不能独立确认。
- [x] priority company 所有路径失败或 Feed partial 且没有成功补检时阻断。
- [x] collection/discovery/selection/self-review 缺少必需字段、included candidate 重复归属或覆盖状态矛盾时阻断。
- [x] Markdown 标签必须与 selection label 和 registry authority 映射一致。
- [x] window/collection 任一哈希变化时阻断。
- [x] commit 文件集合不是“本期简报 + index.json”时阻断；fetch 后 `merge-base --is-ancestor` 失败时发布验证失败。

- [x] **步骤 1：写策略和状态解析测试**

```typescript
it("requires two independent publishers for corroboration", () => {
  expect(isConfirmedEvent(eventWithTwoReutersSources, sourceById)).toBe(false);
  expect(isConfirmedEvent(eventWithReutersAndBloomberg, sourceById)).toBe(true);
});

it("parses the final result from stream-json", () => {
  expect(parseClaudeOutput(streamFixture).status).toBe("draft_ready");
});

it("uses an open-start closed-end window", () => {
  expect(isWithinWindow(windowStart, window)).toBe(false);
  expect(isWithinWindow(windowEnd, window)).toBe(true);
});

it("converts a source-local date to the local day end", () => {
  expect(computeDateEndEffectiveAt("2026-07-14", "America/Los_Angeles"))
    .toBe("2026-07-15T06:59:59.999Z");
});

it("rejects media date-only evidence as standalone confirmation", () => {
  expect(isConfirmedEvent(mediaDateOnlyEvent, sourceById)).toBe(false);
});

it("requires authority labels to match registry", () => {
  expect(() => validatePublicSourceLabels(mislabeledOfficialAsMedia, sourceById)).toThrow("来源标签与 authority 不一致");
});
```

- [x] **步骤 2：写哈希、副作用与远端失败测试**

```typescript
expect(() => verifyImmutableFiles({
  windowPath,
  expectedWindowHash: originalHash,
  collectionPath,
  expectedCollectionHash: originalCollectionHash,
})).not.toThrow();

fs.appendFileSync(windowPath, "\n");
expect(() => verifyImmutableFiles(input)).toThrow("window.json 已被修改");
```

为 `verifyRemoteContainsCommit` 注入 `runGit`；断言它按顺序调用 fetch 和 merge-base，并在 merge-base 非零时失败。

为 `verifyCommittedFileSet` 注入 `runGit`，让其解析：

```text
git diff-tree --no-commit-id --name-only -r <commit>
```

只有本期简报和 `site/public/ai-data/briefings/index.json` 两个路径时通过；多出 hook 或 agent 引入的文件必须失败。无人值守脚本运行前要求 `git status --porcelain` 完全为空，因此不需要维护复杂的脏工作区基线。

- [x] **步骤 3：运行测试确认模块不存在**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts scripts/tests/verify-ai-briefing-run.test.ts
```

- [x] **步骤 4：实现纯验证函数**

导出：

```javascript
module.exports = {
  collectAllowedChangedFiles,
  computeDateEndEffectiveAt,
  isConfirmedEvent,
  isWithinWindow,
  parseClaudeOutput,
  resolveConfirmationPolicy,
  sha256File,
  validateCollectionContract,
  validateCoverage,
  validateDiscoveryContract,
  validateGeneratorResult,
  validatePublicSourceLabels,
  validateReviewerResult,
  validateSelectionContract,
  validateSelectionEvidence,
  validateSelfReviewContract,
  verifyCommittedFileSet,
  verifyImmutableFiles,
  verifyRemoteContainsCommit,
};
```

契约验证规则：

- collection source 必须具有 sourceId/companyId/status/checkedAt/windowCoverage/candidates；candidate 必须具有 `effectiveAt/timePrecision/sourceTimezone/timeConvention/withinWindow`。
- discovery path 必须具有 method/status/checkedAt/error/evidence；成功路径至少一条 evidence，失败路径必须有 error。
- selection included event 必须具有 eventId/title/eventType/candidateIds/sourceRefs/materialDelta/historyMatches；同一 candidateId 不能属于两个 included event。
- self-review 必须显式确认 window、recent five、priority coverage，并给出 conclusion。

`validateSelectionEvidence` 还需验证：included event 标题与 Markdown 来源 group 精确对应、sourceRef URL 与公开 URL 一致、sourceId 存在、事件类型在 source categories 内或 source categories 包含通配语义、label 等于 authority 固定映射。所有 evidence 先通过 `isWithinWindow`；媒体 `timePrecision: date` 不参与 standalone 或 needs-corroboration 判断。

- [x] **步骤 5：实现 CLI 子命令**

```text
parse-generator --input <claude-output> --run-dir <dir> --issue-date <date>
verify-pre-review --run-dir <dir> --expected-window-hash <hash> --expected-collection-hash <hash>
verify-reviewer --input <reviewer-output> --run-dir <dir>
verify-pre-commit --run-dir <dir> --briefing-file <path> --index-file <path>
verify-committed-files --commit <hash> --briefing-file <path> --index-file <path>
verify-post-push --run-dir <dir> --commit <hash> --branch <branch>
```

所有子命令成功时将结果合并写入 `verification.json`；失败时 stderr 包含具体门禁名并退出 1。

- [x] **步骤 6：运行 verifier 测试**

期望：所有纯函数和 CLI fixture 测试通过，不调用真实 Git 远端。

### 任务 6：同步 Skill、来源文档、Eval 和两套 Reviewer

**文件：**
- 修改：`skills/ai-briefing/SKILL.md`
- 修改：`skills/ai-briefing/README.md`
- 修改：`skills/ai-briefing/references/source-map.md`
- 修改：`skills/ai-briefing/evals/evals.json`
- 修改：`skills/tests/ai-skill-sync.test.ts`
- 修改：`.claude/agents/ai-briefing-reviewer.md`
- 修改：`.opencode/agents/ai-briefing-reviewer.md`
- 修改：`.opencode/commands/publish-ai-briefing.md`

**设计关联：** 新窗口、RSS 优先采集、多路径覆盖、动态成稿、来源分组、只读独立复审和单轮审核边界。

**验收标准：**
- [x] 所有“默认过去 24 小时”改为日期差窗口，并保留无历史 24 小时兜底。
- [x] 不再固定要求 900～1300 字；明确 V2 生效日和四档动态范围。
- [x] 明确 registry/证据包、Feed partial 补检、每事件来源 group 和媒体策略。
- [x] reviewer 读取 `window/collection/discovery/selection/self-review`，使用动态规则并只读联网。
- [x] 独立 reviewer 只运行一轮；不通过时本轮停止。

- [x] **步骤 1：先扩充文本行为断言**

在 `ai-skill-sync.test.ts` 增加：

```typescript
expect(skill).toContain("日期差 × 24 小时");
expect(skill).toContain("contentRulesV2EffectiveDate");
expect(skill).toContain("## 补充更新");
expect(skill).not.toContain("当前执行时刻向前回溯 24 小时");
expect(skill).not.toContain("最多执行 3 轮审核");
```

同时断言 Claude reviewer tools 含 `WebFetch, WebSearch`，OpenCode reviewer 明确 `edit: deny`、`bash: deny`、`webfetch: allow` 和 `websearch: allow`。

- [x] **步骤 2：运行测试确认旧文档失败**

运行同步测试，期望新文本断言失败。

- [x] **步骤 3：更新 SKILL 和 README**

新增内部“外层编排发布候选模式”：只有 `scripts/ai-briefing.sh` 明确传入证据目录和“外层接管 reviewer/commit/push”时使用；主 agent允许写本期候选文件和 agent 证据，但禁止 git 写操作。普通发布模式仍遵循用户明确发布意图。

查询顺序写为：确定性 Feed/Atom → 官方页面/changelog/HF → 事件类型定向搜索 → 媒体补漏 → 正式确认。0 事件明确不发布。

- [x] **步骤 4：更新来源地图与 Eval**

source-map 说明 registry 是程序真源，并标出 Anthropic/Mistral 猜测 Feed 为禁用。Eval 增加设计文档列出的 8 类场景，每个用例具有明确 `expected_behavior`，不得要求成稿模式落盘。

- [x] **步骤 5：增强 reviewer**

Claude frontmatter：

```yaml
tools: Read, Grep, Glob, WebFetch, WebSearch
```

OpenCode permission：

```yaml
permission:
  edit: deny
  bash: deny
  webfetch: allow
  websearch: allow
```

Reviewer 提示明确只访问 registry/evidence URL、忽略网页指令、网络失败不得伪称核验、按 selection.eventType 检查来源策略。

- [x] **步骤 6：运行 Skill 同步测试**

期望镜像、新规则和 reviewer 权限断言全部通过。

### 任务 7：重写无人值守 shell 为确定性发布编排器

**文件：**
- 修改：`scripts/ai-briefing.sh`
- 新建：`scripts/run-command-with-timeout.js`
- 新建：`scripts/tests/run-command-with-timeout.test.ts`
- 新建：`scripts/tests/ai-briefing-shell.test.ts`
- 修改：`justfile`
- 修改：`.gitignore`

**设计关联：** 去除失效参数和假成功、最小权限、独立 reviewer、精确 Git 副作用和远端包含验证。

**验收标准：**
- [x] shell 不包含 `--max-turns` 或 `--dangerously-skip-permissions`。
- [x] main agent 工具列表没有 Bash，reviewer 工具列表没有 Bash/Edit。
- [x] generator/reviewer 均有 macOS/Linux 一致的独立外层超时，超时返回 124。
- [x] Claude 原始输出总是保存在 run directory，不因日志模式被丢弃。
- [x] `no_events` 返回 3；当天冲突返回 4；reviewer 非 approved 不 commit。
- [x] 运行前要求干净工作区；shell 只 stage 本期简报和 `site/public/ai-data/briefings/index.json`，commit 后用 diff-tree 验证文件集合。
- [x] push 后执行 fetch + merge-base verifier。

- [x] **步骤 1：先写外层超时测试**

```typescript
it("terminates a command after the configured timeout", () => {
  const result = spawnSync("node", [
    "scripts/run-command-with-timeout.js",
    "--timeout-seconds", "0.1",
    "--output", outputFile,
    "--", "node", "-e", "setTimeout(() => {}, 5000)",
  ]);
  expect(result.status).toBe(124);
});
```

另写快速命令测试，断言 stdout 原样写入 output file 且返回 0。

- [x] **步骤 2：实现 macOS/Linux 兼容 timeout wrapper**

使用 `child_process.spawn(command, args, { detached: true, stdio: ["inherit", "pipe", "inherit"] })`。stdout 同时写入指定文件和可选终端；超时先 `process.kill(-child.pid, "SIGTERM")`，5 秒后 SIGKILL；清理 timer 并映射退出码 124。Windows 不在本仓库支持范围，但普通非 detached fallback 不得影响 Node 单测。

- [x] **步骤 3：先写临时仓库 shell 状态机测试**

测试 helper 创建临时 Git 仓库，复制 `scripts/ai-briefing.sh`，写入最小 config/schema 和 stub Node CLI，并把 fake `claude`、`just` 放到临时 PATH。至少覆盖：

```typescript
it("returns 3 for no_events and keeps raw output", () => {
  const result = runOrchestrator({ generatorStatus: "no_events" });
  expect(result.status).toBe(3);
  expect(findRunFile("claude-output.json")).toBeTruthy();
  expect(gitCommitCount()).toBe(1); // 只有 fixture 初始提交
});

it("returns 4 before invoking Claude when today's file exists", () => {
  const result = runOrchestrator({ existingBriefing: true });
  expect(result.status).toBe(4);
  expect(readClaudeInvocationLog()).toEqual([]);
});

it("does not commit when the independent reviewer blocks", () => {
  const result = runOrchestrator({ generatorStatus: "draft_ready", reviewerStatus: "blocked" });
  expect(result.status).not.toBe(0);
  expect(gitCommitCount()).toBe(1);
});

it("fails when post-push remote verification fails", () => {
  const result = runOrchestrator({ remoteContainsCommit: false });
  expect(result.status).not.toBe(0);
  expect(readVerificationCalls()).toContain("verify-post-push");
});
```

fake generator/reviewer 分别输出带 `structured_output` 的 JSON；draft_ready fake 同时创建正式文件和 discovery/selection/self-review。测试还要断言 generator/reviewer 是两个独立调用、reviewer 参数含 `--agent ai-briefing-reviewer`、精确 stage 参数只有两个允许文件。

- [x] **步骤 4：运行新增测试并确认旧 shell/timeout 缺失**

运行：

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/run-command-with-timeout.test.ts \
  scripts/tests/ai-briefing-shell.test.ts
```

- [x] **步骤 5：实现预检和 run directory**

保留 macOS `mkdir` lock。新增：检查 `main`/指定部署分支、upstream、behind/diverged，并要求 `git status --porcelain --untracked-files=all` 完全为空；当天文件冲突在 Claude 前返回 4。创建 `.local/ai-briefing/runs/$RUN_ID`，RUN_ID 增加 PID 或随机后缀避免同秒冲突。证据和日志目录已被 ignore，因此不会破坏干净检查。

- [x] **步骤 6：接入 window/collector 和不可变哈希**

外层脚本运行两个 Node CLI。哈希使用 Node `crypto`，不依赖 GNU `sha256sum`；哈希值保留在 shell 变量并传给 verifier，不写入 agent 可同时篡改的 manifest。

- [x] **步骤 7：实现 generator 调用**

读取 `generator-result.schema.json` 的完整 JSON 文本并传给 `--json-schema "$GENERATOR_SCHEMA"`，不能传文件路径。使用 `--permission-mode dontAsk`，并同时传入同一组 `--tools` 与 `--allowedTools`，使可用且自动批准的工具严格限制为 Read/Glob/Grep/WebFetch/WebSearch/Write/Edit；不允许 Bash。设置 `AI_BRIEFING_MAX_BUDGET_USD` 时附加 `--max-budget-usd`。

通过 timeout wrapper 启动，默认 `AI_BRIEFING_GENERATOR_TIMEOUT_SECONDS=1800`。输出始终写 `claude-output.json`，LOG_OUTPUT_MODE=paragraph 时额外镜像到终端；stream 模式保存 NDJSON。verifier 必须从顶层或最终 result event 的 `structured_output` 读取状态；缺失即失败，不能回退解析自然语言 `result`。

Prompt 必须包含 issueDate、windowStart/windowEnd、runDir、registry 路径、候选文件路径，并写明外层脚本接管独立 reviewer、commit 和 push。

- [x] **步骤 8：按 generator status 分流**

- `draft_ready`：运行 immutable hash、副作用、selection 和正式文件预审。
- `no_events`：确认正式文件不存在后退出 3。
- `blocked/failed`：打印 reason/blockers，退出 1。
- 当天文件在 agent 前已存在：退出 4。

`DRY_RUN=1` 不进入上述发布状态机：使用标准成稿模式 prompt、`--output-format json`（不附 generator schema），通过同一 timeout wrapper 保存原始输出后退出；它不得创建正式文件、reviewer 文件或 Git 副作用。

- [x] **步骤 9：单独调用只读 reviewer**

读取 reviewer schema 内容并内联传给 `--json-schema`。Reviewer prompt 只给正式文件和证据包路径。调用时使用相同的 `--tools` 与 `--allowedTools`，仅允许 Read/Glob/Grep/WebFetch/WebSearch；通过 timeout wrapper 启动，默认 `AI_BRIEFING_REVIEWER_TIMEOUT_SECONDS=900`。保存原始 JSON 到 `reviewer-output.json`，从 `structured_output` 提取状态并运行 `verify-reviewer`。`needs_changes/blocked` 立即停止，本轮不自动修稿、不调用第二次 reviewer。

- [x] **步骤 10：确定性执行发布门禁与 Git**

依次运行：

```bash
just validate-content-file "$BRIEFING_FILE"
just build-site-ai-data
node scripts/verify-ai-briefing-run.js verify-pre-commit ...
git add -- "$BRIEFING_FILE" "site/public/ai-data/briefings/index.json"
git commit -m "docs(ai-briefing): 发布 $ISSUE_DATE AI 简报"
node scripts/verify-ai-briefing-run.js verify-committed-files ...
git push
node scripts/verify-ai-briefing-run.js verify-post-push ...
```

commit 后立即用 `git diff-tree` 验证 commit 只含两个允许文件，并再次检查工作区没有 hook/agent 遗留修改；任一失败时不得 push。不得 stage 设计文档、证据包或其他已有修改。push 失败或远端不包含 commit 时返回失败并保留 run directory 供排查。

- [x] **步骤 11：新增 ignore 和 smoke 命令**

`.gitignore` 增加 `.local/ai-briefing/`。justfile：

```make
# 实时检查 AI 简报启用 Feed 的健康状态。
smoke-ai-briefing-feeds: _check_node
    @node scripts/collect-ai-briefing-feeds.js --health-check
```

- [x] **步骤 12：运行 shell/脚本定向验证**

运行：

```bash
bash -n scripts/ai-briefing.sh
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/run-command-with-timeout.test.ts \
  scripts/tests/ai-briefing-shell.test.ts \
  scripts/tests/verify-ai-briefing-run.test.ts
```

期望：语法和测试通过；不运行真实 Claude、commit 或 push。

### 任务 8：执行集成验证、实时 Feed smoke 和唯一一轮实现审核修复

**文件：**
- 检查本计划列出的全部改动文件
- 不新增功能范围

**设计关联：** 完整验收、实时来源可用性和 explore-review 单轮约束。

**验收标准：**
- [x] 所有定向测试、workspace 测试、内容校验和 site 检查通过。
- [ ] 所有启用 Feed 在实现当日通过 smoke；失败源不得保持 `enabled: true` 而无说明。
- [x] 实现审核只派发一次；有效问题修复后不再派发第二轮。
- [x] 最终 diff 只包含本任务文件，不包含证据包、缓存、临时文章或生成测试残留。

- [x] **步骤 1：运行定向测试**

```bash
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts \
  scripts/tests/briefing-skill-config.test.ts \
  scripts/tests/ai-briefing-window.test.ts \
  scripts/tests/collect-ai-briefing-feeds.test.ts \
  scripts/tests/verify-ai-briefing-run.test.ts \
  scripts/tests/run-command-with-timeout.test.ts \
  scripts/tests/ai-briefing-shell.test.ts \
  scripts/tests/validate-post.test.ts \
  skills/tests/ai-skill-sync.test.ts
```

期望：全部通过。

- [x] **步骤 2：运行内容与数据构建**

```bash
just validate-content
just build-site-ai-data
```

期望：成功；构建产物未因没有新简报而产生非预期内容变化。

- [ ] **步骤 3：运行实时 Feed smoke**

```bash
just smoke-ai-briefing-feeds
```

期望：所有 `enabled: true` Feed 返回成功、可解析并至少形成一个规范化条目。若某源已失效，改为 `enabled: false` 并在 source-map 记录原因后重新运行一次 smoke；这属于本步骤的修复，不是额外审核轮次。

执行记录：当前环境把 OpenAI、Google、GitHub、TechCrunch 等公开域名统一解析到保留的 `198.18.0.0/15` 代理网段，采集器按“实际 socket 只能绑定已验证公网地址”的安全规则拒绝，故本步骤保持未勾选；该结果不能证明源失效，因此没有错误禁用全部启用源。

- [x] **步骤 4：运行 workspace 与 site 门禁**

```bash
just test-workspace
just check-site
```

期望：typecheck、lint、site tests 和 workspace tests 全部通过。

- [x] **步骤 5：运行全仓关键校验**

```bash
just check
```

期望：site、workspace、admin-console、core-service 全部通过。若环境性服务依赖阻断，记录精确命令和错误，但不能把未运行写成通过。

- [x] **步骤 6：执行唯一一轮实现审核**

使用 `explore-shuai-5.6-long` 对照设计文档和本计划审核最终 diff，重点检查窗口、Feed 安全、证据可信边界、Markdown 兼容、shell 权限和 Git 后置验证。只执行这一轮；将不改变设计范围的有效发现直接修复。

- [x] **步骤 7：修复后复验受影响命令**

根据审核修复涉及文件，至少重跑对应定向测试、`just validate-content`、`bash -n scripts/ai-briefing.sh` 和 `git diff --check`；不再派发第二轮 reviewer。

执行记录：已完成唯一一轮整体实现审核，修复 registry/证据绑定、锁与 remote 一致性、Feed 截断和超时、IPv6 SSRF、普通模式采集初始化、reviewer `task` 权限及 V2 速览映射问题；修复后已重跑定向测试和完整门禁，未派发第二轮审核。

- [x] **步骤 8：最终工作区检查**

```bash
git status --short --branch
git diff --check
```

期望：只有本计划涉及的源文件、测试、配置、文档和 lockfile；没有 `.local/ai-briefing/`、测试生成文章、缓存、日志或 staged change。未经用户明确要求，不执行 commit/push。

## 最终验收清单

### 窗口与候选发现

- [x] 2026-07-15 对上一篇 2026-07-14/13/12 得到 24/48/72 小时。
- [x] 0 条事件不生成文件，下一次仍从上一篇已发布日期计算。
- [x] Feed/Atom 候选安全规范化，缓存和 304 行为可测试。
- [x] Feed coverage 不足会触发补检门禁，不静默宣称无更新。
- [x] 每个 priority company 都有完整覆盖结果。

### 内容与证据

- [x] 2026-07-15 起，一事件只对应一个速览 bullet、一个正文事件标题和一个来源 group。
- [x] 可选补充更新参与事件计数，为什么值得关注不参与。
- [x] 动态字数四档正确，历史简报仍通过。
- [x] Markdown validator 只检查可公开证明的结构；eventType 来源资格由 verifier 检查。
- [x] 两个同 publisher 媒体不能满足双源确认。
- [x] window/collection 哈希被篡改时发布阻断。

### Reviewer 与发布

- [x] reviewer 有只读 WebFetch/WebSearch，无 Edit/Bash。
- [x] reviewer 只运行一轮，非 approved 不 commit。
- [x] main agent 无 Git/Bash 写权限，shell 是唯一 Git 写入者。
- [x] shell 不含失效 `--max-turns` 和危险权限跳过。
- [x] generator/reviewer 超时会终止进程组并返回 124。
- [x] Claude 原始结果、reviewer 结果和 verification 均保存到被忽略的 run directory。
- [x] 精确 stage、中文 Conventional Commit、push 后 fetch + merge-base 通过才返回 0。
- [x] commit 的 diff-tree 文件集合严格等于本期简报和 AI 索引。

### 工程质量

- [x] `bash -n scripts/ai-briefing.sh` 通过。
- [x] 所有新增/修改 Vitest 通过。
- [x] `just validate-content`、`just build-site-ai-data`、`just check-site`、`just check` 通过或如实记录环境阻断。
- [ ] `just smoke-ai-briefing-feeds` 通过，启用源均真实可用。
- [x] `git diff --check` 通过，工作区没有临时产物和无关改动。
- [x] 实现只完成一轮独立审核修复，未自动追加第二轮。
