# Core Service 与 Admin Console 设计文档

日期：2026-06-01

## 1. 背景

当前博客是基于 Next.js 15、TypeScript、Tailwind CSS 和 MDX 的静态站点，采用 `output: 'export'` 部署到 GitHub Pages，并通过 Cloudflare CDN 对外服务。现有 AI 能力由独立的 `blog-ai-worker` Cloudflare Worker 承载，前端通过 `NEXT_PUBLIC_AI_WORKER_URL` 调用 `POST /api/ai/chat/stream` 获取 SSE 流式响应。

现有 `blog-ai-worker` 已支持多个 AI 场景：

- 首页文章推荐：`recommend`
- 文章页问答：`article`
- 作者页问答：`author`
- AI 简报推荐：`briefing-recommend`
- 投资简报推荐：`investment-briefing-recommend`

Worker 已包含 Origin 白名单、Turnstile 校验、请求体大小限制、IP 限流、每日预算、紧急禁用、LLM provider/profile 切换等安全与成本控制能力。现有 AI 数据主要来自构建期生成的静态 JSON：`public/ai-data/index.json`、`public/ai-data/articles/*.json`、`public/ai-data/author.json`、`public/ai-data/briefings/index.json`。

新的目标是将 AI Worker 迁移为 Python FastAPI Web Service，并引入 Postgres，扩展阅读统计、自定义评论、AI Chat、AI 顾问、RAG 知识库和管理控制台能力。

## 2. 目标

第一版目标是构建一个可上线的“博客智能核心服务”，目录名为 `core-service/`，并新增独立管理控制台 `admin-console/`。

第一版必须满足：

- 完整迁移现有 `blog-ai-worker` 的所有公开 AI 场景能力。
- 尽量兼容现有前端 AI 调用协议，保留 `POST /api/ai/chat/stream` 兼容入口。
- 增加文章阅读量统计，包括文章 PV、近似 UV、热门文章和日聚合。
- 增加自定义评论系统，支持匿名评论、二级回复、Markdown 安全子集、AI 辅助审核和人工审核。
- 增加首页、文章页、作者页的 AI 顾问入口。
- 增加基础 RAG，使用 Supabase Postgres + pgvector 检索公开内容。
- 增加极简管理控制台，用于评论审核、阅读统计、AI 用量和系统状态查看。
- 增加 GitHub Actions 到 Render 的 CI/CD 流水线设计。
- 微信登录先预留架构和接口，不阻塞 MVP。

## 3. 非目标

第一版明确不做：

- 完整知识库编辑后台。
- 私有知识库权限系统。
- 完整用户管理后台。
- 复杂 RBAC。
- 评论点赞。
- 评论通知系统。
- 付费系统。
- 复杂可视化报表。
- 本地 embedding 模型。
- 直接依赖 Supabase Auth 完成核心登录路径。
- 将 `admin-console` 直接连接 Supabase 数据库或持有 Supabase service role key。

## 4. 资源与部署选择

采用以下免费资源组合：

- Web Service：Render Free Web Service。
- Postgres：Supabase Free Postgres，启用 `pgvector` 扩展。
- 反滥用：Cloudflare Turnstile。
- 静态博客：保持 GitHub Pages + Cloudflare CDN。
- 管理控制台：Cloudflare Pages Free，部署到单独子域名 `admin.yuanshenjian.cn`。
- Core Service 自定义域名：必须使用同一注册域下的 `api.yuanshenjian.cn`，不能让公开前端长期直接调用 Render 默认域名。

选择 Supabase 而非 Render Postgres 的原因：

- Supabase Free Postgres 更适合作为长期免费数据库。
- Supabase Dashboard 可作为早期数据库观察和应急管理工具。
- 后续可扩展 Supabase Auth、Storage、Realtime，但第一版不强依赖。

免费资源可用性预期：

- 第一版是个人博客低 SLA 上线方案，接受 Render Free 空闲冷启动。
- 冷启动期间前端必须展示“服务唤醒中，请稍后”的非阻断提示。
- 如果 AI 顾问或评论接口连续 7 天日活访问超过 100 次，或冷启动明显影响咨询转化，应优先升级 Render 付费实例。
- 如果 Supabase 存储超过 400MB、RAG chunk 超过 20000 条、或原始事件表增长过快，应执行数据清理或升级 Supabase 计划。
- 免费资源不可承诺高可用；管理员后台应展示 API、DB、RAG sync 状态，便于快速判断问题来源。

## 5. 工程结构

目标 monorepo 结构：

```text
blog/
├─ app/                         # 现有静态博客 Next.js
├─ components/
├─ content/
├─ lib/
├─ public/
├─ scripts/
├─ blog-ai-worker/              # 迁移完成前保留，完成后归档或删除
├─ core-service/                # FastAPI 核心业务后端
├─ admin-console/               # 管理控制台前端
├─ docs/
└─ .github/workflows/
```

`core-service/` 承载：

- AI Gateway
- AI Advisor
- RAG
- 评论
- 阅读统计
- 用户识别
- 管理后台 API
- 内容同步 CLI
- 数据库迁移
- 后端 CI/CD 脚本

`admin-console/` 承载：

- 管理员登录页面
- 评论审核页面
- 阅读统计页面
- AI 用量页面
- 系统状态页面

`admin-console` 只消费 FastAPI 的 `/api/v1/admin/*` 后台 API，不直接访问 Supabase。

## 6. 总体架构

```text
静态博客 Next.js
  |
  | 文章浏览 / 评论 / AI Chat / AI 顾问
  v
FastAPI Core Service on Render
  |
  |-- Identity & Access
  |     visitor cookie
  |     future WeChat OAuth
  |     admin session
  |
  |-- AI Gateway
  |     兼容现有 ai-worker 场景
  |     全站 AI Chat
  |     AI 顾问
  |     文章页上下文问答
  |
  |-- RAG Engine
  |     Supabase Postgres + pgvector
  |     public content chunks
  |     embedding cache
  |
  |-- Comment Service
  |     匿名评论
  |     回复
  |     Markdown 安全渲染
  |     AI 辅助审核
  |
  |-- Analytics Service
  |     阅读量统计
  |     热门文章
  |     AI 用量
  |
  v
Supabase Postgres
```

### 6.1 域名、Cookie 与 CORS 约束

Core Service 必须部署到 `api.yuanshenjian.cn`，主站使用 `yuanshenjian.cn` 或 `www.yuanshenjian.cn`，管理控制台使用 `admin.yuanshenjian.cn`。三者处于同一注册域，便于稳定使用 HttpOnly Cookie。

Cookie 策略：

```text
visitor_id: HttpOnly, Secure, SameSite=Lax, Path=/, Domain=.yuanshenjian.cn
admin_session: HttpOnly, Secure, SameSite=Lax, Path=/api/v1/admin, Domain=.yuanshenjian.cn
csrf_token: 非 HttpOnly, Secure, SameSite=Lax, Path=/, Domain=.yuanshenjian.cn
```

前端请求约定：

- 主博客和 `admin-console` 调用 `core-service` 时必须设置 `credentials: 'include'`。
- `core-service` 只允许配置中的 `ALLOWED_ORIGINS`，默认包含 `https://yuanshenjian.cn`、`https://www.yuanshenjian.cn`、`https://admin.yuanshenjian.cn` 和本地开发地址。
- CORS 必须返回 `Access-Control-Allow-Credentials: true`。
- 所有 mutation 请求必须校验 Origin。
- 管理后台 mutation 请求必须同时校验 Origin 和 CSRF token。
- 公开评论、AI 请求除 Origin 校验外，还必须进行 Turnstile 或服务端低风险豁免校验。

## 7. 领域上下文

### 7.1 Identity & Access

负责匿名访客、未来登录用户、管理员会话和权限判断。

核心概念：

```text
Actor = visitor | user | admin
Visitor = 匿名访客
User = 未来微信或其他登录用户
Admin = 管理员
```

第一版能力：

- 匿名用户是一等用户形态。
- `core-service` 签发 HttpOnly `visitor_id` cookie。
- 匿名用户可评论和使用 AI Chat，但额度更低，评论默认审核。
- 管理员使用独立 admin session。
- 微信登录只预留数据结构和接口，未配置时返回 `501 not_configured`。

微信登录后续流程：

```text
用户点击微信登录
  -> core-service 创建 state 并记录 return_to
  -> 跳转微信开放平台授权页或展示扫码二维码
  -> 微信回调 /api/v1/auth/wechat/callback?code&state
  -> core-service 服务端用 AppID/AppSecret 换 access_token
  -> 获取 openid / unionid / 昵称 / 头像
  -> upsert users 与 auth_identities
  -> 签发 HttpOnly app_session cookie
  -> 跳回博客页面
```

### 7.2 Content Catalog

负责把公开博客内容转换为后端可检索文档。

Canonical 内容来源：

```text
content/blog/**
content/ai-briefings/**
content/investment-briefings/**
lib/author-profile-data.js
```

`public/ai-data/**` 是构建产物和迁移期兼容缓存，不作为 RAG 的并列单一真相源。作者资料必须以 `lib/author-profile-data.js` 为唯一真相源，`public/ai-data/author.json` 禁止作为后台知识库的 canonical 输入。

内容入库规则：

- 只 ingest 已发布公开内容。
- 文章必须复用现有博客的 `published` 判定。
- 草稿、未发布内容、私有笔记不得进入第一版公开 RAG。
- 同一内容同时存在 Markdown 原文和 `public/ai-data` 生成物时，以 Markdown 原文或作者资料单一真相源为准。
- `source_id` 必须稳定，文章使用 slug，简报使用 slug 或日期型唯一标识，作者资料使用固定值 `author-profile`。

文档类型：

```text
article
ai_briefing
investment_briefing
author_profile
advisor_public_note
```

第一版只使用公开内容。私有顾问知识库和分权限 RAG 只在数据模型中预留，不启用。

### 7.3 Knowledge / RAG

负责公开内容的检索增强生成。

核心流程：

```text
文档同步
  -> 切块
  -> embedding
  -> pgvector 入库
  -> 查询时向量召回
  -> 组装上下文
  -> LLM 回答
  -> 返回引用
```

第一版检索策略：

- 使用 OpenAI-compatible embeddings API。
- 使用 Supabase Postgres `pgvector` 存储向量。
- 使用基础向量召回：query embedding -> top_k chunks -> score threshold。
- 回答必须带引用来源。
- 没有足够资料时明确说明资料不足，不能编造。
- 不做复杂 rerank。

Embedding 配置：

```text
EMBEDDING_BASE_URL
EMBEDDING_API_KEY
EMBEDDING_MODEL_ID
EMBEDDING_DIMENSIONS
```

### 7.4 AI Gateway

负责统一 AI 请求、安全、限流、预算、模型适配和用量记录。

兼容现有场景：

```text
recommend
article
author
briefing-recommend
investment-briefing-recommend
```

新增场景：

```text
site-chat
advisor
admin-comment-moderation
```

所有 AI 请求都必须经过：

- Origin 检查。
- Turnstile 校验，后台内部任务除外。
- 请求体大小限制。
- actor 限流。
- IP 哈希限流。
- 每日预算检查。
- SSE 错误兜底。
- 用量记录。

现有 Worker 等价迁移要求：

- 保留 scene 到 LLM profile 的映射能力，不把所有场景硬编码到同一个模型。
- 保留 OpenAI-compatible provider 抽象，支持不同 base URL、API key、model、temperature、max tokens。
- 旧场景在兼容迁移阶段优先读取现有 `public/ai-data` JSON，以降低前端切换风险；RAG 上线后，新 `advisor` 和 `site-chat` 使用数据库知识库。
- 旧场景的数据读取必须有 `AI_DATA_BASE_URL` 或本地文件适配，避免与站点发布内容脱节。
- Turnstile 校验必须支持 scene/action 映射，例如 `ai_recommend`、`ai_article`、`ai_advisor`、`comment_submit`。
- 成本估算必须记录 provider、model、prompt token、completion token 和模型价格元数据版本；缺少 token 用量时使用字符数估算并标记为 estimated。

LLM profile 配置形态：

```text
LLM_PROFILES_JSON=[
  {"id":"default","provider":"openai-compatible","base_url":"...","model":"...","api_key_env":"CHAT_API_KEY"},
  {"id":"advisor","provider":"openai-compatible","base_url":"...","model":"...","api_key_env":"CHAT_API_KEY"}
]

AI_SCENE_PROFILE_MAP={
  "recommend":"default",
  "article":"default",
  "author":"default",
  "briefing-recommend":"default",
  "investment-briefing-recommend":"default",
  "site-chat":"advisor",
  "advisor":"advisor"
}
```

### 7.5 Advisor

`Advisor` 是产品化 AI 顾问，不是普通聊天包装。

第一版服务对象：

- 普通读者：围绕文章和问题获得建议、路径和指导。
- 潜在合作客户：了解作者可提供的 AI 提效、研发效能、敏捷/工程实践咨询价值。
- 招聘/合作方：了解作者经历、能力、项目匹配度。

入口：

- 首页主入口：`问问 AI 顾问`。
- 文章页上下文入口：结合当前文章继续咨询。
- 作者页入口：偏合作、招聘、咨询了解。

第一版回答结构：

```text
answer
suggestions
risks_or_limits
next_steps
references
```

### 7.6 Comments

负责自定义评论系统。

第一版能力：

- 支持一级评论和二级回复。
- 支持匿名评论。
- 支持 Markdown 安全子集：链接、引用、代码、列表、粗体、斜体。
- 禁止原始 HTML。
- 匿名评论默认 `pending`。
- 未来登录用户评论仍可审核，但风险分更低。
- AI 审核只给出风险标签和建议状态，不自动最终拒绝。
- 管理员后台一键批准、拒绝、标记 spam。

### 7.7 Analytics

负责轻量统计。

第一版能力：

- 文章 PV。
- 近似 UV。
- 日聚合。
- 热门文章。
- AI 场景用量。
- 评论数量。

第一版不是完整行为分析平台，不追踪复杂用户路径。

### 7.8 Admin

负责后台 API 聚合和授权，不直接承载业务逻辑。

后台 API：

```text
/api/v1/admin/comments/*
/api/v1/admin/analytics/*
/api/v1/admin/ai-usage/*
/api/v1/admin/system/*
```

`admin-console` 只调用这些 API。

## 8. 数据库模型

### 8.1 Identity

```text
visitors
- id uuid pk
- visitor_key_hash text unique
- first_seen_at timestamptz
- last_seen_at timestamptz
- risk_score int
- created_at timestamptz
```

```text
users
- id uuid pk
- display_name text
- avatar_url text
- status text
- created_at timestamptz
- updated_at timestamptz
```

```text
auth_identities
- id uuid pk
- user_id uuid fk users.id
- provider text
- provider_subject text
- provider_unionid text null
- raw_profile jsonb
- created_at timestamptz
- updated_at timestamptz
```

```text
admin_sessions
- id uuid pk
- session_hash text unique
- expires_at timestamptz
- created_at timestamptz
- last_seen_at timestamptz
```

### 8.2 Knowledge

```text
knowledge_documents
- id uuid pk
- source_type text
- source_id text
- slug text
- title text
- url text
- summary text
- visibility text
- content_hash text
- published_at timestamptz
- metadata jsonb
- created_at timestamptz
- updated_at timestamptz
```

约束：

```text
unique(source_type, source_id)
```

```text
knowledge_chunks
- id uuid pk
- document_id uuid fk knowledge_documents.id
- chunk_index int
- heading text
- content text
- token_count int
- content_hash text
- embedding vector
- embedding_model text
- metadata jsonb
- created_at timestamptz
- updated_at timestamptz
```

约束：

```text
unique(document_id, chunk_index)
```

```text
rag_sync_runs
- id uuid pk
- status text
- commit_sha text null
- started_at timestamptz
- finished_at timestamptz null
- documents_seen int
- documents_upserted int
- chunks_upserted int
- chunks_deleted int
- embeddings_generated int
- error_message text null
- created_at timestamptz
```

索引：

```text
knowledge_documents(source_type, slug)
knowledge_documents(content_hash)
knowledge_chunks(document_id, chunk_index)
knowledge_chunks vector index on embedding
```

### 8.3 Comments

```text
comments
- id uuid pk
- article_slug text
- parent_id uuid null fk comments.id
- actor_type text
- visitor_id uuid null
- user_id uuid null
- display_name text
- email_hash text null
- content_markdown text
- content_html text
- status text
- ai_moderation_recommended_status text
- ai_moderation_score numeric
- ai_moderation_labels text[]
- ai_moderation_reason text
- ip_hash text
- user_agent_hash text
- created_at timestamptz
- updated_at timestamptz
- reviewed_by text null
- review_note text null
- reviewed_at timestamptz null
```

约束：

- `parent_id` 只允许一层回复。
- `status` 只能是 `pending`、`approved`、`rejected`、`spam`。
- `actor_type` 只能是 `visitor`、`user`、`admin`。
- `visitor_id` 与 `user_id` 至少存在一个，管理员操作除外。

评论状态机：

```text
status = 最终可见状态
pending -> approved
pending -> rejected
pending -> spam
approved -> rejected
approved -> spam
rejected -> approved
spam -> rejected
```

AI 审核不直接改变 `status`，只写入建议字段：

```text
ai_moderation_recommended_status: pending | approved | rejected | spam
ai_moderation_labels: text[]
ai_moderation_score: numeric
ai_moderation_reason: text
```

人工审核审计字段：

```text
reviewed_by text null
review_note text null
reviewed_at timestamptz null
```

### 8.4 Analytics

```text
article_view_events
- id uuid pk
- article_slug text
- visitor_id uuid null
- user_id uuid null
- ip_hash text
- user_agent_hash text
- referrer text null
- viewed_at timestamptz
```

```text
article_view_daily_stats
- article_slug text
- stat_date date
- pv_count int
- uv_count int
- created_at timestamptz
- updated_at timestamptz
- primary key(article_slug, stat_date)
```

### 8.5 AI

```text
ai_conversations
- id uuid pk
- scene text
- actor_type text
- visitor_id uuid null
- user_id uuid null
- article_slug text null
- title text null
- created_at timestamptz
- updated_at timestamptz
```

```text
ai_messages
- id uuid pk
- conversation_id uuid fk ai_conversations.id
- role text
- content text
- references jsonb
- created_at timestamptz
```

```text
ai_request_events
- id uuid pk
- scene text
- actor_type text
- visitor_id uuid null
- user_id uuid null
- conversation_id uuid null
- provider text
- model text
- input_chars int
- output_chars int
- prompt_tokens int null
- completion_tokens int null
- latency_ms int
- status text
- error_code text null
- created_at timestamptz
```

```text
rag_query_events
- id uuid pk
- ai_request_event_id uuid null
- query text
- top_k int
- matched_chunk_ids uuid[]
- max_score numeric null
- created_at timestamptz
```

### 8.6 Rate Limit / Budget

第一版先使用 Postgres，不引入 Redis。

```text
rate_limit_buckets
- bucket_key text pk
- count int
- reset_at timestamptz
- updated_at timestamptz
```

```text
daily_budget_usage
- usage_date date
- scene text
- request_count int
- estimated_tokens int
- primary key(usage_date, scene)
```

## 9. API 边界

### 9.1 公开 API

```text
GET  /healthz
GET  /api/v1/healthz
GET  /api/v1/me

POST /api/v1/articles/{slug}/view
GET  /api/v1/articles/{slug}/stats

GET  /api/v1/articles/{slug}/comments
POST /api/v1/articles/{slug}/comments

POST /api/v1/ai/chat/stream
POST /api/v1/ai/advisor/stream
POST /api/v1/ai/article/{slug}/stream
```

最小请求/响应契约：

```text
POST /api/v1/articles/{slug}/view
Request: { referrer?: string }
Response: { article_slug: string, pv: number, uv: number }
Auth: visitor cookie 自动创建
```

```text
GET /api/v1/articles/{slug}/comments?limit=20&cursor=...
Response: { items: Comment[], next_cursor: string | null }
Visibility: 只返回 approved 评论
```

```text
POST /api/v1/articles/{slug}/comments
Request: { parent_id?: string, display_name: string, email?: string, content_markdown: string, turnstile_token: string }
Response: { id: string, status: "pending", message: string }
Auth: visitor 或 user；匿名允许
```

```text
POST /api/v1/ai/advisor/stream
Request: { message: string, conversation_id?: string, entrypoint: "home" | "article" | "author", article_slug?: string, turnstile_token: string }
SSE events: answer-delta, references, usage, error, done
Response stream references: [{ title: string, url: string, source_type: string, heading?: string }]
```

```text
POST /api/v1/ai/chat/stream
Request: { message: string, conversation_id?: string, turnstile_token: string }
SSE events: answer-delta, references, usage, error, done
```

### 9.2 兼容现有 Worker API

```text
POST /api/ai/chat/stream
```

该入口接收现有前端请求体，并继续支持 `scene` 路由：

```text
recommend
article
author
briefing-recommend
investment-briefing-recommend
```

### 9.3 管理 API

```text
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout
GET  /api/v1/admin/me

GET  /api/v1/admin/comments
POST /api/v1/admin/comments/{id}/approve
POST /api/v1/admin/comments/{id}/reject
POST /api/v1/admin/comments/{id}/mark-spam

GET  /api/v1/admin/analytics/overview
GET  /api/v1/admin/analytics/articles
GET  /api/v1/admin/ai-usage/overview
GET  /api/v1/admin/system/status
```

管理 API 契约：

```text
POST /api/v1/admin/auth/login
Request: { password: string, csrf_token: string, turnstile_token?: string }
Response: { ok: true }
Security: Origin + CSRF + rate limit；连续失败后临时锁定 bucket
```

```text
GET /api/v1/admin/comments?status=pending&limit=50&cursor=...
Response: { items: AdminComment[], next_cursor: string | null }
Auth: admin_session
```

```text
POST /api/v1/admin/comments/{id}/approve|reject|mark-spam
Request: { review_note?: string, csrf_token: string }
Response: { id: string, status: string }
Security: admin_session + Origin + CSRF
```

```text
GET /api/v1/admin/system/status
Response: { api: "ok" | "degraded", db: "ok" | "degraded", rag_documents: number, rag_chunks: number, last_rag_sync: RagSyncRun | null }
```

### 9.4 预留微信登录 API

```text
GET  /api/v1/auth/wechat/start
GET  /api/v1/auth/wechat/callback
POST /api/v1/auth/logout
```

第一版未配置微信开放平台凭证时，`/api/v1/auth/wechat/start` 返回 `501 not_configured`。

## 10. 关键数据流

### 10.1 文章阅读统计

```text
用户打开文章
  -> 前端 POST /api/v1/articles/{slug}/view
  -> core-service 解析或创建 visitor_id
  -> 写 article_view_events
  -> upsert article_view_daily_stats.pv_count
  -> 基于 visitor_id + article_slug + date 做近似 UV 去重
  -> 返回当前 stats
```

### 10.2 评论提交

```text
用户提交评论
  -> Turnstile 校验
  -> actor 解析
  -> Markdown sanitize
  -> AI moderation
  -> 保存 pending 评论
  -> 返回“已提交，审核后展示”
  -> admin-console 审核
  -> approved 后公开展示
```

### 10.3 首页 AI 顾问

```text
用户提问
  -> Turnstile + 限流 + 预算检查
  -> query embedding
  -> pgvector 检索公开 chunks
  -> 构造 advisor prompt
  -> LLM SSE 回答
  -> 保存 conversation / message / usage
  -> 返回 answer + references
```

### 10.4 文章页 AI 顾问

```text
用户在文章页提问
  -> 优先检索当前 article_slug 的 chunks
  -> 资料不足时扩展全站公开 chunks
  -> 回答中区分“当前文章依据”和“延伸依据”
```

### 10.5 RAG 同步

```text
GitHub Actions 检测内容变更
  -> core-service ingestion CLI
  -> 解析文章 / 简报 / 作者资料
  -> upsert knowledge_documents
  -> chunk
  -> 对 hash 变化 chunks 生成 embedding
  -> 删除失效 chunks
  -> 更新 Supabase pgvector
```

### 10.6 管理控制台

```text
admin-console 登录
  -> core-service admin session
  -> 调用 /api/v1/admin/*
  -> 审核评论 / 看统计 / 看 AI 用量 / 看系统状态
```

## 11. Admin Console 设计

`admin-console/` 是独立前端工程，推荐技术栈：Vite + React + TypeScript + Tailwind CSS。

选择 Vite 而非 Next.js 的原因：

- 控制台是纯 SPA，所有数据来自 FastAPI。
- 不需要 SSR。
- 构建快，部署简单。
- 与主博客静态导出逻辑隔离。
- 未来可以部署到独立子域名或挂到 `/admin/`。

第一版部署到 Cloudflare Pages Free，并绑定 `admin.yuanshenjian.cn`。这样管理控制台静态资源不占用 GitHub Pages 主站发布链路，也不消耗 Render Web Service 资源。

管理后台登录防护：

- `/api/v1/admin/auth/login` 必须有独立 rate limit bucket。
- 登录失败连续达到阈值后，按 IP hash 和 admin login bucket 临时锁定。
- 登录接口必须校验 Origin、CSRF 和 Turnstile。
- Cloudflare 可选增加 Access 保护；第一版即使未启用 Cloudflare Access，也必须依赖 FastAPI 的后台 session 校验。

第一版页面：

- `/login`：管理员登录。
- `/comments`：待审核评论列表、批准、拒绝、标记 spam。
- `/analytics`：今日 PV、总 PV、热门文章、最近 7/30 天趋势。
- `/ai-usage`：今日请求数、场景分布、错误率、token/成本估算、热门问题摘要。
- `/system`：API health、DB health、RAG 文档数量、最近一次 RAG sync 时间。

## 12. 安全与隐私

### 12.1 Cookie

- `visitor_id` 使用 HttpOnly、Secure、SameSite=Lax。
- `admin_session` 使用 HttpOnly、Secure、SameSite=Lax。
- session 原文不落库，只保存 hash。

### 12.2 IP 与 User-Agent

- 数据库只保存 `ip_hash` 和 `user_agent_hash`。
- hash 使用服务端 secret pepper。
- 不保存明文 IP。

### 12.3 评论安全

- 禁止原始 HTML。
- Markdown 渲染后必须 sanitize。
- 链接增加安全属性。
- 匿名评论默认审核。
- AI 审核不能替代人工最终审核。

### 12.4 AI 安全

- 所有公开 AI 请求必须限流。
- 所有公开 AI 请求必须经过 Turnstile，或满足服务端定义的低风险豁免策略。
- RAG prompt 必须要求引用来源和资料不足时拒绝编造。
- 不在前端暴露任何 LLM API key。

### 12.5 数据保留与最小化

- `article_view_events` 原始事件默认保留 30 天，之后只保留 `article_view_daily_stats` 聚合数据。
- `referrer` 只保存 origin 或归一化后的来源类型，不保存完整 URL 查询参数。
- `ai_messages.content` 第一版默认保留 30 天；管理员后台默认只展示截断摘要，不展示完整敏感原文。
- `rag_query_events.query` 默认保留 30 天，并只用于质量分析和问题排查。
- 评论内容作为用户主动公开内容保留到被删除或审核拒绝后清理。
- IP 和 User-Agent 只保存带 pepper 的 hash。

### 12.6 预算与熔断优先级

预算按工作负载拆分，不只使用全局阈值：

```text
AI_CHAT_DAILY_REQUEST_LIMIT
AI_ADVISOR_DAILY_REQUEST_LIMIT
AI_MODERATION_DAILY_REQUEST_LIMIT
AI_EMBEDDING_DAILY_TOKEN_LIMIT
AI_GLOBAL_DAILY_TOKEN_LIMIT
```

熔断顺序：

```text
comment moderation AI -> site-chat -> advisor -> legacy recommend/article 场景
```

评论 AI 审核达到预算后，评论仍可进入人工 `pending` 队列；embedding 预算达到上限后，RAG 同步停止生成新 embedding 但不得删除旧 chunk。

## 13. 数据库连接策略

Render 到 Supabase Postgres 使用连接池模式，避免免费实例连接数耗尽。

第一版建议：

- 使用 SQLAlchemy 2 + psycopg 3。
- Web 请求使用小型连接池。
- GitHub Actions 迁移使用 direct connection 或 Supabase 推荐的迁移连接串。
- 在线服务不运行长事务。
- RAG 同步分批提交，避免大事务。

如果使用 Supabase pooler，需要确认 SQLAlchemy 与驱动配置不会依赖长生命周期 prepared statements。

## 14. CI/CD 设计

现有 `.github/workflows/deploy.yml` 继续只负责 GitHub Pages 静态博客部署和 Cloudflare cache purge。

新增工作流：

```text
.github/workflows/core-service-ci.yml
.github/workflows/admin-console-ci.yml
.github/workflows/rag-sync.yml
```

### 14.1 core-service-ci.yml

触发条件：

```text
pull_request:
  paths:
    - core-service/**
    - .github/workflows/core-service-ci.yml

push main:
  paths:
    - core-service/**
    - .github/workflows/core-service-ci.yml
```

流程：

```text
setup Python
install dependencies
ruff check
mypy
pytest
本地 Postgres + pgvector 迁移测试
main 分支执行 expand-only alembic upgrade head 到 Supabase
curl RENDER_DEPLOY_HOOK_URL 触发 Render 部署
部署完成后由 health check 验证新版本
```

生产迁移规则：

- 普通部署只允许 expand-only migration，例如新增表、新增 nullable 字段、新增索引。
- 删除字段、改类型、收紧约束必须走单独人工维护窗口，不混入普通 CI。
- 如果 Render 部署失败，数据库允许保持 expand 后 schema，旧服务必须继续兼容。
- Contract migration 在确认新版本稳定后单独执行。

### 14.2 admin-console-ci.yml

触发条件：

```text
pull_request / push main:
  paths:
    - admin-console/**
    - .github/workflows/admin-console-ci.yml
```

流程：

```text
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
main 分支部署静态控制台
```

### 14.3 rag-sync.yml

触发条件：

```text
push main:
  paths:
    - content/**
    - lib/author-profile-data.js
    - scripts/build-ai-data.js
```

流程：

```text
等待主站内容校验和构建成功
checkout
setup Python
install core-service ingestion dependencies
解析公开内容
upsert documents/chunks
仅对 content_hash 或 embedding_model 变化的 chunk 生成 embedding
更新 Supabase pgvector
记录 sync 结果
```

并发与一致性规则：

- Workflow 使用 `concurrency: rag-sync-production`，同一时间只允许一个生产 RAG 同步运行。
- 同步任务启动时在数据库中获取 advisory lock，获取失败则退出并标记 skipped。
- `rag_sync_runs` 记录每次同步的 commit、状态、文档数、chunk 数和错误信息。
- 内容发布失败时不得更新生产 RAG。
- RAG 同步只 upsert 当前公开内容和删除当前 source 范围内失效 chunk，不删除未知 source_type 数据。

### 14.4 Render 配置

Render Web Service：

```text
Root Directory: core-service
Runtime: Python
Build Command: uv sync --frozen --no-dev
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /healthz
Auto Deploy: Off
```

Render 使用 Deploy Hook 由 GitHub Actions 在测试和迁移成功后触发部署。

## 15. 配置项

`core-service` 环境变量：

```text
APP_ENV
PUBLIC_SITE_URL
ALLOWED_ORIGINS
DATABASE_URL
SESSION_SECRET
ADMIN_SECRET_HASH
TURNSTILE_SECRET_KEY
CHAT_BASE_URL
CHAT_API_KEY
CHAT_MODEL_ID
LLM_PROFILES_JSON
AI_SCENE_PROFILE_MAP
AI_DATA_BASE_URL
EMBEDDING_BASE_URL
EMBEDDING_API_KEY
EMBEDDING_MODEL_ID
EMBEDDING_DIMENSIONS
AI_DAILY_REQUEST_LIMIT
AI_DAILY_TOKEN_LIMIT
AI_CHAT_DAILY_REQUEST_LIMIT
AI_ADVISOR_DAILY_REQUEST_LIMIT
AI_MODERATION_DAILY_REQUEST_LIMIT
AI_EMBEDDING_DAILY_TOKEN_LIMIT
EMERGENCY_DISABLE_AI
WECHAT_APP_ID
WECHAT_APP_SECRET
```

微信环境变量为空时，微信登录接口返回 `501 not_configured`。

`admin-console` 环境变量：

```text
VITE_CORE_SERVICE_URL
```

主博客新增或调整环境变量：

```text
NEXT_PUBLIC_CORE_SERVICE_URL
NEXT_PUBLIC_AI_WORKER_URL
NEXT_PUBLIC_AI_ENABLED
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

迁移期可继续使用 `NEXT_PUBLIC_AI_WORKER_URL` 指向新 `core-service` 兼容入口。

## 16. 迁移策略

### 16.1 阶段一：兼容迁移

- 创建 `core-service/`。
- 实现 `POST /api/ai/chat/stream` 兼容入口。
- 迁移现有 AI 场景 prompt、数据读取、provider、SSE 协议和错误兜底。
- 前端只调整 AI 服务 URL，验证现有 AI 组件不回归。

### 16.2 阶段二：互动能力

- 增加阅读统计 API。
- 增加评论 API。
- 增加评论组件。
- 增加管理控制台评论审核、统计和 AI 用量页面。

### 16.3 阶段三：基础 RAG 与 AI 顾问

- 启用 Supabase `pgvector`。
- 增加公开内容 ingestion。
- 增加 embedding 生成和缓存。
- 增加 AI 顾问入口和 API。
- 首页、文章页、作者页接入 AI 顾问。

### 16.4 阶段四：清理与切换

- `NEXT_PUBLIC_AI_WORKER_URL` 指向 `core-service`。
- 验证线上 AI、评论、统计、后台。
- 保留 `blog-ai-worker` 作为回滚方案一段时间。
- 稳定后归档或删除 `blog-ai-worker`。

## 17. 测试策略

`core-service`：

- 配置解析测试。
- actor/cookie 测试。
- Markdown sanitize 测试。
- 评论提交流程测试。
- 阅读统计去重测试。
- RAG chunk/hash 测试。
- AI provider mock 测试。
- SSE 协议测试。
- Admin API 权限测试。
- Alembic migration 测试。

`admin-console`：

- API client 测试。
- 登录态处理测试。
- 评论审核页面测试。
- 统计页面渲染测试。

主博客：

- AI client 兼容测试。
- 评论组件渲染测试。
- 文章页 view tracking 调用测试。
- 构建与类型检查。

## 18. 验收标准

第一版完成时必须满足：

- 现有 AI 场景在 `core-service` 上可用。
- 现有前端 AI 组件能通过兼容入口正常流式显示。
- 文章页能记录阅读量并展示基础统计。
- 评论区可提交匿名评论，审核前不公开展示。
- 管理控制台可以审核评论。
- AI 顾问可基于公开 RAG 内容回答，并返回引用。
- AI 顾问资料不足时明确说明不能确认。
- GitHub Actions 可验证 `core-service` 和 `admin-console`。
- main 分支后端 CI 成功后可触发 Render deploy hook。
- 内容变更可触发 RAG 同步。
- 所有公开 AI 请求有 Turnstile、限流和预算保护。
