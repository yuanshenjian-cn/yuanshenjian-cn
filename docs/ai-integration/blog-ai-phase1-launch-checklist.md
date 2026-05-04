# Blog AI Phase 1 最小上线检查清单

> 适用范围：当前博客 **Phase 1：首页 AI 推荐** 上线。
>
> 本清单默认：
> - 博客主站继续部署到 GitHub Pages
> - AI 接口通过 Cloudflare Worker 提供
> - 当前只接入 **腾讯 TokenHub**
> - 当前**不包含** MiMo、文章页问答、专栏问答、搜索增强

---

## 0. 本次上线范围确认

- [ ] 本次只上线 **Phase 1：首页 AI 推荐**
- [ ] 本次 **不需要** 配置 MiMo
- [ ] 本次 Worker **只走腾讯 TokenHub**
- [ ] 本次 AI 入口只出现在 **首页**

---

## 1. Cloudflare 侧配置

### 1.1 配置 Turnstile

- [ ] 在 Cloudflare 创建一个 Turnstile widget
- [ ] Widget hostname 至少包含：
  - [ ] `yuanshenjian.cn`
  - [ ] 如果本地要调试，建议再加 `localhost`
- [ ] 记录以下两个值：
  - [ ] `Site Key`
  - [ ] `Secret Key`

### 1.2 创建 Workers KV

- [ ] 创建一个 KV namespace，用于 API 限流

如果用 CLI，可在 `blog-ai-worker/` 下执行：

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

创建完成后，把返回的 namespace id 填到：

```toml
blog-ai-worker/wrangler.toml
```

替换这里：

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "REPLACE_WITH_KV_NAMESPACE_ID"
```

---

## 2. Worker 配置

### 2.1 检查 `wrangler.toml`

确认以下值正确：

```toml
[vars]
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000"
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "10"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"
```

检查项：

- [ ] `ALLOWED_ORIGINS` 包含线上域名
- [ ] `ALLOWED_ORIGINS` 包含本地开发域名（如果需要本地联调）
- [ ] `AI_DATA_BASE_URL` 指向最终线上博客地址

> 注意：如果将来域名变更，这里也要同步修改。

### 2.2 配置 Worker secrets

在 `blog-ai-worker/` 目录下执行：

```bash
npx wrangler secret put LLM_PROVIDER_API_KEY
npx wrangler secret put LLM_PROVIDER_BASE_URL
npx wrangler secret put TURNSTILE_SECRET_KEY
```

填写要求：

#### `LLM_PROVIDER_API_KEY`

- [ ] 填你腾讯 TokenHub 的真实 API Key

#### `LLM_PROVIDER_BASE_URL`

- [ ] 填：

```text
https://tokenhub.tencentmaas.com/v1
```

> 不要填成：
>
> ```text
> https://tokenhub.tencentmaas.com/v1/chat/completions
> ```
>
> 因为代码会再拼接 `/chat/completions`。

#### `TURNSTILE_SECRET_KEY`

- [ ] 填 Turnstile 的 Secret Key

---

## 3. 博客前端配置

### 3.1 本地 `.env.local`

在博客根目录配置：

```env
NEXT_PUBLIC_AI_WORKER_URL=/api/ai
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

最少要求：

- [ ] `NEXT_PUBLIC_AI_WORKER_URL` 已配置
- [ ] `NEXT_PUBLIC_AI_ENABLED=true`
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 已配置

### 3.2 GitHub 仓库 Variables

因为生产构建在 GitHub Actions 中完成，需要在仓库里配置以下 **Actions Variables**：

路径：

```text
GitHub 仓库 -> Settings -> Secrets and variables -> Actions -> Variables
```

添加：

- [ ] `NEXT_PUBLIC_AI_WORKER_URL` = `/api/ai`
- [ ] `NEXT_PUBLIC_AI_ENABLED` = `true`
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = 你的 Turnstile Site Key

> 注意：这里是 **Variables**，不是 Secrets。

---

## 4. 本地验证（建议先做）

### 4.1 博客侧验证

在根目录执行：

```bash
npm run build:ai-data
npm run build
```

检查项：

- [ ] `public/ai-data/index.json` 已生成
- [ ] 博客构建成功

### 4.2 Worker 侧验证

执行：

```bash
npm --prefix blog-ai-worker install
npm --prefix blog-ai-worker run typecheck
```

检查项：

- [ ] Worker 依赖安装成功
- [ ] Worker 类型检查通过

如果还没登录 wrangler：

```bash
npx wrangler login
```

---

## 5. 推荐上线顺序

### 第一步：先发布博客

- [ ] push 到 `main`
- [ ] 等 GitHub Pages 部署完成

这样线上会先有：

```text
https://yuanshenjian.cn/ai-data/index.json
```

检查项：

- [ ] 访问 `https://yuanshenjian.cn/ai-data/index.json` 能看到有效 JSON

### 第二步：再部署 Worker

在 `blog-ai-worker/` 下执行：

```bash
npx wrangler deploy
```

检查项：

- [ ] Worker 部署成功
- [ ] Worker 已接管 `/api/ai/chat`

---

## 6. 上线后验收

### 6.1 页面验收

打开首页，确认：

- [ ] 首页出现 AI 推荐模块
- [ ] 输入框可输入内容
- [ ] 提交按钮可点击
- [ ] 页面无明显报错

### 6.2 网络验收

打开浏览器 DevTools -> Network：

- [ ] 提交后发出 `POST /api/ai/chat`
- [ ] 接口返回状态为 `200`

### 6.3 功能验收

试一个问题，例如：

```text
推荐几篇关于 AI 编程的文章
```

确认：

- [ ] 返回 AI 文本回答
- [ ] 返回推荐文章列表
- [ ] 点击推荐文章能跳到 `/articles/${slug}`

---

## 7. 常见问题快速排查

### 7.1 首页没有 AI 模块

优先检查：

- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 是否已配置
- [ ] `NEXT_PUBLIC_AI_ENABLED` 是否为 `true`
- [ ] GitHub Actions Variables 是否已配置
- [ ] 博客是否已经重新部署

### 7.2 点击提交后报 403

大概率是 Turnstile 问题，检查：

- [ ] Turnstile widget hostname 是否包含 `yuanshenjian.cn`
- [ ] `TURNSTILE_SECRET_KEY` 是否正确
- [ ] 前端 Site Key / 后端 Secret Key 是否是一对
- [ ] Worker 路由是否就是当前博客域名

### 7.3 点击提交后报 429

说明限流生效，检查：

- [ ] 是否短时间内触发过多请求
- [ ] 当前默认限制是每小时 10 次 / IP

### 7.4 点击提交后报 500

优先检查 Worker 配置：

- [ ] `LLM_PROVIDER_API_KEY`
- [ ] `LLM_PROVIDER_BASE_URL`
- [ ] `TURNSTILE_SECRET_KEY`
- [ ] `AI_DATA_BASE_URL`
- [ ] KV namespace id 是否已替换

### 7.5 Worker 成功了，但推荐为空

检查：

- [ ] `https://yuanshenjian.cn/ai-data/index.json` 是否可访问
- [ ] `build:ai-data` 是否已生成最新索引
- [ ] 博客是否已重新部署

---

## 8. 本次上线暂时不用做的事情

- [ ] 不用配置 MiMo
- [ ] 不用配置文章页 AI
- [ ] 不用配置专栏页 AI
- [ ] 不用配置搜索 AI
- [ ] 不用配置日志 / 埋点 / 分析

---

## 9. 最终完成条件

当以下条件全部满足时，可以认为 Phase 1 已成功上线：

- [ ] 首页出现 AI 推荐模块
- [ ] 用户可正常提交问题
- [ ] Worker 成功返回推荐结果
- [ ] 推荐文章链接能正确跳转
- [ ] 前端构建产物中不包含腾讯 TokenHub API Key 或 Turnstile Secret Key
