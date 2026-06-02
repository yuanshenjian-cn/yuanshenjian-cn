# Core Service

`core-service/` 是博客系统的统一后端，承载评论、阅读统计、后台管理 API、AI Gateway 和基础 RAG 能力。

## 配置分层

`core-service` 现在使用三层配置：

1. `.env.*`：按环境区分的地址、数据库、secret、provider API key
2. `config/app.yaml`：结构化运行配置（CORS、cookie、AI 限流、配置文件路径）
3. `config/ai/*.jsonc`：LLM provider / model / scene 映射

### 环境变量加载顺序

按优先级从低到高：

1. `core-service/.env`
2. `core-service/.env.<APP_ENV>`
3. `core-service/.env.local`
4. `core-service/.env.<APP_ENV>.local`
5. 真实进程环境变量

本地默认 `APP_ENV=development`。

## 关键配置文件

- `core-service/.env.development`：已提交的本地默认值
- `core-service/.env.production.example`：线上参考模板
- `core-service/migrations/`：Alembic schema 演进脚本
- `core-service/config/app.yaml`：分环境结构化配置
- `core-service/config/ai/llm-profiles.jsonc`：LLM provider / model 配置
- `core-service/config/ai/scene-profile-map.jsonc`：scene -> profile selector 映射
- `core-service/config/ai/supported-llm-providers.json`：允许的 provider 白名单

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

- 服务地址：`http://localhost:8000`
- 健康检查：`http://localhost:8000/healthz`
- 本地数据库：`core-service/dev.db`
- 默认 cookie domain：开发环境为空，生产从 `config/app.yaml` 读取 `.yuanshenjian.cn`
- 默认管理员口令：`admin123456`

说明：默认管理员口令依赖 `core-service/.env.development` 中的 `SESSION_SECRET` 和 `ADMIN_SECRET_HASH`。如果你在 `.env.development.local` 覆盖了其中任意一个，登录口令也要同步调整。

## 本地自定义配置

推荐做法：

1. 保持 `core-service/.env.development` 作为团队共享默认值
2. 本地私有覆盖写到 `core-service/.env.development.local`
3. 只在 `.env.*.local` 里放真实 key 或个人化地址

例如：

```bash
cp core-service/.env.development core-service/.env.development.local
```

然后只修改你需要覆盖的条目，例如：

```bash
DEEPSEEK_API_KEY=replace-with-local-key
MOONSHOT_API_KEY=replace-with-local-key
TENCENT_TOKENHUB_API_KEY=replace-with-local-key
OPENAI_COMPATIBLE_API_KEY=replace-with-local-key
```

## 线上配置

Render 生产环境不落盘 `.env.production`，直接在控制台配置环境变量。可以把 `core-service/.env.production.example` 当作变量清单。

建议分三组维护：

1. 基础运行：`APP_ENV`、`PUBLIC_SITE_URL`、`API_PUBLIC_BASE_URL`、`DATABASE_URL`
2. 安全：`SESSION_SECRET`、`ADMIN_SECRET_HASH`、`TURNSTILE_SECRET_KEY`
3. AI / embedding：各 provider API key 与 embedding 相关变量

## 手动启动

创建虚拟环境并安装依赖：

```bash
python3 -m venv core-service/.venv
core-service/.venv/bin/python -m pip install --upgrade pip
core-service/.venv/bin/python -m pip install -e "./core-service[dev]"
```

执行数据库迁移：

```bash
APP_ENV=development \
PUBLIC_SITE_URL=http://localhost:3000 \
API_PUBLIC_BASE_URL=http://localhost:8000 \
ALLOWED_ORIGINS_RAW=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173 \
core-service/.venv/bin/python -m alembic -c core-service/alembic.ini upgrade head
```

启动开发服务器：

```bash
APP_ENV=development \
PUBLIC_SITE_URL=http://localhost:3000 \
API_PUBLIC_BASE_URL=http://localhost:8000 \
ALLOWED_ORIGINS_RAW=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173 \
core-service/.venv/bin/python -m uvicorn app.main:app --app-dir core-service --reload --host 127.0.0.1 --port 8000
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

`core-service` 的 LLM 配置不再使用 `LLM_PROFILES_JSON` 这类大块环境变量，而是统一走：

1. `config/ai/llm-profiles.jsonc`：provider / model 定义
2. `config/ai/scene-profile-map.jsonc`：scene 映射
3. `.env.*` / Render env：真实 API key

例如 provider 配置里的 `apiKeyEnv`：

```jsonc
{
  "deepseek": {
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKeyEnv": "DEEPSEEK_API_KEY"
  }
}
```

表示真实密钥只从环境变量 `DEEPSEEK_API_KEY` 读取，而不是写进 JSONC 文件。
