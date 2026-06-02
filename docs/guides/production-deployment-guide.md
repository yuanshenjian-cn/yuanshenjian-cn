# 生产部署配置指南

本文说明当前博客在只有 `local` 和 `production` 两个环境时，如何配置 GitHub Pages、Render、Supabase、Vercel 和 GitHub Actions。

## 部署拓扑

| 模块 | 平台 | 说明 |
|---|---|---|
| 主站 `site/` | GitHub Pages | 静态站点，域名 `yuanshenjian.cn` |
| 后端 `core-service/` | Render Web Service | FastAPI，连接 Supabase Postgres |
| 数据库 | Supabase Postgres | 生产数据库，启用 `vector` 扩展 |
| 管理后台 `admin-console/` | Vercel | Vite SPA，调用 Render 后端 API |

## 环境命名

当前只使用两个运行环境：

| 环境 | `APP_ENV` | 配置来源 |
|---|---|---|
| 本地 | `local` | `core-service/.env.local`、`core-service/app/application.yml` |
| 生产 | `production` | Render Env、Vercel Env、GitHub Actions Variables / Secrets |

本地不要再使用 `development`。如果需要本地私有变量，复制：

```bash
cp core-service/.env.example core-service/.env.local
```

## GitHub Pages 主站

GitHub 仓库设置：

| 设置项 | 值 |
|---|---|
| Pages Source | GitHub Actions |
| Custom domain | `yuanshenjian.cn` |
| Enforce HTTPS | 开启 |

GitHub Actions Variables：

| Name | 示例值 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://yuanshenjian.cn` | 主站公网地址 |
| `NEXT_PUBLIC_CORE_SERVICE_URL` | `https://api.yuanshenjian.cn` | Render 后端公网地址 |
| `NEXT_PUBLIC_AI_ENABLED` | `true` | 是否启用 AI 入口 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile Site Key | 前端公开 key |
| `CLOUDFLARE_ZONE_ID` | Zone ID | 可选，用于缓存清理 |
| `CORE_SERVICE_HEALTH_URL` | `https://api.yuanshenjian.cn/healthz` | 可选，后端健康检查 |

GitHub Actions Secrets：

| Name | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 可选，用于部署后清理 Cloudflare 缓存 |
| `RENDER_DEPLOY_HOOK_URL` | 可选，用于 core-service CI 通过后触发 Render 部署 |

主站当前验证方式：

```bash
just build-site-prod
```

构建通过后应存在：

```text
site/dist/index.html
site/dist/CNAME
```

## Supabase 数据库

1. 创建 Supabase Project。
2. 在 `Database -> Extensions` 启用 `vector`。
3. 获取 Postgres 连接串。
4. 将连接串改为 SQLAlchemy psycopg 格式。

示例：

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/postgres?sslmode=require
```

注意：

| 项 | 说明 |
|---|---|
| 密码特殊字符 | `@`、`#`、`%`、`:` 等字符需要 URL encode |
| Supabase anon key | 后端直连 Postgres，不需要配置 anon key |
| Supabase service role key | 后端直连 Postgres，不需要配置 service role key |
| 数据迁移 | Render 启动命令会执行 Alembic migration |

## Render 后端

Render Web Service 建议配置：

| 设置项 | 值 |
|---|---|
| Repository | 当前 GitHub 仓库 |
| Branch | `main` |
| Root Directory | `.` |
| Runtime | Python |
| Build Command | `pip install -r core-service/requirements.txt` |
| Start Command | `alembic -c core-service/alembic.ini upgrade head && uvicorn app.main:app --app-dir core-service --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/healthz` |
| Auto Deploy | 建议关闭，使用 GitHub Action Deploy Hook 触发 |

Render 环境变量：

| Key | 示例值 | 说明 |
|---|---|---|
| `APP_ENV` | `production` | 必填 |
| `PUBLIC_SITE_URL` | `https://yuanshenjian.cn` | 主站地址 |
| `API_PUBLIC_BASE_URL` | `https://api.yuanshenjian.cn` | 后端公网地址 |
| `ALLOWED_ORIGINS_RAW` | `https://yuanshenjian.cn,https://www.yuanshenjian.cn,https://admin.yuanshenjian.cn` | CORS 与 Turnstile hostname 校验 |
| `COOKIE_DOMAIN` | `.yuanshenjian.cn` | 生产 cookie domain |
| `AI_ACTIVE_PROFILE` | `deepseek/deepseek-v4-flash` | 可选，覆盖当前激活的 LLM profile |
| `DATABASE_URL` | Supabase 连接串 | 必填 |
| `SESSION_SECRET` | 长随机字符串 | 必填 |
| `ADMIN_SECRET_HASH` | 管理员密码哈希 | 必填 |
| `TURNSTILE_SECRET_KEY` | Turnstile Secret Key | 必填 |
| `EMERGENCY_DISABLE_AI` | `false` | 紧急关闭 AI |
| `DEEPSEEK_API_KEY` | 真实 key | 当前激活 profile 需要 |
| `MOONSHOT_API_KEY` | 真实 key 或空 | 可选 |
| `OPENAI_COMPATIBLE_API_KEY` | 真实 key 或空 | 可选 |
| `EMBEDDING_BASE_URL` | `https://api.openai.com/v1` | RAG 后续使用 |
| `EMBEDDING_API_KEY` | 真实 key | RAG 后续使用 |
| `EMBEDDING_MODEL_ID` | `text-embedding-3-small` | RAG 后续使用 |
| `EMBEDDING_DIMENSIONS` | `1536` | RAG 后续使用 |

生成管理员配置：

```bash
python3 - <<'PY'
import secrets, hmac, hashlib, getpass

session_secret = secrets.token_urlsafe(48)
password = getpass.getpass("Admin password: ")

print("SESSION_SECRET=" + session_secret)
print("ADMIN_SECRET_HASH=" + hmac.new(session_secret.encode(), password.encode(), hashlib.sha256).hexdigest())
PY
```

## `application.yml` 环境变量覆盖

`core-service/app/application.yml` 提供默认值。生产或本地可以通过环境变量覆盖。LLM provider 列表统一由 `ai.providers` 定义，不再单独维护 JSONC 配置文件。

核心结构：

```yaml
ai:
  active_profile: ${AI_ACTIVE_PROFILE:deepseek/deepseek-v4-flash}
  providers:
    deepseek:
      base_url: https://api.deepseek.com/v1
      api_key: ${DEEPSEEK_API_KEY}
      models:
        deepseek-v4-flash: {}
        deepseek-v4-pro: {}
  scene_profiles:
    default: deepseek/deepseek-v4-flash
    advisor: deepseek/deepseek-v4-pro
```

`models` 下的 key 默认就是真实 model id；如果未来需要 alias，可以在单个 model 下补 `model_id`、`temperature` 或 `max_tokens`。

| 环境变量 | 覆盖字段 |
|---|---|
| `ALLOWED_ORIGINS_RAW` / `ALLOWED_ORIGINS` | `cors.allowed_origins` |
| `COOKIE_DOMAIN` | `security.cookie_domain` |
| `AI_ACTIVE_PROFILE` | `ai.active_profile` |
| `AI_GLOBAL_DAILY_TOKEN_LIMIT` | `ai.global_daily_token_limit` |
| `AI_CHAT_DAILY_REQUEST_LIMIT` | `ai.chat_daily_request_limit` |
| `AI_ADVISOR_DAILY_REQUEST_LIMIT` | `ai.advisor_daily_request_limit` |
| `AI_MODERATION_DAILY_REQUEST_LIMIT` | `ai.moderation_daily_request_limit` |
| `AI_EMBEDDING_DAILY_TOKEN_LIMIT` | `ai.embedding_daily_token_limit` |
| `DEEPSEEK_API_KEY` | `ai.providers.deepseek.api_key` |
| `MOONSHOT_API_KEY` | `ai.providers.moonshot-cn.api_key` |
| `OPENAI_COMPATIBLE_API_KEY` | `ai.providers.openai-compatible.api_key` |

没有配置环境变量时，继续使用 `application.yml` 默认值。

生产环境的后端不会读取 Render 本机的 `site/public` 快照。文章 AI、简报推荐等公开 JSON 数据通过 `PUBLIC_SITE_URL` 从 GitHub Pages 拉取，例如：

```text
https://yuanshenjian.cn/ai-data/index.json
https://yuanshenjian.cn/investment-data/briefings/index.json
```

因此内容更新后以主站部署和 Cloudflare purge 为准，不需要为了这些静态 JSON 单独重部署 `core-service`。

## LLM API Key 安全策略

生产环境使用：

```text
core-service/app/application.yml
```

该文件只保存 provider、base URL、model、scene 映射和 `${ENV}` 占位符，不保存真实 key。真实 key 只放在 Render 环境变量中。

本地使用：

```text
core-service/.env.local
```

本地只在 `.env.local` 中放真实 key 和 `AI_ACTIVE_PROFILE` 覆盖；不要提交、截图或复制到公开日志。

## Cloudflare Turnstile

Turnstile Widget 允许域名至少包含：

```text
yuanshenjian.cn
www.yuanshenjian.cn
admin.yuanshenjian.cn
```

如果 Vercel 暂时使用默认域名，也加入：

```text
*.vercel.app
```

配置位置：

| 值 | 平台 |
|---|---|
| Site Key | GitHub Actions Variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Site Key | Vercel Env `VITE_TURNSTILE_SITE_KEY` |
| Secret Key | Render Env `TURNSTILE_SECRET_KEY` |

## Vercel 管理后台

推荐使用 Vercel Git Integration 或 Vercel Deploy Hook。

Vercel Project 设置：

| 设置项 | 值 |
|---|---|
| Framework Preset | Vite |
| Root Directory | `admin-console` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Vercel Production Env：

| Key | 示例值 |
|---|---|
| `VITE_CORE_SERVICE_URL` | `https://api.yuanshenjian.cn` |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile Site Key |

如果使用 GitHub Action 触发 Vercel Deploy Hook，配置 GitHub Secret：

| Name | 说明 |
|---|---|
| `VERCEL_ADMIN_DEPLOY_HOOK_URL` | Vercel admin-console 项目的 Deploy Hook URL |

同时配置 GitHub Actions Variables：

| Name | 示例值 |
|---|---|
| `VITE_CORE_SERVICE_URL` | `https://api.yuanshenjian.cn` |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile Site Key |

## RAG Sync

RAG Sync workflow 当前已经切到新的 DDD CLI：

```bash
python -m app.contexts.knowledge_base.interface.published_content_sync_cli --repo-root .. --commit-sha "$GITHUB_SHA"
```

GitHub Secrets / Variables：

| 类型 | Name | 说明 |
|---|---|---|
| Secret | `CORE_SERVICE_DATABASE_URL` | Supabase Postgres URL |
| Secret | `EMBEDDING_BASE_URL` | embedding provider base URL |
| Secret | `EMBEDDING_API_KEY` | embedding provider key |
| Variable | `EMBEDDING_MODEL_ID` | embedding model id |

当前同步服务会先写入文档与 chunk；embedding 生成能力后续可以继续增强。

## GitHub Actions 当前状态

| Workflow | 状态 |
|---|---|
| `.github/workflows/site-ci.yml` | GitHub Pages 主站构建与部署，已适配 `site/` |
| `.github/workflows/core-service-ci.yml` | 后端 Ruff、mypy、pytest、migration smoke、Render deploy hook |
| `.github/workflows/admin-console-ci.yml` | 管理后台 typecheck/build，main 分支可触发 Vercel deploy hook |
| `.github/workflows/rag-sync.yml` | 已切到新的 `knowledge_base` CLI |

## 上线顺序

1. 在 Supabase 创建数据库并启用 `vector`。
2. 在 Render 创建 `core-service` Web Service，填好环境变量。
3. 确认 Render `/healthz` 返回 `{"status":"ok"}`。
4. 绑定 `api.yuanshenjian.cn`，并更新 `API_PUBLIC_BASE_URL`。
5. 在 GitHub Actions Variables 配置 `NEXT_PUBLIC_CORE_SERVICE_URL`。
6. 在 Vercel 创建 `admin-console` 项目，填好 `VITE_CORE_SERVICE_URL` 和 Turnstile Site Key。
7. 在 Cloudflare Turnstile 中加入主站、后台和临时 Vercel 域名。
8. Push 到 `main`。
9. 检查 GitHub Pages 首页、Render 后端、Vercel 后台。

## 最终检查清单

| 检查项 | 期望 |
|---|---|
| `https://yuanshenjian.cn` | 首页可访问 |
| `site/dist/CNAME` | 内容为 `yuanshenjian.cn` |
| `https://api.yuanshenjian.cn/healthz` | 返回 `{"status":"ok"}` |
| 主站问 AI | 请求 `/api/v1/ai-assistant/chat/stream` 成功 |
| Vercel admin-console | 页面可打开，登录无 CORS / Turnstile 错误 |
| Render Logs | 无 `Invalid LLM profiles config` 和 migration 错误 |
