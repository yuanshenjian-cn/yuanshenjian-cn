# AGENTS.md - 个人博客开发指南

## 通用规则

- **回复语言**: 使用中文与用户交流。

## 概述

这是一个基于 Next.js 15 的个人博客，使用 TypeScript、Tailwind CSS 和 MDX 构建。站点采用 App Router、静态导出（`output: 'export'`）和中文本地化。

## 构建命令

```bash
# 开启热重载的开发服务器
npm run dev

# 构建生产版本（静态导出到 /dist）
npm run build

# 启动生产服务器
npm run start

# 运行 ESLint
npm run lint
```

## 测试

本项目当前未配置测试套件。如需添加测试：
- 使用 Vitest 进行单元测试
- 使用 Playwright 进行 E2E 测试
- 运行测试：`npm test`
- 运行单个测试：`npm test -- <filename>`

## TypeScript 规范

- **严格模式**: 始终启用。不允许隐式 `any`，启用严格空值检查。
- **类型推断**: 明显的类型让 TypeScript 推断；显式标注函数返回值类型。
- **接口 vs 类型**: 组件 props 和对象类型使用 `interface`；联合类型、基本类型和工具类型使用 `type`。
- **泛型**: 为可复用的 hooks 和组件使用泛型（如 `MDXComponents`）。

## 代码风格

### 导入顺序
```typescript
// 标准顺序：外部模块 → 绝对路径 → 相对路径
import React from 'react';
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog";

// 客户端组件在顶部使用 'use client' 指令
"use client";
```

### 命名规范
- **组件**: PascalCase（如 `Header`、`Footer`）
- **文件**: 非组件文件使用 kebab-case，组件使用 PascalCase
- **变量/函数**: camelCase
- **常量**: 常量使用 UPPER_SNAKE_CASE，其他使用 camelCase
- **CSS 类**: 使用 Tailwind 工具类；除非必要，不使用自定义 CSS

### 组件模式
```typescript
// 服务器组件：默认 async
export default async function BlogPage() { }

// 客户端组件：'use client' 指令
"use client";
export function Header() { }

// Props 接口命名
interface Props {
  params: Promise<{ slug: string }>;
}
```

### Tailwind CSS
- 使用 `tailwind.config.ts` 中定义的 CSS 变量（如 `hsl(var(--background))`）
- 遵循 shadcn/ui 颜色模式：`background`、`foreground`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring`
- 自定义动画在 tailwind.config.ts 中定义（fade-in、slide-up 等）

### 错误处理
- 在服务器组件中使用 Next.js `notFound()` 处理 404
- 条件不满足时提前返回
- 服务器组件中不使用 try/catch，除非处理特定错误

### MDX 配置
- MDX 文件位于 `/content/` 目录，带有 frontmatter
- 自定义 MDX 组件位于 `lib/mdx.tsx`
- 支持的插件：remark-gfm、rehype-prism-plus
- 扩展名：`.mdx`

### App Router 结构
```
app/
├── layout.tsx     # 根布局（含 providers）
├── page.tsx       # 首页
├── error.tsx      # 错误边界
├── not-found.tsx  # 404 页面
└── [route]/       # 动态路由
    └── page.tsx
```

## 部署信息

### GitHub Pages 部署
- **部署平台**: GitHub Pages
- **自定义域名**: `yuanshenjian.cn`
- **CDN 加速**: Cloudflare（已配置缓存）
- **构建输出**: `/dist` 目录

### 域名配置
- **域名文件**: 项目根目录 `CNAME` 文件包含 `yuanshenjian.cn`
- **DNS 解析**: 指向 GitHub Pages 服务器
- **SSL/TLS**: Cloudflare 提供 HTTPS 加密

### 部署工作流
- **触发条件**: `main` 分支推送或手动触发
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)
- **Node.js 版本**: 20.x
- **构建流程**:
  1. Checkout 代码
  2. 安装依赖 (`npm ci`)
  3. 恢复 Next.js 构建缓存
  4. 执行构建 (`npm run build`)
  5. 上传构建产物
  6. 部署到 GitHub Pages

## 环境变量

复制 `.env.example` 创建 `.env` 文件：

```bash
NEXT_PUBLIC_SITE_URL=https://yuanshenjian.cn

# Giscus 评论系统配置
NEXT_PUBLIC_GISCUS_REPO=yourusername/blog-comments
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDxxxxxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDxxxxxxxx
```

## 其他说明
- 静态导出：所有路由在构建时预渲染
- 无数据库：内容从 `/content/` 目录的 MDX 文件读取
- 图片未优化（静态导出限制）
- 基础路径：空字符串（`""`）
- 评论系统：Giscus（基于 GitHub Discussions）
- 主题：支持明暗模式切换（next-themes）
- PWA：支持离线访问，配置位于 `public/manifest.json` 和 `public/sw.js`
