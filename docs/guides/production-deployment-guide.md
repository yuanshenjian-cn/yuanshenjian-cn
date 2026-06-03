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
| 本地 | `local` | `core-service/.env.local`、`core-service/app/config.yml` |
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

`RENDER_DEPLOY_HOOK_URL` 获取方式：

1. 打开 Render Dashboard
2. 进入你的后端 Web Service
3. 打开 `Settings`
4. 找到 `Deploy Hook` 或 `Deploy Hook URL`
5. 复制这条 URL，保存到 GitHub 仓库：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

Secret 名称使用：

```text
RENDER_DEPLOY_HOOK_URL
```

注意：

- 这条 URL 是敏感信息，拿到的人都可以触发 Render 重新部署
- 如果怀疑泄露，可以在 Render 页面重新生成 `Deploy Hook`
- 当前仓库的 `core-service` workflow 会在 `main` 分支校验通过后调用它

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
4. 将连接串改为 SQLAlchemy asyncpg 格式。

示例：

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?ssl=require
```

注意：

| 项 | 说明 |
|---|---|
| SQLAlchemy driver | 当前后端使用 async SQLAlchemy，生产必须用 `postgresql+asyncpg://` |
| 密码特殊字符 | `@`、`#`、`%`、`:` 等字符需要 URL encode |
| SSL 参数 | 当前 asyncpg 连接串使用 `ssl=require`，不要写 `sslmode=require` |
| Supabase anon key | 后端直连 Postgres，不需要配置 anon key |
| Supabase service role key | 后端直连 Postgres，不需要配置 service role key |
| 数据迁移 | Render 启动命令会执行 Alembic migration |

## Render 后端

Render Web Service 建议配置：

| 设置项 | 值 |
|---|---|
| Repository | 当前 GitHub 仓库 |
| Branch | `main` |
| Root Directory | `core-service` |
| Runtime | Python |
| Build Command | `uv sync --frozen` |
| Start Command | `uv run --frozen --no-sync alembic -c alembic.ini upgrade head && uv run --frozen --no-sync uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/healthz` |
| Auto Deploy | 建议关闭，使用 GitHub Action Deploy Hook 触发 |

说明：这里让 Render 直接以 `core-service/pyproject.toml` + `core-service/uv.lock` 作为依赖入口，避免生产环境继续依赖并行维护的 `requirements.txt`。

### Render 自定义域名与 Cloudflare DNS

如果前端和管理后台都使用：

```text
https://api.yuanshenjian.cn
```

那么除了配置 `NEXT_PUBLIC_CORE_SERVICE_URL` / `VITE_CORE_SERVICE_URL` 之外，还需要把 `api.yuanshenjian.cn` 这个域名真正接到 Render Web Service。

推荐步骤：

1. 在 Render 后端服务的 `Settings -> Custom Domains` 中添加 `api.yuanshenjian.cn`
2. 记下 Render 页面提示的目标域名，通常是 `xxx.onrender.com`
3. 到 Cloudflare DNS 新增一条记录：

```text
Type: CNAME
Name: api
Target: xxx.onrender.com
Proxy status: DNS only
```

4. 删除 `api` 子域名上已有的冲突记录，尤其是旧的 `A` / `AAAA` / `CNAME`
5. 回 Render 点击 `Verify`
6. 验证通过后访问：

```text
https://api.yuanshenjian.cn/healthz
```

确认后端已经通过自定义域名正常提供服务。

注意：

- 验证阶段建议先使用 Cloudflare 灰云 `DNS only`
- Render 官方建议在配置时移除相关 `AAAA` 记录，避免 IPv6 干扰验证
- 如果域名配置了 `CAA`，需要允许 `letsencrypt.org` 和 `pki.goog`

### Cloudflare 灰云与橙云

灰云 `DNS only`：

- Cloudflare 只负责域名解析
- 客户端直接访问 Render
- 配置更简单，适合初次接入和排障阶段
- 不能使用 Cloudflare 代理层的 WAF、Rate Limiting、Bot 防护等能力

橙云 `Proxied`：

- 客户端先访问 Cloudflare，再由 Cloudflare 转发到 Render
- 可以使用 Cloudflare 的 WAF、Rate Limiting、Bot 管理等代理能力
- 但链路更复杂，排障时要同时排查 Render、DNS、Cloudflare SSL/TLS 和代理规则

当前项目建议：

1. 先用灰云 `DNS only` 跑通 Render 自定义域名验证
2. 确认 `https://api.yuanshenjian.cn/healthz` 正常
3. 确认主站、评论、管理后台、AI 接口都能正常访问 API
4. 如果后续需要 Cloudflare 代理防护，再切橙云 `Proxied`

### `api.yuanshenjian.cn` 是否值得切橙云

结论：值得，但不建议作为首发前置条件。

原因：

- 当前 API 不只是只读接口，还包含评论提交、管理员登录、AI 对话等更容易被刷的动态入口
- 后端虽然已经有应用层限流和 Turnstile，但 Cloudflare 代理层可以补充 WAF、Rate Limiting、Bot 管理，形成第二层防护
- 对公开 API 来说，这些能力在上线后有真实价值，尤其是评论和 AI 接口开始被搜索引擎、脚本或恶意流量碰撞之后

不建议首发就切橙云的原因：

- 当前还处于基础设施刚接通阶段，优先目标是确认 Render、自定义域名、TLS、Supabase、前后端联调都稳定
- 橙云会把问题面扩大到 Cloudflare 规则、缓存、SSL/TLS、代理行为，排障成本明显上升
- 这个项目包含流式 AI 响应，代理层一旦配置不当，比普通 JSON API 更容易出现边缘问题

推荐决策：

1. 首次上线阶段：保持灰云 `DNS only`
2. 主站、评论、管理后台、AI 接口稳定运行一段时间后，再评估是否切橙云
3. 如果开始出现探测流量、评论刷接口、AI 滥用或异常爬虫，再切橙云通常是值得的

如果后续切橙云，额外检查：

- Cloudflare SSL/TLS 模式建议使用 `Full (strict)`
- 不要给 API 路径错误开启缓存
- 确认流式响应、长连接或 SSE 没有被代理层干扰
- 确认后端对 `api.yuanshenjian.cn` 的跨域和 cookie 行为仍然正确

### 切橙云后，这个项目要重点检查的 Cloudflare 配置

建议优先检查：

1. SSL/TLS

- 模式使用 `Full (strict)`
- 确认 Render 自定义域名已经 `Verified`，证书已经签发完成，再打开代理

2. Cache Rules

- `api.yuanshenjian.cn/*` 默认不要缓存
- 不要给 `/api/*`、评论接口、管理员接口、AI 接口错误配置 `Cache Everything`
- 健康检查 `/healthz` 也建议保持直连语义，不依赖边缘缓存结果

3. WAF / Security Rules

- 可以先对明显敏感路径做更严格规则，例如评论提交、管理员登录、AI 对话入口
- 不要一开始就对整站 API 上挑战或拦截规则，先从高风险写接口开始
- 如果开启更激进的人机验证，注意不要和站内 Turnstile 重复叠加到影响正常用户提交

4. Rate Limiting

- 优先保护高成本或可滥用接口：评论提交、管理员认证、AI chat/stream、AI 推荐类接口
- Cloudflare 限流适合做外层粗限流，应用内限流继续保留做业务语义控制
- 不建议只依赖 Cloudflare 限流替代应用层限流

5. 流式响应与 SSE

- 重点回归测试 AI 流式接口
- 确认前端可以持续收到分段响应，而不是被代理层缓冲到最后一次性返回
- 如果未来增加 WebSocket 或更长连接能力，也要单独验证代理行为

6. 实际来源 IP

- 如果后续要做更精细的审计、限流或封禁，需要明确后端读取真实客户端 IP 的策略
- 橙云后，请求到 Render 时源地址会先经过 Cloudflare，后端应优先信任 `CF-Connecting-IP` 或标准转发头，而不是只看直连源 IP

7. CORS 与 Cookie

- 当前允许的 origin 维护在 `core-service/app/config.yml`，切橙云不应改变这份白名单
- 登录、评论、管理后台等需要再次验证跨域请求和 cookie domain 是否仍符合预期
- 当前 `COOKIE_DOMAIN=.yuanshenjian.cn` 时，要验证主站与后台对子域 cookie 的读写和发送是否正常

8. Cloudflare 额外功能

- 不要把 Cloudflare Access 之类交互式保护直接套到公开 API 上，否则主站和管理后台的正常 AJAX 请求可能被拦住
- 开启 Bot Fight Mode、Super Bot Fight Mode 或托管挑战时，要重新验证评论、AI、后台接口是否仍可正常访问

建议的切换后验收顺序：

1. `https://api.yuanshenjian.cn/healthz`
2. 主站文章页加载与评论列表
3. 评论提交
4. AI 推荐与 AI 流式问答
5. 管理后台登录与受保护接口

Render 环境变量：

| Key | 示例值 | 说明 |
|---|---|---|
| `APP_ENV` | `production` | 必填 |
| `PUBLIC_SITE_URL` | `https://yuanshenjian.cn` | 主站地址 |
| `API_PUBLIC_BASE_URL` | `https://api.yuanshenjian.cn` | 后端公网地址 |
| `COOKIE_DOMAIN` | `.yuanshenjian.cn` | 生产 cookie domain |
| `AI_ACTIVE_PROFILE` | `deepseek/deepseek-v4-flash` | 可选，覆盖当前激活的 LLM profile |
| `DATABASE_URL` | `postgresql+asyncpg://...?...ssl=require` | 必填，Supabase 连接串 |
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

## `config.yml` 环境变量覆盖

`core-service/app/config.yml` 提供默认值。生产或本地可以通过环境变量覆盖常用运行参数。CORS origin 列表直接维护在 `cors.allowed_origins`，不再额外提供环境变量覆盖。

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

没有配置环境变量时，继续使用 `config.yml` 默认值。

生产环境的后端不会读取 Render 本机的 `site/public` 快照。文章 AI、简报推荐等公开 JSON 数据通过 `PUBLIC_SITE_URL` 从 GitHub Pages 拉取，例如：

```text
https://yuanshenjian.cn/ai-data/index.json
https://yuanshenjian.cn/investment-data/briefings/index.json
```

因此内容更新后以主站部署和 Cloudflare purge 为准，不需要为了这些静态 JSON 单独重部署 `core-service`。

## LLM API Key 安全策略

生产环境使用：

```text
core-service/app/config.yml
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

这些值当前都按“可选”处理：

- 如果你还没启用生产 RAG sync，不配置它们也没关系
- `rag-sync.yml` 现在会在缺少任一必要 secret / variable 时自动跳过，不再把整次 push 标红
- 一旦你准备启用生产 RAG sync，再把这 4 个值补齐即可

为什么 `CORE_SERVICE_DATABASE_URL` 要配在 GitHub Secret：

- `rag-sync.yml` 不是调用 Render 上的后端接口，而是直接在 GitHub Actions runner 里执行 `published_content_sync_cli`
- 这条 CLI 会直接连接生产数据库写入 RAG 文档和 chunk，因此谁执行，谁就必须拿到数据库凭证
- Render 环境变量只对 Render 上运行的后端服务可见，GitHub Actions 读不到 Render 的 `DATABASE_URL`
- 因为连接串包含数据库账号密码，所以必须放 GitHub Secret，而不是 GitHub Variable

当前项目建议：

1. 如果还没启用生产 RAG sync，不需要先配置这些 GitHub secrets
2. 先把主站 GitHub Pages 和 Render 后端部署跑通
3. 后续决定启用生产 RAG sync 时，再补齐 `CORE_SERVICE_DATABASE_URL` 和 embedding 相关配置

其中 `CORE_SERVICE_DATABASE_URL` 必须与 `core-service` 运行时使用的 async SQLAlchemy 驱动保持一致，推荐格式：

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?ssl=require
```

注意：

- 不要写成 `postgresql+psycopg://...` 或 `postgresql://...`，当前 `core-service` 与 `rag-sync` 都使用 async SQLAlchemy
- 不要写成 `?sslmode=require`，asyncpg 会把它原样传给 `asyncpg.connect()` 并报 `unexpected keyword argument 'sslmode'`
- 如果密码里包含 `#`、`@`、`%`、`:` 等特殊字符，必须先做 URL encode，例如 `# -> %23`

当前 RAG sync 服务会先写入文档与 chunk；embedding 生成能力后续可以继续增强。

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
