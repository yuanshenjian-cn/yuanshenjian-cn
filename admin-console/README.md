# Admin Console

`admin-console/` 是博客后台管理控制台，负责管理员登录、评论审核、基础统计和系统状态查看。

## 本地启动

优先使用仓库根目录的 `justfile`：

```bash
just setup
just admin-core-dev
```

只启动后台管理前端：

```bash
just admin-dev
```

如果你只启动了 `admin-console`，请另外启动 `core-service`：

```bash
just core-dev
```

## 本地默认值

- 管理后台地址：`http://localhost:5173`
- 后台 API 地址：`http://localhost:8000`
- Turnstile：默认使用 Cloudflare 官方测试 Site Key
- 默认管理员口令：`admin123456`

说明：默认口令只对 `justfile` 提供的本地开发环境生效，生产环境必须自行配置 `SESSION_SECRET` 和 `ADMIN_SECRET_HASH`。

## 手动启动

安装依赖：

```bash
npm --prefix admin-console install
```

启动开发服务器：

```bash
VITE_CORE_SERVICE_URL=http://localhost:8000 \
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA \
npm --prefix admin-console run dev -- --host localhost --port 5173 --strictPort
```

## 相关命令

- `just admin-dev`: 只启动 admin-console
- `just admin-core-dev`: 同时启动 admin-console 和 core-service
- `just workspace-dev`: 同时启动 site、admin-console 和 core-service
- `just admin-check`: 运行 admin-console 的 TypeScript 检查和生产构建
- `just check`: 运行博客前端、admin-console、core-service 的常用校验

## 环境变量

- `VITE_CORE_SERVICE_URL`: core-service 基础地址
- `VITE_TURNSTILE_SITE_KEY`: Cloudflare Turnstile Site Key

如果你修改了 `CORE_PORT`，记得同步设置 `VITE_CORE_SERVICE_URL`，或者直接通过 `just` 传参覆盖，例如：

```bash
CORE_PORT=8100 just admin-core-dev
```
