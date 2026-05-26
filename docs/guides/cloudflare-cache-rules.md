# Cloudflare Cache Rules Guide

> 适用于当前博客主站：Next.js 15、`output: 'export'`、静态导出、简报按期发布、文章低频更新，且允许在必要时手动 purge Cloudflare 缓存。

## 目标

- 控制在 6 类缓存规则以内，避免面板里规则过多、后续难维护
- 让大多数静态页面和静态资源尽可能长时间命中 Cloudflare 缓存，降低 GitHub Pages 回源压力
- 对 `/latest` 保持相对更短缓存，兼顾简报按需更新
- 对已发布文章、作者简介或历史页的修订，默认通过手动 purge 保证及时生效

## 规则顺序

Cloudflare Cache Rules 按顺序匹配。建议使用以下顺序：

1. `sw-no-cache`
2. `static-asset-cache`
3. `document-cache`
4. `latest-cache`
5. `data-and-meta-cache`
6. `site-page-cache`

---

## 1. sw-no-cache

### 用途

- `sw.js` 不做 CDN 缓存，确保浏览器尽快拿到最新版本

### Expression

```txt
(http.request.uri.path eq "/sw.js")
```

### Action

- Cache eligibility: `Bypass cache`

---

## 2. static-asset-cache

### 用途

- 长缓存真正的静态资源
- 这类资源一旦构建发布后通常不会变化，或变化时路径会变化

### 覆盖范围

- `/_next/static/*`
- `/images/*`
- `/icons/*`
- `/screenshots/*`
- `/favicon.ico`
- 非文档类静态文件扩展名：`.css`、`.js`、`.mjs`、`.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.svg`、`.ico`、`.woff`、`.woff2`、`.ttf`、`.otf`

### Expression

```txt
(
  starts_with(http.request.uri.path, "/_next/static/")
  or starts_with(http.request.uri.path, "/images/")
  or starts_with(http.request.uri.path, "/icons/")
  or starts_with(http.request.uri.path, "/screenshots/")
  or http.request.uri.path eq "/favicon.ico"
  or ends_with(http.request.uri.path, ".css")
  or ends_with(http.request.uri.path, ".js")
  or ends_with(http.request.uri.path, ".mjs")
  or ends_with(http.request.uri.path, ".png")
  or ends_with(http.request.uri.path, ".jpg")
  or ends_with(http.request.uri.path, ".jpeg")
  or ends_with(http.request.uri.path, ".gif")
  or ends_with(http.request.uri.path, ".webp")
  or ends_with(http.request.uri.path, ".svg")
  or ends_with(http.request.uri.path, ".ico")
  or ends_with(http.request.uri.path, ".woff")
  or ends_with(http.request.uri.path, ".woff2")
  or ends_with(http.request.uri.path, ".ttf")
  or ends_with(http.request.uri.path, ".otf")
)
and (http.request.method in {"GET" "HEAD"})
```

### TTL

- Edge TTL: `1 year`
- Browser TTL: `1 year`

### 说明

- 当前博客静态资源更新不频繁，且大部分资源要么是构建产物，要么是手工上传后很少再改
- 对 GitHub Pages 这类回源较慢的静态站，`1 year` 更能体现 CDN 价值

---

## 3. document-cache

### 用途

- 缓存简历、PDF、附件、公开文档

### Expression

```txt
(
  http.request.uri.path eq "/resume"
  or starts_with(http.request.uri.path, "/docs/")
)
and (http.request.method in {"GET" "HEAD"})
```

### TTL

- Edge TTL: `1 year`
- Browser TTL: `30 days`

---

## 4. latest-cache

### 用途

- 单独缓存会变化但路径固定的 latest 页面与 latest 分享图

### 覆盖范围

- `/articles/latest`
- `/ai/briefings/latest`
- `/investment/briefings/latest`
- `/ai/briefings/latest/opengraph-image`
- `/investment/briefings/latest/opengraph-image`

### Expression

```txt
(
  http.request.uri.path eq "/articles/latest"
  or http.request.uri.path eq "/ai/briefings/latest"
  or http.request.uri.path eq "/investment/briefings/latest"
  or http.request.uri.path eq "/ai/briefings/latest/opengraph-image"
  or http.request.uri.path eq "/investment/briefings/latest/opengraph-image"
)
and (http.request.method in {"GET" "HEAD"})
```

### TTL

- Edge TTL: `12 hours`
- Browser TTL: `2 hours`

### 说明

- 你的简报更新频率明显低于分钟级，因此 `12 hours` 仍然能兼顾“新一期尽快可见”与“尽量少回源”
- 如果当天发布后希望立刻全网生效，直接手动 purge 这几个 latest 路径即可

---

## 5. data-and-meta-cache

### 用途

- 缓存公开 JSON 数据和站点元信息文件

### 覆盖范围

- `/ai-data/*`
- `/investment-data/*`
- `/feed`
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.json`
- `/.well-known/*`

### Expression

```txt
(
  starts_with(http.request.uri.path, "/ai-data/")
  or starts_with(http.request.uri.path, "/investment-data/")
  or http.request.uri.path eq "/feed"
  or http.request.uri.path eq "/robots.txt"
  or http.request.uri.path eq "/sitemap.xml"
  or http.request.uri.path eq "/manifest.json"
  or starts_with(http.request.uri.path, "/.well-known/")
)
and (http.request.method in {"GET" "HEAD"})
```

### TTL

- Edge TTL: `1 day`
- Browser TTL: `12 hours`

### 说明

- 公开 JSON、RSS、站点元文件都会更新，但更新频率依然明显低于高频新闻站
- `1 day` 更适合你的更新节奏；如果当日发布后需要立刻刷新，也可以手动 purge

---

## 6. site-page-cache

### 用途

- 缓存博客绝大多数页面 HTML

### 覆盖范围

- `/`
- `/about`
- `/author`
- `/articles*`
- `/ai*`
- `/health*`
- `/investment*`
- 所有 `.html` 请求
- 普通日期页 `opengraph-image` 也会被这条排除，交给更前面的规则处理

### Expression

```txt
(
  http.request.uri.path eq "/"
  or http.request.uri.path eq "/about"
  or http.request.uri.path eq "/author"
  or starts_with(http.request.uri.path, "/articles")
  or starts_with(http.request.uri.path, "/ai")
  or starts_with(http.request.uri.path, "/health")
  or starts_with(http.request.uri.path, "/investment")
  or ends_with(http.request.uri.path, ".html")
)
and not (
  starts_with(http.request.uri.path, "/ai-data/")
  or starts_with(http.request.uri.path, "/investment-data/")
  or http.request.uri.path eq "/articles/latest"
  or http.request.uri.path eq "/ai/briefings/latest"
  or http.request.uri.path eq "/investment/briefings/latest"
  or http.request.uri.path eq "/ai/briefings/latest/opengraph-image"
  or http.request.uri.path eq "/investment/briefings/latest/opengraph-image"
)
and (http.request.method in {"GET" "HEAD"})
```

### TTL

- Edge TTL: `7 days`
- Browser TTL: `1 day`

### 说明

- 当前博客文章更新低频、AI/投资非 latest 页面一旦发布后通常不会频繁改动
- `health` 当前也是普通静态栏目页与栏目聚合页，和 `/ai`、`/investment` 一样适合走通用页面缓存
- 普通页面直接给到 `7 days` 更符合“尽量利用 CDN、减少 GitHub Pages 回源”的目标
- 如果后续修改了已发布文章、作者简介或普通页面，直接手动 purge 对应路径即可

---

## 推荐上线步骤

1. 在 Cloudflare 面板按本文从上到下创建 6 条新规则
2. 调整顺序，确保和本文一致
3. 全部创建完成后，做一次 Cache Purge，至少清理：
   - `/`
   - `/articles/latest`
   - `/ai/briefings/latest`
   - `/health`
   - `/investment/briefings/latest`
   - `/feed`
   - `/sitemap.xml`
   - `/robots.txt`

---

## 手动 Purge 策略

这套策略默认偏向“缓存尽可能久”，所以手动 purge 是正常运维动作，不是例外。

### 适合直接手动 purge 的场景

- 新一期 AI / 投资简报发布后，希望 `/latest` 立即更新
- 已发布文章正文被修订
- 作者简介、关于页、首页文案被修改
- `health` 栏目首页或某个健康专栏页被修改
- RSS、sitemap、robots、manifest 需要立即反映最新内容

### 最常用的 purge 路径

- 首页：`/`
- 关于页：`/about`
- 作者页：`/author`
- 健康栏目：`/health`
- 文章 latest：`/articles/latest`
- AI 简报 latest：`/ai/briefings/latest`
- 投资简报 latest：`/investment/briefings/latest`
- AI latest 分享图：`/ai/briefings/latest/opengraph-image`
- 投资 latest 分享图：`/investment/briefings/latest/opengraph-image`
- Feed：`/feed`
- Sitemap：`/sitemap.xml`
- Robots：`/robots.txt`

如果只是修某一篇文章或某一期简报，优先 purge 单一路径，不要动全站。

---

## 验证方法

配置完成后，使用 `curl -I` 连续请求两次，观察 `cf-cache-status`：

```bash
curl -I https://yuanshenjian.cn/
curl -I https://yuanshenjian.cn/articles/latest
curl -I https://yuanshenjian.cn/health
curl -I https://yuanshenjian.cn/ai/briefings/latest
curl -I https://yuanshenjian.cn/investment/briefings/latest
curl -I https://yuanshenjian.cn/ai/briefings/2026-05-10/opengraph-image
curl -I https://yuanshenjian.cn/ai-data/index.json
curl -I https://yuanshenjian.cn/feed
curl -I https://yuanshenjian.cn/sw.js
```

预期结果：

- 普通页面：第一次 `MISS`，之后 `HIT`
- `/latest`：会 `HIT`，但失效时间更短
- `opengraph-image`：会命中缓存
- `ai-data` / `investment-data`：会命中缓存，但刷新速度快于普通页面
- `/sw.js`：应为 `BYPASS`、`DYNAMIC` 或其他非长期缓存状态

---

## 额外说明

- 当前博客已经切到 `next/font/local`，不再依赖 Google Fonts 外网
- `public/_headers` 可继续保留为参考文档，但如果源站是 GitHub Pages，真实生效的缓存策略应以 Cloudflare 面板中的 Cache Rules 为准
