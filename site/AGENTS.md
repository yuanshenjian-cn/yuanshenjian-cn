# AGENTS.md — site 工程规范

本文件为 AI 编程助手在 `site/` 目录中的工作约束与工程规范。

## 技术栈

- **框架**: Next.js 15（App Router）+ React 19
- **语言**: TypeScript 5（严格模式）
- **样式**: Tailwind CSS 3.4 + shadcn/ui
- **内容**: MDX + gray-matter（remark-gfm、rehype-prism-plus、rehype-slug）
- **测试**: Vitest
- **PWA**: manifest.json + Service Worker

---

## 目录结构

```
site/
├── app/          # Next.js App Router（路由和页面）
├── components/   # React 组件
├── hooks/        # 自定义 React hooks
├── lib/          # 主站业务逻辑
├── public/       # 静态资源（含构建产物）
├── tests/        # Vitest 测试
└── types/        # TypeScript 类型定义
```

文章源文件位于仓库根目录的 `content/blog/`，不放在 `site/` 内。

---

## TypeScript 规范

- **严格模式**：始终启用，不允许隐式 `any`
- **类型定义**：主站类型定义优先放 `site/types/`，组件内部类型就近定义
- **接口 vs 类型**：Props 使用 `interface`，联合类型使用 `type`
- **避免断言**：优先使用类型守卫，避免 `as` 断言

---

## 代码规范

### 命名规范

- 组件：PascalCase（`Header`、`Footer`）
- 文件：组件用 PascalCase，其他用 kebab-case
- 变量 / 函数：camelCase
- 常量：UPPER_SNAKE_CASE

### 目录与文件边界

- `components/` 只放 React 组件；hooks 放 `hooks/`，业务/脚本工具放 `lib/`
- `components/**` 中导出 React 组件的文件名必须与组件名一致，统一使用 PascalCase
- 同一目录下不要混用 `PascalCase.tsx` 和 `kebab-case.tsx` 组件文件
- 新增组件时优先放入按职责分组的子目录，如 `article/`、`layout/`、`theme/`、`system/`、`search/`

### 组件模式

```typescript
// 服务器组件（默认 async）
export default async function ArticlePage() { }

// 客户端组件（需要 'use client' 指令）
"use client";
export function ThemeToggle() { }
```

### 导入顺序

```typescript
// 外部模块 → 绝对路径（@/）→ 相对路径
import React from 'react';
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
```

### Tailwind CSS

- 使用 `site/tailwind.config.ts` 中的 CSS 变量（`hsl(var(--background))`）
- 遵循 shadcn/ui 颜色系统
- 避免自定义 CSS，优先使用工具类

### 错误处理

- 服务器组件用 `notFound()` 处理 404
- 文件读取失败记录日志但不中断其他文章加载
- `console.warn` 用于非致命错误，`console.error` 用于致命错误

---

## 核心架构约定

### 作者资料数据源

- `site/lib/author-profile-data.js` 是作者资料的**单一真相源**（Single Source of Truth）
- 作者页 UI 与 AI 数据生成都必须从这份数据派生，不要各维护一套
- `site/lib/author-profile.ts` 只作为 TS 封装与消费入口，不应手写另一份作者资料
- `site/public/ai-data/author.json` 是构建产物，由 `scripts/build-ai-data.js` 自动生成，**禁止手改**

### MDX 内容约定

- 文章源文件位于仓库根目录 `content/blog/`
- 必需 frontmatter 字段：`title`、`date`
- 可选字段：`tags`、`published`、`brief`
- 支持插件：remark-gfm、rehype-prism-plus、rehype-slug

---

### 小工具（`/tools`）约定

小工具是独立的 HTML 单页，不走 React 渲染，直接由静态托管。

| 项目 | 位置 |
|---|---|
| 工具 HTML | `site/public/tools/<slug>/view.html` |
| 注册表（唯一真相源） | `site/data/tools.json` |
| 读取层 | `site/lib/tools.ts` |
| 列表页 / 详情页 | `site/app/tools/page.tsx`、`site/app/tools/[slug]/page.tsx` |
| 列表组件 | `site/components/tools/` |

新增工具只需两步，**不要改任何 TSX 代码**：

```bash
# 复制 HTML 并登记到注册表
just add-tool "/path/to/tool.html" pomodoro "番茄钟" "一次只做一件事" "🍅" "效率,专注"
```

或手动放置 `site/public/tools/<slug>/view.html` 后在 `site/data/tools.json` 追加一条：

```json
{ "slug": "pomodoro", "title": "番茄钟", "description": "…", "emoji": "🍅", "tags": ["效率"], "addedAt": "2026-11-14" }
```

约束：

- **入口文件名固定为 `view.html`**。详情页路由 `/tools/<slug>` 静态导出时会占用 `dist/tools/<slug>/index.html`，放 `index.html` 会被覆盖成裸 HTML（有测试守护）
- `slug` 只能是小写字母、数字、中划线，且全局唯一；它就是 URL 与目录名
- `title`、`description` 必填；`emoji` 缺省为 🧩
- 工具页通过 iframe 承载，`localStorage` 可用，不要给 iframe 加 `sandbox`
- 工具目录内可放图片等相对资源，用相对路径引用即可
- 列表页的卡片 / 列表视图偏好保存在 `localStorage`（key：`ysj-tools-view-mode`）

---

## 质量门禁

完成 site 改动前必须运行根目录定义的前端校验命令（typecheck + lint + test）；具体命令见根目录 `AGENTS.md`。

---

## 环境变量

不要提交 `.env.local` 到 Git。本地初始化：

```bash
cp .env.example .env.local
```

主站关键变量：

```bash
NEXT_PUBLIC_SITE_URL=https://yuanshenjian.cn
NEXT_PUBLIC_CORE_SERVICE_URL=https://api.yuanshenjian.cn
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```
