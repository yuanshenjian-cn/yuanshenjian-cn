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
