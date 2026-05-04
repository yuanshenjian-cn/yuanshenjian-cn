# Troubleshoots

> 记录项目中已经定位并修复过、且值得后续复用的重要问题。

---

## 2026-05-04 GitHub Pages 误走 legacy/Jekyll 构建，导致 README.md 中 `{{ }}` 被 Liquid 解析报错

### 现象

GitHub Actions 日志中出现类似报错：

```text
Run actions/jekyll-build-pages@v1
Liquid Exception: Liquid syntax error ... README.md
Variable '{{ ... }}' was not properly terminated
```

典型触发点是 `README.md` 中的 JSX / 对象字面量示例，例如：

```tsx
<MDXRemote
  source={content}
  options={{
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypePrismPlus],
    },
  }}
/>
```

其中 `{{` 被 Jekyll 的 Liquid 模板引擎误识别为模板语法起始符。

### 根因

仓库虽然已经使用 `.github/workflows/deploy.yml` 通过 GitHub Actions 部署 Next.js 静态产物，但 GitHub Pages 仓库设置仍然是：

- `build_type: legacy`
- `source.branch: main`
- `source.path: /`

这意味着 GitHub Pages 仍会对仓库根目录执行默认的 **Jekyll branch build**，从而扫描并渲染 `README.md`、文档和 Markdown 内容。

### 正确修复

不要去逐个修补 README / 文档 / 文章中的 `{{ }}`。

正确修法是把 GitHub Pages 的发布方式从 **Deploy from a branch** 切换为 **GitHub Actions**。

网页操作路径：

```text
GitHub 仓库 -> Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

切换后：

- GitHub 不再对仓库源码执行默认 Jekyll 构建
- 站点只使用 `.github/workflows/deploy.yml` 上传的静态产物部署
- `README.md` 中的 `{{ }}` 不再触发 Liquid 报错

### 如何确认修复生效

1. 进入仓库 Settings -> Pages，确认 Source 已切为 `GitHub Actions`
2. 重新触发 `.github/workflows/deploy.yml`
3. 确认 Actions 中不再出现 `actions/jekyll-build-pages@v1`
4. 确认 Pages 部署来源为自定义 workflow，而不是 legacy branch build

### 补充说明

当前仓库是 **Next.js 静态导出项目**，不是面向 Jekyll 的源码仓库。

因此如果再看到类似：

- `Run actions/jekyll-build-pages@v1`
- `Liquid Exception`
- `README.md` / `docs/*.md` / `content/**/*.md` 中的 `{{` 或 `${{` 被解析

优先检查 GitHub Pages 的 `build_type` 是否错误回到了 `legacy`，而不是优先修改源码内容。

---

## 2026-05-04 切换到 GitHub Actions 后首页仍显示旧版本，`/ai-data/index.json` 被错误回退成首页

### 现象

在已经切换 GitHub Pages Source 为 `GitHub Actions`，且 build / deploy 成功后，仍出现：

- 首页看不到最新上线的 Phase 1 AI 推荐组件
- 直接访问 `https://yuanshenjian.cn/ai-data/index.json` 时，浏览器里显示成首页
- DevTools Network 中能看到由 `sw.js` 发起的失败请求

### 根因

这次不是 GitHub Pages 部署目录错误，而是 **旧 Service Worker 缓存仍在生效**：

1. 浏览器继续使用旧缓存中的首页 HTML，因此看不到新 UI
2. `public/sw.js` 中对导航失败的请求使用了首页兜底：

```js
if (request.mode === 'navigate') {
  return caches.match('/');
}
```

3. 同时 `sw.js` 没有跳过 `/ai-data/` 这类 JSON 数据请求，导致数据请求失败时容易被误判为“页面变成首页”

### 正确修复

需要同时做两件事：

#### 1. 提升 Service Worker 缓存版本

例如：

```js
const CACHE_VERSION = 'v3';
```

这样浏览器会安装新 SW，并清理旧缓存。

#### 2. 跳过 `/ai-data/` 请求

在 `public/sw.js` 的 `fetch` 监听器中增加：

```js
if (url.pathname.startsWith('/ai-data/')) {
  return;
}
```

这样 AI 静态索引请求就不会被 Service Worker 拦截，也不会在异常时被错误兜底成首页。

### 如何确认修复生效

1. 部署修复后的 `sw.js`
2. 浏览器执行一次强制刷新（或清除站点缓存 / 注销旧 SW）
3. 在 DevTools -> Application -> Service Workers 中确认激活的是新版本 SW
4. 再次访问：

```text
https://yuanshenjian.cn/ai-data/index.json
```

应看到 JSON，而不是首页。

5. 回到首页确认 `AI 推荐` 组件已经出现

### 补充说明

如果线上明明已经部署成功，但页面内容仍像旧版本，优先怀疑：

- 浏览器 Service Worker 缓存
- 站点离线兜底逻辑把失败请求回退成首页

而不是优先怀疑 GitHub Pages 部署目录错误。

### 本次衍生问题：Turnstile `size` 参数配置错误会导致前端卡死在“推荐中...”

如果页面已经显示出 AI 推荐组件，但点击提交后长期停留在“推荐中...”，浏览器 console 中出现类似报错：

```text
Invalid value for parameter "size", expected "compact", "flexible", or "normal", got "invisible"
```

说明 Turnstile 前端参数配置不合法。

当前项目中，稳定可用的组合应优先使用：

```ts
size: "flexible"
execution: "execute"
appearance: "interaction-only"
```

不要使用：

```ts
size: "invisible"
```

否则即使请求体中可能最终带上 `cf_turnstile_response`，页面端也会出现大量 Turnstile 异常，导致提交流程卡住或表现不稳定。

### 本次衍生问题：Worker 返回 `TokenHub returned empty content`

如果 Turnstile 已通过，但 `/api/ai/chat` 返回：

```json
{"error":"TokenHub returned empty content"}
```

说明问题已经从前端验证码阶段进入到了 provider 解析阶段。

根因通常是：

- 上游模型返回的 `message.content` 不是简单字符串
- 而是数组/分片结构（例如文本段数组）
- 当前 provider 只按字符串解析，结果把有效内容误判为空

修复方式：

- 在 `blog-ai-worker/src/providers/tokenhub.ts` 中同时兼容：
  - `message.content: string`
  - `message.content: Array<{ text?: string }>`
  - `message.content: Array<{ type: "text", content: string }>`

原则：优先把 provider 的差异吸收在 Provider 层，不把这种解析差异泄漏到场景层或前端。
