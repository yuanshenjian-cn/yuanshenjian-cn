# Investment Briefing And Column Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 为博客新增独立的 `投资` 内容域、投资简报发布链路、公开 coverage 说明页，以及配套的 `investment-briefing` skill。

**Architecture:** 实现沿用 AI 简报的“独立内容域 + 数据层 + 列表/归档/详情 + 构建产物”结构，但把投资规则、配置、校验和 skill 独立出来。公开页面只读取正式内容与公开投影，内部审核文件、运行配置和 skill 规则保持私有边界。

**Tech Stack:** Next.js 15 App Router 静态导出、TypeScript、Markdown 内容读取、Node 构建脚本、Vitest、OpenCode skill。

---

## File Structure

- Create: `config/investment/briefing.json`
- Create: `config/investment/market-watch.json`
- Create: `config/investment/focus-areas.json`
- Create: `config/investment/focus-companies.json`
- Create: `config/investment/toggles.json`
- Create: `types/investment.ts`
- Create: `lib/investment-config.ts`
- Create: `lib/investment-briefings.ts`
- Create: `lib/investment-columns.ts`
- Create: `scripts/build-investment-data.js`
- Create: `content/investment-briefings/.gitkeep`
- Create: `app/investment/page.tsx`
- Create: `app/investment/coverage/page.tsx`
- Create: `app/investment/briefings/page.tsx`
- Create: `app/investment/briefings/archive/page.tsx`
- Create: `app/investment/briefings/archive/[year]/[month]/page.tsx`
- Create: `app/investment/briefings/[date]/page.tsx`
- Create: `app/investment/[column]/page.tsx`
- Create: `components/investment/coverage-page-client.tsx`
- Create: `components/investment/investment-briefings-page-client.tsx`
- Create: `skills/investment-briefing/SKILL.md`
- Create: `skills/investment-briefing/README.md`
- Create: `skills/investment-briefing/references/source-map.md`
- Create: `skills/investment-briefing/references/event-map.md`
- Create: `skills/investment-briefing/evals/evals.json`
- Create: `.opencode/skills/investment-briefing/SKILL.md`
- Create: `.opencode/skills/investment-briefing/README.md`
- Create: `.opencode/skills/investment-briefing/references/source-map.md`
- Create: `.opencode/skills/investment-briefing/references/event-map.md`
- Create: `.opencode/skills/investment-briefing/evals/evals.json`
- Create: `tests/lib/investment-briefings.test.ts`
- Create: `tests/lib/investment-config.test.ts`
- Create: `tests/scripts/build-investment-data.test.ts`
- Create: `tests/components/investment-briefings-page-client.test.tsx`
- Create: `tests/components/coverage-page-client.test.tsx`
- Create: `tests/skills/investment-skill-sync.test.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `scripts/validate-post.js`
- Modify: `components/header.tsx`
- Modify: `app/sitemap.ts`

---

### Task 1: Define Investment Contracts And Config Files

**Files:**
- Create: `config/investment/briefing.json`
- Create: `config/investment/market-watch.json`
- Create: `config/investment/focus-areas.json`
- Create: `config/investment/focus-companies.json`
- Create: `config/investment/toggles.json`
- Create: `types/investment.ts`
- Create: `lib/investment-config.ts`
- Create: `tests/lib/investment-config.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Add ignored audit directory contract**

Append this line to `.gitignore`:

```gitignore
.local/investment-audits/
```

- [ ] **Step 2: Define investment config and public projection types**

Create `types/investment.ts` with the minimal contracts the rest of the feature will use:

```ts
export type InvestmentPriority = "core" | "important" | "event-driven";
export type InvestmentAreaType = "index" | "theme" | "sector" | "industry" | "style";

export interface InvestmentBriefingConfig {
  timezone: string;
  cadence: "cn-morning";
  normalBodyMin: number;
  normalBodyMax: number;
  shortBodyMin: number;
  disclaimer: string;
  coveragePageTitle: string;
}

export interface InvestmentFocusArea {
  name: string;
  type: InvestmentAreaType;
  priority: InvestmentPriority;
  publicSummary: string;
  showOnCoveragePage: boolean;
}

export interface InvestmentFocusCompany {
  name: string;
  ticker: string;
  market: "A股" | "港股" | "美股";
  priority: InvestmentPriority;
  publicSummary: string;
  publicFocusPoints: string[];
  showOnCoveragePage: boolean;
}

export interface InvestmentCoverageData {
  title: string;
  intro: string;
  disclaimer: string;
  areas: InvestmentFocusArea[];
  companies: InvestmentFocusCompany[];
}
```

- [ ] **Step 3: Add minimal config JSON files**

Create the five config files with at least one valid example each, using this shape as the baseline:

```json
{
  "timezone": "Asia/Shanghai",
  "cadence": "cn-morning",
  "normalBodyMin": 1200,
  "normalBodyMax": 1500,
  "shortBodyMin": 900,
  "disclaimer": "本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。",
  "coveragePageTitle": "投资观察范围"
}
```

```json
[
  {
    "name": "恒生科技",
    "type": "index",
    "priority": "core",
    "publicSummary": "重点观察港股科技平台、政策与财报节奏。",
    "showOnCoveragePage": true
  }
]
```

- [ ] **Step 4: Implement config readers and public projection helper**

Create `lib/investment-config.ts` with small focused functions:

```ts
export function getInvestmentBriefingConfig(): InvestmentBriefingConfig;
export function getInvestmentFocusAreas(): InvestmentFocusArea[];
export function getInvestmentFocusCompanies(): InvestmentFocusCompany[];
export function getInvestmentCoverageProjection(): InvestmentCoverageData;
```

The projection helper must only return public fields and must filter out internal-only keys such as `aliases`, `triggers`, `mustCheck`, `officialSources`, `policySources`, `dataSources`, and `eventSources`.

- [ ] **Step 5: Add config tests**

Create `tests/lib/investment-config.test.ts` to verify:

```ts
it("builds public coverage projection without private fields", () => {
  const data = getInvestmentCoverageProjection();
  expect(data.areas[0]).not.toHaveProperty("aliases");
  expect(data.companies[0]).not.toHaveProperty("mustCheck");
});
```

Run: `npm run test -- tests/lib/investment-config.test.ts`

Expected: projection includes public summaries and excludes private config keys.

---

### Task 2: Build Investment Briefing Data Layer And Public Data Script

**Files:**
- Create: `content/investment-briefings/.gitkeep`
- Create: `lib/investment-briefings.ts`
- Create: `scripts/build-investment-data.js`
- Modify: `package.json`
- Create: `tests/lib/investment-briefings.test.ts`
- Create: `tests/scripts/build-investment-data.test.ts`

- [ ] **Step 1: Add empty content directory support**

Create `content/investment-briefings/.gitkeep` so the directory exists in git even before the first real briefing is published.

- [ ] **Step 2: Implement investment briefing parser and queries**

Create `lib/investment-briefings.ts` with the same responsibility split as `lib/briefings.ts`:

```ts
export interface InvestmentBriefing {
  slug: string;
  title: string;
  date: string;
  brief: string;
  tags: string[];
  url: string;
  relativePath: string;
}

export function getAllInvestmentBriefings(): InvestmentBriefing[];
export function getRecentInvestmentBriefings(limit: number): InvestmentBriefing[];
export function getInvestmentBriefingBySlug(slug: string): InvestmentBriefing | null;
export function getInvestmentBriefingArchives(): InvestmentBriefingArchiveItem[];
export function getInvestmentBriefingsByMonth(year: string, month: string): InvestmentBriefing[];
export function getAdjacentInvestmentBriefings(slug: string): { prev: InvestmentBriefing | null; next: InvestmentBriefing | null };
```

Match AI briefing behavior for sorting, archive grouping, and static path generation, but keep the file separate instead of abstracting a generic core.

- [ ] **Step 3: Implement `build:investment-data` script**

Create `scripts/build-investment-data.js` that:

```js
writeCoverageJson();
writeBriefingIndexJson();
validatePublicProjection();
```

It must emit:

- `public/investment-data/coverage.json`
- `public/investment-data/briefings/index.json`

Use a stable JSON shape for `briefings/index.json`:

```json
{
  "generated": "2026-05-09T00:00:00.000Z",
  "items": [
    {
      "slug": "2026-05-09",
      "title": "投资简报 · 2026-05-09",
      "date": "2026-05-09",
      "brief": "一句话摘要",
      "tags": ["投资简报"],
      "url": "/investment/briefings/2026-05-09"
    }
  ]
}
```

- [ ] **Step 4: Wire build script into npm build chain**

Modify `package.json` scripts to:

```json
{
  "build:investment-data": "node scripts/build-investment-data.js",
  "build": "npm run build:ai-data && npm run build:investment-data && next build"
}
```

- [ ] **Step 5: Add data layer and build script tests**

Create tests that cover:

- empty briefing directory returns `[]`
- archive grouping works with multiple month samples
- public projection JSON contains only allowlisted fields
- build script fails if public summary contains redline wording

Run:

```bash
npm run test -- tests/lib/investment-briefings.test.ts tests/scripts/build-investment-data.test.ts
```

Expected: PASS with both empty-state and populated-state coverage.

---

### Task 3: Extend Content Validation And Release Gates

**Files:**
- Modify: `scripts/validate-post.js`
- Modify: `package.json`

- [ ] **Step 1: Extend allowed content roots**

Add `content/investment-briefings/` alongside `content/blog/` and `content/ai-briefings/` so `validate-content` accepts the new directory and `.md` extension.

- [ ] **Step 2: Add investment briefing rule set**

Implement a dedicated validation branch for investment briefings:

```js
const INVESTMENT_BRIEFINGS_ROOT = path.join(ROOT, "content/investment-briefings");
const INVESTMENT_MIN = 900;
const INVESTMENT_MAX = 1500;
```

Validate:

- `.md` extension only
- required frontmatter: `title`, `date`, `brief`, `published`, `tags`
- `published: true`
- body length `900~1500`
- required sections in order:
  - `## 今日确认动态`
  - `## 接下来重点观察`
  - `## 来源`
- disclaimer exists at the end
- no `传闻观察` heading in published content
- no redline trading language

- [ ] **Step 3: Keep redline checks in the non-bypassable chain**

Ensure the same validation runs when users invoke:

```bash
npm run validate-content
npm run build
```

This keeps public-content redline checks in CI and deploy builds, not only in the skill workflow.

- [ ] **Step 4: Add a targeted validation regression fixture**

Add a small test case or fixture inside the validation test file that proves a published investment briefing fails on forbidden phrases such as:

```md
值得买入
建议加仓
目标价
```

Run: `npm run validate-content`

Expected: FAIL for the fixture and PASS after removing the redline wording.

---

### Task 4: Add Investment Navigation, Coverage Page, And Column Pages

**Files:**
- Modify: `components/header.tsx`
- Create: `lib/investment-columns.ts`
- Create: `app/investment/page.tsx`
- Create: `app/investment/coverage/page.tsx`
- Create: `app/investment/[column]/page.tsx`
- Create: `components/investment/coverage-page-client.tsx`
- Create: `tests/components/coverage-page-client.test.tsx`

- [ ] **Step 1: Add the top-level navigation item**

Update `components/header.tsx` nav items:

```ts
const navItems = [
  { href: "/ai", label: "AI", icon: "sparkles" },
  { href: "/investment", label: "投资" },
  { href: "/articles", label: "文章" },
  { href: "/author", label: "作者" },
];
```

- [ ] **Step 2: Define investment column configs**

Create `lib/investment-columns.ts` with the same pattern as `lib/columns.ts`:

```ts
const INVESTMENT_COLUMNS = [
  {
    slug: "macro",
    title: "宏观",
    description: "围绕政策、利率、汇率与全球宏观事件的投资观察。",
    contentDir: "investment/macro"
  }
];
```

Also export:

```ts
export function getInvestmentColumns(): InvestmentColumnWithPosts[];
export function getInvestmentColumnBySlug(slug: string): InvestmentColumnWithPosts | null;
```

- [ ] **Step 3: Create `/investment/coverage` and its client filter UI**

Render the sections from the spec:

- Hero
- method cards
- area cards with priority filters
- company cards with market filters
- boundary statements
- update mechanism notes

Keep the client component narrow: it should only manage the filter state for priority and market tabs.

- [ ] **Step 4: Create `/investment` and `/investment/[column]`**

`/investment` should show:

- latest investment briefing hero or empty state
- coverage page link
- archive link
- investment column cards

`/investment/[column]` should follow the AI column page structure and use `generateStaticParams()` with `dynamicParams = false`.

- [ ] **Step 5: Add page-level tests**

Create `tests/components/coverage-page-client.test.tsx` to verify:

- priority filter tabs switch cards
- market tabs switch company cards
- disclaimer text renders
- CTA links remain visible

Run:

```bash
npm run test -- tests/components/coverage-page-client.test.tsx
```

Expected: PASS with no snapshot dependence.

---

### Task 5: Add Investment Briefing List, Archive, Detail, And Sitemap

**Files:**
- Create: `app/investment/briefings/page.tsx`
- Create: `app/investment/briefings/archive/page.tsx`
- Create: `app/investment/briefings/archive/[year]/[month]/page.tsx`
- Create: `app/investment/briefings/[date]/page.tsx`
- Create: `components/investment/investment-briefings-page-client.tsx`
- Modify: `app/sitemap.ts`
- Create: `tests/components/investment-briefings-page-client.test.tsx`

- [ ] **Step 1: Implement the list page and client range filters**

Create `/investment/briefings` using the AI list-page pattern, but adapt the wording and empty state for investment content.

The client component should support lightweight range tabs such as `7d`, `30d`, `all` and should not include the AI recommendation widget.

- [ ] **Step 2: Implement archive pages**

Create:

- `/investment/briefings/archive`
- `/investment/briefings/archive/[year]/[month]`

Use the same archive grouping contract as `lib/briefings.ts`, but read from `lib/investment-briefings.ts`.

- [ ] **Step 3: Implement the static detail route with zero-data fallback**

`app/investment/briefings/[date]/page.tsx` must:

- use `generateStaticParams()`
- set `dynamicParams = false`
- use `notFound()` when the slug is not real
- render previous/next briefing links
- support the zero-briefing hidden placeholder param strategy used by the AI briefing detail route so `next build` still succeeds before the first real briefing exists

- [ ] **Step 4: Extend sitemap**

Add:

- `/investment`
- `/investment/coverage`
- `/investment/briefings`
- `/investment/briefings/archive`
- investment archive month URLs
- investment briefing detail URLs
- investment column URLs

- [ ] **Step 5: Add component tests for the list client**

Create `tests/components/investment-briefings-page-client.test.tsx` to verify:

- range filters
- empty state text
- archive CTA visibility

Run:

```bash
npm run test -- tests/components/investment-briefings-page-client.test.tsx
```

Expected: PASS for both empty and non-empty lists.

---

### Task 6: Add The Investment Skill And Mirror Sync Test

**Files:**
- Create: `skills/investment-briefing/SKILL.md`
- Create: `skills/investment-briefing/README.md`
- Create: `skills/investment-briefing/references/source-map.md`
- Create: `skills/investment-briefing/references/event-map.md`
- Create: `skills/investment-briefing/evals/evals.json`
- Create: `.opencode/skills/investment-briefing/*`
- Create: `tests/skills/investment-skill-sync.test.ts`

- [ ] **Step 1: Write the investment skill source files**

The skill must encode the design decisions already approved:

- query / draft / publish routing
- manual publish only
- CN morning briefing cadence
- 1200~1500 normal body length and 900~1199 short edition fallback
- no trading advice or stock picks
- rumor never enters publish-mode public output
- non-public audit file requirement

- [ ] **Step 2: Mirror the skill into `.opencode/skills/`**

Copy the same files into `.opencode/skills/investment-briefing/`.

- [ ] **Step 3: Add a sync regression test**

Create `tests/skills/investment-skill-sync.test.ts`:

```ts
it("keeps mirrored skill files in sync", () => {
  expect(readFileSync("skills/investment-briefing/SKILL.md", "utf8")).toBe(
    readFileSync(".opencode/skills/investment-briefing/SKILL.md", "utf8"),
  );
});
```

Also compare `README.md`, `references/source-map.md`, `references/event-map.md`, and `evals/evals.json`.

- [ ] **Step 4: Run the sync test**

Run:

```bash
npm run test -- tests/skills/investment-skill-sync.test.ts
```

Expected: PASS with mirrored files byte-equal.

---

### Task 7: Final Verification Pass

**Files:**
- Modify as needed based on failing checks only

- [ ] **Step 1: Run focused tests first**

Run:

```bash
npm run test -- tests/lib/investment-config.test.ts tests/lib/investment-briefings.test.ts tests/scripts/build-investment-data.test.ts tests/components/coverage-page-client.test.tsx tests/components/investment-briefings-page-client.test.tsx tests/skills/investment-skill-sync.test.ts
```

Expected: PASS for all new investment-specific tests.

- [ ] **Step 2: Run repository-wide validation chain**

Run:

```bash
npm run lint
npm run typecheck
npm run validate-content
npm run build
```

Expected:

- `lint`: no new lint errors
- `typecheck`: no TypeScript errors
- `validate-content`: investment, AI, and blog content all valid
- `build`: static export succeeds with investment pages and data generation included

- [ ] **Step 3: Smoke-check generated artifacts**

Verify these files exist after the build:

```text
public/investment-data/coverage.json
public/investment-data/briefings/index.json
```

And verify that `.local/investment-audits/` is still ignored and untracked.
