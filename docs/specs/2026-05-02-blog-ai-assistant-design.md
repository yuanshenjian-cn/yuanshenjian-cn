# 博客 AI 助手设计方案

**版本**：v1.2  
**日期**：2026-05-04  
**状态**：已落地（持续回填实现细节）  
**作者**：袁慎建

---

## 目录

1. [背景与约束](#1-背景与约束)
2. [整体架构](#2-整体架构)
3. [安全设计：为什么不能把 API Key 放前端](#3-安全设计为什么不能把-api-key-放前端)
4. [Cloudflare Turnstile：做什么，为什么需要](#4-cloudflare-turnstile做什么为什么需要)
5. [API 限流方案](#5-api-限流方案)
6. [模型适配层（Provider Abstraction）](#6-模型适配层provider-abstraction)
7. [场景级模型路由配置](#7-场景级模型路由配置)
8. [构建期静态索引（ai-data）](#8-构建期静态索引ai-data)
9. [前端 AI 入口落地设计](#9-前端-ai-入口落地设计)
10. [分阶段设计：Phase 1 / 2 / 3](#10-分阶段设计phase-1--2--3)
11. [环境变量 / Secrets / Vars 命名清单](#11-环境变量--secrets--vars-命名清单)
12. [文件变更清单](#12-文件变更清单)
13. [已知未定项（MiMo 相关）](#13-已知未定项mimo-相关)

---

## 1. 背景与约束

### 1.1 现有站点技术栈

| 项目 | 详情 |
|------|------|
| 框架 | Next.js 15 + React 19，`output: 'export'`，静态导出 |
| 部署 | GitHub Pages，`main` 分支触发，见 `.github/workflows/deploy.yml` |
| CDN | Cloudflare，域名 `yuanshenjian.cn`，已设置 Proxied（橙云）|
| 内容 | MDX，位于 `content/blog/`，通过 `lib/blog.ts` 构建期读取 |
| 搜索 | 当前为客户端关键字过滤，见 `components/global-search.tsx` |
| 配置 | `lib/config.ts` 管理站点全局参数 |

### 1.2 已有模型来源

**腾讯 TokenHub（已确认细节）**

- Endpoint：OpenAI 兼容 `/v1/chat/completions`
- 鉴权：`Authorization: Bearer <API_KEY>`
- 可用模型示例：`deepseek-v4-pro`、`kimi-k2.6`、`glm-5.1`
- 基础 URL：待配置，格式与 OpenAI 兼容

**Xiaomi MiMo（API 细节待确认）**

- 用户已持有 API Key
- API 文档尚未提供
- 本方案为 MiMo 保留兼容接入通道，但所有 MiMo 具体细节标记为 **[MiMo-TBD]**，实现时以实际文档为准

### 1.3 核心约束

- 博客是静态站，无服务端运行时，所有动态逻辑必须通过外部服务完成
- Cloudflare Proxied 意味着同域 Worker 路由（如 `yuanshenjian.cn/api/*`）可行，无需跨域
- 首发阶段优先上线高价值 AI 功能，以最小成本验证效果
- LLM API Key 绝对不能出现在前端代码或 HTML 响应中
- 当前文章详情页真实路由为 `app/articles/[slug]/page.tsx`，所有 AI 入口与索引设计都必须与 `/articles/${slug}` 对齐
- 当前阶段的 `blog-ai-worker/` 指的是同一 Git 仓库下并列的第二个 package，Phase 1 不引入 workspaces、Turborepo 等额外工具链

---

## 2. 整体架构

### 2.1 架构概览

```
浏览器（静态页面）
  │
  │  1. 用户触发 AI 请求
  │  2. 携带 Turnstile token（防滥用）
  ▼
Cloudflare Worker  (yuanshenjian.cn/api/*)
  │
  ├── Turnstile 验证（siteverify API）
  ├── 限流检查（Workers KV，Phase 1 为固定窗口计数）
  ├── 请求解析（scene + context + message，并校验请求体字节数与消息长度）
  ├── 场景路由 → 选择 provider/model/params
  ├── 提取 ai-data 静态索引（可选，限定问答范围）
  │
  ├── Provider: TokenHub  ──▶  /v1/chat/completions
  ├── Provider: MiMo      ──▶  [MiMo-TBD]
  └── Provider: (future)  ──▶  ...
  │
  ▼
Phase 1 返回 JSON，后续可扩展为 SSE
```

**关键设计决定：**

1. Worker 是唯一接触 LLM API Key 的服务，前端不持有任何凭据
2. 静态索引 (`public/ai-data/*.json`) 在构建期生成，Worker 运行时从 CDN fetch 使用
3. Turnstile 在 Worker 侧验证，前端只负责渲染挑战控件和传递 token

### 2.2 工程组织方式（Monorepo）

推荐将 `blog-ai-worker/` 放在当前博客工程根目录下，采用 **monorepo** 方式统一管理，而不是额外维护一个嵌套独立 git repository。

推荐目录形态：

```text
blog/
├─ app/
├─ components/
├─ docs/
├─ public/
├─ scripts/
├─ ...
└─ blog-ai-worker/
   ├─ src/
   ├─ package.json
   ├─ tsconfig.json
   └─ wrangler.toml
```

**这样做更适合当前阶段，原因如下：**

1. **实现速度更快**：Phase 1 需要同时改博客前端、构建脚本和 Worker；放在同一仓库中协作成本最低。
2. **文档与代码统一**：设计方案、执行计划、前端代码、Worker 代码放在同一工程内，后续继续推进 Phase 2/3 时更容易保持一致。
3. **联调更简单**：本地开发时，博客和 Worker 可以在同一工作区里运行，减少路径、脚本、环境变量同步成本。
4. **对个人项目更轻量**：当前阶段没有必要引入多仓库管理、跨仓库版本协调、submodule 或额外的 monorepo 工具链问题。

**需要明确的边界：**

- `blog-ai-worker/` 在代码结构上独立，拥有自己的 `package.json`、`wrangler.toml`、`.dev.vars`。
- 主博客前端绝不直接读取 Worker secrets，也不依赖 Worker 项目的私密配置文件。
- 后续如果 Worker 演进速度明显快于博客主站，或希望单独开源/独立部署，再考虑将其拆成独立仓库。

**结论：** 当前阶段推荐采用 monorepo 方式；Phase 1 ~ Phase 3 默认都按该组织方式设计与实施。

---

## 3. 安全设计：为什么不能把 API Key 放前端

### 3.1 直接风险

Next.js 静态导出的页面最终是 HTML + JS bundle，任何 `process.env.NEXT_PUBLIC_*` 变量都会被打进 bundle 中，可以被任何人通过 DevTools 或直接 curl 静态文件拿到。

即使使用 `process.env`（非 `NEXT_PUBLIC_`），`output: 'export'` 模式下构建产物全是静态文件，环境变量在构建时被内联，结果一样。

### 3.2 拿到 Key 之后能做什么

腾讯 TokenHub 的 Key 可以直接消耗 token 配额，产生费用，且无法区分合法请求和滥用请求。MiMo 同理。

### 3.3 正确分层

| 层 | 存放什么 | 谁可见 |
|----|---------|--------|
| 博客前端（`lib/config.ts`、env） | 站点 URL、Turnstile **Site Key**（公开用，设计上可见）、Worker 端点路径 | 所有人 |
| Worker `vars`（明文，可在 dashboard 查看） | 限流阈值、允许的 origin、场景路由配置（JSON）| Cloudflare dashboard 管理员 |
| Worker `secrets`（加密，不可导出） | LLM API Key（TokenHub）、MiMo API Key、Turnstile **Secret Key** | 仅 Worker 运行时环境 |

**结论：** LLM API Key 和 Turnstile Secret Key 必须放在 Worker secrets，永远不能出现在博客仓库、构建产物、或 Worker vars 明文字段中。

---

## 4. Cloudflare Turnstile：做什么，为什么需要

### 4.1 Turnstile 是什么

Cloudflare Turnstile 是 CAPTCHA 替代方案。它在前端运行一段 JavaScript 挑战，验证当前访问者"看起来像真人"，然后颁发一个一次性 token。该 token 必须在服务端（本方案为 Worker）通过 Cloudflare 的 `siteverify` API 核验，核验通过才允许继续处理请求。

### 4.2 为什么这个博客的 AI 接口需要它

本博客 AI 接口不需要用户登录，任何人都可以访问。如果没有防护措施：

- **费用滥用**：一个自动化脚本可以在几分钟内消耗数万 token，产生真实费用
- **限流绕过**：单纯 IP 限流可以被代理池部分绕过；Turnstile 会显著提高自动化滥用成本
- **爬虫批量采集**：无防护的 AI 接口等于给爬虫提供了结构化内容生成服务

Turnstile 在用户打开 AI 功能对话框时静默触发（无感模式），真人用户几乎无感知。它的定位是 **提高滥用成本**，不是认证系统，也不是精确限流系统，因此仍需与请求大小限制、KV 限流、超时和输出上限一起使用。

### 4.3 配置要点

- 前端：引入 Turnstile JS SDK，渲染挑战控件（可以是隐藏的 invisible 模式）
- AI 请求时：将 token 作为请求字段（如 `cf_turnstile_response`）随请求发送给 Worker
- Worker 侧验证：
  ```
  POST https://challenges.cloudflare.com/turnstile/v0/siteverify
  Body: secret=<TURNSTILE_SECRET_KEY>&response=<token>&remoteip=<ip>
  ```
- siteverify 成功后还要继续校验：
  - `hostname` 必须命中 Worker vars 中的允许名单
  - `action` 在配置了期望值时必须精确匹配，例如 `homepage_recommend`
- 验证失败 → 返回 `403`，不发出 LLM 请求
- Turnstile token 一次性有效，不可重用

---

## 5. API 限流方案

### 5.1 可行方案对比

| 方案 | 原理 | Cloudflare Workers 可行性 | 适合本场景 |
|------|------|--------------------------|-----------|
| Workers KV + 固定窗口计数 | 以 IP + 时间桶为 key，KV 存计数 | 可行，简单、便宜 | **Phase 1 推荐** |
| Workers KV + 滑动窗口 | 以 IP 为 key，KV 存时间戳列表 | 可行，但实现更复杂 | Phase 2 可评估 |
| Durable Objects + 计数器 | 强一致性计数器 | 可行，但额度占用更高 | 过度设计 |
| Cloudflare Rate Limiting（产品） | 平台层限流规则 | 可行，但按请求收费 | Phase 2 可补充 |
| 纯内存（无持久化） | Worker 实例变量 | 不可行，Worker 实例无状态，多实例不共享 | 不可行 |

### 5.2 为什么 Phase 1 选 Workers KV + 固定窗口计数

Workers KV 是 Cloudflare 的全球分布式 KV 存储，支持 TTL，适合做首发阶段的 **best-effort 防滥用限流**。

纯内存方案在 Workers 中不可行：每次请求可能落在不同 Worker 实例上，实例间不共享内存，计数器无法全局一致。

Durable Objects 虽然支持强一致性，但首发阶段流量小，引入 Durable Objects 会增加架构复杂度和费用。

Phase 1 不选“KV + 时间戳数组滑动窗口”的原因是：在 KV 上做 read-modify-write 的时间戳数组更新，容易在并发下丢失更新，且实现复杂度高于首发需要。

### 5.3 Phase 1 固定窗口实现思路

```
key:   "ratelimit:{ip}:{windowBucket}"
value: 当前窗口内的请求次数（整数）
TTL:   略大于窗口大小（如 3700 秒）

检查逻辑：
  1. 计算当前小时桶，例如 floor(now / 3600)
  2. 读取 key 对应计数
  3. 如果计数 >= 阈值 → 返回 429，附带 Retry-After 头
  4. 否则计数 +1，写回 KV（带 TTL）
  5. 继续处理 LLM 请求
```

这不是强一致安全边界，而是首发阶段足够实用、实现最简单、成本最低的“提高滥用门槛”方案。

### 5.3.1 总量止损 / 熔断补充

在固定窗口 IP 限流之外，再补一层全局止损：

- 使用同一个 `RATE_LIMIT_KV` 记录按 UTC 日期聚合的全局计数
- 计数 key 形如 `ai-daily-budget:2026-05-04`
- 只有请求已经通过 `origin -> Turnstile -> per-IP rate limit` 后，才会消耗这一天的全局预算
- 超出 `AI_DAILY_REQUEST_LIMIT` 后直接返回用户可读错误，不再继续触发 LLM 调用
- `AI_EMERGENCY_DISABLE=true` 时，直接拒绝新的 AI 请求，用于异常流量或上游故障时的紧急停机

这层保护的目标不是精确计费，而是把“每日最大风险敞口”限制在一个明确范围内。

### 5.4 首发阶段配置建议

| 参数 | 建议值 | 说明 |
|------|--------|------|
| 窗口大小 | 1 小时 | 与固定窗口桶实现一致 |
| 每 IP 每小时请求上限 | 10 次 | 对真实读者足够，对爬虫过紧 |
| 响应码 | `429 Too Many Requests` | 标准语义 |
| `Retry-After` 头 | 距窗口重置的秒数 | 让前端可以展示"请 X 分钟后重试" |

随流量增长，可以收紧阈值或分场景设置不同限额（推荐摘要可以宽松，文章问答可以更严格）。

### 5.5 本地开发策略

- 生产环境：使用同域 `/api/ai/*`，不依赖额外 CORS
- 本地开发：允许 `http://localhost:3000` 访问本地 `wrangler dev` 端口，或通过 Next.js rewrite / 代理转发
- 因此允许源配置推荐使用列表，而不是单个 origin

---

## 6. 模型适配层（Provider Abstraction）

### 6.1 设计目标

- 腾讯 TokenHub（OpenAI 兼容）和 MiMo（细节待确认）能接入同一套路由逻辑
- 未来新增其他 provider 只需新增适配器，不改动路由和场景逻辑
- 统一的请求/响应接口，Worker 业务代码不关心具体 provider 差异
- Phase 1 先统一为**非流式 JSON 返回**，降低前后端联调复杂度；流式 SSE 作为 Phase 2/3 的增强能力

### 6.2 Provider 接口定义

```typescript
// worker/src/providers/types.ts

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  stream: boolean;
}

interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

interface LLMProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
}
```

### 6.3 TokenHub 适配器（确定实现）

TokenHub 完全兼容 OpenAI `/v1/chat/completions`，适配器实现简单：

```typescript
// worker/src/providers/tencent-tokenhub.ts

class TencentTokenHubProvider implements LLMProvider {
  name = "tencent-tokenhub";

  constructor(
    private apiKey: string,
    private baseUrl: string,  // 如 https://tokenhub.tencentmaas.com/v1
    private model: string,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: request.stream,
      }),
    });
    // Phase 1 只处理非流式 JSON 响应
  }
}
```

### 6.4 MiMo 适配器（待完善）

**[MiMo-TBD]** 以下为兼容性占位设计，实际实现以 MiMo 官方文档为准：

```typescript
// worker/src/providers/mimo.ts

class MiMoProvider implements LLMProvider {
  name = "mimo";

  constructor(
    private apiKey: string,
    private baseUrl: string,  // [MiMo-TBD] 待确认
    private model: string,    // [MiMo-TBD] 待确认模型名称格式
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // [MiMo-TBD] 以下假设 MiMo 兼容 OpenAI 协议
    // 如果不兼容，需在此处做请求/响应格式转换
    // 差异点可能包括：
    //   - 鉴权方式（不一定是 Bearer token）
    //   - 请求字段命名（可能不同于 OpenAI）
    //   - 响应格式（可能有自定义字段）
    //   - 流式协议（可能不是标准 SSE）
    throw new Error("[MiMo-TBD] 实现待补充");
  }
}
```

### 6.5 Provider 注册与工厂

```typescript
// worker/src/providers/index.ts

function createProvider(env: Env, providerName: string, model: string): LLMProvider {
  switch (providerName) {
    case "tencent-tokenhub":
      return new TencentTokenHubProvider(env.LLM_PROVIDER_API_KEY, env.LLM_PROVIDER_BASE_URL, model);
    case "mimo":
      return new MiMoProvider(env.MIMO_API_KEY, env.MIMO_BASE_URL, model); // [MiMo-TBD]
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}
```

---

## 7. 场景级模型路由配置

### 7.1 三种 AI 场景

| 场景 | 触发位置 | 说明 |
|------|---------|------|
| `article` | 文章页（`components/article-content.tsx` 附近） | 针对当前文章内容的问答 |
| `column` | AI 专栏页（`app/ai/[column]/page.tsx`） | 针对整个专栏的导读或推荐 |
| `recommend` | 主页（`app/page.tsx`）或搜索入口 | 基于全局索引的文章推荐 |

### 7.2 路由配置结构

路由配置存储在 Worker `vars` 中（明文，便于调整无需重新部署 secrets），格式为 JSON 字符串：

```json
{
  "article": {
    "provider": "deepseek",
    "model": "deepseek-v4-pro",
    "maxTokens": 800,
    "temperature": 0.3,
    "systemPromptKey": "article_qa"
  },
  "column": {
    "provider": "deepseek",
    "model": "deepseek-v4-pro",
    "maxTokens": 600,
    "temperature": 0.5,
    "systemPromptKey": "column_intro"
  },
  "recommend": {
    "provider": "deepseek",
    "model": "deepseek-v4-pro",
    "maxTokens": 400,
    "temperature": 0.7,
    "systemPromptKey": "recommend"
  }
}
```

**设计意图：**

- `article` 场景要求准确性高，temperature 低，模型选推理能力强的
- `column` 场景需要流畅的介绍性文字，temperature 适中
- `recommend` 场景更偏发散，temperature 可以略高
- 切换 provider/model 只需修改 Worker vars，不需要改代码或重新部署

> 约束说明：`SCENE_ROUTING_CONFIG` 是 Phase 2 起推荐启用的能力。Phase 1 只有 `recommend` 一个场景时，可以先在 Worker 代码中固定配置，待 `article` / `column` 上线后再迁移到 vars。

### 7.3 Worker 中的路由逻辑

```typescript
// worker/src/router.ts

async function handleAIRequest(request: Request, env: Env): Promise<Response> {
  const { scene, message, context, cf_turnstile_response } = await request.json();

  // 1. Turnstile 验证
  await verifyTurnstile(cf_turnstile_response, request.headers.get("CF-Connecting-IP"), env);

  // 2. 限流检查
  await checkRateLimit(request.headers.get("CF-Connecting-IP"), env);

  // 3. 从 vars 读取场景路由配置
  const sceneConfig = JSON.parse(env.SCENE_ROUTING_CONFIG)[scene];
  if (!sceneConfig) throw new Error(`Unknown scene: ${scene}`);

  // 4. 创建 provider
  const provider = createProvider(env, sceneConfig.provider, sceneConfig.model);

  // 5. 构建 messages（含系统提示 + 上下文 + 用户消息）
  const messages = buildMessages(sceneConfig.systemPromptKey, context, message);

  // 6. 调用 LLM
  const llmResponse = await provider.chat({
    messages,
    maxTokens: sceneConfig.maxTokens,
    temperature: sceneConfig.temperature,
  });

  // 7. 返回统一 JSON 契约
  return Response.json({
    answer: llmResponse.content,
    references: context?.references ?? [],
    usage: llmResponse.usage,
  });
}
```

---

## 8. 构建期静态索引（ai-data）

### 8.1 为什么需要静态索引

Worker 运行时无法访问 `content/blog/` 源文件（构建产物不含 MD 文件）。要让 AI 问答限定在博客内容范围内（防止模型乱答），需要在构建期把文章元数据和摘要预先整理成 JSON，放到 `public/ai-data/`，通过 CDN 提供给 Worker 使用。

### 8.2 索引文件结构

```
public/
  ai-data/
    index.json             # Phase 1：全局文章列表（轻量，含 slug/title/excerpt/tags/date）
    articles/
      {slug}.json          # Phase 2：单篇文章详情（含正文纯文本分块）
    columns/
      {column-slug}.json   # Phase 2：专栏信息 + guide + 文章摘要
```

**`index.json` 结构：**

```json
{
  "generated": "2026-05-02T00:00:00Z",
  "posts": [
    {
      "slug": "...",
      "title": "...",
      "excerpt": "...",
      "tags": ["..."],
      "date": "2026-04-01"
    }
  ]
}
```

**`articles/{slug}.json` 结构（Phase 2）：**

```json
{
  "slug": "...",
  "title": "...",
  "date": "...",
  "excerpt": "...",
  "tags": ["..."],
  "contentChunks": [
    {
      "heading": "为什么要做这个",
      "text": "这一节的纯文本内容..."
    }
  ]
}
```

**`columns/{column-slug}.json` 结构（Phase 2）：**

```json
{
  "slug": "claudecode",
  "title": "Claude Code 实战",
  "description": "...",
  "guide": {
    "intro": "...",
    "paths": [
      { "label": "入门", "description": "..." }
    ]
  },
  "posts": [
    {
      "slug": "...",
      "title": "...",
      "excerpt": "..."
    }
  ]
}
```

### 8.3 构建期生成脚本

新增 `scripts/build-ai-data.js`，在 `npm run build` 与 `npm run build:prod` 前执行：

- 复用 `lib/blog.ts` 的 `getAllPosts()` 逻辑
- Phase 1 只生成 `index.json`
- Phase 2 再补充 `articles/{slug}.json` 与 `columns/{column-slug}.json`
- 将生成的 JSON 写入 `public/ai-data/`

**`package.json` 中的脚本调整：**

```json
{
  "scripts": {
    "build:ai-data": "node scripts/build-ai-data.js",
    "build": "npm run build:ai-data && next build",
    "build:prod": "npm run optimize-images && npm run build"
  }
}
```

如果希望避免 `build` 与 `build:prod` 重复，也可以将 `build:prod` 调整为 `npm run optimize-images && npm run build`。关键要求只有一个：**GitHub Pages 工作流实际执行的 `build:prod` 必须包含 `build:ai-data`。**

### 8.4 Worker 运行时使用索引

Worker 通过 fetch 请求 CDN 上的静态 JSON：

```typescript
// 获取全局索引（用于 recommend 场景）
const indexResp = await fetch("https://yuanshenjian.cn/ai-data/index.json");
const index = await indexResp.json();

// 获取单篇文章上下文（用于 Phase 2 的 article 场景，slug 由前端传入）
const articleResp = await fetch(`https://yuanshenjian.cn/ai-data/articles/${slug}.json`);
const article = await articleResp.json();
```

这些 JSON 由 Cloudflare CDN 缓存，Worker 访问延迟极低。

---

## 9. 前端 AI 入口落地设计

### 9.1 主页（`app/page.tsx`）

**Phase 1 当前入口：** 在 Hero 区域内嵌一个输入式 AI 推荐组件，不是浮动按钮或单独弹窗。

- 场景：`recommend`
- 用途：用户输入主题后，AI 返回站内相关文章推荐（带链接）
- 当前交互：
  - 单行输入框
  - 右侧 `问 AI` 按钮
  - 一组可配置快捷主题（当前默认包括 `AI 前沿`、`AI 编程`、`OpenAI`、`DeepSeek`、`Claude Code`、`简单设计`、`敏捷方法`）
  - 错误红框
  - `AI 回答` + `推荐文章` 卡片列表
- 上下文：Worker 先从全局 `index.json` 中按 query 做预筛，只把更相关的少量文章送给模型

**组件：** `components/ai/ai-recommend-widget.tsx`（客户端组件）

### 9.2 文章页（`components/article-content.tsx` 附近）

**Phase 2 入口：** 在文章内容区域末尾、评论区（Giscus）之前，新增"问问 AI"对话框。

- 场景：`article`
- 用途：读者可以对当前文章内容提问（如"这篇文章里的依赖注入适合在 Java 里用吗"）
- 上下文：当前文章的 `contentChunks`（由前端通过 slug 指定，Worker 去 CDN 取）

**组件：** 新增 `components/ai-article-chat.tsx`（客户端组件）

文章页 slug 通过当前真实路由 `app/articles/[slug]/page.tsx` 传入。

### 9.3 AI 专栏页（`app/ai/[column]/page.tsx`）

**Phase 2 入口：** 在专栏介绍文字下方，新增"问问这个专栏"交互区。

- 场景：`column`
- 用途：读者询问"这个专栏适合没有 Claude Code 基础的人吗"，AI 基于专栏文章列表回答
- 上下文：对应 `columns/{column-slug}.json` 中的文章列表和摘要

**组件：** 新增 `components/ai-column-chat.tsx`（客户端组件）

### 9.4 搜索入口（`components/global-search.tsx`）

**Phase 3 升级：** 当前 `GlobalSearch` 是客户端关键字过滤。Phase 3 可在搜索无结果时，提供"用 AI 搜索"降级，或在搜索框旁增加 AI 增强入口。

- 场景：`recommend`
- 这是可选升级，不影响 Phase 1/2 的现有搜索功能

### 9.5 前端通用请求封装

新增 `lib/ai-client.ts`：

```typescript
// lib/ai-client.ts

const AI_WORKER_BASE = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? "/api/ai";

interface AIChatOptions {
  scene: "recommend";
  message: string;
  context?: Record<string, unknown>;
  turnstileToken: string;
}

export async function aiChat(options: AIChatOptions): Promise<AIChatResponse> {
  const response = await fetch(`${AI_WORKER_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scene: options.scene,
      message: options.message,
      context: options.context,
      cf_turnstile_response: options.turnstileToken,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }

  return (await response.json()) as AIChatResponse;
}
```

---

## 10. 分阶段设计：Phase 1 / 2 / 3

---

### Phase 1：核心基础设施 + 主页推荐

#### 目标

在最短时间内上线可用的 AI 功能，验证技术路径和用户交互模式。

#### 范围

- Cloudflare Worker 基础设施（origin 校验 + Turnstile 验证 + hostname/action 校验 + per-IP 限流 + 日预算止损 + 紧急关闭）
- 构建期 `index.json` 生成
- Hero 区域内嵌输入式 AI 推荐组件
- 推荐 query 预筛 + 站内确定性 fallback

#### 架构变化

- 在当前工程内新增 `blog-ai-worker/` 子项目，按 monorepo 方式管理（见第 12 节）
- Worker 绑定一个 KV namespace（用于限流）
- `public/ai-data/` 目录纳入构建产物，随静态站一起部署到 GitHub Pages
- `lib/config.ts` 新增 `ai` 配置节（Worker URL、Turnstile site key）
- `.env.local` / `.env.example` 新增相关变量

#### 前端入口

- `app/page.tsx`：引入 `components/ai/ai-recommend-widget.tsx`
- 用户输入问题 → 展示相关文章列表（带链接、标题、excerpt）
- UI 轻量，不干扰主页现有布局

#### Worker 能力

- `POST /api/ai/chat`：接受 `scene=recommend`，从 CDN 取 `index.json`，调 Tencent TokenHub，返回非流式 JSON 响应
- `origin -> Turnstile -> hostname/action -> per-IP rate limit -> daily budget` 全部通过后才会触发 LLM
- 推荐前先按 query 对 tags / title / excerpt 做预筛，只选少量高相关文章作为模型上下文
- 上游 provider 5xx 或空内容时，回退为站内确定性推荐，而不是直接把 502 暴露给用户
- 生产同域 `/api/ai/*`；开发环境允许 `localhost`

#### 风险与取舍

| 风险 | 取舍 |
|------|------|
| `index.json` 包含全站文章摘要，直接全量送模会推高 token 成本 | 先按 query 预筛，再限制送模文章数（当前为 top 8） |
| Turnstile 首次加载可能有 100-200ms 延迟 | 用户打开对话框时再初始化，不影响主页首屏 |
| 上游 provider 偶发不返回最终内容 | Worker 侧保留站内推荐 fallback，优先保证首页可用性 |
| MiMo 尚未可用 | Phase 1 全部使用 Tencent TokenHub，MiMo 适配器在代码中保留占位 |
| 本地联调路径与生产不同 | 文档中同时给出生产同域与开发 `localhost` 放行策略 |

#### 验收标准

- [ ] Worker 部署成功，可通过 `yuanshenjian.cn/api/ai/chat` 访问
- [ ] Turnstile 验证正常工作（可通过 Cloudflare dashboard 验证）
- [ ] 限流生效：同一 IP 超过 10 次后返回 429
- [ ] 主页推荐对话框可以正常返回带链接的文章推荐
- [ ] LLM API Key 不出现在任何前端产物中（通过 `grep` 验证构建产物）
- [ ] `public/ai-data/index.json` 随构建生成，内容正确

---

### Phase 2：文章问答 + 专栏导读

#### 目标

将 AI 能力延伸到内容消费场景，提升单篇文章和专栏的阅读体验。

#### 范围

- 文章页"问 AI"对话框（基于文章内容的上下文问答）
- AI 专栏页"问问专栏"交互区
- 补充 `articles/{slug}.json` 与 `columns/{column-slug}.json` 生成逻辑
- 场景路由配置完善（article/column 场景独立配置）
- 每个 scene 显式定义自己的 `turnstileAction`、`contextLimit`、`fallbackPolicy` 与预算策略

#### 架构变化

- Worker 新增对 `article` 和 `column` 场景的处理逻辑
- Worker 运行时按需 fetch `articles/{slug}.json` 或 `columns/{column-slug}.json`
- 前端需要在请求中传递 `context.slug` 或 `context.columnSlug`，供 Worker 取索引
- article / column 不应直接全量送正文或整专栏摘要，必须沿用“先筛选、再限制上下文长度”的 Phase 1 经验
- article / column 也应继承 Phase 1 已落地的安全基线，而不是只复用最初的 `recommend` happy path

#### 前端入口

- `components/article-content.tsx` 末尾区域：引入 `components/ai-article-chat.tsx`
- `app/ai/[column]/page.tsx` 专栏介绍下方：引入 `components/ai-column-chat.tsx`

#### Worker 能力

- 支持 `scene=article`：取 `articles/{slug}.json`，按标题/段落提取纯文本 contentChunks 作为系统提示上下文
- 支持 `scene=column`：取 `columns/{column-slug}.json`，整理文章列表摘要作为上下文
- 场景路由配置 `SCENE_ROUTING_CONFIG` 从 Worker vars 读取（无需改代码即可调整 model/temperature）

#### 风险与取舍

| 风险 | 取舍 |
|------|------|
| 单篇文章正文可能过长 | contentChunks 按标题/段落提取纯文本，并限制总长度；必要时先按 query 选 chunk |
| 读者可能问文章以外的问题 | 系统提示明确限定"请基于以下文章内容回答" |
| 新 scene 如果没有 fallback，体验会退回纯 happy path | 将 fallback 从 recommend 特例升级为 scene 级契约 |
| 如果 MiMo 文档到位，Phase 2 可以接入 MiMo | MiMo 适配器在 Phase 1 代码中已有占位，完成 `[MiMo-TBD]` 部分即可 |

#### 验收标准

- [ ] 文章页 AI 对话框可以正确基于文章内容回答
- [ ] 专栏页 AI 可以推荐专栏内文章
- [ ] `article` 和 `column` 场景可以独立配置不同 model
- [ ] 各场景限流计数独立计算（或合并计算，取决于策略）
- [ ] MiMo 适配器（如文档已到位）通过 Worker 集成测试

---

### Phase 3：搜索增强 + 精细化运营

#### 目标

将 AI 能力融入全站搜索体验，并对 token 用量、质量和用户行为做精细化观测。

#### 范围

- `components/global-search.tsx` 搜索增强（AI 搜索降级 / 并行模式）
- Worker 侧请求日志和 token 用量追踪（通过 Cloudflare Analytics Engine 或 Logpush）
- 根据 Phase 1/2 数据调整限流阈值和场景模型配置
- 可选：多 provider 灰度（部分流量走 MiMo，部分走 TokenHub）

#### 架构变化

- `GlobalSearch` 增加 AI 搜索模式（client 组件改造）
- Worker 新增简单的用量日志写入（用 CF Analytics Engine，无额外成本）
- 场景路由配置可扩展 `weight` 字段，支持多 provider 按比例路由

#### 前端入口

- `components/global-search.tsx`：搜索无结果时展示"用 AI 搜索"按钮，或搜索框旁增加 AI 图标

#### Worker 能力

- `scene=recommend` 复用主页推荐逻辑
- 新增轻量日志写入（请求场景、响应时长、token 用量，不记录用户内容）
- 可选 provider 灰度路由

#### 风险与取舍

| 风险 | 取舍 |
|------|------|
| 搜索 AI 化可能让用户绕过 Turnstile 习惯 | 搜索入口同样必须经过 Turnstile 验证 |
| 多 provider 灰度增加调试复杂度 | Phase 3 灰度为可选，先单 provider 稳定运行再评估 |
| 用量日志隐私问题 | 明确不记录用户输入内容，只记录元数据（场景、时长、token 数） |

#### 验收标准

- [ ] 搜索 AI 增强上线，Turnstile 验证正常
- [ ] Worker 日志可以在 CF dashboard 查看基本用量数据
- [ ] 场景路由配置经过 Phase 1/2 调优后稳定

---

## 11. 环境变量 / Secrets / Vars 命名清单

### 11.1 博客前端（`.env.local` / GitHub Actions secrets）

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_AI_WORKER_URL` | 公开 env | Worker 对外端点，如 `https://yuanshenjian.cn/api/ai` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 公开 env | Turnstile 前端 Site Key（设计上可见，非敏感） |

### 11.2 Worker Secrets（加密，仅 Worker 运行时可见）

| 变量名 | 说明 |
|--------|------|
| `LLM_PROVIDER_API_KEY` | 当前激活 LLM provider 的 API Key（Phase 1 对应 TokenHub） |
| `LLM_PROVIDER_BASE_URL` | 当前激活 LLM provider 的基础 URL（Phase 1 对应 TokenHub） |
| `MIMO_API_KEY` | Xiaomi MiMo API Key **[MiMo-TBD]** |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 后端 Secret Key |

> 注意：`LLM_PROVIDER_BASE_URL` 如果仅是通用域名（不含账号信息），可以降级为 vars。

### 11.3 Worker Vars（明文，Cloudflare dashboard 可见）

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `ALLOWED_ORIGINS` | string | 允许的 origin 列表，如 `https://yuanshenjian.cn,http://localhost:3000` |
| `TURNSTILE_ALLOWED_HOSTNAMES` | string | Turnstile siteverify 返回允许的 hostname 列表，如 `yuanshenjian.cn,localhost` |
| `TURNSTILE_EXPECTED_ACTION` | string | 期望的 Turnstile action，如 `homepage_recommend`；为空则不校验 |
| `AI_IP_RATE_LIMIT_WINDOW_SECONDS` | string | 按 IP 的限流窗口大小，单位秒，如 `"3600"` |
| `AI_IP_RATE_LIMIT_MAX_REQUESTS` | string | 按 IP 的窗口内最大请求数，如 `"10"` |
| `AI_EMERGENCY_DISABLE` | string | 是否紧急关闭 AI，`"true"` 表示直接拒绝请求 |
| `AI_DAILY_REQUEST_LIMIT` | string | 每日最多允许的 AI 请求数，如 `"100"` |
| `AI_REQUEST_MAX_BODY_BYTES` | string | 请求体最大字节数，如 `"8192"`；超限返回 `413 Payload Too Large` |
| `AI_REQUEST_MAX_MESSAGE_CHARS` | string | `message.trim()` 后允许的最大字符数，如 `"500"`；超限返回 `413 Payload Too Large` |
| `SCENE_ROUTING_CONFIG` | JSON string | 场景路由配置（参见第 7 节） |
| `AI_DATA_BASE_URL` | string | ai-data JSON 的 CDN 基础 URL，如 `https://yuanshenjian.cn/ai-data` |
| `MIMO_BASE_URL` | string | MiMo API 基础 URL **[MiMo-TBD]**，如确认无敏感信息则放 vars |

### 11.4 KV Namespace 绑定

| 绑定名 | 说明 |
|--------|------|
| `RATE_LIMIT_KV` | Worker KV namespace，用于存储 IP 限流计数 |

---

## 12. 文件变更清单

### 12.1 新增 `blog-ai-worker/` 子项目（推荐 monorepo 方式）

说明：这里的 monorepo 指 **同一 Git 仓库下并列的第二个 package**，Phase 1 不要求引入 npm workspaces、pnpm workspace、Turborepo 等额外工具链。

推荐目录结构：

```
blog-ai-worker/
  src/
    index.ts              # Worker 入口，路由分发
    providers/
      types.ts            # LLMProvider 接口定义
      tencent-tokenhub.ts # 腾讯 TokenHub 适配器
      mimo.ts             # MiMo 适配器（[MiMo-TBD]）
      index.ts            # createProvider 工厂函数
    middleware/
      turnstile.ts        # verifyTurnstile
      rate-limit.ts       # per-IP 限流 + daily budget + emergency disable
      origin.ts           # origin 检查
    scenes/
      recommend.ts        # recommend 场景：fetch index.json，构建 messages
    prompts/
      recommend.ts        # recommend 场景系统提示模板
    types.ts              # Env 接口定义（绑定的 KV、secrets、vars）
  wrangler.toml           # Worker 配置（路由、KV 绑定等）
  .dev.vars               # 本地开发 secrets（不提交）
  package.json
  tsconfig.json
```

**`wrangler.toml` 关键配置：**

```toml
name = "blog-ai-worker"
main = "src/index.ts"
compatibility_date = "2026-05-02"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "<kv-namespace-id>"

[vars]
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000,http://localhost:3001"
TURNSTILE_ALLOWED_HOSTNAMES = "yuanshenjian.cn,localhost"
TURNSTILE_EXPECTED_ACTION = "homepage_recommend"
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "3600"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "10"
AI_EMERGENCY_DISABLE = "false"
AI_DAILY_REQUEST_LIMIT = "100"
AI_REQUEST_MAX_BODY_BYTES = "8192"
AI_REQUEST_MAX_MESSAGE_CHARS = "500"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"

# routes 通过 Cloudflare dashboard 配置，或：
[[routes]]
pattern = "yuanshenjian.cn/api/ai/*"
zone_name = "yuanshenjian.cn"
```

### 12.2 博客仓库需新增的文件

| 文件路径 | 说明 |
|---------|------|
| `scripts/build-ai-data.js` | 构建期生成 `public/ai-data/` 的脚本 |
| `public/ai-data/.gitkeep` | 占位，确保目录存在（实际 JSON 由构建生成，不提交）|
| `lib/ai-client.ts` | 前端统一 AI 请求封装 |
| `components/ai/ai-recommend-widget.tsx` | Hero 区域内嵌输入式 AI 推荐组件（Phase 1）|
| `components/ai-article-chat.tsx` | 文章页问答对话框（Phase 2）|
| `components/ai-column-chat.tsx` | 专栏页问答对话框（Phase 2）|
| `.env.example` 更新 | 新增 `NEXT_PUBLIC_AI_WORKER_URL`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY` |

### 12.3 博客仓库需修改的文件

| 文件路径 | 修改内容 |
|---------|---------|
| `lib/config.ts` | 新增 `ai` 配置节（Worker URL、Turnstile site key）|
| `app/page.tsx` | Phase 1：引入 `AiRecommendWidget` 组件 |
| `components/article-content.tsx` | Phase 2：在末尾引入 `AiArticleChat` 组件 |
| `app/ai/[column]/page.tsx` | Phase 2：引入 `AiColumnChat` 组件 |
| `package.json` | 新增 `build:ai-data` script，修改 `build` 串联 |
| `.github/workflows/deploy.yml` | 确认构建步骤包含 `build:ai-data`（如果已串联则无需修改）|

### 12.4 `public/ai-data/` 与 `.gitignore`

构建产物 `public/ai-data/*.json` 建议**不提交到 Git**（`gitignore` 添加 `public/ai-data/*.json`），每次部署时由构建步骤生成。这样避免仓库随文章增加而膨胀，也确保索引始终与最新文章同步。

### 12.5 Worker 部署与忽略项

由于当前仓库现有工作流只负责 GitHub Pages，需要为 `blog-ai-worker/` 单独补充部署方式。Phase 1 推荐两种任选其一：

1. **本地手动部署**：在 `blog-ai-worker/` 目录执行 `npx wrangler deploy`
2. **单独 GitHub Actions 工作流**：新增仅负责 Worker 的 workflow，使用 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 部署

推荐在根仓库 `.gitignore` 中补充以下内容：

```gitignore
blog-ai-worker/node_modules/
blog-ai-worker/.wrangler/
blog-ai-worker/.dev.vars
public/ai-data/*.json
```

---

## 13. 已知未定项（MiMo 相关）

以下所有项目标记为 **[MiMo-TBD]**，在实际实现前必须确认 MiMo 官方文档：

| 项目 | 当前状态 | 需要确认 |
|------|---------|---------|
| MiMo API Endpoint 格式 | 未知 | Base URL、路径结构 |
| MiMo 鉴权方式 | 未知 | 是否为 `Bearer token`，还是其他方式（如 HMAC、自定义 header）|
| MiMo 请求格式 | 未知 | 是否兼容 OpenAI `/v1/chat/completions` 格式 |
| MiMo 响应格式 | 未知 | 是否兼容 OpenAI 响应结构 |
| MiMo 流式协议 | 未知 | 是否为标准 SSE，还是 WebSocket 或其他 |
| MiMo 模型名称格式 | 未知 | 模型 ID 命名规范 |
| MiMo 速率限制 | 未知 | 是否有自身的 RPM/TPM 限制，需要在 Worker 侧适配 |
| `MIMO_BASE_URL` 是否含敏感信息 | 未知 | 决定放 secrets 还是 vars |

**兼容性目标：** 本方案优先把 MiMo 的差异收敛在 Provider 层（第 6 节）。如果 MiMo 与 OpenAI 协议差异较大，原则上先修改 `worker/src/providers/mimo.ts`；如其流式协议、错误结构或鉴权方式明显不同，也允许对 router/response 层做少量配套调整。

---

*文档结束*
