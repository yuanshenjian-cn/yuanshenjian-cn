# Core Service Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 完整交付 `core-service/` FastAPI 后端、`admin-console/` 管理控制台、主博客接入和 CI/CD，使现有 AI Worker 能力平滑迁移，并新增阅读统计、评论、基础 RAG 与 AI 顾问。

**Architecture:** `core-service` 是唯一业务后端，负责身份、评论、统计、AI Gateway、RAG、后台 API 和内容同步；`admin-console` 是独立 Vite SPA，只通过后台 API 操作；主博客继续静态导出，通过 `api.yuanshenjian.cn`、`credentials: 'include'` 和兼容 AI 入口接入。

**Tech Stack:** FastAPI、SQLAlchemy 2、Alembic、PostgreSQL/Supabase、pgvector、httpx、pytest、Vite、React、TypeScript、Tailwind CSS、GitHub Actions、Render Deploy Hook、Cloudflare Pages。

---

## V1 覆盖矩阵

| 需求 | 实现任务 | 验证方式 |
| --- | --- | --- |
| 现有 AI Worker 五个 scene 等价迁移 | Task 4 | fake provider 覆盖 `recommend/article/author/briefing-recommend/investment-briefing-recommend` SSE 测试 |
| LLM profile、scene map、旧 ai-data 兼容 | Task 4 | profile 解析测试、旧请求体兼容测试 |
| 首页/文章页/作者页 AI 顾问入口 | Task 5、Task 10 | 主站 typecheck、组件测试、手动 smoke |
| Supabase Postgres + pgvector | Task 2、Task 5 | Alembic 迁移、pgvector 扩展检查、RAG dry-run |
| 阅读统计 PV/UV | Task 6、Task 10 | 持久化服务测试、文章页上报测试 |
| 自定义评论与审核 | Task 7、Task 8、Task 10 | 评论提交、公开查询、后台 approve/reject/spam 测试 |
| 管理控制台独立工程 | Task 9 | `npm --prefix admin-console run build` |
| Cookie/CORS/CSRF/Turnstile/限流/预算 | Task 3 | 安全依赖测试、管理 API 权限测试 |
| Render + GitHub Actions CI/CD | Task 11 | workflow lint、后端 CI、Render health smoke |
| 内容变更 RAG 同步 | Task 5、Task 11 | ingestion dry-run、`rag_sync_runs` 记录测试 |

---

## 文件结构

### `core-service/`

- Create: `core-service/pyproject.toml`，Python 项目与工具配置。
- Create: `core-service/requirements.txt`，Render 和 CI 安装入口。
- Create: `core-service/alembic.ini`，Alembic 配置。
- Create: `core-service/app/main.py`，FastAPI app、CORS、路由挂载、健康检查。
- Create: `core-service/app/core/config.py`，环境变量与 LLM profile 配置。
- Create: `core-service/app/core/security.py`，cookie、Origin、CSRF、Turnstile、hash。
- Create: `core-service/app/core/rate_limit.py`，Postgres rate limit 与预算熔断。
- Create: `core-service/app/db/session.py`，SQLAlchemy engine/session。
- Create: `core-service/app/db/models.py`，V1 全量模型。
- Create: `core-service/app/db/migrations/env.py`，迁移环境。
- Create: `core-service/app/db/migrations/versions/0001_initial.py`，初始迁移。
- Create: `core-service/app/schemas/public.py`，公开 API DTO。
- Create: `core-service/app/schemas/admin.py`，后台 API DTO。
- Create: `core-service/app/services/analytics.py`，阅读统计服务。
- Create: `core-service/app/services/comments.py`，评论、Markdown sanitize、AI 审核建议。
- Create: `core-service/app/services/ai_gateway.py`，LLM profile、provider、SSE、legacy scenes。
- Create: `core-service/app/services/rag.py`，embedding、检索、引用与顾问回答上下文。
- Create: `core-service/app/services/ingestion.py`，公开内容同步 CLI。
- Create: `core-service/app/api/public.py`，公开 API。
- Create: `core-service/app/api/admin.py`，管理 API。
- Create: `core-service/app/api/compat.py`，`/api/ai/chat/stream` 兼容入口。
- Create: `core-service/tests/*.py`，后端测试。

### `admin-console/`

- Create: `admin-console/package.json`，Vite 工程脚本。
- Create: `admin-console/tsconfig.json`、`admin-console/vite.config.ts`，构建配置。
- Create: `admin-console/index.html`，SPA 入口。
- Create: `admin-console/src/main.tsx`，React mount。
- Create: `admin-console/src/api/client.ts`，GET/POST API client、CSRF、`credentials: 'include'`。
- Create: `admin-console/src/App.tsx`，极简路由。
- Create: `admin-console/src/pages/LoginPage.tsx`，管理员登录。
- Create: `admin-console/src/pages/CommentsPage.tsx`，评论审核。
- Create: `admin-console/src/pages/AnalyticsPage.tsx`，阅读统计。
- Create: `admin-console/src/pages/AiUsagePage.tsx`，AI 用量。
- Create: `admin-console/src/pages/SystemPage.tsx`，系统状态。
- Create: `admin-console/src/styles.css`，基础样式。

### 现有主博客

- Modify: `lib/config.ts`，增加 `NEXT_PUBLIC_CORE_SERVICE_URL`。
- Modify: `lib/ai-client.ts`，AI URL 优先使用 core service，保留 worker URL 兼容。
- Create: `lib/core-service-client.ts`，阅读统计与评论 API client。
- Create: `components/article-view-tracker.tsx`，文章阅读上报。
- Create: `components/comments/comment-section.tsx`，自定义评论区。
- Modify: `components/article-content.tsx`，以自定义评论替代 Giscus 展示位置。
- Modify: `app/articles/[slug]/page.tsx`，传入 canonical `post.slug`，避免 `/articles/latest` 统计错归档。
- Modify: `app/page.tsx`，首页 AI 顾问入口。
- Modify: `app/author/page.tsx`，作者页 AI 顾问入口。
- Modify: `components/ai/ai-recommend-widget.tsx`、`components/ai/page-ai-assistant-provider.tsx`、`types/ai.ts`，支持 advisor/site-chat 场景和新 URL。
- Modify: `.github/workflows/deploy.yml`，构建时注入 `NEXT_PUBLIC_CORE_SERVICE_URL`。
- Modify: `.env.example`，补充 Core Service 与 Admin Console 变量。

### CI/CD

- Create: `.github/workflows/core-service-ci.yml`，后端测试、迁移校验、Render deploy hook 和 health smoke。
- Create: `.github/workflows/admin-console-ci.yml`，管理控制台 typecheck/build 和 Cloudflare Pages 部署入口。
- Create: `.github/workflows/rag-sync.yml`，公开内容变更后的 RAG 同步。

---

## Task 1: 后端工程骨架

**Files:**
- Create: `core-service/pyproject.toml`
- Create: `core-service/requirements.txt`
- Create: `core-service/app/main.py`
- Create: `core-service/app/core/config.py`
- Test: `core-service/tests/test_health.py`

- [ ] **Step 1: 写健康检查测试**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_healthz_returns_ok() -> None:
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: 创建依赖配置**

```toml
[project]
name = "core-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic-settings>=2.4.0",
  "sqlalchemy>=2.0.0",
  "asyncpg>=0.30.0",
  "aiosqlite>=0.20.0",
  "alembic>=1.13.0",
  "httpx>=0.27.0",
  "python-frontmatter>=1.1.0",
  "markdown-it-py>=3.0.0",
  "bleach>=6.1.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.3.0", "ruff>=0.6.0", "mypy>=1.11.0"]

[tool.ruff]
line-length = 100

[tool.mypy]
python_version = "3.12"
strict = true
```

- [ ] **Step 3: 创建配置对象**

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    public_site_url: str = "https://yuanshenjian.cn"
    allowed_origins_raw: str = Field(default="https://yuanshenjian.cn,http://localhost:3000")
    database_url: str = "sqlite+aiosqlite:///:memory:"
    session_secret: str = "dev-session-secret"
    turnstile_secret_key: str = ""
    llm_profiles_json: str = "[]"
    ai_scene_profile_map: str = "{}"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]


settings = Settings()
```

- [ ] **Step 4: 创建 FastAPI app**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(title="Blog Core Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 5: 运行测试**

Run: `pytest core-service/tests/test_health.py -q`

Expected: `1 passed`

---

## Task 2: V1 全量数据库模型与迁移

**Files:**
- Create: `core-service/app/db/session.py`
- Create: `core-service/app/db/models.py`
- Create: `core-service/alembic.ini`
- Create: `core-service/app/db/migrations/env.py`
- Create: `core-service/app/db/migrations/versions/0001_initial.py`
- Test: `core-service/tests/test_models.py`

- [ ] **Step 1: 写 schema 覆盖测试**

```python
from app.db.models import Base, Comment, KnowledgeChunk, KnowledgeDocument, RagSyncRun


def test_v1_schema_contains_required_tables() -> None:
    required = {
        "visitors", "users", "auth_identities", "admin_sessions",
        "knowledge_documents", "knowledge_chunks", "rag_sync_runs",
        "comments", "article_view_events", "article_view_daily_stats",
        "ai_conversations", "ai_messages", "ai_request_events", "rag_query_events",
        "rate_limit_buckets", "daily_budget_usage",
    }
    assert required.issubset(Base.metadata.tables.keys())


def test_knowledge_upsert_constraints_exist() -> None:
    doc_constraints = {constraint.name for constraint in KnowledgeDocument.__table__.constraints}
    chunk_constraints = {constraint.name for constraint in KnowledgeChunk.__table__.constraints}
    assert "uq_knowledge_documents_source" in doc_constraints
    assert "uq_knowledge_chunks_document_index" in chunk_constraints


def test_comment_review_and_ai_moderation_fields_exist() -> None:
    columns = set(Comment.__table__.columns.keys())
    assert {"visitor_id", "user_id", "ip_hash", "user_agent_hash"}.issubset(columns)
    assert {"ai_moderation_recommended_status", "reviewed_by", "reviewed_at"}.issubset(columns)


def test_rag_sync_run_tracks_result() -> None:
    columns = set(RagSyncRun.__table__.columns.keys())
    assert {"status", "commit_sha", "documents_seen", "chunks_upserted", "error_message"}.issubset(columns)
```

- [ ] **Step 2: 实现 V1 全量模型**

实现 `models.py` 时必须包含以下表和约束：

```text
visitors: id, visitor_key_hash unique, first_seen_at, last_seen_at, risk_score
users: id, display_name, avatar_url, status
auth_identities: user_id, provider, provider_subject, provider_unionid, raw_profile
admin_sessions: session_hash unique, expires_at, last_seen_at
knowledge_documents: unique(source_type, source_id), slug, title, url, visibility, content_hash
knowledge_chunks: unique(document_id, chunk_index), content, content_hash, embedding_model, embedding
rag_sync_runs: status, commit_sha, counts, error_message
comments: article_slug, parent_id, actor fields, markdown/html, status, AI moderation fields, review fields
article_view_events: article_slug, actor fields, ip_hash, user_agent_hash, referrer_origin
article_view_daily_stats: primary key(article_slug, stat_date), pv_count, uv_count
ai_conversations: scene, actor fields, article_slug, title
ai_messages: conversation_id, role, content, references
ai_request_events: scene, actor fields, provider, model, tokens, latency, status, error_code
rag_query_events: query, top_k, matched_chunk_ids, max_score
rate_limit_buckets: bucket_key primary key, count, reset_at
daily_budget_usage: primary key(usage_date, scene), request_count, estimated_tokens
```

`knowledge_chunks.embedding` 在 Postgres 中使用 `vector` 类型；测试环境允许使用 nullable text 替代，以便不依赖本地 pgvector。

- [ ] **Step 3: 实现 Alembic 初始迁移**

迁移必须执行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

迁移必须创建所有 V1 表、唯一约束、状态 check 约束和基础索引。向量索引使用 `ivfflat` 或 `hnsw`，若 Supabase 当前版本不支持目标索引，则保留普通索引并在迁移注释中说明。

- [ ] **Step 4: 运行模型测试与迁移校验**

Run: `pytest core-service/tests/test_models.py -q`

Expected: `4 passed`

Run: `alembic -c core-service/alembic.ini upgrade head`

Expected: 本地测试数据库迁移成功。

---

## Task 3: 安全、身份、限流与预算

**Files:**
- Create: `core-service/app/core/security.py`
- Create: `core-service/app/core/rate_limit.py`
- Modify: `core-service/app/api/admin.py`
- Test: `core-service/tests/test_security.py`

- [ ] **Step 1: 写安全行为测试**

```python
from app.core.security import create_secret_token, hash_with_pepper, verify_origin
from app.core.rate_limit import InMemoryRateLimiter


def test_hash_with_pepper_is_stable_and_not_plaintext() -> None:
    value = hash_with_pepper("127.0.0.1", "pepper")
    assert value == hash_with_pepper("127.0.0.1", "pepper")
    assert value != "127.0.0.1"


def test_origin_must_be_allowed() -> None:
    verify_origin("https://yuanshenjian.cn", ["https://yuanshenjian.cn"])


def test_rate_limiter_rejects_after_limit() -> None:
    limiter = InMemoryRateLimiter(limit=2)
    assert limiter.hit("visitor:a") is True
    assert limiter.hit("visitor:a") is True
    assert limiter.hit("visitor:a") is False


def test_secret_token_has_enough_entropy() -> None:
    assert len(create_secret_token()) >= 43
```

- [ ] **Step 2: 实现请求安全依赖**

必须实现：

```text
ensure_visitor_cookie(response, request): 没有 visitor_id 时签发 HttpOnly cookie
require_allowed_origin(request): mutation 请求 Origin 校验
require_csrf(request): admin mutation 校验 csrf cookie/header 双提交
verify_turnstile(token, expected_action, remote_ip): 校验 success、hostname、action
hash_ip_and_user_agent(request): 只返回 hash，不返回明文
```

- [ ] **Step 3: 实现限流与预算**

必须实现：

```text
check_rate_limit(bucket_key, limit, window_seconds)
record_daily_budget(scene, estimated_tokens)
ensure_ai_budget(scene)
EMERGENCY_DISABLE_AI=true 时所有公开 AI 返回 503
```

预算优先级按设计文档执行：先熔断评论 AI 审核，再熔断 site-chat，再熔断 advisor，最后熔断 legacy scene。

- [ ] **Step 4: 运行安全测试**

Run: `pytest core-service/tests/test_security.py -q`

Expected: `4 passed`

---

## Task 4: AI Worker 等价迁移

**Files:**
- Create: `core-service/app/services/ai_gateway.py`
- Create: `core-service/app/api/compat.py`
- Modify: `core-service/app/api/public.py`
- Test: `core-service/tests/test_ai_gateway.py`

- [ ] **Step 1: 写 legacy scene 覆盖测试**

```python
import pytest

from app.services.ai_gateway import build_legacy_prompt, resolve_scene_profile


@pytest.mark.parametrize("scene", [
    "recommend", "article", "author", "briefing-recommend", "investment-briefing-recommend",
])
def test_build_legacy_prompt_supports_all_existing_scenes(scene: str) -> None:
    prompt = build_legacy_prompt(scene=scene, message="测试", context={"title": "标题", "content": "正文"})
    assert "测试" in prompt
    assert "正文" in prompt or scene == "recommend"


def test_scene_profile_map_resolves_specific_profile() -> None:
    profile_id = resolve_scene_profile("advisor", {"advisor": "advisor-profile"}, default="default")
    assert profile_id == "advisor-profile"
```

- [ ] **Step 2: 实现 LLM profile 与 provider**

必须实现：

```text
LLMProfile(id, provider, base_url, model, api_key_env, temperature, max_tokens)
parse_llm_profiles(settings.llm_profiles_json)
resolve_scene_profile(scene, scene_map, default)
OpenAICompatibleProvider.stream_chat(messages)
```

`stream_chat` 接收 OpenAI-compatible chat completions stream，输出内部统一 delta 流，并解析 usage。

- [ ] **Step 3: 实现旧数据源适配**

必须实现：

```text
load_ai_index(): 读取 AI_DATA_BASE_URL 或仓库 public/ai-data/index.json
load_article_ai_data(slug): 读取 public/ai-data/articles/{slug}.json
load_author_ai_data(): 读取 public/ai-data/author.json
load_briefing_index(kind): 读取 public/ai-data/briefings/index.json 或投资简报索引
```

旧场景兼容阶段优先使用 `public/ai-data`，RAG 只服务 `advisor` 和 `site-chat`。

- [ ] **Step 4: 实现五个旧 scene prompt 与 fallback**

必须实现：

```text
recommend: 根据 index posts 构建推荐上下文，返回 references
article: 根据 article slug 构建单篇问答上下文
author: 根据 author profile 构建作者问答上下文
briefing-recommend: 根据 AI 简报索引构建推荐上下文
investment-briefing-recommend: 根据投资简报索引构建推荐上下文
```

当上游 LLM 失败时，返回 scene 专属错误 SSE：`event: error`，不得泄露 provider 原始错误。

- [ ] **Step 5: 实现兼容 SSE 入口**

必须实现：

```text
POST /api/ai/chat/stream
POST /api/v1/ai/chat/stream
SSE events: answer-delta, references, usage, error, done
```

旧请求体字段、Turnstile token、scene 路由必须兼容当前前端。

- [ ] **Step 6: 运行 AI Gateway 测试**

Run: `pytest core-service/tests/test_ai_gateway.py -q`

Expected: legacy scene、profile、SSE 编码全部通过。

---

## Task 5: 基础 RAG、AI 顾问与内容同步

**Files:**
- Create: `core-service/app/services/rag.py`
- Create: `core-service/app/services/ingestion.py`
- Modify: `core-service/app/api/public.py`
- Test: `core-service/tests/test_rag.py`

- [ ] **Step 1: 写 RAG 基础测试**

```python
from app.services.ingestion import canonical_source_id, chunk_text, content_hash, should_ingest_frontmatter
from app.services.rag import build_advisor_prompt


def test_content_hash_is_stable() -> None:
    assert content_hash("hello") == content_hash("hello")
    assert content_hash("hello") != content_hash("world")


def test_unpublished_content_is_not_ingested() -> None:
    assert should_ingest_frontmatter({"published": False}) is False
    assert should_ingest_frontmatter({"title": "公开", "date": "2026-01-01"}) is True


def test_canonical_source_id_uses_slug() -> None:
    assert canonical_source_id("article", "hello-world") == "article:hello-world"


def test_advisor_prompt_requires_citations() -> None:
    prompt = build_advisor_prompt("怎么学 TDD", ["资料 A"])
    assert "资料不足" in prompt
    assert "引用" in prompt
```

- [ ] **Step 2: 实现 canonical ingestion**

必须实现：

```text
ingest content/blog/** 中 published != false 的文章
ingest content/ai-briefings/** 中 published != false 的简报
ingest content/investment-briefings/** 中 published != false 的简报
ingest lib/author-profile-data.js 派生的作者资料
不把 public/ai-data/** 作为 RAG canonical 输入
```

- [ ] **Step 3: 实现 embedding 与向量检索**

必须实现：

```text
OpenAICompatibleEmbeddingClient.embed(texts)
upsert knowledge_documents by unique(source_type, source_id)
upsert knowledge_chunks by unique(document_id, chunk_index)
仅 content_hash 或 embedding_model 变化时重新生成 embedding
query_top_chunks(query, filters, top_k)
```

- [ ] **Step 4: 实现 `rag_sync_runs` 与 advisory lock**

必须实现：

```text
sync start: insert rag_sync_runs(status='running', commit_sha)
sync lock: pg_try_advisory_lock(hashtext('rag_sync_public_content'))
sync success: status='success', finished_at, counts
sync failure: status='failed', error_message, finished_at
```

- [ ] **Step 5: 实现 AI 顾问 API**

必须实现：

```text
POST /api/v1/ai/advisor/stream
Request: message, conversation_id, entrypoint, article_slug, turnstile_token
Flow: Turnstile -> rate limit -> budget -> embedding -> vector search -> prompt -> LLM stream -> references -> usage
SSE events: answer-delta, references, usage, error, done
```

- [ ] **Step 6: 运行 RAG 测试**

Run: `pytest core-service/tests/test_rag.py -q`

Expected: RAG hash、published 过滤、prompt、sync run 测试全部通过。

---

## Task 6: 阅读统计持久化

**Files:**
- Create: `core-service/app/services/analytics.py`
- Modify: `core-service/app/api/public.py`
- Test: `core-service/tests/test_analytics.py`

- [ ] **Step 1: 写阅读统计测试**

```python
from app.services.analytics import DailyArticleStats


def test_daily_stats_counts_pv_and_unique_visitors() -> None:
    stats = DailyArticleStats(article_slug="hello")
    stats.record_view("visitor-a")
    stats.record_view("visitor-a")
    stats.record_view("visitor-b")
    assert stats.pv_count == 3
    assert stats.uv_count == 2
```

- [ ] **Step 2: 实现持久化服务**

必须实现：

```text
record_view(slug, actor, ip_hash, user_agent_hash, referrer_origin)
写 article_view_events
按 article_slug + date upsert article_view_daily_stats.pv_count
按 visitor_id/user_id + article_slug + date 做近似 UV 去重
get_article_stats(slug)
get_admin_overview()
get_top_articles(days)
```

- [ ] **Step 3: 实现公开 API**

```text
POST /api/v1/articles/{slug}/view
GET /api/v1/articles/{slug}/stats
```

`POST /view` 必须自动创建 visitor cookie，并返回 `{ article_slug, pv, uv }`。

- [ ] **Step 4: 运行测试**

Run: `pytest core-service/tests/test_analytics.py -q`

Expected: PV/UV 与 API 行为测试全部通过。

---

## Task 7: 评论、AI 审核建议与公开查询

**Files:**
- Create: `core-service/app/services/comments.py`
- Modify: `core-service/app/api/public.py`
- Test: `core-service/tests/test_comments.py`

- [ ] **Step 1: 写评论服务测试**

```python
from app.services.comments import ensure_one_level_reply, render_safe_markdown


def test_render_safe_markdown_removes_script() -> None:
    html = render_safe_markdown("hello <script>alert(1)</script> **world**")
    assert "script" not in html.lower()
    assert "<strong>world</strong>" in html


def test_reply_depth_rejects_reply_to_reply() -> None:
    assert ensure_one_level_reply(parent_has_parent=False) is True
    assert ensure_one_level_reply(parent_has_parent=True) is False
```

- [ ] **Step 2: 实现评论提交**

必须实现：

```text
POST /api/v1/articles/{slug}/comments
校验 Origin、Turnstile、rate limit
Markdown render + bleach sanitize
匿名评论默认 status='pending'
保存 actor_type、visitor_id/user_id、ip_hash、user_agent_hash
parent_id 只允许一级回复
调用 AI moderation，预算不足时跳过 AI 并保留 pending
```

- [ ] **Step 3: 实现公开评论查询**

必须实现：

```text
GET /api/v1/articles/{slug}/comments?limit=20&cursor=...
只返回 approved 评论
返回一级评论和其 approved 回复
按 created_at 升序或降序稳定分页
```

- [ ] **Step 4: 实现 AI moderation 建议**

必须实现：

```text
moderate_comment(content): 返回 recommended_status, score, labels, reason
AI 失败时 recommended_status='pending'，reason='moderation_unavailable'
AI 不直接改变最终 status
```

- [ ] **Step 5: 运行测试**

Run: `pytest core-service/tests/test_comments.py -q`

Expected: Markdown、安全状态机、公开查询、AI 建议测试全部通过。

---

## Task 8: 管理 API

**Files:**
- Create: `core-service/app/api/admin.py`
- Modify: `core-service/app/services/comments.py`
- Modify: `core-service/app/services/analytics.py`
- Test: `core-service/tests/test_admin_api.py`

- [ ] **Step 1: 写后台权限测试**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_admin_comments_requires_session() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/admin/comments")
    assert response.status_code in {401, 403}
```

- [ ] **Step 2: 实现管理员登录**

必须实现：

```text
POST /api/v1/admin/auth/login
校验 Origin、CSRF、Turnstile、admin login rate limit
用 ADMIN_SECRET_HASH 验证密码
写 admin_sessions.session_hash
签发 admin_session HttpOnly cookie
```

- [ ] **Step 3: 实现评论审核 API**

必须实现：

```text
GET /api/v1/admin/comments?status=pending&limit=50&cursor=...
POST /api/v1/admin/comments/{id}/approve
POST /api/v1/admin/comments/{id}/reject
POST /api/v1/admin/comments/{id}/mark-spam
写 reviewed_by、review_note、reviewed_at
```

- [ ] **Step 4: 实现统计、AI 用量、系统状态 API**

必须实现：

```text
GET /api/v1/admin/analytics/overview
GET /api/v1/admin/analytics/articles
GET /api/v1/admin/ai-usage/overview
GET /api/v1/admin/system/status
system/status 返回 api、db、rag_documents、rag_chunks、last_rag_sync
```

- [ ] **Step 5: 运行后台 API 测试**

Run: `pytest core-service/tests/test_admin_api.py -q`

Expected: 权限、登录、审核、系统状态测试全部通过。

---

## Task 9: Admin Console 完整 SPA

**Files:**
- Create: `admin-console/package.json`
- Create: `admin-console/tsconfig.json`
- Create: `admin-console/vite.config.ts`
- Create: `admin-console/index.html`
- Create: `admin-console/src/main.tsx`
- Create: `admin-console/src/api/client.ts`
- Create: `admin-console/src/App.tsx`
- Create: `admin-console/src/pages/LoginPage.tsx`
- Create: `admin-console/src/pages/CommentsPage.tsx`
- Create: `admin-console/src/pages/AnalyticsPage.tsx`
- Create: `admin-console/src/pages/AiUsagePage.tsx`
- Create: `admin-console/src/pages/SystemPage.tsx`
- Create: `admin-console/src/styles.css`

- [ ] **Step 1: 创建 Vite 工程配置**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: 实现 API client**

必须实现：

```text
adminGet(path): credentials include
adminPost(path, body): credentials include + X-CSRF-Token
login(password): POST /api/v1/admin/auth/login
fetchComments(status): GET /api/v1/admin/comments
reviewComment(id, action, note): approve/reject/mark-spam
fetchOverview(), fetchAiUsage(), fetchSystemStatus()
```

- [ ] **Step 3: 实现五个页面**

必须实现：

```text
/login: 密码输入、错误提示、登录成功后进入 /comments
/comments: pending 列表、AI 标签、批准、拒绝、spam
/analytics: 今日 PV、总 PV、热门文章
/ai-usage: 今日请求数、按 scene 分组、错误率
/system: API/DB/RAG 状态、最近 sync run
```

- [ ] **Step 4: 构建控制台**

Run: `npm --prefix admin-console run typecheck && npm --prefix admin-console run build`

Expected: TypeScript 和 Vite 构建成功。

---

## Task 10: 主博客真实挂点集成

**Files:**
- Modify: `lib/config.ts`
- Modify: `lib/ai-client.ts`
- Create: `lib/core-service-client.ts`
- Create: `components/article-view-tracker.tsx`
- Create: `components/comments/comment-section.tsx`
- Modify: `components/article-content.tsx`
- Modify: `app/articles/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/author/page.tsx`
- Modify: `components/ai/ai-recommend-widget.tsx`
- Modify: `components/ai/page-ai-assistant-provider.tsx`
- Modify: `types/ai.ts`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.env.example`

- [ ] **Step 1: 配置 Core Service URL**

`lib/config.ts` 增加：

```typescript
coreServiceUrl: process.env.NEXT_PUBLIC_CORE_SERVICE_URL || process.env.NEXT_PUBLIC_AI_WORKER_URL || "",
```

`.github/workflows/deploy.yml` 的 Build env 增加：

```yaml
NEXT_PUBLIC_CORE_SERVICE_URL: ${{ vars.NEXT_PUBLIC_CORE_SERVICE_URL }}
```

- [ ] **Step 2: 更新 AI client**

必须实现：

```text
AI stream URL 优先使用 NEXT_PUBLIC_CORE_SERVICE_URL
保留 NEXT_PUBLIC_AI_WORKER_URL 回退
所有 fetch 设置 credentials: 'include'
advisor/site-chat/article 场景类型进入 types/ai.ts
```

- [ ] **Step 3: 接入阅读统计**

必须实现：

```text
ArticleViewTracker 使用 post.slug，不使用路由参数 slug
/articles/latest 解析到真实 post.slug 后上报
POST /api/v1/articles/{post.slug}/view
```

- [ ] **Step 4: 替换文章页评论区**

必须实现：

```text
components/article-content.tsx 不再默认挂载 GiscusCommentsContainer
CommentSection 拉取 approved 评论
匿名提交评论后展示 pending 提示
Turnstile site key 通过现有 NEXT_PUBLIC_TURNSTILE_SITE_KEY 使用
```

- [ ] **Step 5: 接入首页、文章页、作者页 AI 顾问入口**

必须实现：

```text
app/page.tsx 首页增加 advisor 主入口
文章页 assistant 请求带 entrypoint='article' 和 article_slug=post.slug
app/author/page.tsx 作者页 assistant 请求带 entrypoint='author'
保留现有 recommend widget，不破坏旧入口
```

- [ ] **Step 6: 运行主站验证**

Run: `npm run typecheck && npm run lint && npm run test && npm run build:prod`

Expected: 全部通过。

---

## Task 11: CI/CD、Render、Cloudflare Pages 与 RAG Sync

**Files:**
- Create: `.github/workflows/core-service-ci.yml`
- Create: `.github/workflows/admin-console-ci.yml`
- Create: `.github/workflows/rag-sync.yml`
- Create: `core-service/render.example.yaml`

- [ ] **Step 1: 后端 CI**

必须实现：

```text
setup Python 3.12
pip install -r core-service/requirements.txt
ruff check core-service/app core-service/tests
mypy core-service/app
pytest core-service/tests -q
启动临时 Postgres + pgvector 服务
alembic -c core-service/alembic.ini upgrade head
main 分支 curl RENDER_DEPLOY_HOOK_URL
部署后 curl https://api.yuanshenjian.cn/healthz
```

- [ ] **Step 2: Render 配置示例**

`core-service/render.example.yaml` 必须包含：

```yaml
services:
  - type: web
    name: blog-core-service
    runtime: python
    rootDir: core-service
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /healthz
    autoDeployTrigger: off
```

- [ ] **Step 3: 管理控制台 CI**

必须实现：

```text
npm ci --prefix admin-console
npm --prefix admin-console run typecheck
npm --prefix admin-console run build
main 分支使用 Cloudflare Pages 项目发布 admin-console/dist
```

- [ ] **Step 4: RAG sync workflow**

必须实现：

```text
触发 paths: content/**, lib/author-profile-data.js, scripts/build-ai-data.js
concurrency: rag-sync-production
等待主站 build job 成功，或独立执行 npm run validate-content
pip install -r core-service/requirements.txt
python -m app.services.ingestion --commit-sha $GITHUB_SHA
ingestion 内部使用 pg advisory lock
写 rag_sync_runs
```

- [ ] **Step 5: workflow 验证**

Run: `git diff --check`

Expected: 无尾随空格。

Run: `npm run build:prod`

Expected: 主站生产构建成功。

---

## Task 12: 端到端验收

**Files:**
- Modify: 本计划涉及的全部文件。

- [ ] **Step 1: 后端验收**

Run: `pytest core-service/tests -q`

Expected: 全部通过。

- [ ] **Step 2: 后端静态检查**

Run: `ruff check core-service/app core-service/tests && mypy core-service/app`

Expected: 全部通过。

- [ ] **Step 3: 管理控制台验收**

Run: `npm --prefix admin-console run typecheck && npm --prefix admin-console run build`

Expected: 构建成功。

- [ ] **Step 4: 主博客验收**

Run: `npm run typecheck && npm run lint && npm run test && npm run build:prod`

Expected: 全部通过。

- [ ] **Step 5: 手动 smoke 场景**

```text
GET /healthz 返回 {status:'ok'}
POST /api/ai/chat/stream 对五个 legacy scene 返回 SSE
POST /api/v1/ai/advisor/stream 返回 answer-delta 与 references
POST /api/v1/articles/{slug}/view 返回 pv/uv
POST /api/v1/articles/{slug}/comments 返回 pending
GET /api/v1/articles/{slug}/comments 只返回 approved
admin-console 可登录、审核评论、查看统计、AI 用量和系统状态
/articles/latest 上报真实 post.slug
```

---

## 自审结果

- 计划覆盖设计文档 V1 范围，并通过覆盖矩阵关联到任务和验证方式。
- 原先 contract/mock 风险已改为真实服务、持久化、API、前端和 CI/CD 闭环。
- 计划明确当前仓库真实挂点：`components/article-content.tsx`、`app/page.tsx`、`app/author/page.tsx`、`app/articles/[slug]/page.tsx`、`.github/workflows/deploy.yml`。
- 计划将 `public/ai-data/**` 限定为 legacy AI 兼容数据源，不作为 RAG canonical 输入。
