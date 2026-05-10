# AI 每日简报设计方案

- **日期**: 2026-05-08
- **状态**: 待实现
- **项目**: 个人博客（Next.js 15 / App Router / 静态导出）

## 1. 背景

当前博客已经有 `/ai` 作为 AI 主题入口，页面下方展示 AI 专栏卡片，例如 AI 前沿、Claude Code、OpenCode、Codex、DeepSeek。用户希望每天早上 6 点运行旧的 AI 雷达 workflow，产出一篇当天 AI 厂商动态简报，并在博客中形成独立的“每日简报”内容域。

经过讨论，AI 每日简报不作为顶部导航独立入口，也不混入普通文章流，而是作为 `/ai` 页面上的“时效内容层”：进入 AI 页面先看到最新一期简报摘要，再继续浏览下方长期沉淀的 AI 专栏。

## 2. 目标

1. 顶部导航保持不变，仍然只有 `AI` 入口。
2. 在 `/ai` 页面顶部新增“最新一期 AI 每日简报”摘要卡片。
3. 新增 AI 每日简报往期列表页 `/ai/daily-briefings`，按日期倒序排列。
4. 新增 AI 每日简报详情页 `/ai/daily-briefings/[date]`，页面简洁、无评论。
5. 在 `/ai/daily-briefings` 顶部提供简报域内的 AI 推荐入口，支持主题输入与快捷日期范围。
6. AI 每日简报不进入首页最新文章、`/articles`、RSS、全站搜索、首页 AI 推荐。
7. 将旧的 AI 雷达 skill/workflow 改造为发布工作流，并统一为 `ai-daily-briefing`。
8. skill 生成 `.md` 稿件，frontmatter 中 `published: true`，便于本地预览。
9. skill 默认自动发布当天新生成的简报：发布前追加一轮严格审核，审核通过后自动 commit 并 push。

## 3. 非目标

- 不改变现有顶部导航结构。
- 不把 AI 每日简报注册为现有 AI 专栏。
- 不让 AI 每日简报混入普通博客文章列表、RSS 或全站搜索。
- 不让首页 AI 推荐默认推荐 AI 每日简报。
- 首版不在 AI 每日简报详情页接入页面级 AI 助手。
- 不做自定义日期范围选择，首版只做快捷范围：今天、近 3 天、近 7 天、近 30 天。
- 不生成 `.mdx` 简报文件；AI 每日简报统一使用 `.md`。
- 不在最终发布前跳过审核；审核失败时不得 commit 或 push。

## 4. 信息架构与路由

### 4.1 顶部导航

顶部导航维持现状：`首页 / 文章 / AI / 简历`。`AI` 仍然指向 `/ai`。

### 4.2 页面路由

- `/ai`：AI 主题首页，顶部展示最新一期 AI 每日简报摘要卡，下方展示现有 AI 专栏卡片。
- `/ai/daily-briefings`：AI 每日简报往期列表页，顶部提供简报推荐入口，下方按日期倒序展示全部已发布简报。
- `/ai/daily-briefings/[date]`：AI 每日简报详情页，路由参数直接使用 `YYYY-MM-DD`。

### 4.3 静态导出要求

本站使用 `output: 'export'`，因此简报详情动态路由必须显式支持静态生成：

- `app/ai/daily-briefings/[date]/page.tsx` 使用 `generateStaticParams()` 从 `content/ai-briefings` 生成所有日期参数。
- `app/ai/daily-briefings/[date]/page.tsx` 设置 `dynamicParams = false`。
- 没有匹配简报时使用 `notFound()`。
- `/ai/daily-briefings` 和 `/ai/daily-briefings/[date]` 都生成 metadata 与 canonical。
- `app/sitemap.ts` 增加 `/ai/daily-briefings` 与所有简报详情 URL；不加入 RSS。

## 5. 内容模型

### 5.1 独立内容目录

AI 每日简报使用独立目录：

```text
content/ai-briefings/
```

原因：用户已明确要求 AI 每日简报不进入普通文章流、RSS、全站搜索和首页 AI 推荐。若继续放入 `content/blog`，需要在多个现有入口增加排除逻辑，容易漏出；独立内容目录更符合“AI 频道内独立内容域”的边界。

### 5.2 frontmatter

每篇简报使用 `.md`，frontmatter 至少包含：

```yaml
---
title: "AI 每日简报 · 2026-05-08"
date: "2026-05-08"
brief: "一句话概括当天最重要的 AI 厂商动态。"
published: true
tags:
  - AI每日简报
  - OpenAI
  - Anthropic
---
```

字段说明：

- `title`：页面标题。
- `date`：简报日期，用于排序与日期范围过滤。
- `brief`：用于 `/ai` 最新卡、列表页、推荐索引。
- `published`：默认写 `true`，便于本地预览；线上发布仍取决于 git commit/push 与部署。
- `tags`：用于简报列表展示与简报推荐排序。

### 5.3 成稿长度

发布候选稿正文控制在 **900~1100 个中文汉字**。该长度不包含 frontmatter 和来源 URL。

## 6. 页面设计

### 6.1 `/ai` 顶部最新简报卡

在现有 AI 专栏卡片网格上方新增一张横向摘要卡。

内容包括：

- 标签：`AI 每日简报`
- 最新一期标题
- 最新一期日期
- `brief` 摘要
- 已发布期数
- 主按钮：`阅读最新一期`
- 次按钮：`查看往期`

当还没有任何简报时，卡片展示空状态：说明“AI 每日简报即将上线”，并保留“查看往期”入口但禁用或指向空列表页。

### 6.2 `/ai/daily-briefings` 往期列表页

页面包含：

- 标题：`AI 每日简报`
- 简短说明：每日追踪重点 AI 厂商动态，保留严格来源核验。
- 顶部 AI 推荐入口。
- 快捷日期范围：今天、近 3 天、近 7 天、近 30 天。
- 倒序列表：标题、日期、摘要、标签。

推荐入口规则：

- 未输入主题时，只根据日期范围过滤列表。
- 输入主题后，调用专用的 `briefing-recommend` AI 场景，在选定日期范围内推荐相关简报。
- 推荐结果只来自 AI 每日简报，不访问普通文章索引。

### 6.3 `/ai/daily-briefings/[date]` 详情页

详情页复用底层 MDX 渲染能力，但不直接复用普通文章容器。当前 `ArticleContent` 会挂评论和普通文章导航，不适合简报详情页。

页面包含：

- 返回 `/ai/daily-briefings` 的面包屑。
- 标题、日期、摘要、标签。
- MDX 正文。
- 分享按钮。
- 上一期 / 下一期导航。
- 无 Giscus 评论。
- 首版无页面级 AI 助手。

实现时只复用 `lib/mdx.tsx`、`ShareButtons`、`TableOfContents` 等底层能力；简报详情页单独控制返回链接、上下期链接和评论关闭。

## 7. AI 推荐集成

### 7.1 数据源

`scripts/build-ai-data.js` 扩展生成独立简报索引：

```text
public/ai-data/briefings/index.json
```

该索引只包含 AI 每日简报元数据，不混入 `public/ai-data/index.json`。

建议结构：

```json
{
  "generated": "2026-05-08T00:00:00.000Z",
  "briefings": [
    {
      "slug": "2026-05-08",
      "title": "AI 每日简报 · 2026-05-08",
      "excerpt": "一句话摘要",
      "tags": ["AI每日简报", "OpenAI"],
      "date": "2026-05-08T00:00:00.000Z",
      "url": "/ai/daily-briefings/2026-05-08"
    }
  ]
}
```

### 7.2 Worker 场景

新增独立 Worker scene：`briefing-recommend`，并配套新客户端函数与新列表页组件。该 scene 不复用首页 `recommend` 的前端组件，也不读取普通文章 `index.json`，避免首页 AI 推荐和简报域推荐互相污染。

请求参数：

```json
{
  "scene": "briefing-recommend",
  "message": "OpenAI 模型发布",
  "context": {
    "range": "7d"
  },
  "cf_turnstile_response": "token"
}
```

`range` 首版只支持：

- `today`
- `3d`
- `7d`
- `30d`

返回模式沿用现有 SSE：先输出自然语言推荐理由，再在末尾返回 references。references 指向 `/ai/daily-briefings/[date]`。

前端新增专用组件，例如 `components/briefings/briefing-recommend-widget.tsx`，它只在 `/ai/daily-briefings` 使用，并通过新的 `aiBriefingRecommendStream()` 调用 Worker。现有 `AiRecommendWidget` 和首页 `recommend` scene 不改语义。

### 7.3 Worker 部署边界

主站 GitHub Pages 部署不会自动部署 `blog-ai-worker`。因此本功能分两层发布：

- 页面、数据索引和内容文件随主站构建发布。
- `/ai/daily-briefings` 顶部 AI 推荐入口依赖新版 Worker 单独部署后才在线上可用。

如果 Worker 尚未部署或未配置，页面应保持可用：推荐入口展示友好错误或不可用提示，下方列表仍按日期范围正常展示。

## 8. Skill 改造

### 8.1 命名

将旧的 AI 雷达 workflow 统一为 `ai-daily-briefing`。保留旧触发词兼容，包括：

- AI 雷达
- AI 前沿雷达
- 厂商动态汇总
- 今天 AI 厂商发布了什么

同时同步处理现有命令入口：

- 更新 `.opencode/commands/ai-radar.md` 指向新的 `ai-daily-briefing` 语义。
- 保留旧命令名与旧触发词作为兼容入口，避免用户习惯命令断裂。

### 8.2 工作流

skill 默认执行：

1. 确定时间窗口，默认昨天 00:00 到今天当前时刻，时区 Asia/Shanghai。
2. 搜集默认重点 AI 厂商动态。
3. 使用官方源和权威媒体源核验时间证据。
4. 过滤旧事新报、无时间证据、单一非权威来源。
5. 生成严格审核报告，覆盖真实性、准确性、专业性。
6. 生成本地可预览的正式候选稿，frontmatter `published: true`。
7. 写入建议路径：`content/ai-briefings/YYYY-MM-DD-ai-daily-briefing.md`。
8. 执行发布前最终审核，重点检查信息准确性、专业性、来源标注完整性、来源可靠性。
9. 审核通过后自动提交并 push 当天新生成的简报与必要索引/skill 相关改动；审核失败则停止发布，不得 commit 或 push。

### 8.3 审核门禁

正文确定区只允许写入通过审核的信息：

- 有明确事件时间。
- 有官方来源或权威媒体来源。
- 媒体报道不冒充官方来源。
- 旧事新报不纳入当期动态。
- 待核验线索不得进入正文确定区。

第一轮审核报告必须列出：

- 通过审核的事件。
- 被剔除的事件及原因。
- 仅媒体报道、无官方确认的事件。
- 本期内容是否满足 900~1100 汉字。

发布前最终审核必须再次检查：

- 信息准确性：每条确定信息是否有来源支撑，是否存在夸大或误读。
- 专业性：术语、模型名、版本号、厂商名和技术概念是否准确。
- 来源完整性：正文确定区涉及的事件是否都有来源标注。
- 来源可靠性：来源是否为官方源或权威媒体；仅社交媒体、二手转述或无日期证据的信息不得进入正文确定区。
- 发布阻断：任一关键事件来源缺失、来源不可靠、时间证据不足或正文长度超出 900~1100 汉字时，不得 commit 或 push。

## 9. 发布流程

1. 用户每天早上运行 `ai-daily-briefing`。
2. skill 生成本地 `.md` 稿件，`published: true`。
3. skill 生成第一轮审核报告。
4. skill 执行发布前最终审核。
5. 最终审核通过后，skill 自动 commit 并 push 当天新生成的简报及必要产物。
6. GitHub Pages 部署完成后线上可见。
7. 最终审核失败时，skill 保留本地稿件与审核报告，但不得 commit 或 push。
8. 如果本次包含 Worker scene 变更，线上 AI 推荐入口还需要按现有 Worker 发布流程单独部署。

## 10. 验证策略

实现后至少验证：

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run build:ai-data`
- `npm --prefix blog-ai-worker run typecheck`
- 涉及 Worker scene 时运行相关 Vitest 测试。

若构建或测试失败，只修复本次改造引入的问题，不改动无关代码。
