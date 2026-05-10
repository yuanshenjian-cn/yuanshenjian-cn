# Blog Optimization Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 修复当前博客工程审核中发现的安全、静态导出、SEO、内容质量、可访问性、性能、PWA 与 CI 问题。

**Architecture:** 保持现有 Next.js 15 App Router + 静态导出架构，不做大规模重构。优先用最小改动修复真实问题：依赖对齐、Metadata 结构修正、内容校验脚本、MDX 渲染管线、客户端交互语义、CI 验证链路。

**Tech Stack:** Next.js 15、React 19、TypeScript、Tailwind CSS、MDX/next-mdx-remote、Vitest、GitHub Actions、GitHub Pages。

---

## File Structure

- Modify: `package.json` — 升级依赖、修复 `start`、新增内容校验脚本。
- Modify: `package-lock.json` — 由 `npm install` 自动更新依赖锁定版本。
- Modify: `next.config.ts` — 移除未使用的 `@next/mdx` wrapper，保留静态导出配置。
- Modify: `README.md` — 同步生产预览脚本说明。
- Modify: `.github/workflows/deploy.yml` — 增加 lint、内容校验，修正 Next cache 路径。
- Modify: `app/layout.tsx` — 增加 `metadataBase`、RSS alternate、修正 apple icon。
- Modify: `lib/seo-utils.ts` — 修正 article Open Graph 和分页 canonical URL。
- Modify: `app/articles/[slug]/page.tsx` — 使用修正后的 Metadata，增加 `dynamicParams = false`。
- Modify: `app/articles/page/[page]/page.tsx` — 增加 `dynamicParams = false`。
- Modify: `app/ai/[column]/page.tsx` — 增加 `dynamicParams = false`。
- Modify: `app/feed/route.ts` — 删除静态导出不支持的 `revalidate`。
- Modify: `app/sitemap.ts` — 补充 `/resume` 和分页页。
- Modify: `lib/mdx.tsx` — 接入 `rehype-prism-plus`，给 Markdown 图片加 lazy/async。
- Modify: `lib/blog.ts` — 暴露内容目录路径工具、slug 冲突检测支持函数。
- Modify: `scripts/validate-post.js` — 支持 `.mdx`、校验 slug 冲突、brief、内链、图片 alt。
- Modify: `scripts/optimize-images.js` — 移除构建时自动安装依赖行为。
- Modify: `components/articles-content.tsx` — 修复标签点击的语义和键盘可访问性。
- Modify: `components/global-search.tsx` — 增加焦点管理和 Escape/焦点回收。
- Modify: `components/share-buttons.tsx` — 增加 noopener/noreferrer 与弹窗语义。
- Modify: `components/floating-toc-button.tsx` — 增加移动目录抽屉 dialog 语义和 Escape。
- Modify: `components/header.tsx` — 如果改动成本可控，将搜索弹窗动态加载。
- Modify: `public/sw.js` — 增加缓存版本化和容量限制。
- Modify: `content/blog/**/*.md`、`content/blog/**/*.mdx` — 批量修复旧内链、缺失 brief、明显无意义图片 alt。
- Test: `tests/lib/seo-utils.test.ts` — 覆盖分页 canonical 与 Article OG。
- Test: `tests/lib/content-validation.test.ts` — 覆盖 slug 冲突、内链、brief、图片 alt 校验辅助逻辑。

---

### Task 1: Baseline and Dependency Safety

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `next.config.ts`
- Modify: `README.md`

- [ ] **Step 1: Capture current baseline**

Run:

```bash
git status --short
npm audit --json
npm run typecheck
npm run lint
npm test
```

Expected:
- Understand any pre-existing uncommitted files before editing.
- `typecheck`、`lint`、`test` should pass before changes.
- `npm audit` currently reports Next/PostCSS issues.

- [ ] **Step 2: Upgrade vulnerable dependencies**

Run:

```bash
npm install next@^15.5.15 postcss@^8.5.10 eslint-config-next@^15.5.15
```

Expected:
- `package.json` and `package-lock.json` update.
- Next and ESLint config Next stay aligned.

- [ ] **Step 3: Remove unused `@next/mdx` integration**

Edit `package.json` dependencies by removing:

```json
"@mdx-js/loader": "^3.1.1",
"@mdx-js/react": "^3.1.1",
"@next/mdx": "^16.1.6",
"@vercel/og": "^0.8.6",
"html2canvas": "^1.4.1"
```

Run:

```bash
npm install
```

Expected:
- Lockfile no longer includes unused MDX loader wrapper dependencies unless required transitively.

- [ ] **Step 4: Simplify `next.config.ts`**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  basePath: "",
  images: {
    unoptimized: true,
  },
  compress: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
```

Expected:
- No `@next/mdx` import remains.
- Runtime MDX remains handled by `next-mdx-remote/rsc`.

- [ ] **Step 5: Fix static export preview script**

In `package.json`, add `serve` dev dependency and change scripts:

```json
"start": "serve dist"
```

Run:

```bash
npm install --save-dev serve
```

Expected:
- Production preview serves exported static files.

- [ ] **Step 6: Add Node engines**

Add to `package.json` root:

```json
"engines": {
  "node": ">=20 <21"
}
```

Expected:
- Local and CI Node versions are explicit.

- [ ] **Step 7: Update README command docs**

Find production preview docs in `README.md` and make sure they say:

```bash
npm run build:prod
npm run start        # preview exported ./dist directory
```

Expected:
- Docs no longer imply `next start`.

- [ ] **Step 8: Validate dependency fixes**

Run:

```bash
npm audit
npm run typecheck
npm run lint
npm test
```

Expected:
- No high/moderate audit issues from Next/PostCSS.
- Typecheck, lint, tests pass.

---

### Task 2: SEO, Metadata, Sitemap, RSS, and Route Semantics

**Files:**
- Modify: `app/layout.tsx`
- Modify: `lib/seo-utils.ts`
- Modify: `app/articles/[slug]/page.tsx`
- Modify: `app/articles/page/[page]/page.tsx`
- Modify: `app/ai/[column]/page.tsx`
- Modify: `app/feed/route.ts`
- Modify: `app/sitemap.ts`
- Test: `tests/lib/seo-utils.test.ts`

- [ ] **Step 1: Write SEO utility tests**

Create `tests/lib/seo-utils.test.ts` with tests asserting:

```ts
import { describe, expect, it } from "vitest";
import { generateListPageSEO, generateOpenGraph } from "@/lib/seo-utils";
import type { Post } from "@/types/blog";

const post: Post = {
  slug: "example-post",
  year: "2026",
  month: "04",
  day: "27",
  title: "Example Post",
  date: "2026-04-27T00:00:00.000Z",
  excerpt: "This is a useful excerpt for testing metadata output.",
  content: "# Example",
  tags: ["Next.js", "SEO"],
  published: true,
  readingTime: 3,
  category: "swd",
  relativePath: "swd/example-post.md",
};

describe("seo-utils", () => {
  it("uses path-based canonical URLs for paginated article pages", () => {
    const seo = generateListPageSEO("文章", "文章列表", "https://yuanshenjian.cn/articles", {
      pageNumber: 2,
      totalPages: 4,
      paginationPath: (page) => page === 1 ? "/articles" : `/articles/page/${page}`,
    });

    expect(seo.openGraph.url).toBe("https://yuanshenjian.cn/articles/page/2");
    expect(seo.alternates?.canonical).toBe("https://yuanshenjian.cn/articles/page/2");
    expect(seo.alternates?.prev).toBe("https://yuanshenjian.cn/articles");
    expect(seo.alternates?.next).toBe("https://yuanshenjian.cn/articles/page/3");
  });

  it("returns Next Metadata-compatible article open graph fields", () => {
    const og = generateOpenGraph(post, "https://yuanshenjian.cn/articles/example-post");

    expect(og.type).toBe("article");
    expect(og.publishedTime).toBe(post.date);
    expect(og.modifiedTime).toBe(post.date);
    expect(og.authors).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(og.tags).toEqual(post.tags);
    expect("article" in og).toBe(false);
  });
});
```

- [ ] **Step 2: Run SEO tests to verify failure**

Run:

```bash
npm test -- tests/lib/seo-utils.test.ts
```

Expected:
- Fails before implementation because `paginationPath` and top-level article fields do not exist.

- [ ] **Step 3: Fix `lib/seo-utils.ts`**

Update `generateOpenGraph` return object so article fields are top-level:

```ts
return {
  title: post.title,
  description: enrichedDescription,
  type: "article" as const,
  url,
  siteName: SITE_NAME,
  locale: config.site.locale,
  images: [
    {
      url: ogImage,
      width: 1200,
      height: 630,
      alt: post.title,
    },
  ],
  publishedTime: post.date,
  modifiedTime: post.date,
  authors: [config.author.name],
  tags: post.tags,
};
```

Extend `generateListPageSEO` options:

```ts
paginationPath?: (page: number) => string;
```

Inside `generateListPageSEO`, compute URLs with:

```ts
const resolvePageUrl = (page?: number) => {
  if (!page || page <= 1) return url;
  if (!options?.paginationPath) return `${url}?page=${page}`;
  return new URL(options.paginationPath(page), config.site.url).toString();
};

const currentUrl = resolvePageUrl(options?.pageNumber);
```

Then use `currentUrl`, `resolvePageUrl(page - 1)`, `resolvePageUrl(page + 1)` for OG/canonical/prev/next.

- [ ] **Step 4: Add root metadata base and RSS alternate**

In `app/layout.tsx`, import config and update metadata:

```ts
import { config } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.site.url),
  title: "袁慎建的主页 | Yuan Shenjian's Personal Blog",
  description: "分享技术知识、生活感悟与个人想法",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YSJ Blog",
  },
  other: {
    "color-scheme": "dark light",
  },
};
```

- [ ] **Step 5: Update paginated metadata call sites**

In `app/articles/page/[page]/page.tsx`, pass:

```ts
paginationPath: (page) => page === 1 ? "/articles" : `/articles/page/${page}`,
```

Expected:
- Canonical for `/articles/page/2` is path based.

- [ ] **Step 6: Add dynamic route static semantics**

Add to these files:

```ts
export const dynamicParams = false;
```

Files:
- `app/articles/[slug]/page.tsx`
- `app/articles/page/[page]/page.tsx`
- `app/ai/[column]/page.tsx`

- [ ] **Step 7: Remove RSS revalidate**

In `app/feed/route.ts`, delete:

```ts
export const revalidate = 3600;
```

- [ ] **Step 8: Include resume and pagination in sitemap**

In `app/sitemap.ts`, include:

```ts
{
  url: `${baseUrl}/resume`,
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.6,
}
```

Also include article pagination pages from page 2 to `totalPages`:

```ts
const { totalPages } = getPaginatedPosts(1);
const paginationPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
  url: `${baseUrl}/articles/page/${index + 2}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.7,
}));
```

- [ ] **Step 9: Validate SEO fixes**

Run:

```bash
npm test -- tests/lib/seo-utils.test.ts
npm run typecheck
npm run build
```

Expected:
- SEO tests pass.
- Static build succeeds.

---

### Task 3: Content Validation and Content Fixes

**Files:**
- Modify: `scripts/validate-post.js`
- Modify: `package.json`
- Modify: `content/blog/**/*.md`
- Test: `tests/lib/content-validation.test.ts` if reusable helpers are extracted.

- [ ] **Step 1: Update `validate-post` script behavior**

Modify `scripts/validate-post.js` to:
- include both `.md` and `.mdx` files;
- fail on duplicate slug basenames;
- warn or fail on missing `brief` for published posts;
- fail on internal old links matching `/articles/YYYY/MM/DD/`, `/blog/`, or known bare legacy article paths;
- fail on missing local images;
- warn on empty or generic image alt values: `""`, `image`, `Alt text`, `图片`.

Use concrete matching rules:

```js
const MARKDOWN_EXT_RE = /\.mdx?$/i;
const OLD_ARTICLE_DATE_LINK_RE = /\]\(\/articles\/\d{4}\/\d{2}\/\d{2}\//g;
const OLD_BLOG_LINK_RE = /\]\(\/blog\//g;
const GENERIC_ALT_RE = /^\s*(|image|alt text|图片)\s*$/i;
```

- [ ] **Step 2: Add validation script to package lifecycle**

In `package.json`, add:

```json
"validate-content": "node scripts/validate-post.js"
```

Keep existing `validate-post` as alias if desired:

```json
"validate-post": "node scripts/validate-post.js",
"validate-content": "node scripts/validate-post.js"
```

- [ ] **Step 3: Run content validation and list failures**

Run:

```bash
npm run validate-content
```

Expected:
- Fails with concrete files/lines for old links, missing brief, or generic image alt.

- [ ] **Step 4: Fix old internal links**

For each old route found:
- Replace `/articles/YYYY/MM/DD/<slug>` with `/articles/<slug>`.
- Replace `/blog/<slug>` with `/articles/<slug>` if `<slug>` exists as a current slug.
- Replace bare legacy paths like `/some-tips-for-newer/...` with their current `/articles/<slug>` target or remove link if target no longer exists.

Expected:
- No published content links to known old blog paths.

- [ ] **Step 5: Add missing `brief` to published posts**

For each published post missing `brief`, add one concise Chinese/English summary in frontmatter:

```yaml
brief: "一句话概括文章主题，控制在 80 到 140 字之间。"
```

Expected:
- List pages and SEO no longer depend on body truncation for those posts.

- [ ] **Step 6: Fix generic image alt text**

For Markdown images like:

```md
![](./image.png)
![image](./diagram.png)
![Alt text](./screenshot.png)
```

Replace with specific descriptions:

```md
![Claude Code 模型配置界面截图](./image.png)
![OpenCode 分类速查表截图](./diagram.png)
![敏捷实践关系示意图](./screenshot.png)
```

Expected:
- Published posts have meaningful image alt text where feasible.

- [ ] **Step 7: Validate content fixes**

Run:

```bash
npm run validate-content
npm test
```

Expected:
- Content validation passes or only emits accepted warnings.
- Existing tests still pass.

---

### Task 4: MDX Rendering, Images, Search Payload, and Accessibility

**Files:**
- Modify: `lib/mdx.tsx`
- Modify: `components/articles-content.tsx`
- Modify: `components/global-search.tsx`
- Modify: `components/share-buttons.tsx`
- Modify: `components/floating-toc-button.tsx`
- Modify: `components/header.tsx`

- [ ] **Step 1: Add syntax highlighting to actual MDX pipeline**

In `lib/mdx.tsx`, import:

```ts
import rehypePrismPlus from "rehype-prism-plus";
```

Update `rehypePlugins`:

```ts
rehypePlugins: [
  rehypeSlug,
  rehypePrismPlus,
],
```

Expected:
- Code highlighting plugin runs in `next-mdx-remote/rsc` path.

- [ ] **Step 2: Add Markdown image loading attributes**

Replace image component with:

```tsx
img: ({ src, alt }: ImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={src}
    alt={alt ?? ""}
    loading="lazy"
    decoding="async"
    className="max-w-full h-auto my-4 rounded-lg"
  />
),
```

Expected:
- Markdown images load lazily and decode asynchronously.

- [ ] **Step 3: Fix article tag click semantics**

In `components/articles-content.tsx`, replace clickable `<span onClick>` tags inside links with buttons or prevent nested interactive misuse. Preferred pattern:

```tsx
<button
  type="button"
  onClick={(event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleTag(tag);
  }}
  className="..."
  aria-pressed={selectedTags.includes(tag)}
>
  {tag}
</button>
```

Expected:
- Tags are keyboard focusable and semantically interactive.

- [ ] **Step 4: Add search dialog focus management**

In `components/global-search.tsx`:
- Save trigger element before opening: `const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;`
- Focus search input after open.
- On close, restore focus to previous element.
- Trap Tab inside dialog by cycling first/last focusable elements.
- Keep Escape close behavior.

Expected:
- Search modal is usable by keyboard and screen readers.

- [ ] **Step 5: Add external popup safety**

In `components/share-buttons.tsx`, change `window.open` calls to include:

```ts
window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
```

Expected:
- External windows cannot access `window.opener`.

- [ ] **Step 6: Add dialog semantics to share and TOC overlays**

For share modal and mobile TOC drawer, add:

```tsx
role="dialog"
aria-modal="true"
aria-labelledby="..."
```

Add Escape listener while open:

```ts
useEffect(() => {
  if (!isOpen) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") setIsOpen(false);
  };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [isOpen]);
```

Expected:
- Overlays announce as dialogs and can close via Escape.

- [ ] **Step 7: Dynamically load search if straightforward**

In `components/header.tsx`, use Next dynamic import for the client search component if it does not break existing server/client boundaries:

```ts
import dynamic from "next/dynamic";

const GlobalSearch = dynamic(() => import("@/components/global-search").then((mod) => mod.GlobalSearch), {
  ssr: false,
});
```

If TypeScript or RSC constraints make this noisy, skip this step and keep as a future optimization rather than restructuring Header.

- [ ] **Step 8: Validate UI changes**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected:
- No hook dependency errors.
- Static export build succeeds.

---

### Task 5: Image Optimization Script and PWA Cache

**Files:**
- Modify: `scripts/optimize-images.js`
- Modify: `public/sw.js`

- [ ] **Step 1: Remove build-time auto-install from image script**

In `scripts/optimize-images.js`, replace any `npm install sharp --save-dev` execution with:

```js
console.error("sharp is required for image optimization. Run: npm install --save-dev sharp");
process.exit(1);
```

Expected:
- Build scripts do not mutate dependencies.

- [ ] **Step 2: Make optimized image cleanup safe**

Ensure cleanup only deletes generated files matching:

```js
/-\d+w\.webp$/
```

and logs every removed generated file.

Expected:
- Source images are never deleted.

- [ ] **Step 3: Version service worker cache names**

In `public/sw.js`, define:

```js
const CACHE_VERSION = "v2";
const STATIC_CACHE = `ysj-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ysj-runtime-${CACHE_VERSION}`;
const MAX_RUNTIME_ENTRIES = 80;
```

Add helper:

```js
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await cache.delete(keys[0]);
  await trimCache(cacheName, maxEntries);
}
```

Call after runtime `cache.put`:

```js
await trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
```

Expected:
- Runtime cache cannot grow without bound.

- [ ] **Step 4: Validate build with image optimization**

Run:

```bash
npm run optimize-images
npm run build
```

Expected:
- No dependency mutation.
- Build succeeds.

---

### Task 6: CI and Full Verification

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `vitest.config.ts` if adding coverage thresholds.

- [ ] **Step 1: Add lint and content validation to CI**

In `.github/workflows/deploy.yml`, after typecheck add:

```yaml
      - name: Lint
        run: npm run lint

      - name: Validate content
        run: npm run validate-content
```

Expected:
- CI catches lint and content regressions before build.

- [ ] **Step 2: Fix Next cache path**

Change cache path from:

```yaml
.next/cache
```

to:

```yaml
dist/cache
```

Expected:
- Cache path matches `distDir: "dist"`.

- [ ] **Step 3: Run final verification**

Run:

```bash
npm audit
npm run validate-content
npm run typecheck
npm run lint
npm test
npm run build:prod
```

Expected:
- Audit has no high/moderate actionable issues.
- Content validation passes.
- Typecheck, lint, tests, production build pass.

- [ ] **Step 4: Review git diff**

Run:

```bash
git diff --stat
git diff -- package.json next.config.ts lib/seo-utils.ts app/layout.tsx .github/workflows/deploy.yml
```

Expected:
- Every changed line maps to this optimization plan.
- No secrets or local files are included.

---

## Self-Review

- Spec coverage: Plan covers dependency vulnerabilities, MDX version drift, static export preview, old content links, pagination canonical, Article OG metadata, RSS revalidate, CI lint/cache, image script side effects, actual MDX highlighting, slug conflict risk, `.mdx` validation, missing brief, image alt, Markdown image loading, key accessibility issues, search payload, PWA cache, sitemap, metadataBase, Node engine.
- Placeholder scan: No `TBD` or undefined “implement later” tasks. Steps include exact files, commands, and expected outcomes.
- Type consistency: New SEO option is consistently named `paginationPath`; validation script command is consistently `validate-content`; route semantic export is consistently `dynamicParams`.
