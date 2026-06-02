# 袁慎建的个人博客

基于 Next.js 15、FastAPI 和独立管理后台构建的个人博客仓库，聚焦 AI 软件开发、敏捷开发、测试驱动开发（TDD）、极限编程（XP）等主题。

## 仓库结构

```text
personal-blog/
├── site/              # 公开主站前端（Next.js 15）
├── admin-console/     # 管理后台（Vite + React）
├── core-service/      # 统一后端（FastAPI）
├── content/           # 博客正文 / AI 简报 / 投资简报
├── scripts/           # 仓库级脚本（内容校验、数据构建、缓存清理等）
├── tests/             # workspace 级测试（scripts / skills / blog-ai-worker）
├── skills/            # 仓库内 skills
├── docs/              # 设计、计划、排障文档
└── justfile           # 仓库统一命令入口
```

## 开发方式

在仓库根目录统一使用 `just`：

```bash
just setup
just start-site
just start-admin-console
just start-core-service
just start-site-and-core-service
just start-admin-console-and-core-service
just start-all-services
```

## 常用命令

```bash
just check-site
just check-admin-console
just check-core-service
just check

just build-site
just build-site-prod
just preview-site

just run-core-migrations
just create-core-migration "message"

just validate-content
just validate-content-file "content/blog/xxx.md"
```

## 主站单独运行

如果你要直接进入主站工程：

```bash
cd site
npm install
npm run dev
npm run test
npm run build:prod
```

## 构建产物

- 主站静态构建产物：`site/dist/`
- 后台构建产物：`admin-console/dist/`

## 部署

- 主站：GitHub Pages + Cloudflare CDN
- 管理后台：Cloudflare Pages
- 后端：Render

## 说明

- 仓库根目录不再作为主站 npm 工程入口。
- `site/` 自己持有主站相关配置和脚手架：`package.json`、`next.config.ts`、`tsconfig.json`、`eslint.config.mjs`、`vitest.config.ts`、`tailwind.config.ts`、`postcss.config.mjs`。
- 仓库根目录主要负责：内容、脚本、文档、skills、workflows 和 `just` 命令编排。
