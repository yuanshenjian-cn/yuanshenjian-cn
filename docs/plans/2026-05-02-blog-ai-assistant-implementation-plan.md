# Blog AI Assistant Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 在当前 GitHub Pages 静态博客中，以最小改动上线 Phase 1 AI 能力（首页 AI 推荐），并为 Phase 2/3 保留可持续扩展的 Worker、静态索引和模型路由基础。

**Architecture:** 保持现有 Next.js 静态导出不变，在同一仓库下新增 `blog-ai-worker/` 子项目作为独立 package，通过 Cloudflare Worker 承接 AI 请求。当前已落地的 Phase 1 不再只是最初最小稿，而是包含 `origin + Turnstile hostname/action + per-IP limit + daily budget + emergency disable + query 预筛 + 站内 fallback` 的生产化最小闭环；Phase 2/3 必须继承这套安全与成本控制基线，而不是回退到早期 happy path 设计。

**Tech Stack:** Next.js 15、React 19、TypeScript、Cloudflare Workers、Workers KV、Cloudflare Turnstile、GitHub Pages、TokenHub OpenAI-compatible API。

---

## Progress Summary

- [x] 设计方案文档补充 monorepo 组织方式
- [x] 设计方案文档审核完成并修复所有关键问题
- [x] 执行计划文档审核完成并修复所有关键问题
- [x] Phase 1 代码实现完成
- [x] Phase 1 审核完成并修复所有关键问题
- [x] 用户侧配置说明整理完成

> 注：本文件下方 Task 1 ~ Task 8 主要保留 Phase 1 的原始实现轨迹。继续推进 Phase 2/3 时，请以本文件顶部 `Architecture`、`Phase Boundaries` 与后文 `Notes for Future Continuation` 的更新基线为准。

---

## File Structure

### Blog repository

- Modify: `package.json` — 新增 `build:ai-data`，并确保 `build:prod` 会先生成 `public/ai-data/index.json`
- Modify: `.env.example` — 新增前端 AI 相关公开变量
- Modify: `.gitignore` — 忽略 `public/ai-data/*.json` 与 `blog-ai-worker/.dev.vars` 等本地文件
- Modify: `lib/config.ts` — 新增 `ai` 配置节（Worker URL、Turnstile Site Key、可选启用开关）
- Create: `scripts/build-ai-data.js` — 直接读取 `content/blog/`，并对齐现有 `getAllPosts()` 的 published / excerpt / 排序语义，生成 Phase 1 所需 `public/ai-data/index.json`
- Create: `public/ai-data/.gitkeep` — 保留目录
- Create: `types/ai.ts` — 前端 AI 请求/响应类型
- Create: `lib/ai-client.ts` — 统一封装前端到 Worker 的请求
- Create: `components/ai/ai-recommend-widget.tsx` — 首页 AI 推荐组件（Phase 1）
- Modify: `app/page.tsx` — 接入首页 AI 推荐组件
- Verify: `npm run build:ai-data` — 作为 Phase 1 的脚本集成校验，不在 Vitest 中依赖预生成产物
- Test: `tests/lib/ai-client.test.ts` 或 `tests/components/ai/AiRecommendWidget.test.tsx` — 覆盖基础请求/错误分支

### Worker subpackage

- Create: `blog-ai-worker/package.json` — Worker 子项目依赖与脚本
- Create: `blog-ai-worker/tsconfig.json` — Worker TypeScript 配置
- Create: `blog-ai-worker/wrangler.toml` — Worker 配置、KV 绑定、路由 vars
- Create: `blog-ai-worker/src/index.ts` — Worker 入口
- Create: `blog-ai-worker/src/types.ts` — Env 与请求/响应类型
- Create: `blog-ai-worker/src/providers/types.ts` — Provider 接口
- Create: `blog-ai-worker/src/providers/tencent-tokenhub.ts` — Tencent TokenHub provider
- Create: `blog-ai-worker/src/providers/index.ts` — Provider 工厂
- Create: `blog-ai-worker/src/middleware/turnstile.ts` — Turnstile 验证
- Create: `blog-ai-worker/src/middleware/rate-limit.ts` — KV 固定窗口限流
- Create: `blog-ai-worker/src/middleware/origin.ts` — origin 校验
- Create: `blog-ai-worker/src/scenes/recommend.ts` — Phase 1 推荐场景逻辑
- Create: `blog-ai-worker/src/prompts/recommend.ts` — 推荐场景系统提示模板
- Create: `blog-ai-worker/src/utils/response.ts` — 统一 JSON 响应工具
- Verify: `npm --prefix blog-ai-worker run typecheck` + 本地 smoke request — 作为 Worker 最小验证链路

---

## Phase Boundaries

### Phase 1（本次实现）

- [x] `blog-ai-worker/` 子项目落地
- [x] Tencent TokenHub provider 可用
- [x] MiMo 仅保留文档扩展位，不进入 Phase 1 运行时实现
- [x] Turnstile 校验接入
- [x] Workers KV 固定窗口限流接入
- [x] Turnstile `hostname / action` 校验接入
- [x] 全局日预算止损与紧急关闭开关接入
- [x] `public/ai-data/index.json` 构建生成
- [x] 首页 `AiRecommendWidget` 可用
- [x] 前端与 Worker 使用统一 JSON 契约：`{ answer, references, usage? }`
- [x] 推荐场景 query 预筛与上下文限制落地
- [x] Provider 失败时站内确定性 fallback 落地

### Phase 2（仅计划，不实现）

- [ ] 文章页 `article` 场景
- [ ] 专栏页 `column` 场景
- [ ] `articles/{slug}.json` 与 `columns/{column}.json`
- [ ] `SCENE_ROUTING_CONFIG` 外置到 Worker vars，并显式包含 `turnstileAction`、`contextLimit`、`fallbackPolicy`
- [ ] article / column 场景继承 Phase 1 的安全、预算与 fallback 机制

### Phase 3（仅计划，不实现）

- [ ] 用量日志与运营指标
- [ ] 搜索增强（在预算与观测语义稳定后推进）
- [ ] 多 provider 灰度与 MiMo 深度接入

### Phase 2/3 Planning Adjustments（2026-05-04）

后续继续扩展前，先接受三个现实约束：

1. **Phase 1 已经不是“最小可演示稿”**，而是带安全兜底和成本约束的生产基线。
2. **新 scene 不能只复制 `recommend` 的接口表面**，必须补齐自己的 `turnstileAction`、上下文裁剪、fallback 和预算语义。
3. **搜索增强不应早于观测与预算治理**。否则搜索入口一旦 AI 化，会比首页推荐更容易放大流量与成本风险。

因此推荐顺序调整为：

1. 先做 `article` / `column` 的索引与 scene 契约设计
2. 再补 scene 级 routing / fallback / 预算配置
3. 然后做基础用量日志与运营指标
4. 最后再推进搜索增强与多 provider 灰度

---

### Task 1: Align plan with reviewed design

**Files:**
- Modify: `docs/specs/2026-05-02-blog-ai-assistant-design.md`
- Modify: `docs/plans/2026-05-02-blog-ai-assistant-implementation-plan.md`

- [x] **Step 1: Confirm reviewed design decisions are reflected**

Checklist:

```text
- Phase 1 只做 recommend 场景
- Phase 1 只生成 public/ai-data/index.json
- 文章真实路由为 /articles/${slug}
- Phase 1 返回 JSON，不做 SSE
- 限流为 KV 固定窗口计数
- blog-ai-worker/ 为同仓库下并列 package
```

Expected:
- 设计文档与执行计划没有互相矛盾的内容。

- [x] **Step 2: Keep progress summary accurate**

Update this plan’s `Progress Summary` immediately when the following milestones finish:

```text
1. 设计文档审核修复完成
2. 执行计划审核修复完成
3. Phase 1 实现完成
4. Phase 1 审核修复完成
5. 用户配置说明整理完成
```

Expected:
- 后续继续推进 Phase 2/3 时，能直接从本计划中看到当前完成状态。

- [x] **Step 3: Clarify root-vs-worker check boundaries**

Boundary rules:

```text
1. 根仓库 typecheck/lint/test 仅覆盖博客主站代码
2. blog-ai-worker/ 作为并列 package，自带独立依赖与独立 typecheck
3. Phase 1 不引入 npm workspaces
4. 必要时从根 tsconfig / root eslint 中排除 blog-ai-worker/**
```

Expected:
- 实现阶段不会出现“根检查是否应该覆盖 worker”的歧义。

---

### Task 2: Create Phase 1 ai-data generation

**Files:**
- Create: `scripts/build-ai-data.js`
- Create: `public/ai-data/.gitkeep`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Define script verification target**

Phase 1 不在 Vitest 中依赖预生成产物，而使用脚本集成校验：

```text
1. 执行 npm run build:ai-data
2. 断言 public/ai-data/index.json 被生成
3. 断言 JSON 可解析且 posts 为数组
```

- [ ] **Step 2: Implement minimal generator**

The generator should:

```text
1. 直接读取 content/blog 下的 .md/.mdx 文件
2. 对齐现有 getAllPosts() 语义：仅包含 published 文章、使用 excerpt 字段、按日期倒序
3. 仅生成 Phase 1 需要的字段：slug/title/excerpt/tags/date
4. 写入 public/ai-data/index.json
5. 自动创建 public/ai-data 目录
```

Expected JSON shape:

```json
{
  "generated": "2026-05-02T00:00:00.000Z",
  "posts": [
    {
      "slug": "example-post",
      "title": "Example Post",
      "excerpt": "Short excerpt...",
      "tags": ["AI"],
      "date": "2026-05-02T00:00:00.000Z"
    }
  ]
}
```

- [ ] **Step 3: Wire build scripts**

Update `package.json` so that both local build and CI build include ai-data generation:

```json
{
  "scripts": {
    "build:ai-data": "node scripts/build-ai-data.js",
    "build": "npm run build:ai-data && next build",
    "build:prod": "npm run optimize-images && npm run build"
  }
}
```

This keeps `build:ai-data` maintenance in one place and ensures current GitHub Pages CI (`npm run build:prod`) picks it up automatically.

- [ ] **Step 4: Ignore generated artifacts**

Update `.gitignore` to include:

```gitignore
public/ai-data/*.json
blog-ai-worker/.dev.vars
blog-ai-worker/.wrangler/
blog-ai-worker/node_modules/
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run build:ai-data
```

Expected:
- `public/ai-data/index.json` exists and has valid JSON structure.

---

### Task 3: Add blog-side AI configuration and client contract

**Files:**
- Modify: `.env.example`
- Modify: `lib/config.ts`
- Create: `types/ai.ts`
- Create: `lib/ai-client.ts`
- Test: `tests/lib/ai-client.test.ts`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Define public env contract**

Add to `.env.example`:

```env
NEXT_PUBLIC_AI_WORKER_URL=/api/ai
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
NEXT_PUBLIC_AI_ENABLED=true
```

Also plan to inject these public envs in the GitHub Pages build step where production static assets are generated.

- [ ] **Step 2: Add `ai` config section**

Shape to add in `lib/config.ts`:

```ts
ai: {
  enabled: process.env.NEXT_PUBLIC_AI_ENABLED !== "false",
  workerUrl: process.env.NEXT_PUBLIC_AI_WORKER_URL || "/api/ai",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
}
```

- [ ] **Step 3: Define shared frontend types**

Create `types/ai.ts` with at least:

```ts
export interface AIReference {
  slug: string;
  title: string;
  excerpt: string;
}

export interface AIChatResponse {
  answer: string;
  references: AIReference[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}
```

- [ ] **Step 4: Implement `lib/ai-client.ts`**

Phase 1 contract:

```ts
POST ${workerUrl}/chat
{
  scene: "recommend",
  message: string,
  context?: object,
  cf_turnstile_response: string
}
```

The helper should:

```text
1. 发送 JSON 请求
2. 在非 2xx 时抛出可读错误
3. 返回 AIChatResponse
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test
```

Expected:
- 相关单元测试通过，未破坏现有测试。

- [ ] **Step 6: Inject public AI envs into GitHub Pages build**

Update `.github/workflows/deploy.yml` Build step env block to include:

```yaml
NEXT_PUBLIC_AI_WORKER_URL: ${{ vars.NEXT_PUBLIC_AI_WORKER_URL }}
NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY }}
NEXT_PUBLIC_AI_ENABLED: ${{ vars.NEXT_PUBLIC_AI_ENABLED }}
```

Expected:
- 生产静态构建拿到前端 AI 所需公开变量。

---

### Task 4: Create Worker Phase 1 foundation

**Files:**
- Create: `blog-ai-worker/package.json`
- Create: `blog-ai-worker/tsconfig.json`
- Create: `blog-ai-worker/wrangler.toml`
- Create: `blog-ai-worker/src/index.ts`
- Create: `blog-ai-worker/src/types.ts`
- Create: `blog-ai-worker/src/utils/response.ts`
- Modify: `tsconfig.json`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Create Worker package manifest**

Include scripts similar to:

```json
{
  "name": "blog-ai-worker",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  }
}
```

Decide explicitly that `blog-ai-worker/package-lock.json` is committed, because this subpackage is not managed by workspaces and should have reproducible installs.

- [ ] **Step 2: Define Worker env bindings**

`src/types.ts` should define at least:

```ts
export interface Env {
  RATE_LIMIT_KV: KVNamespace;
  LLM_PROVIDER_API_KEY: string;
  LLM_PROVIDER_BASE_URL: string;
  TURNSTILE_SECRET_KEY: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_WINDOW_SECONDS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  AI_DATA_BASE_URL: string;
  MIMO_API_KEY?: string;
  MIMO_BASE_URL?: string;
}
```

- [ ] **Step 3: Add `wrangler.toml`**

Minimal config:

```toml
name = "blog-ai-worker"
main = "src/index.ts"
compatibility_date = "2026-05-02"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "<kv-namespace-id>"

[vars]
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000"
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "10"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"

[[routes]]
pattern = "yuanshenjian.cn/api/ai/*"
zone_name = "yuanshenjian.cn"
```

- [ ] **Step 4: Implement Worker entry**

Phase 1 only needs:

```text
POST /chat
OPTIONS /chat
404 for other paths
```

Expected:
- Worker entry can route requests to Phase 1 recommend scene.

- [ ] **Step 5: Keep root checks isolated from worker package**

Apply one of these minimal rules and document it in code:

```text
1. 根 tsconfig exclude blog-ai-worker/**
2. 根 ESLint ignores blog-ai-worker/**
```

Expected:
- `npm run typecheck` / `npm run lint` in root only check the blog app.

---

### Task 5: Implement Worker middleware and Tencent TokenHub provider

**Files:**
- Create: `blog-ai-worker/src/providers/types.ts`
- Create: `blog-ai-worker/src/providers/tencent-tokenhub.ts`
- Create: `blog-ai-worker/src/providers/index.ts`
- Create: `blog-ai-worker/src/middleware/turnstile.ts`
- Create: `blog-ai-worker/src/middleware/rate-limit.ts`
- Create: `blog-ai-worker/src/middleware/origin.ts`

- [ ] **Step 1: Implement origin guard**

Rules:

```text
1. 生产允许 yuanshenjian.cn
2. 本地开发允许 localhost:3000
3. 对非法 origin 返回 403
```

- [ ] **Step 2: Implement Turnstile verification**

Verification target:

```text
POST https://challenges.cloudflare.com/turnstile/v0/siteverify
secret=<TURNSTILE_SECRET_KEY>
response=<cf_turnstile_response>
remoteip=<CF-Connecting-IP>
```

Failure behavior:

```json
{ "error": "Turnstile verification failed" }
```

- [ ] **Step 3: Implement KV fixed-window rate limiting**

Behavior:

```text
1. key = ratelimit:{ip}:{hourBucket}
2. 计数达到阈值时返回 429
3. 返回 Retry-After 头
```

- [ ] **Step 4: Implement Tencent TokenHub provider**

Payload shape:

```json
{
  "model": "glm-5.1",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "你好" }
  ],
  "stream": false
}
```

Response extraction target:

```text
choices[0].message.content
usage.prompt_tokens
usage.completion_tokens
```

- [ ] **Step 5: Keep MiMo out of Phase 1 runtime path**

Phase 1 不实现 `mimo.ts`，只在设计与后续计划中保留扩展位。`providers/index.ts` 先只注册 Tencent TokenHub，避免把非必需复杂度混入首发代码。

---

### Task 6: Implement recommend scene response contract

**Files:**
- Create: `blog-ai-worker/src/scenes/recommend.ts`
- Create: `blog-ai-worker/src/prompts/recommend.ts`
- Modify: `blog-ai-worker/src/index.ts`

- [ ] **Step 1: Fetch `index.json` from AI data base URL**

Target:

```ts
const response = await fetch(`${env.AI_DATA_BASE_URL}/index.json`);
```

- [ ] **Step 2: Build minimal prompt**

Prompt behavior:

```text
1. 只基于提供的 posts 列表推荐文章
2. 不知道就明确说不知道
3. 输出简短结论
4. 同时返回推荐引用列表
```

Internal contract:

```text
1. 模型只返回 JSON：{ answer: string, slugs: string[] }
2. Worker 用 index.json 校验 slugs 是否存在
3. Worker 再把 slugs 映射为 references[{slug,title,excerpt}]
```

- [ ] **Step 3: Return structured JSON**

Phase 1 response contract:

```json
{
  "answer": "推荐你先看这几篇……",
  "references": [
    {
      "slug": "example-post",
      "title": "Example Post",
      "excerpt": "Short excerpt..."
    }
  ],
  "usage": {
    "promptTokens": 123,
    "completionTokens": 45
  }
}
```

- [ ] **Step 4: Validate locally**

Run:

```bash
cd blog-ai-worker
npm run dev
```

Expected:
- `POST /chat` can complete the recommend flow end-to-end when env is configured.

---

### Task 7: Add homepage AI widget

**Files:**
- Create: `components/ai/ai-recommend-widget.tsx`
- Modify: `app/page.tsx`
- Test: `tests/lib/ai-client.test.ts`（优先）或 `tests/components/ai/ai-recommend-widget.test.tsx`

- [ ] **Step 0: Decide component file naming to match repository style**

Use repository naming conventions consistently:

```text
组件文件使用 kebab-case：components/ai/ai-recommend-widget.tsx
```

- [ ] **Step 1: Implement minimal widget UI**

Widget requirements:

```text
1. 输入框
2. 提交按钮
3. 加载态
4. 错误态
5. answer 文本展示
6. 推荐文章列表展示（点击跳转 /articles/${slug}）
```

- [ ] **Step 2: Add Turnstile token acquisition flow**

Define the complete frontend flow:

```text
1. 仅在用户打开或提交 widget 时加载 Turnstile SDK
2. 使用显式渲染 + execute 模式获取 token
3. token 获取失败时展示可读错误
4. token 过期后重新获取
5. 若 turnstile site key 缺失，则组件不渲染提交能力
```

- [ ] **Step 3: Use `aiChat` helper**

Call contract:

```ts
await aiChat({
  scene: "recommend",
  message,
  turnstileToken,
});
```

- [ ] **Step 4: Gate by config**

If `config.ai.enabled === false` or `config.ai.turnstileSiteKey` is empty, the widget should still avoid making broken requests. 当前已落地实现是：组件仍渲染，但提交链路不可用，并会给出可读错误提示。

- [ ] **Step 5: Insert into homepage**

Placement target:

```text
Hero 区域内嵌输入式推荐组件，不再是 Hero 之后的独立模块
```

Expected:
- 首页出现轻量 AI 推荐模块，不破坏现有 Hero 和最新文章布局。

---

### Task 8: Validate Phase 1 end-to-end

**Files:**
- Modify: `docs/plans/2026-05-02-blog-ai-assistant-implementation-plan.md`
- Modify: `docs/specs/2026-05-02-blog-ai-assistant-design.md`（仅当实施偏差需要回填时）

- [ ] **Step 1: Run blog checks**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build:ai-data
npm run build
```

Expected:
- 前端类型、lint、测试、静态构建全部通过。

- [ ] **Step 2: Run Worker local verification**

Run:

```bash
ls blog-ai-worker
npm --prefix blog-ai-worker install
npm --prefix blog-ai-worker run typecheck
npm --prefix blog-ai-worker run dev
```

Expected:
- Worker 本地可启动。

- [ ] **Step 3: Send a smoke request to local worker**

After `wrangler dev` is running, send one minimal request:

```bash
curl -X POST "http://127.0.0.1:8787/chat" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "scene": "recommend",
    "message": "给我推荐几篇关于 AI 编程的文章",
    "cf_turnstile_response": "test-token"
  }'
```

Expected:
- 在使用测试 token / 测试模式配置时，Worker 能返回结构化 JSON 或明确的验证错误。

- [ ] **Step 4: Update progress summary**

Mark completed items in this plan immediately after:

```text
- 设计方案文档审核完成并修复所有关键问题
- 执行计划文档审核完成并修复所有关键问题
- Phase 1 代码实现完成
```

- [ ] **Step 5: Prepare user-facing configuration checklist**

The final handoff must include:

```text
1. Cloudflare Turnstile Site Key / Secret Key 配置
2. Cloudflare KV namespace 创建与绑定
3. Worker secrets 配置
4. Worker vars 配置
5. 前端 .env.local 配置
6. 如何部署 blog-ai-worker
7. 如何重新部署博客以生成 ai-data
```

Expected:
- 用户完成这些配置后，可以看到首页 AI 推荐功能。

---

## Notes for Future Continuation

- 执行 Phase 2 时，先更新本文件 `Phase Boundaries` 与 `Progress Summary`
- 新增 article/column 功能前，先确认 `articles/{slug}.json` 和 `columns/{column}.json` 结构
- article / column / search 任一新 scene，都必须单独定义自己的 `turnstileAction`、上下文裁剪规则、fallback 策略与预算语义
- 搜索增强应排在用量日志与预算治理之后，不建议直接跳过观测层
- MiMo 接入前，必须先补齐官方文档，再更新设计文档第 13 节的 TBD 状态
