# 袁慎建的个人博客

基于 Next.js 15 构建的现代化个人博客，专注于敏捷开发、测试驱动开发（TDD）、极限编程（XP）等技术知识分享。目前已发布 **42 篇**技术文章，分布在 4 个核心主题分类。

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

## 功能特性

- 📝 **MDX 支持**: 使用 Markdown + JSX 撰写文章，支持在文章中嵌入 React 组件
- 🎨 **现代化设计**: 基于 Tailwind CSS 和 shadcn/ui 设计系统，支持明暗主题切换
- 🔍 **全局搜索**: 支持快捷键搜索（⌘K），快速找到目标文章
- 💬 **评论系统**: 集成 Giscus 评论系统，基于 GitHub Discussions，支持 Markdown
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🔧 **代码高亮**: 使用 Prism Plus 实现语法高亮
- 📊 **SEO 优化**: 自动生成 sitemap 和 robots.txt，支持 Open Graph 元数据
- 📰 **RSS 订阅**: 支持 RSS Feed，方便读者订阅
- 🚀 **静态导出**: 构建时生成静态 HTML，部署到 GitHub Pages
- 📲 **PWA 支持**: 支持离线访问，可安装为桌面/移动应用
- ⚡ **性能优化**: 代码分割、懒加载、缓存机制等优化

## 技术栈

### 核心框架
- **Next.js 15**: React 框架，使用 App Router 和静态导出
- **React 19**: UI 库
- **TypeScript**: 类型安全的 JavaScript 超集

### 样式方案
- **Tailwind CSS 3.4**: 原子化 CSS 框架
- **PostCSS**: CSS 后处理器
- **Autoprefixer**: 自动添加浏览器前缀

### 内容管理
- **MDX**: Markdown 扩展，支持 JSX
- **gray-matter**: 解析 frontmatter
- **remark-gfm**: GitHub Flavored Markdown 支持
- **rehype-prism-plus**: 代码高亮
- **rehype-slug**: 自动生成标题锚点

### 评论系统
- **Giscus**: 基于 GitHub Discussions 的评论系统

### 图标库
- **lucide-react**: 现代化图标库

### 其他工具
- **clsx**: 条件类名工具
- **tailwind-merge**: 合并 Tailwind 类名
- **github-slugger**: 生成 URL 友好的 slug

## 快速开始

### 环境要求

- Node.js >= 20.x
- npm >= 9.x

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/blog.git
cd blog

# 安装依赖
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写实际配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 站点基础配置
NEXT_PUBLIC_SITE_URL=https://yuanshenjian.cn

# Giscus 评论系统配置
# 在 https://giscus.app 配置后获取以下值
NEXT_PUBLIC_GISCUS_REPO=yourusername/blog-comments
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDxxxxxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDxxxxxxxx
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 本地预览生产版本

```bash
npm run start
```

## 项目结构

```
personal-blog/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 根布局（字体、Providers）
│   ├── page.tsx             # 首页
│   ├── articles/            # 文章列表及详情路由
│   ├── about/              # 关于页面
│   ├── resume/             # 简历页面
│   ├── feed/               # RSS 订阅
│   ├── sitemap.ts          # SEO Sitemap
│   ├── robots.ts           # Robots.txt
│   ├── error.tsx           # 错误页面
│   └── not-found.tsx       # 404 页面
├── components/             # React 组件（22 个组件）
│   ├── header.tsx         # 站点导航
│   ├── footer.tsx         # 页脚
│   ├── articles-content.tsx  # 文章列表
│   ├── giscus-comments.tsx  # Giscus 评论系统
│   ├── global-search.tsx    # 全局搜索（支持 ⌘K 快捷键）
│   ├── table-of-contents.tsx # 文章目录
│   ├── code-block.tsx     # 代码高亮显示
│   └── resume/              # 简历相关组件
├── lib/                    # 工具库
│   ├── blog.ts            # 博客数据逻辑
│   ├── mdx.tsx            # MDX 渲染
│   ├── config.ts          # 配置文件
│   └── utils.ts           # 工具函数
├── content/blog/           # MDX 文章内容（42 篇文章）
│   ├── agile/             # 敏捷开发（8 篇）
│   ├── career/            # 职业发展（12 篇）
│   ├── oo/                # 面向对象（4 篇）
│   └── xp/                # 极限编程（18 篇）
├── public/                # 静态资源
├── types/                 # TypeScript 类型定义
├── scripts/               # 工具脚本
├── tailwind.config.ts     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
├── next.config.ts         # Next.js 配置
└── package.json           # 项目依赖
```

## 配置说明

### 站点配置

主要配置位于 `lib/config.ts`：

```typescript
export const config = {
  posts: {
    perPage: 12,  // 每页显示文章数
  },
  readingTime: {
    charactersPerMinute: 600,  // 阅读速度（字符/分钟）
    wordsPerMinute: 200,       // 阅读速度（词/分钟）
  },
} as const;
```

### Tailwind 主题配置

主题变量在 `app/globals.css` 中定义，遵循 shadcn/ui 设计系统：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 10%;
  --primary: 0 0% 10%;
  /* ... */
}
```

### MDX 配置

MDX 插件配置位于 `next.config.ts`：

```typescript
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],           // GitHub Flavored Markdown
    rehypePlugins: [rehypeSlug, rehypePrismPlus],  // 自动生成标题 ID + 代码高亮
  },
  extension: /\.mdx?$/,
});
```

## 文章编写规范

### 文件组织

文章按类别组织在 `content/blog/` 目录下：

```
content/blog/
├── agile/      # 敏捷开发（8 篇）
├── career/     # 职业发展（12 篇）
├── oo/         # 面向对象（4 篇）
└── xp/         # 极限编程（18 篇）
```

每个分类目录下包含对应主题的 `.mdx` 文件。

### Frontmatter 格式

每篇文章必须包含 frontmatter：

```mdx
---
title: 文章标题
date: '2024-08-04'
tags:
  - 标签1
  - 标签2
published: true
brief: 文章摘要，用于列表展示和 SEO
---

文章内容...
```

**字段说明**：
- `title`: 文章标题（必填）
- `date`: 发布日期，格式为 `YYYY-MM-DD`（必填）
- `tags`: 文章标签列表（可选）
- `published`: 是否发布，设为 `false` 不会在网站显示（默认 `true`）
- `brief`: 文章摘要，用于列表展示（可选，默认取文章前 200 字）

### 文件命名

文件名使用 kebab-case，例如：
- `tdd-best-practices.mdx`
- `agile-manifesto-guide.mdx`

### MDX 语法支持

- 标准 Markdown 语法
- GFM（GitHub Flavored Markdown）扩展
- 代码块语法高亮
- 嵌入 React 组件（需要先在 `lib/mdx.tsx` 中注册）

## 部署指南

### GitHub Pages 部署

本项目已配置 GitHub Actions 自动部署，推送到 `main` 分支后自动触发。

部署配置位于 `.github/workflows/deploy.yml`。

### 自定义域名

1. 在项目根目录创建 `CNAME` 文件，写入域名：
   ```
   yuanshenjian.cn
   ```

2. 在 DNS 提供商处配置 A 记录或 CNAME 记录指向 GitHub Pages。

### 环境变量配置

在 GitHub 仓库设置中添加以下 Secrets：

- `NEXT_PUBLIC_SITE_URL`: 站点 URL
- `NEXT_PUBLIC_GISCUS_REPO`: GitHub 仓库（用于评论）
- `NEXT_PUBLIC_GISCUS_REPO_ID`: 仓库 ID
- `NEXT_PUBLIC_GISCUS_CATEGORY`: 讨论分类
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`: 分类 ID

## 开发规范

### 代码风格

项目使用 ESLint 进行代码检查：

```bash
npm run lint
```

### TypeScript

项目使用 TypeScript 严格模式，类型定义位于 `types/` 目录。

### 组件开发

- 服务端组件：默认 async，不使用 'use client'
- 客户端组件：必须使用 'use client' 指令
- 组件 props 使用 interface 定义类型

### 提交规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建/工具配置更新
```

## 常见问题

### 如何添加新文章？

在 `content/blog/` 对应分类下创建新的 `.mdx` 文件，按照 frontmatter 格式编写。

### 如何修改主题？

在 `app/globals.css` 中修改 CSS 变量，或使用 Tailwind 的 dark 类。

### 如何添加新的 MDX 组件？

在 `lib/mdx.tsx` 中的 `mdxComponents` 对象中注册：

```typescript
const mdxComponents: MDXComponents = {
  // ... 现有组件
  CustomComponent: (props) => <div {...props} />,
};
```

### 如何调整每页显示的文章数？

修改 `lib/config.ts` 中的 `posts.perPage` 配置。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 博客: https://yuanshenjian.cn
- GitHub: https://github.com/your-username
- Email: yuanshenjian@foxmail.com

## 致谢

感谢以下开源项目：
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Giscus](https://giscus.app/)
