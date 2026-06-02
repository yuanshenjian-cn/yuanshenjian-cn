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
NEXT_PUBLIC_GISCUS_REPO=username/repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxx
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxx
```

Giscus 配置获取：https://giscus.app/zh-CN
