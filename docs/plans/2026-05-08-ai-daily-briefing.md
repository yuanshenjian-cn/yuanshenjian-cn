# AI 每日简报 Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 在现有 AI 入口中加入独立的 AI 每日简报内容域、往期列表、详情页、简报域内 AI 推荐，并把旧的 AI 雷达 workflow 统一为默认自动发布的 `ai-daily-briefing` skill。

**Architecture:** AI 每日简报使用独立 `content/ai-briefings` 内容目录和 `lib/briefings.ts` 数据层，避免进入普通博客流。页面路由为 `/ai` 顶部最新卡、`/ai/daily-briefings` 列表和 `/ai/daily-briefings/[date]` 详情；Worker 新增 `briefing-recommend` scene，只读取 `public/ai-data/briefings/index.json`。

**Tech Stack:** Next.js 15 App Router 静态导出、TypeScript、MD/MDX 渲染、Cloudflare Worker SSE、Vitest、OpenCode skill。

---

## File Structure

- Create: `content/ai-briefings/2026-05-08-ai-daily-briefing.md` 示例简报，用于首版页面和构建验证。
- Create: `lib/briefings.ts`，负责读取、解析、排序 AI 每日简报。
- Create: `types/briefing.ts`，定义简报类型。
- Create: `components/briefings/briefing-recommend-widget.tsx`，列表页顶部专属推荐入口。
- Create: `app/ai/daily-briefings/page.tsx`，往期列表页。
- Create: `app/ai/daily-briefings/[date]/page.tsx`，简洁详情页。
- Modify: `app/ai/page.tsx`，顶部增加最新一期简报摘要卡，下方保留 AI 专栏卡。
- Modify: `app/sitemap.ts`，加入 `/ai/daily-briefings` 和详情页 URL。
- Modify: `scripts/build-ai-data.js`，生成 `public/ai-data/briefings/index.json`。
- Modify: `scripts/validate-post.js`，纳入 `content/ai-briefings/*.md` 校验。
- Modify: `lib/ai-client.ts` 和 `types/ai.ts`，增加 `briefing-recommend` 客户端流式协议与类型。
- Create: `blog-ai-worker/src/prompts/briefing-recommend.ts`，简报推荐 prompt。
- Create: `blog-ai-worker/src/scenes/briefing-recommend.ts`，简报推荐 Worker scene。
- Modify: `blog-ai-worker/src/index.ts`、`blog-ai-worker/src/types.ts`、`blog-ai-worker/src/middleware/turnstile.ts`，接入新 scene。
- Create: `tests/lib/briefings.test.ts`，覆盖简报读取、排序、过滤。
- Modify: `tests/lib/build-ai-data.test.ts`，覆盖简报索引生成。
- Create: `tests/blog-ai-worker/briefing-recommend-scene.test.ts`，覆盖简报推荐 scene。
- Modify: `.opencode/commands/ai-radar.md`，兼容旧命令但指向 AI 每日简报语义。
- Create: `.opencode/skills/ai-daily-briefing/SKILL.md`，新 skill。
- Copy/update: `.opencode/skills/ai-daily-briefing/references/source-map.md` 和 `evals/evals.json`。
- Remove/replace: 旧 AI 雷达 skill 入口，统一切换到 `ai-daily-briefing`。
- Modify: `docs/troubleshoots.md`，记录本次独立内容域和发布边界。

---

## Task 1: Briefing Data Layer

**Files:**
- Create: `types/briefing.ts`
- Create: `lib/briefings.ts`
- Create: `content/ai-briefings/2026-05-08-ai-daily-briefing.md`
- Create: `tests/lib/briefings.test.ts`

- [ ] **Step 1: Define briefing types**

Create `BriefingFrontmatter`, `Briefing`, `BriefingRecommendationRange`.

- [ ] **Step 2: Implement parser and query functions**

Implement `getAllBriefings()`, `getLatestBriefing()`, `getBriefingBySlug()`, `getAdjacentBriefings()`, `getBriefingsByRange()`.

- [ ] **Step 3: Add sample published `.md` briefing**

Use `published: true`, `brief`, `tags`, and about 900-1100 Chinese characters of deterministic sample content.

- [ ] **Step 4: Add data-layer tests**

Verify sorting desc, latest selection, slug lookup, adjacent links, and range filtering.

---

## Task 2: Pages And Sitemap

**Files:**
- Modify: `app/ai/page.tsx`
- Create: `app/ai/daily-briefings/page.tsx`
- Create: `app/ai/daily-briefings/[date]/page.tsx`
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Add latest briefing card to `/ai`**

Place a horizontal “最新一期 AI 每日简报” card above the existing AI 专栏 grid, including the empty state from the design.

- [ ] **Step 2: Create `/ai/daily-briefings` list page**

Render heading, description, canonical metadata, recommendation widget, range filter client component, and date-desc list.

- [ ] **Step 3: Create static detail route**

Use `generateStaticParams()`, `dynamicParams = false`, metadata, `notFound()`, date-based params, MDX rendering, share buttons, previous/next briefing links, and no comments.

- [ ] **Step 4: Extend sitemap**

Add `/ai/daily-briefings` and all published briefing details. Do not add RSS entries.

---

## Task 3: Briefing AI Recommendation

**Files:**
- Create: `components/briefings/briefing-recommend-widget.tsx`
- Modify: `types/ai.ts`
- Modify: `lib/ai-client.ts`
- Modify: `scripts/build-ai-data.js`
- Modify: `scripts/validate-post.js`
- Create: `blog-ai-worker/src/prompts/briefing-recommend.ts`
- Create: `blog-ai-worker/src/scenes/briefing-recommend.ts`
- Modify: `blog-ai-worker/src/index.ts`
- Modify: `blog-ai-worker/src/types.ts`
- Modify: `blog-ai-worker/src/middleware/turnstile.ts`
- Create: `tests/blog-ai-worker/briefing-recommend-scene.test.ts`
- Modify: `tests/lib/build-ai-data.test.ts`
- Modify: `tests/lib/ai-client.test.ts`
- Modify: `tests/blog-ai-worker/index-runtime-config.test.ts`
- Create/modify: `tests/components/briefing-recommend-widget.test.tsx`

- [ ] **Step 1: Generate briefing AI data index**

Extend `scripts/build-ai-data.js` to emit `public/ai-data/briefings/index.json` with `slug/title/excerpt/tags/date/url`. `excerpt` is derived from frontmatter `brief` or body excerpt; Worker and client consistently consume `excerpt`.

- [ ] **Step 2: Extend content validation**

Extend `scripts/validate-post.js` or add a called helper so `npm run validate-content` also validates `content/ai-briefings/*.md`: required `title/date/tags/published/brief`, `published: true`, `.md` extension, and 900-1100 Chinese character body length for generated briefings.

- [ ] **Step 3: Add client-side stream function**

Add `aiBriefingRecommendStream()` using `scene: "briefing-recommend"` and `context.range`.

- [ ] **Step 4: Add briefing recommend widget**

Support input plus quick ranges: today, 3d, 7d, 30d. If input is empty, filter locally; if non-empty, call Worker. Reuse existing AI client stream parsing and user-facing error style where practical. If Worker is unavailable or not deployed, show a friendly message and keep the local list usable.

- [ ] **Step 5: Add Worker scene**

Fetch `briefings/index.json`, filter by range, score by title/brief/tags, stream answer and references.

- [ ] **Step 6: Add protocol, Worker, component, and build-data tests**

Cover `aiBriefingRecommendStream()` request body, Worker `parseBody`, Turnstile action `briefing_recommend`, range filtering, references URL, SSE response, failed index behavior, and widget local filtering / Worker failure fallback.

---

## Task 4: Skill Rename And Publishing Workflow

**Files:**
- Create: `.opencode/skills/ai-daily-briefing/SKILL.md`
- Create/copy: `.opencode/skills/ai-daily-briefing/references/source-map.md`
- Create: `.opencode/skills/ai-daily-briefing/evals/evals.json`
- Modify: `.opencode/commands/ai-radar.md`

- [ ] **Step 1: Create `ai-daily-briefing` skill**

Define triggers, default vendor list, 900-1100 Chinese character output, `.md` output path, `published: true`, and default auto-publish.

- [ ] **Step 2: Add strict two-stage audit**

Stage 1 checks candidate facts; final pre-publish audit blocks commit/push on accuracy, professionalism, source completeness, or source reliability issues.

- [ ] **Step 3: Define git publishing protocol**

Default flow: generate `.md`, run final audit, run content validation, then check git branch and remote safety before commit/push. Auto publish is allowed only on the configured deploy branch (`main` unless explicitly overridden), with an upstream tracking branch, no behind/diverged state, and no unrelated staged changes. Commit only the new daily briefing and necessary generated files; never use `--no-verify`; use normal push only. If any gate fails, stop before commit/push.

- [ ] **Step 4: Define same-day rerun behavior**

If today's briefing file already exists, update it only when explicitly replacing the same-day draft in the current working tree; otherwise stop and ask the user to resolve. The final audit must run again after any replacement.

- [ ] **Step 5: Preserve old entry points**

Update `/ai-radar` command copy and remove old skill-name references.

---

## Task 5: Documentation And Validation

**Files:**
- Modify: `docs/troubleshoots.md`

- [ ] **Step 1: Document the content boundary**

Record why AI 每日简报 uses `content/ai-briefings` and does not enter ordinary article flows.

- [ ] **Step 2: Run validation**

Run `npm run lint`, `npm run typecheck`, `npm run validate-content`, `npm run build:ai-data`, targeted Vitest tests, and `npm --prefix blog-ai-worker run typecheck`.

- [ ] **Step 3: Run static build if preceding checks pass**

Run `npm run build` to validate static export paths and generated params.
