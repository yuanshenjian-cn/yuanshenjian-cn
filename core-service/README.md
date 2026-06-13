# Core Service

`core-service/` 是博客系统的统一后端，承载评论、阅读统计、后台管理 API、AI Gateway 和基础 RAG 能力。

## 配置分层

`core-service` 现在使用两层配置：

1. `.env.*`：按环境区分的地址、数据库、secret、provider API key
2. `app/config.yml`：结构化运行配置（CORS、cookie、AI provider/profile、限流参数）

### 环境变量加载顺序

按优先级从低到高：

1. `core-service/.env`
2. `core-service/.env.<APP_ENV>`
3. `core-service/.env.local`
4. `core-service/.env.<APP_ENV>.local`
5. 真实进程环境变量

本地默认 `APP_ENV=local`。

## 关键配置文件

- `core-service/.env.example`：环境变量清单，本地可复制为 `.env.local`
- `core-service/migrations/`：Alembic schema 演进脚本
- `core-service/app/config.yml`：分环境结构化配置，包含 LLM provider / model / scene 映射

## 本地启动

优先使用仓库根目录 `justfile`：

```bash
just install-core-service
just run-core-migrations
just start-core-service
```

如果你要联调前端：

```bash
just start-site-and-core-service
just start-admin-console-and-core-service
just start-all-services
```

## 本地默认值

- 服务地址：`http://localhost:8001`
- 健康检查：`http://localhost:8001/healthz`
- 本地数据库：`core-service/dev.db`
- 默认 cookie domain：本地环境为空，生产从 `app/config.yml` 读取 `.yuanshenjian.cn`
- 默认管理员口令：`admin123456`

说明：通过 `just` 启动本地后端时会注入默认 `SESSION_SECRET` 和 `ADMIN_SECRET_HASH`，默认管理员口令为 `admin123456`。如果你在 `.env.local` 覆盖了其中任意一个，登录口令也要同步调整。

## 本地自定义配置

推荐做法：

1. 复制 `core-service/.env.example` 为 `core-service/.env.local`
2. 本地私有覆盖统一写到 `core-service/.env.local`
3. 只在 `.env.local` 里放真实 key 或个人化地址
4. 本地切换当前 LLM profile 时，在 `.env.local` 中覆盖 `AI_ACTIVE_PROFILE`

例如：

```bash
cp core-service/.env.example core-service/.env.local
```

然后只修改你需要覆盖的条目，例如：

```bash
DEEPSEEK_API_KEY=replace-with-local-key
MOONSHOT_API_KEY=replace-with-local-key
OPENAI_COMPATIBLE_API_KEY=replace-with-local-key
```

LLM provider、model 和 scene 映射统一维护在 `core-service/app/config.yml`。真实 API key 不写进 YAML，使用 `${DEEPSEEK_API_KEY}` 这类占位符从 `.env.local` 或 Render Env 注入。

### `config.yml` 的环境变量覆盖

`app/config.yml` 提供默认值；生产或本地可以用环境变量覆盖常用字段。LLM provider 列表统一由 `ai.providers` 定义，不再单独维护 JSONC 配置文件。

| 环境变量 | 覆盖字段 |
|---|---|
| `COOKIE_DOMAIN` | `security.cookie_domain` |
| `AI_ACTIVE_PROFILE` | `ai.active_profile` |
| `AI_GLOBAL_DAILY_TOKEN_LIMIT` | `ai.global_daily_token_limit` |
| `AI_CHAT_DAILY_REQUEST_LIMIT` | `ai.chat_daily_request_limit` |
| `AI_ADVISOR_DAILY_REQUEST_LIMIT` | `ai.advisor_daily_request_limit` |
| `AI_MODERATION_DAILY_REQUEST_LIMIT` | `ai.moderation_daily_request_limit` |
| `AI_EMBEDDING_DAILY_TOKEN_LIMIT` | `ai.embedding_daily_token_limit` |

## 线上配置

Render 生产环境不落盘 env 文件，直接在控制台配置环境变量。可以把 `core-service/.env.example` 和 `docs/guides/production-deployment-guide.md` 当作变量清单。

建议分三组维护：

1. 基础运行：`APP_ENV`、`PUBLIC_SITE_URL`、`API_PUBLIC_BASE_URL`、`DATABASE_URL`
2. 安全：`SESSION_SECRET`、`ADMIN_SECRET_HASH`、`TURNSTILE_SECRET_KEY`
3. AI / embedding：`AI_ACTIVE_PROFILE`、各 provider API key 与 embedding 相关变量

## 手动启动

创建虚拟环境并安装依赖：

```bash
uv --directory core-service sync --frozen --extra dev
```

执行数据库迁移：

```bash
APP_ENV=local \
PUBLIC_SITE_URL=http://localhost:3001 \
API_PUBLIC_BASE_URL=http://localhost:8001 \
uv --directory core-service run --no-sync alembic -c alembic.ini upgrade head
```

启动开发服务器：

```bash
APP_ENV=local \
PUBLIC_SITE_URL=http://localhost:3001 \
API_PUBLIC_BASE_URL=http://localhost:8001 \
uv --directory core-service run --no-sync uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

## 相关命令

- `just install-core-service`：安装或更新 `core-service` 本地虚拟环境依赖
- `just run-core-migrations`：执行本地数据库迁移
- `just show-core-migration-current`：查看当前 Alembic 版本
- `just show-core-migration-history`：查看 Alembic 历史
- `just create-core-migration "message"`：生成新的 Alembic migration
- `just start-core-service`：执行迁移后启动服务
- `just check-core-service`：运行 `core-service` 的 Ruff、mypy 和 pytest 校验
- `just start-admin-console-and-core-service`：同时启动 admin-console 和 core-service
- `just start-all-services`：同时启动 site、admin-console 和 core-service
- `just check`：运行博客前端、admin-console、core-service 的常用校验

## AI 配置说明

`core-service` 的 LLM 配置不再使用 `LLM_PROFILES_JSON` 或独立 JSONC profile 文件，而是统一走：

1. `app/config.yml`：provider / model / scene profile 定义
2. `.env.*` / Render env：真实 API key

例如 `app/config.yml` 中的 provider 配置：

```yaml
providers:
  deepseek:
    base_url: https://api.deepseek.com/v1
    api_key: ${DEEPSEEK_API_KEY}
    models:
      deepseek-v4-flash: {}
```

表示真实密钥只从环境变量 `DEEPSEEK_API_KEY` 注入，而不是写进仓库文件。
