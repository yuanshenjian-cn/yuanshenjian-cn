# AGENTS.md - 个人博客开发指南

## 通用规则

- **回复语言**: 使用中文与用户交流。

## 项目概述

基于 Next.js 15 的个人博客，使用 TypeScript、Tailwind CSS 和 MDX 构建。采用 App Router 和静态导出（`output: 'export'`），部署到 GitHub Pages。

## 核心命令

```bash
npm run dev           # 开发服务器
npm run build         # 构建生产版本（输出到 /dist）
npm run lint          # 代码检查
npm run optimize-images  # 图片优化
```

## TypeScript 规范

- **严格模式**: 始终启用，不允许隐式 `any`
- **类型定义**: 全局类型放在 `types/` 目录，组件内部类型就近定义
- **接口 vs 类型**: Props 使用 `interface`，联合类型使用 `type`
- **避免断言**: 优先使用类型守卫而非 `as` 断言

## 代码规范

### 命名规范
- 组件：PascalCase（`Header`、`Footer`）
- 文件：组件用 PascalCase，其他用 kebab-case
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE

### 组件模式
```typescript
// 服务器组件 - 默认 async
export default async function ArticlePage() { }

// 客户端组件 - 需要 'use client' 指令
"use client";
export function ThemeToggle() { }
```

### 导入顺序
```typescript
// 外部模块 → 绝对路径 → 相对路径
import React from 'react';
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
```

### Tailwind CSS
- 使用 `tailwind.config.ts` 中的 CSS 变量（`hsl(var(--background))`）
- 遵循 shadcn/ui 颜色系统
- 避免自定义 CSS，优先使用工具类

### 错误处理
- 服务器组件用 `notFound()` 处理 404
- 文件读取失败记录日志但不中断其他文章加载
- `console.warn` 用于非致命错误，`console.error` 用于致命错误

## 核心架构

### 目录结构
```
app/          # Next.js App Router（路由和页面）
components/   # React 组件（22 个）
lib/          # 核心业务逻辑（blog.ts、mdx.tsx、config.ts）
content/blog/ # MDX 文章（agile、career、oo、xp）
public/       # 静态资源
types/        # TypeScript 类型定义
```

### MDX 配置
- 文章位于 `/content/blog/` 目录
- 必需字段：`title`、`date`
- 可选字段：`tags`、`published`、`brief`
- 支持插件：remark-gfm、rehype-prism-plus、rehype-slug

## 环境变量

**⚠️ 重要**: 不要提交 `.env.local` 到 Git！

### 本地开发
```bash
cp .env.example .env.local
```

### 必需变量
```bash
NEXT_PUBLIC_SITE_URL=https://yuanshenjian.cn
NEXT_PUBLIC_GISCUS_REPO=username/repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxx
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxx
```

配置获取：https://giscus.app/zh-CN

## 部署

- **平台**: GitHub Pages + Cloudflare CDN
- **域名**: yuanshenjian.cn
- **工作流**: `.github/workflows/deploy.yml`
- **触发**: 推送到 `main` 分支
- **Node.js**: 20.x

## 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript 5（严格模式）
- **样式**: Tailwind CSS 3.4 + shadcn/ui
- **内容**: MDX + gray-matter
- **评论**: Giscus（GitHub Discussions）
- **主题**: next-themes（明暗模式）
- **PWA**: manifest.json + Service Worker


## 待改进项

- [ ] 添加单元测试（Vitest）
- [ ] 添加 E2E 测试（Playwright）
- [ ] 图片运行时优化（WebP）
- [ ] Bundle 大小监控
- [ ] 浏览器缓存策略优化