# Troubleshoots

> 记录项目中已经定位并修复过、且值得后续复用的重要问题。

---

## 2026-06-02 切换到 `uv --directory core-service` 后，Alembic 不能再使用 `core-service/migrations`

### 现象

执行 `just run-core-migrations` 或 `just start-core-service` 报错：

```text
FAILED: Path doesn't exist: core-service/migrations.
```

### 根因

`uv --directory core-service run ...` 会先把工作目录切到 `core-service/`，这时 `core-service/alembic.ini` 里的旧相对路径：

- `script_location = core-service/migrations`
- `prepend_sys_path = core-service`

会被解析成错误的双重路径：

- `core-service/core-service/migrations`

### 修复

把 `core-service/alembic.ini` 改为以 `core-service/` 为工作目录的相对路径：

```ini
[alembic]
script_location = migrations
prepend_sys_path = .
```

### 结论

当运行链路统一切到 `uv --directory core-service`、Render `rootDir=core-service` 或 CI `working-directory: core-service` 后，`alembic.ini` 里的相对路径也必须一起收口，不能继续带 `core-service/` 前缀。

## 2026-06-03 未配置 `CORE_SERVICE_DATABASE_URL` 时，`rag-sync` 不应把整次 push 标红

### 现象

GitHub Actions 的 `RAG Sync` workflow 在 `Sync public RAG content` 步骤失败，报错类似：

```text
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

### 根因

`rag-sync.yml` 会把：

- `CORE_SERVICE_DATABASE_URL`
- `EMBEDDING_BASE_URL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL_ID`

注入到 `core-service` 的 CLI。未配置时，GitHub Actions 会把对应值展开成空字符串，而不是完全不传；后端在导入数据库层时执行：

```python
create_async_engine(settings.database_url, ...)
```

最终等价于 `create_async_engine("")`，于是 URL 解析直接失败。

### 修复

给 `rag-sync.yml` 增加前置检查：

1. 任一必要 secret / variable 缺失时，输出 `ready=false`
2. 后续数据库 URL 校验和内容同步步骤只在 `ready=true` 时运行
3. 缺少配置时打印明确日志，并优雅跳过 workflow

### 结论

`RAG Sync` 在当前项目里应视为“按需启用”的生产能力，而不是主站/后端基础部署的阻断项。没配 RAG 所需 secrets 时，workflow 应跳过而不是失败。

## 2026-06-03 `rag-sync` 的 `CORE_SERVICE_DATABASE_URL` 必须使用 asyncpg 风格 URL

### 现象

GitHub Actions 的 `Sync public RAG content` 步骤失败，报错：

```text
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

### 根因

`rag-sync` 会导入 `core-service/app/shared/infra/database.py`，当前项目已统一使用 async SQLAlchemy：

```python
create_async_engine(settings.database_url, ...)
```

因此 `CORE_SERVICE_DATABASE_URL` 必须使用 async SQLAlchemy 可识别的连接串。常见错误有两类：

1. 误填成旧同步驱动 `postgresql+psycopg://...` 或裸 `postgresql://...`
2. 密码里包含原始 `#`，没有编码成 `%23`

另外，当前项目的连接串查询参数应写成：

- `sslmode=require`

而不是：

- `ssl=require`

### 正确示例

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?sslmode=require
```

如果密码里有 `#`，例如：

```text
abc#123
```

则 URL 中必须写成：

```text
abc%23123
```

### 修复

1. 将 GitHub Secret `CORE_SERVICE_DATABASE_URL` 改成 `postgresql+asyncpg://...?...sslmode=require`
2. 如果 Render 里的 `DATABASE_URL` 也用了同一条旧值，一并修正
3. 对密码中的特殊字符做 URL encode，尤其是 `# -> %23`

### 防回归

`rag-sync.yml` 已新增前置校验步骤，会明确阻断以下问题：

- Secret 为空
- 驱动不是 `postgresql+asyncpg://`
- URL 中仍包含原始 `#`

## 2026-06-03 `site-ci` 的根级 Vitest 不能在 `site/` 目录下执行

### 现象

GitHub Actions 的 `Run tests` 步骤在 `site` 内测试通过后，根级 workspace 测试仍然失败，典型报错包括：

```text
Error: Cannot find module '/.../site/scripts/validate-post.js'
ENOENT: no such file or directory, open 'skills/ai-briefing/SKILL.md'
```

### 根因

根因有两层：

1. `npm exec vitest ...` 在 CI 的 npm 版本下需要显式 `--`
2. 更关键的是，`site/vitest.workspace.config.ts` 会加载仓库根目录下的测试：

- `tests/scripts/**`
- `tests/skills/**`
- `tests/blog-ai-worker/**`

这些测试依赖的相对路径是按仓库根目录设计的。如果在 `working-directory: site` 下执行，就会错误地去找：

- `site/scripts/validate-post.js`
- `site/skills/...`

从而导致根级测试失败。

### 修复

把测试拆成两步：

```bash
npm run test
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts
```

其中：

- `npm run test` 在 `site/` 目录执行，负责主站自身测试
- workspace tests 在仓库根目录执行，负责 `tests/scripts`、`tests/skills`、`tests/blog-ai-worker`

### 结论

带仓库根级测试的 Vitest workspace，如果包含依赖相对路径的脚本测试，必须在仓库根目录执行；不能简单沿用 `working-directory: site`。

## 2026-06-03 `core-service-ci` 的 migration smoke 不能与 pytest 共用默认 SQLite 文件

### 现象

GitHub Actions 的 `Migration smoke` 步骤执行：

```text
uv run --frozen --no-sync alembic -c alembic.ini upgrade head
```

报错：

```text
sqlite3.OperationalError: table visitors already exists
```

### 根因

`core-service-ci.yml` 先跑 pytest，再跑 Alembic migration smoke。两步都没有显式覆盖 `DATABASE_URL`，于是都会落到同一个默认 SQLite 文件。

测试阶段会先创建业务表，但不会写入 Alembic 版本表；后续 migration smoke 再执行 `0001_initial` 时，Alembic 认为这是一个空库，于是尝试重复建表，最终触发：

```text
table visitors already exists
```

### 修复

给两个步骤使用不同数据库文件：

```text
pytest           -> sqlite+aiosqlite:///./test.db
migration smoke  -> sqlite+aiosqlite:///./migration-smoke.db
```

同时显式设置：

```text
APP_ENV=test
```

### 结论

在 CI 中，只要同一个 job 既跑测试又跑 Alembic migration smoke，就不要共用默认 SQLite 文件；必须把测试库和迁移烟测库隔离开。

## 2026-06-03 Render 上 Alembic 不能直接把含 `%23` 的 `DATABASE_URL` 写入 configparser

### 现象

Render 启动命令执行 Alembic migration 时失败：

```text
ValueError: invalid interpolation syntax in 'postgresql+asyncpg://...Ysj%23blog2026...'
```

### 根因

这里有两个问题：

1. Alembic 的 config 底层是 Python `configparser`，它会把 `%` 当成插值语法。数据库密码里的 `#` 被正确 URL encode 成 `%23` 后，`configparser` 会因为裸 `%` 抛 `invalid interpolation syntax`。
2. 当前 `core-service` 已使用 async SQLAlchemy `create_async_engine()` 和 `AsyncSession`，生产 `DATABASE_URL` 必须使用 `postgresql+asyncpg://`。

### 当前项目的正确连接串

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?sslmode=require
```

说明：

- `asyncpg` 适用于 async SQLAlchemy 链路，需要 `create_async_engine()` 和 `AsyncSession`
- 当前项目已经走 async SQLAlchemy，所以不能继续使用 `postgresql+psycopg://` 或裸 `postgresql://`
- 密码里的 `#` 仍然必须 URL encode 成 `%23`

### 修复

1. Alembic 写入 `sqlalchemy.url` 前，把 `%` 转义成 `%%`：

```python
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))
```

2. `Settings` 增加数据库 URL 校验，发现 `postgresql+psycopg://`、裸 `postgresql://`、`sqlite+pysqlite://` 或裸 `sqlite://` 时直接报错，避免 async engine 误用同步 driver。
3. Render 的 `DATABASE_URL` 必须同步改成 `postgresql+asyncpg://...?...sslmode=require`。

### 结论

URL encode 是正确的，`%23` 可以被数据库驱动还原成 `#`；问题在 Alembic configparser 需要额外转义 `%`。生产后端和 Alembic 都走 async SQLAlchemy，所以 Render 上必须使用 `asyncpg` 连接串。
