# Page AI Assistant Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 为文章详情页和作者页实现基于页面内容的 AI 助手，支持页面级单轮问答、显式依据展示，以及页面场景优先的真实流式输出。

**Architecture:** 继续沿用“构建期生成 ai-data JSON + Cloudflare Worker 按 scene 读取上下文 + 前端客户端小岛调用”的现有路线。首页 `recommend` 保持现状；新增 `article` / `author` 场景、页面级结构化数据、流式 `/chat/stream` 接口，以及文章页共享状态容器来承载双入口。

**Tech Stack:** Next.js 15、React 19、TypeScript、Vitest、Cloudflare Workers、Workers KV、Cloudflare Turnstile、ReadableStream + SSE。

---

## File Structure

### Blog app

- Create: `lib/author-profile.ts` — 作者页与作者 AI 数据的单一结构化来源
- Modify: `components/resume/resume-hero.tsx` — 改为从共享作者资料读取 hero 数据，并补稳定锚点
- Modify: `components/resume/resume-skills.tsx` — 改为从共享作者资料读取技能与证书，并补稳定锚点
- Modify: `components/resume/resume-education.tsx` — 改为从共享作者资料读取教育背景，并补稳定锚点
- Modify: `components/resume/resume-experience.tsx` — 改为从共享作者资料读取经历数据，并补稳定锚点
- Modify: `components/resume/resume-projects.tsx` — 改为从共享作者资料读取项目数据，并补稳定锚点
- Modify: `components/resume/resume-extras.tsx` — 改为从共享作者资料读取附加信息，并补稳定锚点
- Modify: `lib/config.ts` — 新增页面级 AI 可用性开关 `pageAssistantEnabled`
- Modify: `.env.example` — 新增页面级 AI 开关公开变量
- Modify: `types/ai.ts` — 引入判别联合请求/响应类型、页面引用类型、流式事件类型
- Modify: `lib/ai-client.ts` — 保留 JSON `aiChat`，新增 `aiChatStream`（`fetch + ReadableStream` 解析 SSE）
- Modify: `scripts/build-ai-data.js` — 在现有 `index.json` 之外，生成 `articles/{slug}.json` 和 `author.json`
- Create: `components/ai/page-ai-assistant-provider.tsx` — 页面级共享状态容器，承载流式状态 / abort / requestId / 最近一次结果
- Create: `components/ai/ai-page-assistant.tsx` — 通用页面级 AI 交互组件
- Create: `components/ai/article-ai-assistant.tsx` — 文章页场景包装组件（前置 / 文末 variant）
- Create: `components/ai/author-ai-assistant.tsx` — 作者页场景包装组件
- Modify: `app/articles/[slug]/page.tsx` — 页面层挂载文章页 AI 共享状态容器与前置主入口
- Modify: `components/article-content.tsx` — 接入文章页文末次入口 variant
- Modify: `app/author/page.tsx` — 在 `ResumeHero` 后接入作者页 AI 助手
- Test: `tests/lib/ai-client.test.ts` — 补流式客户端解析测试
- Test: `tests/components/page-ai-assistant*.test.tsx` — 覆盖共享状态、流式显示、双入口互斥
- Test: `tests/lib/blog.test.ts` 或新增脚本测试 — 验证文章无标题时退化成 `intro` section

### Worker

- Modify: `blog-ai-worker/src/types.ts` — 扩展 `ChatScene`、页面请求 context 类型、页面引用类型
- Modify: `blog-ai-worker/src/index.ts` — 新增 `/chat/stream` 路由与 `article` / `author` scene 分发
- Modify: `blog-ai-worker/src/providers/types.ts` — 为 provider 增加可选 `streamChat` 能力
- Modify: `blog-ai-worker/src/providers/openai-compatible.ts` — 实现真实流式上游调用与原始流返回
- Modify: `blog-ai-worker/src/providers/deepseek.ts` — 确保继承流式能力
- Modify: `blog-ai-worker/src/providers/moonshot-cn.ts` — 确保继承流式能力
- Modify: `blog-ai-worker/src/providers/tencent-tokenhub.ts` — 确保继承流式能力
- Modify: `blog-ai-worker/src/middleware/turnstile.ts` — 支持 scene 级 action 校验
- Create: `blog-ai-worker/src/prompts/article.ts` — 文章页 prompt
- Create: `blog-ai-worker/src/prompts/author.ts` — 作者页 prompt
- Create: `blog-ai-worker/src/scenes/article.ts` — 文章页问答逻辑、section 映射、流式解析、尾部引用组装
- Create: `blog-ai-worker/src/scenes/author.ts` — 作者页问答逻辑、section 映射、流式解析、尾部引用组装
- Modify: `blog-ai-worker/wrangler.toml` — 增补页面级 action / 开关 / 默认配置项
- Test: `tests/blog-ai-worker/index-runtime-config.test.ts` — 补场景路由与 `/chat/stream` 校验
- Test: `tests/blog-ai-worker/provider-factory.test.ts` — 补 provider 流式能力校验
- Create: `tests/blog-ai-worker/article-scene.test.ts` — 覆盖 section id 映射、无效引用过滤、分隔符协议解析
- Create: `tests/blog-ai-worker/author-scene.test.ts` — 覆盖作者页引用组装与归纳边界

### Docs

- Modify: `docs/specs/2026-05-04-page-ai-assistant-design.md` — 如实现中仅有必要的小偏差，再回填
- Modify: `docs/troubleshoots.md` — 记录本次实现中遇到的、值得复用的重要问题修复

---

### Task 1: Build a single source of truth for author profile data

**Files:**
- Create: `lib/author-profile.ts`
- Modify: `components/resume/resume-hero.tsx`
- Modify: `components/resume/resume-skills.tsx`
- Modify: `components/resume/resume-education.tsx`
- Modify: `components/resume/resume-experience.tsx`
- Modify: `components/resume/resume-projects.tsx`
- Modify: `components/resume/resume-extras.tsx`

- [ ] **Step 1: Create the shared author profile module**

Create a single exported object/structure in `lib/author-profile.ts` that contains:

```ts
export const authorProfile = {
  hero: {
    name: "袁慎建",
    roles: ["AI 效率工程师", "研发效能专家", "敏捷开发教练"],
    phone: "18192235667",
    email: "yuanshenjian@foxmail.com",
    summary: [
      "在Thoughtworks 10年多年，经历多个国内外交付、咨询和技术人员培养项目，精通敏捷软件工程实践和研发效能提升，擅长软件架构设计和服务器端应用开发",
      "有代码洁癖和优秀的业务Sense，具备良好的快速学习、解决问题和团队协作能力，热爱技术写作和分享",
    ],
  },
  skills: {
    items: [],
    certificates: [],
  },
  education: {
    school: "长安大学（统招本科 211）",
    major: "软件工程（转）",
    period: "2009.09 ~ 2013.07",
  },
  experience: [],
  projects: [],
  extras: [],
} as const;
```

Fill the arrays with the content already present in the resume components. Do not invent new facts.

- [ ] **Step 2: Refactor resume components to read from shared data**

Update each resume component so that display content is derived from `authorProfile`, not duplicated local constants.

Constraints:

```text
1. Keep existing visual layout unchanged as much as possible
2. Add stable section ids where missing: hero / skills / education / experience / projects / extras
3. Do not refactor unrelated styling
```

- [ ] **Step 3: Run focused verification**

Run:

```bash
npm run test -- tests/lib/blog.test.ts
npm run typecheck
```

Expected:
- Existing blog tests still pass
- Resume pages still compile

---

### Task 2: Extend ai-data generation for article sections and author profile

**Files:**
- Modify: `scripts/build-ai-data.js`
- Create: `lib/author-profile-data.js`
- Create: `lib/author-profile.ts`
- Modify: `lib/mdx.tsx` (only if needed to reuse heading slug behavior safely)
- Test: `tests/lib/blog.test.ts` or a new dedicated script test file

- [ ] **Step 1: Create a build-script-friendly author data source**

+To avoid blocking `node scripts/build-ai-data.js` on importing TypeScript directly, create a plain data module:
+
+```text
+1. Create `lib/author-profile-data.js` as the raw shared data source
+2. Export serializable plain objects/arrays only
+3. Create `lib/author-profile.ts` as a typed wrapper that re-exports the same data for app code
+```
+
+This keeps the single-source-of-truth rule while remaining compatible with the current CommonJS build script.
+
+- [ ] **Step 2: Define output shapes explicitly in code comments / helpers**
+
+Add helper types / JSDoc-equivalent structure in the script for:
+
+```ts
+type ArticleSection = {
+  id: string;
+  anchorId: string;
+  heading: string;
+  content: string;
+  excerpt: string;
+};
+
+type AuthorSection = {
+  id: string;
+  heading: string;
+  content: string;
+  excerpt: string;
+};
+```
+
+- [ ] **Step 3: Generate `articles/{slug}.json` with section splitting**
+
+Implement section generation with these rules:
+
+```text
+1. Use markdown headings as boundaries
+2. Content before the first heading becomes intro
+3. If no heading exists, the whole article becomes intro
+4. Reuse the same slugger behavior as current TOC generation
+5. Exclude fenced code block content
+6. Generate excerpt from section content
+```
+
+Output example:
+
+```json
+{
+  "slug": "example-post",
+  "sections": [
+    {
+      "id": "intro",
+      "anchorId": "intro",
+      "heading": "前言",
+      "content": "...",
+      "excerpt": "..."
+    }
+  ]
+}
+```
+
+- [ ] **Step 4: Generate `author.json` from the shared author data source**
+
+The script must transform the raw author profile data into:
+
+```json
+{
+  "slug": "author",
+  "title": "袁慎建",
+  "summary": "AI 效率工程师 | 研发效能专家 | 敏捷开发教练",
+  "sections": [
+    {
+      "id": "hero",
+      "heading": "个人简介",
+      "content": "...",
+      "excerpt": "..."
+    }
+  ]
+}
+```
+
+- [ ] **Step 5: Run generation checks**
+
+Run:
+
+```bash
+npm run build:ai-data
+```
+
+Expected:
+- `public/ai-data/index.json` still exists
+- `public/ai-data/articles/*.json` exists
+- `public/ai-data/author.json` exists
+
+### Task 3: Define strict page-AI types and client APIs

**Files:**
- Modify: `types/ai.ts`
- Modify: `lib/ai-client.ts`
- Test: `tests/lib/ai-client.test.ts`

- [ ] **Step 1: Add discriminated request/response types**

In `types/ai.ts`, define:

```ts
export interface RecommendRequestPayload {
  scene: "recommend";
  message: string;
  cf_turnstile_response: string;
}

export interface ArticleRequestPayload {
  scene: "article";
  message: string;
  context: { slug: string };
  cf_turnstile_response: string;
}

export interface AuthorRequestPayload {
  scene: "author";
  message: string;
  context: { page: "author" };
  cf_turnstile_response: string;
}

export interface PageReference {
  id: string;
  title: string;
  excerpt: string;
  sourceType: "article-section" | "author-section";
  anchorId?: string;
}

export type PageStreamEvent =
  | { type: "answer-delta"; delta: string }
  | { type: "references"; references: PageReference[] }
  | { type: "done"; usage?: AIUsage }
  | { type: "error"; message: string };
```

- [ ] **Step 2: Keep JSON `aiChat` for recommend and non-stream fallback**

Ensure `aiChat()` still works for existing `recommend` tests and is widened to support page-AI non-stream fallback when needed.

- [ ] **Step 3: Add `aiChatStream()` using fetch + ReadableStream**

Implement a new helper shaped like:

```ts
export async function aiChatStream(options: {
  workerUrl: string;
  scene: "article" | "author";
  message: string;
  context: { slug: string } | { page: "author" };
  turnstileToken: string;
  signal?: AbortSignal;
  onEvent: (event: PageStreamEvent) => void;
}): Promise<void>
```

Constraints:

```text
1. Use fetch POST
2. Parse response.body via TextDecoder + stream reader
3. Parse SSE events manually
4. Surface protocol errors as readable Error
```

- [ ] **Step 4: Add tests for stream parsing**

Add tests covering:

```text
1. answer-delta parsing across multiple chunks
2. references event parsing
3. done event parsing
4. malformed event handling
```

Run:

```bash
npm run test -- tests/lib/ai-client.test.ts
```

Expected:
- Existing JSON tests still pass
- New stream parsing tests pass

---

### Task 4: Add page-level AI availability config

**Files:**
- Modify: `lib/config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add page assistant env contract**

+Append to `.env.example`:
+
+```env
+NEXT_PUBLIC_AI_PAGE_ASSISTANT_ENABLED=true
+NEXT_PUBLIC_AI_PAGE_ASSISTANT_STREAM_ENABLED=true
+```
+
+- [ ] **Step 2: Add `pageAssistantEnabled` config**
+
+Extend `config.ai` with:
+
+```ts
+pageAssistantEnabled:
+  process.env.NEXT_PUBLIC_AI_ENABLED !== "false" &&
+  process.env.NEXT_PUBLIC_AI_PAGE_ASSISTANT_ENABLED !== "false" &&
+  (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim().length > 0,
+pageAssistantStreamEnabled:
+  process.env.NEXT_PUBLIC_AI_ENABLED !== "false" &&
+  process.env.NEXT_PUBLIC_AI_PAGE_ASSISTANT_ENABLED !== "false" &&
+  process.env.NEXT_PUBLIC_AI_PAGE_ASSISTANT_STREAM_ENABLED !== "false" &&
+  (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim().length > 0,
+```
+
+Expected behavior:
+
+```text
+1. 首页 recommend 仍由原 enabled 控制
+2. 页面级 AI 由 pageAssistantEnabled 单独控制
+3. 页面级流式入口由 pageAssistantStreamEnabled 控制
+```
+
+- [ ] **Step 3: Define rendering rules for article and author pages**
+
+Implementation rule to follow later:
+
+```text
+1. 文章页和作者页都必须 gate by config.ai.pageAssistantEnabled
+2. 如果 pageAssistantEnabled 为 false，则页面级 AI 完全不渲染
+3. 如果 pageAssistantEnabled 为 true 但 pageAssistantStreamEnabled 为 false，则页面级 AI 以非流式 /chat fallback 模式运行
+```
+
+### Task 5: Build Worker page-scene contracts and stream-capable provider layer

**Files:**
- Modify: `blog-ai-worker/src/types.ts`
- Modify: `blog-ai-worker/src/providers/types.ts`
- Modify: `blog-ai-worker/src/providers/openai-compatible.ts`
- Modify: `blog-ai-worker/src/providers/deepseek.ts`
- Modify: `blog-ai-worker/src/providers/moonshot-cn.ts`
- Modify: `blog-ai-worker/src/providers/tencent-tokenhub.ts`
- Test: `tests/blog-ai-worker/provider-factory.test.ts`

- [ ] **Step 1: Extend Worker request/response types**

Update `blog-ai-worker/src/types.ts` so that:

```ts
export type ChatScene = "recommend" | "article" | "author";
```

and request body parsing can represent page-scene contexts safely.

- [ ] **Step 2: Extend provider interface with stream support**

Add:

```ts
streamChat?(request: ChatRequest): Promise<ReadableStream<Uint8Array>>;
```

to `LLMProvider`.

- [ ] **Step 3: Implement stream support in OpenAI-compatible provider**

Requirements:

```text
1. Send upstream request with stream: true
2. Return raw upstream body stream when successful
3. Keep existing chat() intact for JSON mode
4. Throw readable error if upstream has no body
```

- [ ] **Step 4: Verify provider subclasses inherit stream capability**

Run:

```bash
npm run test -- tests/blog-ai-worker/provider-factory.test.ts
```

Expected:
- Existing provider routing tests still pass
- Stream-capable providers can be instantiated without breaking chat mode

---

### Task 6: Add scene-aware Turnstile action validation and stream route

**Files:**
- Modify: `blog-ai-worker/src/index.ts`
- Modify: `blog-ai-worker/src/middleware/turnstile.ts`
- Modify: `blog-ai-worker/wrangler.toml`
- Test: `tests/blog-ai-worker/index-runtime-config.test.ts`
+
+- [ ] **Step 1: Define scene → Turnstile action mapping**
+
+Use fixed mapping in code for Phase 1/2 scope:
+
+```ts
+const TURNSTILE_ACTIONS = {
+  recommend: "homepage_recommend",
+  article: "article_page_ai",
+  author: "author_page_ai",
+} as const;
+```
+
+- [ ] **Step 2: Update Turnstile verification signature**
+
+Change verification so the expected action is derived from scene instead of a single global env string.
+
+- [ ] **Step 3: Add `/chat/stream` route**
+
+Worker routing rules:
+
+```text
+POST /chat          -> recommend JSON + page-scene fallback JSON
+POST /chat/stream   -> article/author SSE
+OPTIONS supported on both
+```
+
+- [ ] **Step 4: Add runtime tests**
+
+Cover:
+
+```text
+1. unsupported scene on /chat/stream rejected clearly
+2. scene-specific action expectation can be computed
+3. existing recommend runtime validation still works
+4. /chat/stream returns text/event-stream content type
+5. success event order is answer-delta -> references -> done
+6. error path can emit SSE error event or fail clearly before stream starts
+```
+
+### Task 7: Implement article and author Worker scenes with reference assembly

**Files:**
- Create: `blog-ai-worker/src/prompts/article.ts`
- Create: `blog-ai-worker/src/prompts/author.ts`
- Create: `blog-ai-worker/src/scenes/article.ts`
- Create: `blog-ai-worker/src/scenes/author.ts`
- Test: `tests/blog-ai-worker/article-scene.test.ts`
- Test: `tests/blog-ai-worker/author-scene.test.ts`

- [ ] **Step 1: Implement common page-scene helpers**

Shared helper expectations:

```text
1. fetch page data JSON from AI_DATA_BASE_URL
2. index sections by id
3. assemble references from validated ids
4. cap references at 3
```

- [ ] **Step 2: Implement the output-tail contract parser**

Support the fixed protocol:

```text
<answer text>
<<<AI_PAGE_REFERENCES>>>
{"sectionIds":["intro","section-2"]}
```

Behavior:

```text
1. forward only answer text to SSE answer-delta
2. keep tail JSON private inside worker
3. parse sectionIds after stream end
4. on malformed tail -> keep answer, emit empty references
```

- [ ] **Step 3: Implement `article` scene rules**

Requirements:

```text
1. require context.slug
2. read articles/{slug}.json
3. answer only from article content
4. return article-section references
5. non-stream fallback path should reuse the same reference assembly logic
```

- [ ] **Step 4: Implement `author` scene rules**

Requirements:

```text
1. require context.page === "author"
2. read author.json
3. facts must stay page-bound
4. role-fit answers must use cautious wording
5. return author-section references
```

- [ ] **Step 5: Add scene tests**

Cover:

```text
1. valid section ids -> correct PageReference mapping
2. invalid ids are filtered
3. duplicate ids are de-duplicated
4. malformed tail still returns answer with empty references
5. author role-fit wording rule is preserved in prompt contract
```

Run:

```bash
npm run test -- tests/blog-ai-worker/article-scene.test.ts tests/blog-ai-worker/author-scene.test.ts
```

---

### Task 8: Build the page-level shared client container and reusable assistant UI

**Files:**
- Create: `components/ai/page-ai-assistant-provider.tsx`
- Create: `components/ai/ai-page-assistant.tsx`
- Create: `components/ai/article-ai-assistant.tsx`
- Create: `components/ai/author-ai-assistant.tsx`
- Test: `tests/components/page-ai-assistant-provider.test.tsx`
- Test: `tests/components/article-ai-assistant.test.tsx`
- Test: `tests/components/author-ai-assistant.test.tsx`

- [ ] **Step 1: Reuse or extract Turnstile execution logic for page AI**

+The page-level assistant cannot submit without a valid Turnstile token. Reuse the existing homepage logic or extract a shared helper.
+
+Requirements:
+
+```text
+1. Support explicit render + execute flow
+2. Support scene-specific actions:
+   - article_page_ai
+   - author_page_ai
+3. Surface readable errors on timeout / expired / failure
+4. Reset widget after each request
+```
+
+- [ ] **Step 2: Create shared page-level state container**
+
+The provider/container must hold:
+
+```ts
+{
+  currentAnswer: string;
+  currentReferences: PageReference[];
+  currentError: string | null;
+  isStreaming: boolean;
+  requestId: number;
+  abortController: AbortController | null;
+}
+```
+
+- [ ] **Step 3: Implement last-write-wins, abort behavior, and stream fallback**
+
+Rules:
+
+```text
+1. only one in-flight request per page
+2. new request aborts previous request
+3. stale stream chunks must not write to current state
+4. answer may remain partially visible if interrupted
+5. if pageAssistantStreamEnabled is false, call /chat non-stream fallback instead of /chat/stream
+6. if stream request fails due to unsupported runtime path, surface readable error rather than fake typing
+```
+
+- [ ] **Step 4: Build the reusable assistant component**
+
+The generic UI should render:
+
+```text
+1. title and subtitle
+2. quick questions
+3. input + submit button
+4. streaming answer area
+5. references area
+6. interrupted / error states
+```
+
+- [ ] **Step 5: Wrap article and author variants**
+
+Article variant props should set:
+
+```text
+title = AI 快速读懂这篇文章
+scene = article
+Turnstile action = article_page_ai
+quick questions = summary-oriented set
+```
+
+Author variant props should set:
+
+```text
+title = 问 AI：快速了解作者
+scene = author
+Turnstile action = author_page_ai
+quick questions = recruiter-oriented set
+```
+
+- [ ] **Step 6: Add UI tests**
+
+Cover:
+
+```text
+1. stream answer is appended incrementally
+2. references appear only after stream tail event
+3. second request aborts first
+4. stale answer chunks are ignored
+5. Turnstile token acquisition happens before request submission
+6. non-stream fallback path renders final result correctly
+```
+
+### Task 9: Integrate article page shared container and dual-entry layout

**Files:**
- Modify: `app/articles/[slug]/page.tsx`
- Modify: `components/article-content.tsx`

- [ ] **Step 1: Gate article page AI by config**

+Implementation target:
+
+```text
+1. if config.ai.pageAssistantEnabled is false, render no article page AI UI
+2. if config.ai.pageAssistantEnabled is true, mount the page-level provider exactly once
+3. if config.ai.pageAssistantStreamEnabled is false, provider still mounts in non-stream fallback mode
+```
+
+- [ ] **Step 2: Add the page-level AI container in the page layer**
+
+Implementation target:
+
+```text
+1. mount a single page-level client container from app/articles/[slug]/page.tsx
+2. place the primary assistant entry below article header/meta and above content
+3. keep placement consistent across desktop/mobile layouts
+```
+
+- [ ] **Step 3: Add the footer variant in article content**
+
+Implementation target:
+
+```text
+1. place a lightweight follow-up trigger before comments
+2. do not create a second independent answer area
+3. trigger the shared provider state from this footer entry
+```
+
+- [ ] **Step 4: Manual behavior verification**
+
+Check:
+
+```text
+1. primary answer area appears near the top
+2. footer trigger does not duplicate the answer area
+3. starting from footer updates the shared top result
+4. disabled config hides both entries
+```
+
+### Task 10: Integrate author page assistant

**Files:**
- Modify: `app/author/page.tsx`

- [ ] **Step 1: Insert the author assistant after `ResumeHero`**

+Rules:
+
+```text
+1. gate by config.ai.pageAssistantEnabled
+2. place assistant before ResumeSkills
+3. keep existing page sections unchanged otherwise
+4. if pageAssistantStreamEnabled is false, author page AI runs in non-stream fallback mode
+```
+
+- [ ] **Step 2: Verify recruiter-oriented defaults**
+
+Check:
+
+```text
+1. quick questions focus on experience / skills / certificates / fit
+2. no irrelevant generic AI copy appears
+```
+
+### Task 11: Run full validation and capture troubleshooting learnings

**Files:**
- Modify: `docs/troubleshoots.md`

- [ ] **Step 1: Run blog app checks**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build:ai-data
npm run build
```

Expected:
- App typecheck / lint / tests / build all pass

- [ ] **Step 2: Run worker checks**

Run:

```bash
npm --prefix blog-ai-worker run typecheck
npm run test -- tests/blog-ai-worker/provider-factory.test.ts tests/blog-ai-worker/index-runtime-config.test.ts tests/blog-ai-worker/article-scene.test.ts tests/blog-ai-worker/author-scene.test.ts
```

Expected:
- Worker type and scene tests pass

- [ ] **Step 3: Add at least one troubleshooting note if a meaningful issue is fixed**

If implementation reveals a reusable issue (for example stream tail parsing, stale chunk overwrite, anchor mismatch, or Turnstile action mismatch), append a new section to:

```md
docs/troubleshoots.md
```

The note must include:

```text
1. symptom
2. root cause
3. fix
4. how to verify
```

---

## Self-review

- 规格覆盖：已覆盖文章页前置主入口、文末次入口、作者页前置入口、单一数据源、页面级引用、真实流式、scene 级 Turnstile、共享状态容器、非流式 fallback。
- 占位检查：无 `TBD` / `TODO` / “稍后实现” 这类占位。
- 类型一致性：计划中明确区分 `RecommendReference` 与 `PageReference`，并要求请求使用判别联合，避免 scene/context 混搭。

---

Plan complete and saved to `docs/plans/2026-05-04-page-ai-assistant-implementation-plan.md`. You can now review it and decide how to proceed with implementation.
