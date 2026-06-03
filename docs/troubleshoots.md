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
create_engine(settings.database_url, ...)
```

最终等价于 `create_engine("")`，于是 URL 解析直接失败。

### 修复

给 `rag-sync.yml` 增加前置检查：

1. 任一必要 secret / variable 缺失时，输出 `ready=false`
2. 后续数据库 URL 校验和内容同步步骤只在 `ready=true` 时运行
3. 缺少配置时打印明确日志，并优雅跳过 workflow

### 结论

`RAG Sync` 在当前项目里应视为“按需启用”的生产能力，而不是主站/后端基础部署的阻断项。没配 RAG 所需 secrets 时，workflow 应跳过而不是失败。

## 2026-06-03 `rag-sync` 的 `CORE_SERVICE_DATABASE_URL` 不能直接复用 `asyncpg` 风格 URL

### 现象

GitHub Actions 的 `Sync public RAG content` 步骤失败，报错：

```text
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

### 根因

`rag-sync` 会导入 `core-service/app/shared/infra/database.py`，其中使用的是同步 SQLAlchemy：

```python
create_engine(settings.database_url, ...)
```

因此 `CORE_SERVICE_DATABASE_URL` 必须使用同步 SQLAlchemy 可识别的连接串。常见错误有两类：

1. 误填成 `postgresql+asyncpg://...`
2. 密码里包含原始 `#`，没有编码成 `%23`

另外，当前项目的连接串查询参数应写成：

- `sslmode=require`

而不是：

- `ssl=require`

### 正确示例

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/postgres?sslmode=require
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

1. 将 GitHub Secret `CORE_SERVICE_DATABASE_URL` 改成 `postgresql+psycopg://...?...sslmode=require`
2. 如果 Render 里的 `DATABASE_URL` 也用了同一条旧值，一并修正
3. 对密码中的特殊字符做 URL encode，尤其是 `# -> %23`

### 防回归

`rag-sync.yml` 已新增前置校验步骤，会明确阻断以下问题：

- Secret 为空
- 驱动不是 `postgresql+psycopg://`
- URL 中仍包含原始 `#`
