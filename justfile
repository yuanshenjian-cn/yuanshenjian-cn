set shell := ["bash", "-uc"]

SITE_DIR := "site"
SITE_HOST := env_var_or_default("SITE_HOST", "localhost")
SITE_PORT := env_var_or_default("SITE_PORT", "3001")
ADMIN_HOST := env_var_or_default("ADMIN_HOST", "localhost")
ADMIN_PORT := env_var_or_default("ADMIN_PORT", "5173")
CORE_HOST := env_var_or_default("CORE_HOST", "127.0.0.1")
CORE_PORT := env_var_or_default("CORE_PORT", "8001")
TURNSTILE_SITE_KEY := env_var_or_default("TURNSTILE_SITE_KEY", "1x00000000000000000000AA")
CORE_PGVECTOR_CONTAINER := env_var_or_default("CORE_PGVECTOR_CONTAINER", "blog-pgvector-postgres")
CORE_PGVECTOR_PORT := env_var_or_default("CORE_PGVECTOR_PORT", "5437")
CORE_PGVECTOR_USER := env_var_or_default("CORE_PGVECTOR_USER", "postgres")
CORE_PGVECTOR_PASSWORD := env_var_or_default("CORE_PGVECTOR_PASSWORD", "postgres")
CORE_PGVECTOR_DB := env_var_or_default("CORE_PGVECTOR_DB", "ysj_blog")

# 默认列出所有可用命令。
default:
    @just --list

# 检查 npm 是否可用。
_check_node:
    @if ! command -v npm >/dev/null; then \
        printf "未找到 npm，请先安装 Node.js 20 和 npm。\n"; \
        exit 1; \
    fi

# 检查 python3 是否可用。
_check_python:
    @if ! command -v python3 >/dev/null; then \
        printf "未找到 python3，请先安装 Python 3.12。\n"; \
        exit 1; \
    fi

# 检查 uv 是否可用。
_check_uv:
    @if ! command -v uv >/dev/null; then \
        printf "未找到 uv，请先安装 uv。\n"; \
        exit 1; \
    fi

# 检查 docker 是否可用。
_check_docker:
    @if ! command -v docker >/dev/null; then \
        printf "未找到 docker，请先安装并启动 Docker Desktop。\n"; \
        exit 1; \
    fi

# 同步 core-service 本地 uv 环境依赖。
_ensure_core_venv: _check_uv
    @uv --directory core-service sync --frozen --extra dev

# 打印本地开发地址与默认调试口令。
urls:
    @printf '%s\n' \
        "Site: http://{{SITE_HOST}}:{{SITE_PORT}}" \
        "Admin Console: http://{{ADMIN_HOST}}:{{ADMIN_PORT}}" \
        "Core Service: http://localhost:{{CORE_PORT}}" \
        "Core Health: http://localhost:{{CORE_PORT}}/healthz" \
        "Core Database: 从 core-service/.env.local 或当前 shell 的 DATABASE_URL 读取" \
        "默认管理员口令: admin123456 (仅 just 本地默认环境)"

# 安装 site 依赖。
install-site: _check_node
    @npm --prefix {{SITE_DIR}} install

# 安装 admin-console 依赖。
install-admin-console: _check_node
    @npm --prefix admin-console install

# 安装或更新 core-service 本地 uv 环境依赖。
install-core-service: _ensure_core_venv

# 一次性安装三套本地开发依赖。
setup: install-site install-admin-console install-core-service

# 启动本地 pgvector Postgres 开发容器，并确保 ysj_blog 数据库存在。
start-local-pgvector-postgres: _check_docker
    @if docker ps -a --format '{{"{{.Names}}"}}' | grep -xq "{{CORE_PGVECTOR_CONTAINER}}"; then \
        if [ "$(docker inspect -f '{{"{{.State.Running}}"}}' "{{CORE_PGVECTOR_CONTAINER}}")" = "true" ]; then \
            printf "pgvector Postgres 容器已在运行: %s\n" "{{CORE_PGVECTOR_CONTAINER}}"; \
        else \
            docker start "{{CORE_PGVECTOR_CONTAINER}}" >/dev/null; \
            printf "已启动 pgvector Postgres 容器: %s\n" "{{CORE_PGVECTOR_CONTAINER}}"; \
        fi; \
    else \
        docker run -d \
            --name "{{CORE_PGVECTOR_CONTAINER}}" \
            -e POSTGRES_USER="{{CORE_PGVECTOR_USER}}" \
            -e POSTGRES_PASSWORD="{{CORE_PGVECTOR_PASSWORD}}" \
            -e POSTGRES_DB=postgres \
            -p "{{CORE_PGVECTOR_PORT}}:5432" \
            pgvector/pgvector:pg16 >/dev/null; \
        printf "已创建 pgvector Postgres 容器: %s\n" "{{CORE_PGVECTOR_CONTAINER}}"; \
    fi
    @until docker exec "{{CORE_PGVECTOR_CONTAINER}}" pg_isready -U "{{CORE_PGVECTOR_USER}}" -d postgres >/dev/null 2>&1; do \
        sleep 1; \
    done
    @if ! docker exec "{{CORE_PGVECTOR_CONTAINER}}" psql -U "{{CORE_PGVECTOR_USER}}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='{{CORE_PGVECTOR_DB}}'" | grep -q 1; then \
        docker exec "{{CORE_PGVECTOR_CONTAINER}}" psql -U "{{CORE_PGVECTOR_USER}}" -d postgres -c "CREATE DATABASE {{CORE_PGVECTOR_DB}}" >/dev/null; \
        printf "已创建数据库: %s\n" "{{CORE_PGVECTOR_DB}}"; \
    else \
        printf "数据库已存在: %s\n" "{{CORE_PGVECTOR_DB}}"; \
    fi
    @printf '%s\n' \
        "连接串: postgresql+asyncpg://{{CORE_PGVECTOR_USER}}:{{CORE_PGVECTOR_PASSWORD}}@127.0.0.1:{{CORE_PGVECTOR_PORT}}/{{CORE_PGVECTOR_DB}}" \
        "建议写入 core-service/.env.local 的 DATABASE_URL"

# 停止本地 pgvector Postgres 开发容器。
stop-local-pgvector-postgres: _check_docker
    @if docker ps --format '{{"{{.Names}}"}}' | grep -xq "{{CORE_PGVECTOR_CONTAINER}}"; then \
        docker stop "{{CORE_PGVECTOR_CONTAINER}}" >/dev/null; \
        printf "已停止 pgvector Postgres 容器: %s\n" "{{CORE_PGVECTOR_CONTAINER}}"; \
    else \
        printf "pgvector Postgres 容器未运行: %s\n" "{{CORE_PGVECTOR_CONTAINER}}"; \
    fi

# 为当前仓库安装 Git hooks。
install-git-hooks:
    @git config core.hooksPath .husky/_

# 构建 site AI 数据产物。
build-site-ai-data: _check_node
    @npm --prefix {{SITE_DIR}} run build:ai-data

# 构建 site 投资数据产物。
build-site-investment-data: _check_node
    @npm --prefix {{SITE_DIR}} run build:investment-data

# 执行 site 静态资源优化。
optimize-site-assets: _check_node
    @npm --prefix {{SITE_DIR}} run optimize-images

# 运行 site TypeScript 检查。
typecheck-site: _check_node
    @npm --prefix {{SITE_DIR}} run typecheck

# 运行 site ESLint 检查。
lint-site: _check_node
    @npm --prefix {{SITE_DIR}} run lint

# 运行 site 测试。
test-site: _check_node
    @npm --prefix {{SITE_DIR}} run test

# 以 watch 模式运行 site 测试。
test-site-watch: _check_node
    @npm --prefix {{SITE_DIR}} run test:watch

# 运行 workspace 级测试（scripts / skills）。
test-workspace: _check_node
    @./{{SITE_DIR}}/node_modules/.bin/vitest run -c {{SITE_DIR}}/vitest.workspace.config.ts

# 运行站点内容校验。
validate-content:
    @node scripts/validate-post.js

# 校验单篇内容文件。
validate-content-file path:
    @node scripts/validate-post.js "{{path}}"

# 仅校验文章路径合法性与 slug 唯一性。
validate-content-path path:
    @node scripts/validate-post.js --check-path "{{path}}"

# 按严格写作规范校验单篇文章。
validate-content-strict path:
    @node scripts/validate-post.js --strict-writing "{{path}}"

# 定向清理 AI 简报相关 Cloudflare 缓存。
purge-ai-briefing-cache date:
    @node scripts/purge-cloudflare-cache.js --scope ai-briefing --date "{{date}}"

# 定向清理投资简报相关 Cloudflare 缓存。
purge-investment-briefing-cache date:
    @node scripts/purge-cloudflare-cache.js --scope investment-briefing --date "{{date}}"

# 运行 site 全量常用校验。
check-site: typecheck-site lint-site test-site

# 运行站点生产构建。
build-site: _check_node
    @npm --prefix {{SITE_DIR}} run build

# 运行站点完整生产构建（含数据和图片）。
build-site-prod: _check_node
    @npm --prefix {{SITE_DIR}} run build:prod

# 预览站点构建产物。
preview-site: _check_node
    @npm --prefix {{SITE_DIR}} run start

# 运行 admin-console TypeScript 检查。
typecheck-admin-console: _check_node
    @npm --prefix admin-console run typecheck

# 构建 admin-console。
build-admin-console: _check_node
    @npm --prefix admin-console run build

# 启动 admin-console 开发服务器。
start-admin-console: _check_node
    @VITE_CORE_SERVICE_URL="http://localhost:{{CORE_PORT}}" \
    VITE_TURNSTILE_SITE_KEY="{{TURNSTILE_SITE_KEY}}" \
    npm --prefix admin-console run dev -- --host {{ADMIN_HOST}} --port {{ADMIN_PORT}} --strictPort

# 运行 core-service Ruff 检查。
lint-core-service: _ensure_core_venv
    @uv --directory core-service run --no-sync ruff check app tests

# 运行 core-service mypy 检查。
typecheck-core-service: _ensure_core_venv
    @uv --directory core-service run --no-sync mypy app

# 运行 core-service 测试。
test-core-service: _ensure_core_venv
    @APP_ENV=test \
    DATABASE_URL="sqlite+aiosqlite:///./test.db" \
    uv --directory core-service run --no-sync pytest tests -q

# 查看当前 Alembic 迁移版本。
show-core-migration-current: _ensure_core_venv
    @uv --directory core-service run --no-sync alembic -c alembic.ini current

# 查看 Alembic 迁移历史。
show-core-migration-history: _ensure_core_venv
    @uv --directory core-service run --no-sync alembic -c alembic.ini history --verbose

# 创建新的 Alembic migration。
create-core-migration message: _ensure_core_venv
    @uv --directory core-service run --no-sync alembic -c alembic.ini revision --autogenerate -m "{{message}}"

# 运行 admin-console 全部常用校验。
check-admin-console: typecheck-admin-console build-admin-console

# 运行 core-service 全部常用校验。
check-core-service: lint-core-service typecheck-core-service test-core-service

# 运行三套工程的常用校验。
check: check-site test-workspace check-admin-console check-core-service

# 触发 core-service 本地数据库迁移到最新版本。
run-core-migrations: _ensure_core_venv
    @APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync alembic -c alembic.ini upgrade head

# 启动 site 开发服务器。
start-site: _check_node
    @NEXT_PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    NEXT_PUBLIC_CORE_SERVICE_URL="http://localhost:{{CORE_PORT}}" \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY="{{TURNSTILE_SITE_KEY}}" \
    npm --prefix {{SITE_DIR}} run dev -- --hostname {{SITE_HOST}} --port {{SITE_PORT}}

# 启动 core-service 开发服务器，并在启动前自动执行迁移。
start-core-service: run-core-migrations
    @APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync uvicorn app.main:app --reload --host {{CORE_HOST}} --port {{CORE_PORT}}

# 同时启动 site 和 core-service。
start-site-and-core-service: _check_node _ensure_core_venv
    @trap 'kill 0' INT TERM EXIT; \
    APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync alembic -c alembic.ini upgrade head && \
    APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync uvicorn app.main:app --reload --host {{CORE_HOST}} --port {{CORE_PORT}} & \
    NEXT_PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    NEXT_PUBLIC_CORE_SERVICE_URL="http://localhost:{{CORE_PORT}}" \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY="{{TURNSTILE_SITE_KEY}}" \
    npm --prefix {{SITE_DIR}} run dev -- --hostname {{SITE_HOST}} --port {{SITE_PORT}} & \
    wait

# 同时启动 admin-console 和 core-service。
start-admin-console-and-core-service: _check_node _ensure_core_venv
    @trap 'kill 0' INT TERM EXIT; \
    APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync alembic -c alembic.ini upgrade head && \
    APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync uvicorn app.main:app --reload --host {{CORE_HOST}} --port {{CORE_PORT}} & \
    VITE_CORE_SERVICE_URL="http://localhost:{{CORE_PORT}}" \
    VITE_TURNSTILE_SITE_KEY="{{TURNSTILE_SITE_KEY}}" \
    npm --prefix admin-console run dev -- --host {{ADMIN_HOST}} --port {{ADMIN_PORT}} --strictPort & \
    wait

# 同时启动 site、admin-console 和 core-service。
start-all-services: _check_node _ensure_core_venv
    @trap 'kill 0' INT TERM EXIT; \
    APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync alembic -c alembic.ini upgrade head && \
    APP_ENV=local \
    PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    API_PUBLIC_BASE_URL="http://localhost:{{CORE_PORT}}" \
    SESSION_SECRET="dev-session-secret" \
    ADMIN_SECRET_HASH="0e926fc654f93f0a1687a22384c7c27f03ccf038cf7cf3ab37fc6177f8553317" \
    uv --directory core-service run --no-sync uvicorn app.main:app --reload --host {{CORE_HOST}} --port {{CORE_PORT}} & \
    NEXT_PUBLIC_SITE_URL="http://{{SITE_HOST}}:{{SITE_PORT}}" \
    NEXT_PUBLIC_CORE_SERVICE_URL="http://localhost:{{CORE_PORT}}" \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY="{{TURNSTILE_SITE_KEY}}" \
    npm --prefix {{SITE_DIR}} run dev -- --hostname {{SITE_HOST}} --port {{SITE_PORT}} & \
    VITE_CORE_SERVICE_URL="http://localhost:{{CORE_PORT}}" \
    VITE_TURNSTILE_SITE_KEY="{{TURNSTILE_SITE_KEY}}" \
    npm --prefix admin-console run dev -- --host {{ADMIN_HOST}} --port {{ADMIN_PORT}} --strictPort & \
    wait
