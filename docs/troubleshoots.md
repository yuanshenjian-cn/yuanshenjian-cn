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

### 本次衍生问题：Worker 返回 `Tencent TokenHub returned empty content`

如果 Turnstile 已通过，但 `/api/ai/chat` 返回：

```json
{"error":"Tencent TokenHub returned empty content"}
```

说明问题已经从前端验证码阶段进入到了 provider 解析阶段。

根因通常是：

- 上游模型返回的 `message.content` 不是简单字符串
- 而是数组/分片结构（例如文本段数组）
- 当前 provider 只按字符串解析，结果把有效内容误判为空

修复方式：

- 在 `blog-ai-worker/src/providers/tencent-tokenhub.ts` 中同时兼容：
  - `message.content: string`
  - `message.content: Array<{ text?: string }>`
  - `message.content: Array<{ type: "text", content: string }>`

原则：优先把 provider 的差异吸收在 Provider 层，不把这种解析差异泄漏到场景层或前端。

### 本次衍生问题：Provider 已兼容后仍然 `empty content`，真实根因是 `reasoning_content` 吃光了输出预算

如果已经完成 provider 解析兼容、也确认最新 Worker 已部署，但首页 AI 推荐仍然间歇性返回：

```json
{"error":"Tencent TokenHub returned empty content"}
```

并且这次错误不是稳定必现，而是有时 502、有时又能返回结果，那么要继续看 Worker 实际拿到的上游响应结构。

#### 现象

- 浏览器端仍可能看到 `/api/ai/chat` 返回 502
- Playwright / 手工测试里，页面有时卡在“推荐中...”，随后变成错误提示
- 即使 `message.content` 已支持字符串与数组两种格式，依然可能没有最终可用答案

#### 如何定位

在 `blog-ai-worker/` 目录使用 `wrangler tail` 抓线上日志，确认这类关键字段：

- `finish_reason`
- `message.content`
- `message.reasoning_content`

本次线上真实数据表现为：

- `finish_reason = "length"`
- `message.content = ""`（空字符串）
- `reasoning_content` 很长，说明模型把输出预算主要消耗在思考过程上

也就是说，问题已经不是“解析不到内容”，而是**模型根本没有在预算内产出最终回答**。

#### 根因

这次根因有两个叠加：

1. `recommend` 场景给 `glm-5.1` 的上下文过大，早期实现一次性塞入过多文章摘要
2. 用户查询词提取过于粗糙，像 `AI` 这样的泛词会把大量并不直接相关的文章一起带进 prompt

最终导致模型把 token 花在 `reasoning_content` 上，而不是最终 JSON 答案。

#### 正确修复

不要把 `reasoning_content` 直接透传给前端。

更稳妥的修法是：

1. **缩小推荐上下文**
   - `blog-ai-worker/src/scenes/recommend.ts`
   - 将送给模型的候选文章数从大批量缩到更小范围（本次收敛到 8 篇）

2. **先做本地主题预筛**
   - 对用户 query 做中文归一化和停用词剔除
   - 优先按 `tags`、`title`、`excerpt` 做简单打分
   - 只把更相关的文章送给模型

3. **为 provider 5xx / empty content 增加确定性兜底**
   - 如果上游仍因 `reasoning_content` 过长而不给最终答案
   - Worker 直接基于已筛好的站内文章返回一版稳定推荐
   - 这样首页 AI 推荐至少能返回 `answer + references`，不会把 502 暴露给用户

#### 如何确认修复生效

1. 先手动部署 Worker（见下方补充说明）
2. 打开首页，输入：

```text
推荐几篇关于 AI 编程的文章
```

3. 期望结果：
   - 页面出现 `AI 回答`
   - 页面出现 1~3 篇推荐文章
   - `/api/ai/chat` 最终能返回 200（即使上游模型偶发不稳定，也能由 Worker 兜底）

#### 补充说明：根仓库的 GitHub Pages workflow 不会自动部署 Worker

这次排查中还有一个很容易忽略的坑：

- `.github/workflows/deploy.yml` 只部署 GitHub Pages 静态站点
- **不会自动部署 `blog-ai-worker/`**

所以如果你改了 `blog-ai-worker/` 代码，但没有额外执行：

```bash
cd blog-ai-worker
npm run deploy
```

那么线上 `/api/ai/chat` 仍然会继续跑旧逻辑。

以后遇到“本地代码已经修了，但线上行为完全没变”，优先先确认 Worker 是否已经单独部署，而不是继续怀疑前端缓存或 parser 逻辑。

---

## 2026-05-04 新增 AI 专栏后 `columns.test.ts` 失败，根因是测试把“非专栏文章”写死成旧目录集合

### 现象

提交时 pre-commit hook 运行测试失败，类似报错：

```text
FAIL tests/lib/columns.test.ts > Columns Module > getColumnContextByPost > should return null for a post not in any column
expected { ... } to be null
```

实际返回的上下文来自新加的专栏（本次是 `deepseek`）。

### 根因

测试里原本通过硬编码目录前缀来寻找“非专栏文章”：

- `swd/ai-coding/claudecode/`
- `swd/ai-coding/opencode/`
- `swd/ai-coding/ai-frontier/`
- `swd/ai-coding/codex/`

这个假设默认 AI 专栏只有上述几类。

当新增 `deepseek` 之类的新专栏后，测试仍然可能把 AI 专栏文章误当成“非专栏文章”，从而导致断言失效。

### 正确修复

不要继续在测试里硬编码“已有专栏目录白名单”。

更稳妥的写法是直接找：

```ts
const nonColumnPost = allPosts.find((p) => !p.relativePath.startsWith("swd/ai-coding/"));
```

这样测试语义会变成：

- 只要文章不在 AI 专栏总目录下
- 就应该返回 `null`

新增 `claudecode` / `opencode` / `deepseek` / 未来更多 AI 专栏时，都不需要继续维护这条测试。

### 补充说明

如果后续继续新增 AI 专栏：

1. 更新 `lib/columns.ts`
2. 更新 `components/column-icons.tsx`
3. 同步检查测试是否仍依赖旧的目录白名单或固定专栏数量假设

原则：**测试应验证“分类规则”，不要验证一组容易过期的目录枚举。**
