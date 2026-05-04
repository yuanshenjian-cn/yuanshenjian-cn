# 袁慎建的个人博客

基于 Next.js 15 构建的现代化个人博客，专注于 AI 软件开发、敏捷开发、测试驱动开发（TDD）、极限编程（XP）等技术知识分享。

[![Next.js](https://img.shields.io/badge/Next.js-15.5.15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

## 功能特性

- **Markdown 内容管线**: 文章以 `.md` 为主，统一通过现有渲染链支持 GFM、代码高亮与少量内联 HTML/组件能力
- **专栏系统**: 支持系列文章聚合展示，每个专栏有独立的阅读路径和导航
- **现代化设计**: 基于 Tailwind CSS 和 shadcn/ui 设计系统，支持明暗主题切换
- **全局搜索**: 支持快捷键搜索（⌘K），快速找到目标文章
- **评论系统**: 集成 Giscus 评论系统，基于 GitHub Discussions，支持 Markdown
- **OG 图片**: 提供静态 Open Graph 默认分享卡片，支持文章级元数据
- **响应式设计**: 完美适配桌面端和移动端
- **代码高亮**: 使用 Prism Plus 实现语法高亮
- **SEO 优化**: 自动生成 sitemap 和 robots.txt，支持 Open Graph 元数据
- **RSS 订阅**: 支持 RSS Feed，方便读者订阅
- **静态导出**: 构建时生成静态 HTML，部署到 GitHub Pages
- **PWA 支持**: 支持离线访问，可安装为桌面/移动应用
- **测试覆盖**: 使用 Vitest + Testing Library 进行单元测试
- **首页 AI 推荐**: 首页 Hero 内嵌 AI 输入框，支持可配置快捷主题、站内文章推荐、错误提示与推荐结果卡片，由 Cloudflare Worker 承接请求并做人机校验、限流与推荐兜底

## 技术栈

### 核心框架
- **Next.js 15**: React 框架，使用 App Router 和静态导出
- **React 19**: UI 库
- **TypeScript**: 类型安全的 JavaScript 超集

### 内容管理
- **Markdown（.md）**: 文章主格式，支持 frontmatter 与 GFM 扩展
- **next-mdx-remote**: 统一内容渲染管线（兼容 `.md` / `.mdx`）
- **gray-matter**: 解析 frontmatter
- **remark-gfm**: GitHub Flavored Markdown 支持
- **rehype-prism-plus**: 代码高亮
- **rehype-slug**: 自动生成标题锚点

### 样式方案
- **Tailwind CSS 3.4**: 原子化 CSS 框架
- **@tailwindcss/typography**: 排版插件
- **PostCSS**: CSS 后处理器
- **Autoprefixer**: 自动添加浏览器前缀

### 图标与图片
- **lucide-react**: 现代化图标库
- **qrcode.react**: 分享二维码生成
- **sharp**: 图片处理与优化

### 评论系统
- **Giscus**: 基于 GitHub Discussions 的评论系统

### 测试
- **Vitest**: 单元测试框架
- **@testing-library/react**: React 组件测试
- **jsdom**: 浏览器环境模拟

### 其他工具
- **clsx**: 条件类名工具
- **tailwind-merge**: 合并 Tailwind 类名
- **github-slugger**: 生成 URL 友好的 slug
- **husky**: Git hooks

### AI 推荐基础设施
- **Cloudflare Workers**: 承接 `/api/ai/chat` 请求
- **Cloudflare Turnstile**: 人机校验
- **Workers KV**: 固定窗口限流
- **OpenAI-compatible LLM provider**: 当前通过腾讯 TokenHub 接入

## 快速开始

### 环境要求

- Node.js >= 20.x < 21
- npm >= 9.x

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/yuanshenjian-cn/yuanshenjian-cn.git
cd yuanshenjian-cn

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

# 首页 AI 推荐（可选）
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AI_WORKER_URL=https://yuanshenjian.cn/api/ai
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

> 注意：
>
> - `NEXT_PUBLIC_AI_WORKER_URL` 和 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 会注入前端，可以放 GitHub Variables / `.env.local`
> - LLM API Key、Turnstile Secret Key 只能放在 Cloudflare Worker secrets，不能进前端

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 构建生产版本

```bash
# 仅构建（不含图片优化）
npm run build

# 完整生产构建（图片优化 + 构建，用于部署）
npm run build:prod
```

构建产物将输出到 `dist/` 目录。

### 本地预览生产版本

```bash
npm run build:prod
npm run start
```

`npm run start` 会用 `serve` 预览静态导出的 `dist/` 目录，不使用 `next start`。

## 项目结构

```
personal-blog/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 根布局（字体、Providers）
│   ├── page.tsx             # 首页
│   ├── articles/            # 文章列表及详情路由
│   ├── ai/                  # AI 编程专栏展示页
│   ├── about/               # 关于页面
│   ├── resume/              # 简历页面
│   ├── feed/                # RSS 订阅
│   ├── sitemap.ts           # SEO Sitemap
│   ├── robots.ts            # Robots.txt
│   ├── error.tsx            # 错误页面
│   └── not-found.tsx        # 404 页面
├── components/              # React 组件
│   ├── ai/                  # AI 推荐相关组件
│   │   └── ai-recommend-widget.tsx
│   ├── header.tsx           # 站点导航
│   ├── footer.tsx           # 页脚
│   ├── articles-content.tsx # 文章列表
│   ├── column-icons.tsx     # 专栏图标
│   ├── column-navigation.tsx # 专栏导航
│   ├── global-search.tsx    # 全局搜索（支持 ⌘K 快捷键）
│   ├── giscus-comments.tsx  # Giscus 评论系统
│   ├── table-of-contents.tsx # 文章目录
│   ├── code-block.tsx       # 代码高亮显示
│   ├── share-buttons.tsx    # 分享按钮（含二维码）
│   ├── post-navigation.tsx  # 文章上下篇导航
│   └── resume/              # 简历相关组件
├── lib/                     # 工具库
│   ├── ai-client.ts        # 前端 AI 请求封装
│   ├── blog.ts             # 博客数据逻辑
│   ├── columns.ts          # 专栏注册与文章关联
│   ├── mdx.tsx             # MDX 渲染
│   ├── config.ts           # 站点配置
│   └── utils.ts            # 工具函数
├── content/blog/            # Markdown/MDX 文章内容（.md / .mdx 文件）
│   ├── swd/                 # 软件开发
│   │   ├── agile/           # 敏捷开发
│   │   ├── ai-coding/       # AI 编程（专栏）
│   │   │   ├── ai-frontier/ # AI 前沿
│   │   │   ├── claudecode/  # Claude Code
│   │   │   ├── deepseek/    # DeepSeek
│   │   │   ├── opencode/    # OpenCode
│   │   │   └── codex/       # Codex
│   │   ├── oo/              # 面向对象
│   │   └── xp/              # 极限编程
│   │       ├── tdd/         # 测试驱动开发
│   │       ├── testing/     # 测试策略
│   │       ├── simple-design/ # 简单设计
│   │       └── refactoring/ # 代码重构
│   ├── career/              # 职业发展
│   ├── fitness/             # 运动健康
│   ├── investment/          # 投资理财
│   ├── life/                # 生活杂谈
│   └── talkshow/            # 脱口秀
├── tests/                   # 测试文件
│   ├── lib/                 # 工具库测试
│   └── setup.ts             # 测试环境配置
├── public/                  # 静态资源
│   ├── icons/               # PWA 图标
│   ├── screenshots/         # PWA 截图
│   ├── images/              # 文章配图
│   ├── docs/                # 文档资源（简历 PDF）
│   ├── ai-data/             # 首页 AI 推荐静态索引
│   ├── sw.js                # Service Worker
│   └── manifest.json        # PWA 配置
├── types/                   # TypeScript 类型定义
│   └── ai.ts               # AI 请求/响应与 Turnstile 类型
├── scripts/                 # 工具脚本
│   ├── build-ai-data.js     # 生成首页 AI 推荐静态索引
│   ├── optimize-images.js   # 图片优化
│   ├── check-images.js      # 图片检查
│   └── pwa/                 # PWA 相关脚本
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml           # 自动部署配置
├── blog-ai-worker/          # Cloudflare Worker（AI 推荐后端）
├── tailwind.config.ts       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
├── next.config.ts           # Next.js 配置
├── vitest.config.ts         # Vitest 配置
└── package.json             # 项目依赖
```

## 配置说明

### 站点配置

主要配置位于 `lib/config.ts`：

```typescript
export const config = {
  posts: {
    perPage: 12,              // 每页显示文章数
    excerptLength: 200,       // 摘要长度
  },
  readingTime: {
    charactersPerMinute: 600, // 阅读速度（字符/分钟）
    wordsPerMinute: 200,      // 阅读速度（词/分钟）
  },
  site: {
    url: "https://yuanshenjian.cn",
    name: "袁慎建的博客",
    description: "记录思考，分享成长。技术实践、敏捷方法、生活随笔。",
    ogImage: "/images/og-default.webp",
    locale: "zh_CN",
  },
} as const;
```

### 专栏配置

专栏注册在 `lib/columns.ts` 的 `AI_COLUMNS` 数组中定义：

```typescript
const AI_COLUMNS: ColumnConfig[] = [
  {
    slug: "claudecode",
    title: "Claude Code",
    description: "从入门到进阶，系统整理 Claude Code 的工作流...",
    contentDir: "swd/ai-coding/claudecode",
    guide: {
      intro: "共 10 篇，从心智模型到高阶自动化...",
      paths: [
        { label: "赶时间", description: "直接从第 2 篇开始上手..." },
        // ...
      ],
    },
  },
  // ...
];
```

每个专栏需要同时在 `components/column-icons.tsx` 中注册对应的 SVG 图标。

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

### 内容渲染配置

内容渲染相关插件配置位于 `lib/mdx.tsx`，由 `next-mdx-remote/rsc` 在渲染文章时执行：

```typescript
<MDXRemote
  source={content}
  options={{
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypePrismPlus],
    },
  }}
/>
```

## 文章编写规范

### 文件组织

文章按主题组织在 `content/blog/` 目录下：

```
content/blog/
├── swd/                  # 软件开发
│   ├── agile/            # 敏捷开发
│   ├── ai-coding/        # AI 编程（专栏）
│   │   ├── ai-frontier/  # AI 前沿
│   │   ├── claudecode/   # Claude Code
│   │   ├── opencode/     # OpenCode
│   │   └── codex/        # Codex
│   ├── oo/               # 面向对象
│   └── xp/               # 极限编程
│       ├── tdd/          # 测试驱动开发
│       ├── testing/      # 测试策略
│       ├── simple-design/# 简单设计
│       └── refactoring/  # 代码重构
├── career/               # 职业发展
├── fitness/              # 运动健康
├── investment/           # 投资理财
├── life/                 # 生活杂谈
└── talkshow/             # 脱口秀
```

专栏文章需要额外在 `lib/columns.ts` 中注册，非专栏文章直接放入对应主题目录即可。

### Frontmatter 格式

每篇文章必须包含 frontmatter：

```markdown
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
- `tdd-best-practices.md`
- `agile-manifesto-guide.md`

### Markdown 语法支持

- 标准 Markdown 语法
- GFM（GitHub Flavored Markdown）扩展
- 代码块语法高亮
- 少量内联 HTML / 组件能力（如需扩展渲染映射，在 `lib/mdx.tsx` 中注册）

## 部署指南

### GitHub Pages 部署

本项目已配置 GitHub Actions 自动部署，推送到 `main` 分支后自动触发。部署流程包含类型检查、单元测试和构建三个步骤。

部署配置位于 `.github/workflows/deploy.yml`。

### 首页 AI 推荐 / Cloudflare Worker 部署

首页 AI 推荐不是直接在前端请求模型，而是通过 `blog-ai-worker/` 目录下的 Cloudflare Worker 统一处理：

- Turnstile 校验
- Turnstile hostname / action 校验
- 请求限流
- 全局日预算止损与紧急关闭
- 读取 `public/ai-data/index.json`
- 调用 LLM provider
- 在上游模型不稳定时回退为站内确定性推荐

#### 本地检查

```bash
npm run build:ai-data
npm --prefix blog-ai-worker run typecheck
```

#### 初始化并切换 LLM Profile

```bash
cd blog-ai-worker
cp llm-profiles.example.jsonc llm-profiles.local.jsonc
# 填入真实 baseUrl / apiKey / modelId

npm run llm:list
npm run llm:use -- tencent-tokenhub/glm-5.1
npm run llm:deploy
```

也可以一步完成本地激活 + 线上发布：

```bash
cd blog-ai-worker
npm run llm:deploy -- tencent-tokenhub/kimi-k2.6
```

更详细的配置项说明、限流调优和防滥用止损建议见：

- `blog-ai-worker/docs/guides/ai-worker-config-guide.md`

如果你关心“新增文章 / 新增专栏后，AI 推荐何时能自动看到新内容”，也看这份指南里的对应章节。

如果你要修改 Turnstile 允许域名、前端 action、每日总预算或紧急停用开关，优先改这份配置指南，再单独部署 Worker。

> 重要：根目录的 GitHub Pages workflow **不会自动部署** `blog-ai-worker/`。
>
> 也就是说：
>
> - 推送 `main` 会自动部署静态站点
> - **但不会自动发布 Worker 新代码**
>
> 如果你修改了 `blog-ai-worker/`，必须单独执行一次 `npm run deploy`，否则线上 `/api/ai/chat` 仍然跑旧逻辑。

### 自定义域名

1. 在项目根目录创建 `CNAME` 文件，写入域名：
   ```
   yuanshenjian.cn
   ```

2. 在 DNS 提供商处配置 A 记录或 CNAME 记录指向 GitHub Pages。

### 环境变量配置

在 GitHub 仓库设置 **Settings → Secrets and variables → Actions** 中添加以下环境变量（Variables）：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点 URL，如 `https://yuanshenjian.cn` |
| `NEXT_PUBLIC_AI_ENABLED` | 是否允许首页 AI 推荐发起有效提交（当前不会强制隐藏组件） |
| `NEXT_PUBLIC_AI_WORKER_URL` | AI Worker 地址，如 `https://yuanshenjian.cn/api/ai` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key |
| `NEXT_PUBLIC_GISCUS_REPO` | GitHub 仓库，格式 `username/repo` |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | 仓库 ID（从 Giscus 配置获取） |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | 讨论分类名称，如 `General` |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | 分类 ID（从 Giscus 配置获取） |

**注意**: 这些配置为 GitHub Variables（而非 Secrets），因为需要在构建时注入到客户端代码中。

Cloudflare Worker 侧还需要额外配置：

### Worker vars / secrets

`blog-ai-worker/wrangler.toml` 中使用了以下运行时配置：

- `AI_DATA_BASE_URL`
- `ALLOWED_ORIGINS`
- `TURNSTILE_ALLOWED_HOSTNAMES`
- `TURNSTILE_EXPECTED_ACTION`
- `AI_IP_RATE_LIMIT_WINDOW_SECONDS`
- `AI_IP_RATE_LIMIT_MAX_REQUESTS`
- `AI_EMERGENCY_DISABLE`
- `AI_DAILY_REQUEST_LIMIT`
- `AI_REQUEST_MAX_BODY_BYTES`
- `AI_REQUEST_MAX_MESSAGE_CHARS`

Turnstile secret 仍需单独设置：

- `TURNSTILE_SECRET_KEY`

LLM 相关字段不再手工逐项 `wrangler secret put`，而是由 `blog-ai-worker/llm-profiles.local.jsonc` + `npm run llm:deploy` 统一写入 Worker。当前运行时支持的 provider 包括 `tencent-tokenhub`、`deepseek`、`moonshot-cn`：

- `LLM_ACTIVE_PROFILE`
- `LLM_PROVIDER_NAME`
- `LLM_MODEL_ID`
- `LLM_PROVIDER_API_KEY`
- `LLM_PROVIDER_BASE_URL`

本地文件约定：

- `blog-ai-worker/llm-profiles.example.jsonc`：入库模板
- `blog-ai-worker/llm-profiles.local.jsonc`：本地真实配置，已 git ignore
- `blog-ai-worker/.llm-active-profile`：本地当前激活项，已 git ignore

默认安全基线见 `blog-ai-worker/wrangler.toml`。其中：

- `TURNSTILE_ALLOWED_HOSTNAMES` 默认保留 `yuanshenjian.cn,localhost`，保证本地调试仍可用
- `TURNSTILE_EXPECTED_ACTION` 默认是 `homepage_recommend`，需与前端 Turnstile render 的 action 保持一致
- `AI_IP_RATE_LIMIT_WINDOW_SECONDS` 和 `AI_IP_RATE_LIMIT_MAX_REQUESTS` 控制按 IP 的限流窗口与阈值
- `AI_EMERGENCY_DISABLE=true` 时，Worker 会直接拒绝 AI 请求
- `AI_DAILY_REQUEST_LIMIT` 控制每天最多允许多少次会触发 LLM 的请求，按 UTC 日期统计
- `AI_REQUEST_MAX_BODY_BYTES` 默认是 `8192`，优先用 `Content-Length` 预判请求体大小，并在实际解析时再做一次字节数兜底校验，超限返回 `413`
- `AI_REQUEST_MAX_MESSAGE_CHARS` 默认是 `500`，按 `message.trim()` 后的字符数判断，超限返回 `413`

### 当前首页 AI 推荐现状

Phase 1 当前已经落地为 **Hero 区域内嵌输入式推荐组件**，不是独立弹窗或浮动按钮：

- 输入框右侧按钮为 `问 AI`
- 提交中按钮文案为 `思考中...`
- 下方快捷标签由 `lib/config.ts` 的 `config.ai.quickTopics` 决定，可按数组顺序调整展示顺序
- 成功后展示：
  - `AI 回答`
  - `推荐文章` 卡片列表（标题 / 日期 / excerpt / 跳转链接）

快捷标签配置示例：

```ts
ai: {
  enabled: true,
  workerUrl: "/api/ai",
  turnstileSiteKey: "",
  maxInputChars: 200,
  quickTopics: [
    {
      label: "AI 编程",
      prompt: "请推荐我博客里和 AI 编程相关的文章，并说明分别适合什么场景。",
    },
    {
      label: "简单设计",
      prompt: "请推荐我博客里和简单设计相关的文章，并总结每篇文章的核心要点。",
    },
  ],
}
```

- 改 `label` 会影响页面上的按钮文案
- 改 `prompt` 会影响点击后真正发送给 AI 的提示词
- 调整数组顺序会同步调整按钮展示顺序

Worker 当前除了基础 `origin + Turnstile + per-IP rate limit` 外，还额外包含：

- Turnstile `hostname / action` 校验
- 全局日预算止损
- 紧急关闭开关
- 基于 query 的文章预筛（只选更相关的少量文章喂给模型）
- 上游 provider 不稳定时的站内确定性推荐兜底

设置示例：

```bash
cd blog-ai-worker
npx wrangler secret put TURNSTILE_SECRET_KEY
npm run llm:list
npm run llm:deploy -- tencent-tokenhub/glm-5.1
```

## 开发规范

### 代码风格

项目使用 ESLint 进行代码检查：

```bash
npm run lint
```

类型检查：

```bash
npm run typecheck
```

### 测试

使用 Vitest 运行测试：

```bash
npm run test          # 运行全部测试
npm run test:watch    # 监听模式
npm run test:coverage # 生成覆盖率报告
```

### 脚本工具

项目包含以下实用脚本：

| 脚本 | 说明 |
|------|------|
| `npm run optimize-images` | 批量优化图片（转换为 WebP，生成多种尺寸） |
| `npm run validate-content` | 校验全仓文章 frontmatter、slug、旧内链和图片 alt |
| `node scripts/check-images.js` | 检查文章中引用的图片是否存在 |

### 性能优化

- **图片优化**: 部署前通过 `npm run build:prod` 自动将图片转换为 WebP 格式
- **代码分割**: Next.js 自动进行路由级代码分割
- **静态导出**: 预渲染所有页面，提升首屏加载速度
- **PWA 缓存**: Service Worker 缓存静态资源，支持离线访问

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

在 `content/blog/` 对应主题目录下创建新的 `.md` 文件，按照 frontmatter 格式编写。如果是专栏文章，还需要在 `lib/columns.ts` 的 `AI_COLUMNS` 数组中注册专栏配置，并在 `components/column-icons.tsx` 中添加对应的 SVG 图标。

### 如何修改主题？

在 `app/globals.css` 中修改 CSS 变量，或使用 Tailwind 的 dark 类。

### 如何扩展内容渲染组件？

在 `lib/mdx.tsx` 中的 `mdxComponents` 对象中注册：

```typescript
const mdxComponents: MDXComponents = {
  // ... 现有组件
  CustomComponent: (props) => <div {...props} />,
};
```

### 如何调整每页显示的文章数？

修改 `lib/config.ts` 中的 `posts.perPage` 配置。

### PWA 如何配置？

PWA 配置位于 `public/manifest.json`，图标放置在 `public/icons/` 目录。使用以下命令生成图标：

```bash
node scripts/pwa/generate-pwa-icons.js
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 博客: https://yuanshenjian.cn
- GitHub: https://github.com/yuanshenjian-cn
- Email: yuanshenjian@foxmail.com

## 致谢

感谢以下开源项目：
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Giscus](https://giscus.app/)

---

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

> 支持 ES2020+ 语法的现代浏览器
