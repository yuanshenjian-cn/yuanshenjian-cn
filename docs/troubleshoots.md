# Troubleshoots

> 记录项目中已经定位并修复过、且值得后续复用的重要问题。

---

## 2026-05-05 页面级 AI 回答前缀过强，作者页与文章页应直接自然回答

### 现象

- 作者页 AI 在岗位匹配、能力归纳类回答中，容易被 prompt 推向固定来源前缀，如 `作者技能中提到...`、`作者项目经验中提到...`
- 文章页 AI 也容易出现 `文章中提到...`、`文中提到...`、`本文介绍了...` 这类模板化前缀，或 `页面中显示...`、`当前文章页展示的信息...` 这类页面化措辞
- 虽然事实依据和引用 `sectionIds` 正常，但回答读起来不够自然

### 根因

1. `blog-ai-worker/src/prompts/author.ts` 对岗位匹配和能力归纳的回答风格约束过强，鼓励使用固定来源前缀
2. `blog-ai-worker/src/prompts/article.ts` 对回答风格约束也偏模板化，容易把正文依据写成固定开场

### 修复

1. 作者页和文章页 prompt 都改为要求直接、自然地回答用户问题
2. 明确继续严格基于当前页面 / 文章内容作答，不补充页面外知识
3. 明确不要使用 `作者技能中提到...`、`文章中提到...` 这类模板化来源前缀
4. 继续避免 `页面中显示...`、`根据当前作者页展示的信息...`、`当前文章页展示的信息...` 这类页面化措辞
5. 保留原有事实依据边界和 `sectionIds` 引用逻辑，只调整回答风格约束

### 如何确认修复生效

1. 运行作者页与文章页相关测试：
   - `npm run test -- tests/blog-ai-worker/author-scene.test.ts tests/blog-ai-worker/article-scene.test.ts`
2. 确认作者页与文章页 prompt 都要求“直接、自然地回答用户问题”
3. 确认 prompt 不再鼓励 `作者技能中提到...`、`文章中提到...` 这类固定前缀模板
4. 确认仍然避免 `页面中显示...`、`当前作者页展示的信息...`、`当前文章页展示的信息...` 这类页面化措辞
5. 冒烟提问作者页和文章页，确认回答更自然，但事实边界与引用仍正常

---

## 2026-05-05 Turnstile timeout 原先散落在组件内部且值不一致，现已按场景收口到 config

### 现象

- 页面级 AI 曾在组件内部写死 `10000ms`
- 首页推荐组件曾在组件内部写死 `15000ms`
- 同样是 Turnstile 前端等待逻辑，却分散在不同组件里维护，后续难以按场景调整

### 根因

1. `components/ai/page-ai-assistant-provider.tsx` 和 `components/ai/ai-recommend-widget.tsx` 都直接在组件内部维护 timeout 常量
2. 首页推荐、文章页 AI、作者页 AI 没有统一的场景化配置入口
3. 导致 timeout 值不一致，也缺少统一的版本化配置入口

### 修复

1. 在 `lib/config.ts` 中新增 `config.ai.turnstile.timeoutMs`
2. 按场景拆成：
   - `homepageRecommend`
   - `pageAssistant.article`
   - `pageAssistant.author`
3. 三个默认值都收口为 `20000ms`
4. Turnstile timeout 统一只认 `lib/config.ts` 里的按场景版本化配置，不再支持 env override
5. 组件不直接读取全局 config，继续由页面层通过 props 传入 timeout

### 如何确认修复生效

1. 运行相关组件测试：
   - `npm run test -- tests/components/page-ai-assistant.test.tsx tests/components/ai-recommend-widget.test.tsx`
2. 使用 fake timers 验证传入值生效：
   - 在自定义 timeout 前 1ms 仍不会报 `Turnstile 响应超时，请稍后重试。`
   - 到达传入 timeout 时才出现超时错误
3. 检查页面传参：
   - 首页从 `config.ai.turnstile.timeoutMs.homepageRecommend` 传入
   - 文章页从 `config.ai.turnstile.timeoutMs.pageAssistant.article` 传入
   - 作者页从 `config.ai.turnstile.timeoutMs.pageAssistant.author` 传入

---

## 2026-05-05 页面级 AI 二次提问时旧回答被过早清空，且作者页链接信息未进入 author chunks

### 现象

- 文章页 / 作者页第一次提问后已经展示了 `AI 回答` 和 `回答依据`
- 用户继续发起第二次提问时，旧回答和旧引用会在新请求刚开始时被立即清空
- 如果新请求稍后才真正开始流式返回，结果区会短暂只剩加载提示
- 如果新请求失败，用户会同时丢失上一次已经得到的有效回答
- 作者页里像 `整洁软件设计` 这样的可见链接，AI 有时无法回答出具体网址

### 根因

1. `components/ai/page-ai-assistant-provider.tsx` 在 `submitMessage()` 开始阶段就执行了：

```ts
setCurrentReferences([]);
updateAnswer("");
```

这会让旧结果在新请求真正开始产出内容之前就被清空。

2. `scripts/build-ai-data.js` 构建 author chunks 时，`extras` 里的链接只保留了 `label`，没有把 `href` 写进 chunk content；同时作者页里其他可见链接信息没有系统化进入作者资料单一数据源。

### 修复

1. 将页面级 AI 的覆盖时机改成“惰性覆盖”
2. 发起新请求时只清错误态并进入 `isStreaming`
3. 只有在收到首个新的 `answer-delta` 时，才用新回答和新引用覆盖旧内容
4. 如果新请求在开始返回前失败，则继续保留旧回答和旧引用，只额外展示错误
5. 将作者页可见链接补进单一数据源和 `author chunks`，包括：
6. `education.href`
7. `extras.groups[].items[].href`

### 如何确认修复生效

1. 在文章页或作者页先提问一次，确认有 `AI 回答` 与 `回答依据`
2. 再发起第二次提问，确认按钮进入 `思考中...` 时旧回答仍继续显示
3. 仅在新流式回答真正开始返回后，旧回答和旧引用才被替换
4. 如果第二次请求失败，确认旧回答仍在，同时页面出现新的错误提示
5. 重新生成 `author.json` 后，确认作者页相关 chunk 中含有 `整洁软件设计：https://...`、`学校官网：https://...` 等页面可见链接信息

---

## 2026-05-05 作者页下载 PDF 简历入口注释后，build 仍出现未使用变量 warning

### 现象

- 已经把作者页中的下载 PDF 简历入口注释掉
- 但执行 `npm run build` 时，仍然出现 `@typescript-eslint/no-unused-vars` warning
- warning 主要集中在 `app/author/page.tsx` 和 `components/resume/resume-hero.tsx`

### 根因

只是把 JSX 入口注释掉了，但没有同步删除只服务于该入口的残留代码，包括：

1. `Download` 图标导入
2. `ShareButtons` 导入
3. `resumeUrl` / `authorSummary` 等局部变量
4. 整段已经失效的注释块

Next.js build 阶段会执行 ESLint，因此这些残留会继续触发 warning。

### 修复

1. 删除作者页和 hero 组件中仅供 PDF 下载入口使用的残留导入
2. 删除对应的未使用局部变量
3. 删除整段已失效的注释 JSX，而不是只保留注释
4. 如果业务上已确认不再提供 PDF 简历，就同步把 `resumeHref` 从作者数据结构、AI 构建链和测试中一并移除，避免后续再次漂移

### 如何确认修复生效

1. 执行 `npm run build`
2. 确认不再出现：
   - `ShareButtons is defined but never used`
   - `Download is defined but never used`
   - `resumeUrl is assigned a value but never used`
   - `authorSummary is assigned a value but never used`

---

## 2026-05-04 首页 AI 推荐二次搜索时旧结果会立即消失，导致加载期间页面闪空

### 现象

- 用户第一次搜索后，页面下方已经展示了 `AI 回答` 和 `推荐文章`
- 在还没点击这些结果的情况下，继续输入新的搜索内容并再次点击 `问 AI`
- 旧结果会在新请求刚发出时立刻消失
- 如果新请求需要一点时间返回，页面中间会出现一段“结果区域闪空”的状态

### 根因

`components/ai/ai-recommend-widget.tsx` 在 `doSubmit()` 开始阶段会立即执行：

```ts
setError(null);
setResponse(null);
```

这会让旧推荐结果在新请求发出时被立刻清空，而不是等新结果真正返回后再替换。

### 修复

将提交流程改为：

1. 发起新请求时只清空错误态，不清空旧 `response`
2. 保留旧的 `AI 回答` 与 `推荐文章` 继续显示
3. 等新请求成功返回后，再用新的 `response` 一次性覆盖旧结果
4. 如果新请求失败，则继续保留旧结果，同时展示新的错误信息

### 如何确认修复生效

1. 先搜索一次，确认页面出现 `AI 回答` 和 `推荐文章`
2. 在结果仍显示的情况下，再输入第二个查询并点击 `问 AI`
3. 确认按钮显示 `思考中...` 时，旧结果仍然留在页面上
4. 确认只有在新结果真正返回后，旧结果才被新的回答和推荐覆盖

---

## 2026-05-04 Worker LLM profile 已切到本地 active，但线上模型仍未变化

### 现象

- 本地执行过 `npm run llm:use -- provider/modelKey`
- `blog-ai-worker/.llm-active-profile` 已经变成新值
- 但线上 `/api/ai/chat` 仍然表现得像旧模型 / 旧 provider

### 根因

新方案里：

- `llm:use` 只负责写本地 `.llm-active-profile`
- `llm:deploy` 才会把当前 active profile 通过 `wrangler secret bulk` 写入 Cloudflare Worker，并执行 `wrangler deploy`

如果只执行了 `llm:use`，线上不会发生任何变化。

### 正确修复

在 `blog-ai-worker/` 下执行：

```bash
npm run llm:deploy
```

如果你想在部署时顺便切换目标 profile，也可以直接：

```bash
npm run llm:deploy -- deepseek/deepseek-v4-pro
```

### 如何确认修复生效

1. 检查本地 `.llm-active-profile` 是否是预期的 `provider/modelKey`
2. 执行 `npm run llm:deploy`
3. 确认命令输出里展示的 `profile / provider / modelId / baseUrl origin` 都符合预期
4. 再做一次首页 AI 推荐冒烟验证，确认线上行为已切到新配置

---

## 2026-05-04 首页 AI 推荐偶发泄漏原始 JSON，且“敏捷方法”主题检索退化成兜底排序

### 现象

- 点击首页快捷标签 `DeepSeek` 时，AI 回答正文偶发以 `{"answer": ...` 开头，直接把模型原始 JSON / 半结构化 JSON 暴露给前端
- 点击 `敏捷方法` 时，虽然能返回 AI 回答和推荐文章，但上下文文章明显偏 AI 主题，不像真正围绕敏捷方法筛出来的结果
- `public/ai-data/index.json` 中已经存在敏捷相关文章，说明问题不在索引缺失

### 根因

这次是两处独立但都发生在 `blog-ai-worker/src/scenes/recommend.ts` 的回归：

1. `parseModelResponse()` 对模型输出的容错过宽
   - prompt 要求返回 `{"answer": string, "slugs": string[]}`
   - 但当模型返回不完整 JSON、缺失右花括号，或只返回了 `answer` 没返回合法 `slugs` 时
   - 旧逻辑会直接走 `answer: content.trim()` 回退，把整段 JSON 文本原样返回给前端

2. `buildQueryKeywords()` 对中文连续主题词提取不足
   - 旧逻辑主要依赖整句压缩后的长串关键词和按空白/标点切词
   - 对 `请推荐我博客里和敏捷方法相关的文章` 这种中文句子，往往只能得到 `请推荐我博客里和敏捷方法相关的文章` 这种整串，无法稳定抽出 `敏捷方法` / `敏捷`
   - 打分无法命中 `title` / `tags` / `excerpt` 中的敏捷类文章，于是推荐退化成默认顺序兜底

### 修复

1. 收紧模型输出解析
   - `parseModelResponse()` 只要成功解析出字符串类型的 `answer`，就优先使用它
   - `slugs` 不合法时直接降级为空数组，而不是整包回退失败
   - 如果整体 JSON 解析失败，再额外尝试从半结构化输出里提取 `"answer": "..."`
   - 只有当内容看起来像结构化 payload、但仍提取不出 answer 时，才回退到默认文案，避免把原始 JSON 透传给前端

2. 补强中文主题关键词提取
   - 在 `buildQueryKeywords()` 中，额外识别 `关于 X 文章`、`和 X 相关文章`、`推荐几篇 X 文章` 这类中文推荐句式
   - 从主题短语里提取核心关键词，并对 4 字及以上中文词补一个更短的前缀词（例如 `敏捷方法` -> `敏捷`）
   - 让本地打分阶段能先把真正相关的敏捷文章送进 prompt，避免模型在无关候选上“硬选”

### 如何确认修复生效

1. 点击首页 `DeepSeek` 快捷标签，多次触发推荐，确认 `AI 回答` 正文不再出现 `{"answer": ...` 这类原始 JSON 前缀
2. 点击 `敏捷方法` 快捷标签，确认推荐列表优先出现敏捷/Scrum/宣言/团队实践相关内容，而不是 AI 主题文章
3. 本地运行与本次改动最相关的校验：
   - `npm run test -- tests/blog-ai-worker/recommend-scene.test.ts`
   - `npm run typecheck --prefix blog-ai-worker`

### 补充说明

- 这次问题的重点不在 `public/ai-data/index.json` 是否有数据，而在 Worker 本地预筛和模型输出容错
- 如果以后再出现“快捷标签有结果但明显不贴题”，优先检查：
  - 查询词提取是否抽到了真正主题词
  - 本地打分是否把相关文章送进了 prompt
  - 模型返回的 `slugs` 是否落在预筛候选集合内

---

## 2026-05-04 首页 AI 输入缺少前端长度上限，且 per-IP 限流变量名不够直观

### 现象

- 首页 AI 输入框过去只依赖 Worker 侧 `AI_REQUEST_MAX_MESSAGE_CHARS` 做安全边界
- 前端没有静态长度上限，超长内容会一直留在输入框里，提交时才由后端拒绝
- Worker 的 per-IP 限流变量名 `RATE_LIMIT_WINDOW_SECONDS`、`RATE_LIMIT_MAX_REQUESTS` 语义偏泛，不利于和其他限流配置区分

### 修复

1. 在 `lib/config.ts` 中新增 `config.ai.maxInputChars = 200`
2. 在 `components/ai/ai-recommend-widget.tsx` 中：
   - 给输入框加 `maxLength`
   - 提交前再做一次长度兜底校验
   - 超限时直接展示可读错误，不触发 Turnstile，也不发起 AI 请求
3. 将 per-IP 限流默认变量名升级为：
   - `AI_IP_RATE_LIMIT_WINDOW_SECONDS`
   - `AI_IP_RATE_LIMIT_MAX_REQUESTS`
4. Worker 代码和默认配置统一切到新名字，不再继续保留旧变量名兼容

### 如何确认修复生效

1. 在首页输入超过 200 个字符，确认输入框不会继续接收更多字符
2. 通过程序方式或快捷提交路径传入超过 200 个字符，确认前端直接显示错误，且不会触发 Turnstile / AI 请求
3. `wrangler.toml` 与 Cloudflare dashboard 中只使用 `AI_IP_RATE_LIMIT_WINDOW_SECONDS`、`AI_IP_RATE_LIMIT_MAX_REQUESTS`
4. 触发限流时，确认行为仍与改名前一致

---

## 2026-05-04 AI Worker 缺少请求体大小与消息长度保护，异常长输入会直接进入解析链路

### 现象

首页 AI 推荐过去只校验 JSON 结构与空字符串，缺少：

- 请求体总字节数上限
- `message.trim()` 后的字符数上限

这会让异常长输入先进入 JSON 解析链路，增加无意义开销。

### 修复

在 `blog-ai-worker/src/index.ts` 的请求解析阶段增加两层 `413 Payload Too Large` 防护：

1. 优先读取 `Content-Length`，声明值超限时立即拒绝
2. 实际读取请求体后按真实字节数再校验一次，避免没有 header 或 header 不可信时失效

同时新增两个 Worker vars：

- `AI_REQUEST_MAX_BODY_BYTES="8192"`
- `AI_REQUEST_MAX_MESSAGE_CHARS="500"`

其中 `message` 长度按 `trim()` 后计算，超限时返回用户可读错误，但不暴露内部细节。

### 如何确认修复生效

1. 构造一个 `Content-Length` 明显大于 `8192` 的请求，确认 Worker 返回 `413`
2. 构造一个没有 `Content-Length`、但实际 body 超过 `8192` 字节的请求，确认仍返回 `413`
3. 构造一个 `message.trim().length > 500` 的请求，确认返回 `413`
4. 正常长度请求仍可继续走后续 Turnstile / 限流 / 推荐逻辑

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

---

## 2026-05-04 AI Worker 新增 Turnstile hostname/action 校验与日预算止损后，因配置未同步导致 403 / 429 / 503

### 现象

上线新版本后，首页 AI 推荐可能出现以下几类报错：

- `Turnstile verification failed`
- `今日 AI 请求额度已用完，请明天再试。`
- `AI 功能当前暂时不可用，请稍后再试。`

常见外在表现：

- 本地开发原来可用，现在 localhost 提交直接失败
- 线上页面明明能拿到 Turnstile token，但 Worker 仍返回 403
- 线上请求突然全部 503
- 流量稍大后开始稳定返回 429

### 根因

这类问题通常不是前端组件坏了，而是 **Worker / Turnstile 控制台 / 前端 action 三边配置没有同步**。

重点检查这几项：

1. `TURNSTILE_ALLOWED_HOSTNAMES`
2. `TURNSTILE_EXPECTED_ACTION`
3. 前端 `components/ai/ai-recommend-widget.tsx` 中的 `TURNSTILE_ACTION`
4. Turnstile 控制台中的 hostname allowlist
5. `AI_DAILY_REQUEST_LIMIT`
6. `AI_EMERGENCY_DISABLE`

### 排查方式

#### 情况 A：`Turnstile verification failed`

优先检查：

1. `blog-ai-worker/wrangler.toml` 中的 hostname 列表是否写成了完整 URL

错误示例：

```toml
TURNSTILE_ALLOWED_HOSTNAMES = "https://yuanshenjian.cn,http://localhost:3000"
```

正确示例：

```toml
TURNSTILE_ALLOWED_HOSTNAMES = "yuanshenjian.cn,localhost"
```

2. 本地调试是否遗漏了 `localhost`
3. 如果你本地用的是 `127.0.0.1`，是否显式加入了 `127.0.0.1`
4. `TURNSTILE_EXPECTED_ACTION` 是否与前端固定 action 一致

当前前端默认值是：

```ts
const TURNSTILE_ACTION = "homepage_recommend";
```

5. Turnstile 控制台里是否也允许了对应域名

#### 情况 B：`今日 AI 请求额度已用完，请明天再试。`

说明请求已经通过了：

- origin 校验
- Turnstile 校验
- 单 IP 限流

但全局日预算已经打满。

处理方式：

1. 确认是否是正常流量增长
2. 按需调大 `AI_DAILY_REQUEST_LIMIT`
3. 修改后执行 `cd blog-ai-worker && npm run deploy`
4. 如果是恶意流量，优先不要盲目放大预算，而是先打开紧急关闭或收紧来源名单

#### 情况 C：`AI 功能当前暂时不可用，请稍后再试。`

这通常表示：

```toml
AI_EMERGENCY_DISABLE = "true"
```

这是主动熔断，不是故障。

恢复方式：

1. 把值改回 `"false"`
2. 重新部署 Worker

### 如何避免再次踩坑

以后只要改下面任意一项，都要同步检查另外几处：

- 改前端 Turnstile action
- 改 Worker 的 `TURNSTILE_EXPECTED_ACTION`
- 改 Turnstile 控制台的 hostname allowlist
- 改 Worker 的 `TURNSTILE_ALLOWED_HOSTNAMES`

并且记住：

- 改 `wrangler.toml` 后，必须单独部署 Worker
- 保留 `localhost` 是为了本地调试，不应被误删
- `AI_DAILY_REQUEST_LIMIT` 是总量止损，不是单 IP 限流的替代品

---

## 2026-05-05 页面级 AI 流式回答偶发丢空格/换行，正文被拼成一整段

### 现象

- 页面级 AI 在文章页 / 作者页流式输出时，偶发出现词与词之间空格消失
- 某些本应换行的回答被直接拼接成一整段
- 引用区正常，但正文阅读体验明显变差

### 根因

问题不在前端 SSE 解析，而在 Worker 对上游 delta 的文本抽取逻辑：

1. `blog-ai-worker/src/scenes/page.ts` 中的 `extractTextParts()` 会对字符串执行 `trim()`
2. `normalizeTextParts()` 在拼接后又再次 `trim()`
3. 对流式 delta 来说，前导空格和换行本来就是合法正文的一部分
4. 一旦被 Worker 侧 trim 掉，前端即使按原样追加，也无法恢复这些空白

### 修复

将页面级流式 delta 的处理收紧为：

1. `extractTextParts()` 只过滤空字符串，不再 `trim()` 有效内容
2. `normalizeTextParts()` 只做 `join("")`，不再额外裁剪首尾空白
3. 保证 Worker 向浏览器转发的是模型原始正文片段，而不是“清洗过”的片段

### 如何确认修复生效

1. 在文章页或作者页触发一次流式回答
2. 观察正文中原本应保留的空格、中文句间停顿和换行是否正常显示
3. 若需要回归验证，可运行：
   - `npm run test -- tests/lib/ai-client.test.ts tests/blog-ai-worker/article-scene.test.ts tests/blog-ai-worker/author-scene.test.ts`
   - `npm --prefix blog-ai-worker run typecheck`

---

## 2026-05-05 页面级 AI 流式 fallback 引用 Turnstile token 时因作用域错误直接报错

### 现象

- 页面级 AI 在流式模式下，如果上游返回“当前 provider 不支持 streaming”
- 前端本应自动回退到非流式 `/chat`
- 但实际没有回退成功，而是停留在加载态，测试里还能看到未处理异常：`ReferenceError: turnstileToken is not defined`

### 根因

`components/ai/page-ai-assistant-provider.tsx` 的 `submitMessage()` 中：

1. `turnstileToken` 是在 `try` 块里用 `const` 声明的
2. `catch` 分支里又要在 `AIStreamUnsupportedError` 场景下调用 `runNonStreamFallback(requestId, nextMessage, turnstileToken)`
3. 由于块级作用域限制，`catch` 里实际上拿不到这个变量
4. 于是流式 fallback 不是正常降级，而是被新的 `ReferenceError` 打断

### 修复

将 `turnstileToken` 提前到 `try/catch` 外层声明：

1. 在 `submitMessage()` 进入 `try` 前先定义 `let turnstileToken = ""`
2. `try` 中只做 `turnstileToken = await getTurnstileToken()`
3. 这样 `catch` 中的流式 fallback 可以复用同一个 token，正常回退到非流式请求

### 如何确认修复生效

1. 让 `aiChatStream()` 抛出 `AIStreamUnsupportedError`
2. 确认页面最终展示非流式回答，而不是停在 `AI 正在整理当前页面内容...`
3. 回归运行：
   - `npm run test -- tests/components/page-ai-assistant.test.tsx tests/lib/ai-client.test.ts tests/blog-ai-worker/article-scene.test.ts`

---

## 2026-05-05 页面级 AI 流式接口线上返回 Cloudflare 1101 HTML

### 现象

- 浏览器请求 `POST /api/ai/chat/stream` 时返回 `500 Internal Server Error`
- 响应体不是 Worker 约定的 JSON / SSE，而是 Cloudflare 错误页
- 页面标题类似：`Worker threw exception | yuanshenjian.cn | Cloudflare`
- Cloudflare 错误码：`1101`

### 根因

`blog-ai-worker/src/index.ts` 的流式分支里直接返回了异步函数：

1. `return streamArticleScene(body, env, origin)`
2. `return streamAuthorScene(body, env, origin)`

这两个函数是 `async`。如果它们在真正创建 `Response` 前发生 reject，例如：

- 拉取页面 AI 数据失败
- 上游 provider 创建流失败
- provider 返回非 2xx 并抛出 `HttpError`

异常会绕过 `index.ts` 外层 `try/catch`，直接冒泡成 Cloudflare Worker 未捕获异常，于是线上返回 1101 HTML。

### 修复

在流式分支中显式 `await`：

1. `return await streamArticleScene(body, env, origin)`
2. `return await streamAuthorScene(body, env, origin)`

这样 Response 创建前的异步异常会进入统一 `catch`，返回受控 JSON 错误，而不是 Cloudflare HTML 错误页。

### 如何确认修复生效

1. 模拟上游 provider 在流式 Response 创建前返回 500
2. 断言 `worker.fetch()` 返回 `502` JSON：`{ "error": "..." }`
3. 回归运行：
   - `npm run test -- tests/blog-ai-worker/index-runtime-config.test.ts tests/blog-ai-worker/article-scene.test.ts tests/lib/ai-client.test.ts`
   - `npm --prefix blog-ai-worker run typecheck`

---

## 2026-05-05 页面级 AI 回答直接展示 Markdown 语法

### 现象

- 文章页 / 作者页的页面级 AI 回答里会直接出现 Markdown 标记
- 例如 `**加粗**`、有序列表 `1.`、行内代码等不是按富文本展示，而是原样输出
- 首页 AI 推荐不受影响，因为它本来只展示纯文本摘要

### 根因

`components/ai/ai-page-assistant.tsx` 里此前直接用普通文本节点渲染：

1. `currentAnswer` 被放进 `<p className="whitespace-pre-wrap ...">`
2. 这样只能保留换行，不能解析 Markdown
3. 流式 SSE 拿到的最终回答虽然是 Markdown 文本，但前端没有做 Markdown 渲染

### 修复

将页面级 AI 回答改为 Markdown 渲染：

1. 新增 `react-markdown`
2. 复用现有 `remark-gfm`，支持列表、加粗、链接等常见 Markdown
3. 只在页面级 AI 回答区域启用，不影响首页 AI 推荐
4. 为回答区补了轻量级 Markdown 组件样式，保持与现有页面风格一致

### 如何确认修复生效

1. 触发文章页或作者页 AI 回答
2. 确认 `**重点**` 会显示为加粗，而不是星号原样输出
3. 确认 `1. 第一条` 会显示成真正的列表项
4. 回归运行：
   - `npm run test -- tests/components/page-ai-assistant.test.tsx tests/lib/ai-client.test.ts`
   - `npm run typecheck`

---

## 2026-05-05 页面级 AI 回答中的 Markdown 标题字号忽大忽小

### 现象

- 作者页和文章页的页面级 AI 回答里，文字有时看起来突然变大
- 当回答中出现 `##`、`###` 这类 Markdown 标题时，标题字号会明显跳出当前回答区视觉节奏
- 同一块 AI 回答里会出现“正文很小、标题很大”的不协调感

### 根因

`components/ai/ai-page-assistant.tsx` 已经为段落、列表、代码块等 Markdown 元素做了样式收敛，但之前漏掉了 `h1` 到 `h6`：

1. `ReactMarkdown` 遇到 Markdown 标题时会输出原生 `h1` ~ `h6`
2. 因为没有自定义组件映射，这些标题直接使用浏览器默认样式
3. 默认标题字号明显大于 AI 回答区正文，于是视觉上出现忽大忽小

### 修复

在 `components/ai/ai-page-assistant.tsx` 的 `answerMarkdownComponents` 中补齐 `h1` ~ `h6`：

1. 统一收敛到适合回答区的小型标题样式
2. 保留 heading 语义标签，不把标题降级成普通段落
3. 不改动 `p`、`ul`、`ol`、`li`、`code`、`pre` 等现有样式映射

### 如何验证

1. 在文章页或作者页输入一个会返回 Markdown 标题的提问
2. 确认 `## 小标题`、`### 小节` 会渲染成真正的 heading 标签
3. 确认标题比正文只略强一级，不会再出现浏览器默认大标题
4. 回归运行：
   - `npm run test -- tests/components/page-ai-assistant.test.tsx`

---

## 2026-05-05 Worker LLM 非敏感配置继续以 secret 形式存在，排障不便

### 现象

- 在 Cloudflare Dashboard 里，以下键原本都显示为 secret：
  - `LLM_ACTIVE_PROFILE`
  - `LLM_PROVIDER_NAME`
  - `LLM_MODEL_ID`
  - `LLM_PROVIDER_BASE_URL`
- 这些值并不敏感，但作为 secret 时不方便直接核对当前线上真实配置
- 每次 `llm:deploy` 还会继续把它们重新写成 secret

### 根因

`blog-ai-worker/scripts/llm-profile-cli.mjs` 之前把 5 个 LLM 字段统一走了 `wrangler secret bulk`：

1. 非敏感字段和 API key 没有区分
2. 导致 Cloudflare 面板里无法直观看到当前生效的 provider / model / base URL
3. 也会让线上残留一批其实不该保密的 legacy secrets

### 修复

将 LLM 配置拆成两类：

1. 明文变量：
   - `LLM_ACTIVE_PROFILE`
   - `LLM_PROVIDER_NAME`
   - `LLM_MODEL_ID`
   - `LLM_PROVIDER_BASE_URL`
2. secret：
   - `LLM_PROVIDER_API_KEY`

`llm:deploy` 新流程：

1. 先用 `wrangler secret bulk` 只上传 `LLM_PROVIDER_API_KEY`
2. 再用 `wrangler deploy --keep-vars --var ...` 写入 4 个非敏感字段
3. 部署后检查现有 secrets，并删除同名 legacy secrets（如果存在）

### 如何确认修复生效

1. 执行 `npm run llm:deploy -- deepseek/deepseek-v4-flash`
2. 在 Cloudflare Dashboard 中确认：
   - `LLM_PROVIDER_API_KEY` 仍是 secret
   - 另外 4 个字段出现在 Variables 中
3. 回归运行：
   - `npm run test -- tests/blog-ai-worker/llm-profile-cli.test.ts`
   - `npm --prefix blog-ai-worker run typecheck`

---

## 2026-05-05 作者页 AI 数据只有粗粒度 sections，导致项目/技能/经历边界不清

### 现象

- `public/ai-data/author.json` 之前只生成 6 个大 section：`hero`、`skills`、`education`、`experience`、`projects`、`extras`
- `skills`、`experience`、`projects` 中大量条目被压成大段纯文本
- 导致作者页 AI 在以下方面效果较差：
  - 不同项目之间的边界不明显
  - 不同技能和证书条目的区分度低
  - 大 section 容易在 prompt 中被截断
  - 引用只能落到粗粒度模块，不能精确到具体项目/技能/经历

### 根因

`scripts/build-ai-data.js` 之前把作者页数据当作“页面模块快照”而不是“AI 检索索引”生成：

1. `skills.items` 全部拼成一个 `skills` section
2. `experience.items` 全部拼成一个 `experience` section
3. `projects.items` 全部拼成一个 `projects` section
4. 再经过 `toPlainText()` 和空白归一化后，结构边界进一步被抹平

### 修复

将作者页 AI 数据升级为“双层结构”：

1. `entities`
   - 结构化保留作者资料真相：`profile`、`skills`、`certificates`、`education`、`experiences`、`projects`、`extras`
2. `chunks`
   - 作为 AI 检索与引用单元
   - 将技能、证书、经历、项目、兴趣分组拆成细粒度 chunk
3. `sections`
   - 先保留为兼容 fallback
   - 由 `chunks` 简化映射生成，不再是旧的 6 个粗粒度大块
4. Worker 作者场景优先消费 `chunks`，如果线上仍是旧 payload，再回退到 legacy `sections`

### 如何确认修复生效

1. 重新生成数据：`npm run build:ai-data`
2. 检查 `public/ai-data/author.json`：
   - 顶层包含 `entities` 与 `chunks`
   - `chunks` 中可见诸如 `project-*`、`skill-*`、`certificate-*`、`experience-*` 的细粒度条目
3. 回归运行：
   - `npm run test -- tests/lib/build-ai-data.test.ts tests/blog-ai-worker/author-scene.test.ts tests/blog-ai-worker/index-runtime-config.test.ts tests/blog-ai-worker/article-scene.test.ts`
   - `npm --prefix blog-ai-worker run typecheck`
