# AI 专栏设计方案

- **日期**: 2026-04-16
- **状态**: 已确认，已审核修订
- **项目**: 个人博客（Next.js 15 / App Router / 静态导出）

## 1. 背景

当前博客已经积累了一批 AI Agent / AI Coding 相关文章，尤其是：

- `content/blog/swd/ai-coding/claudecode`
- `content/blog/swd/ai-coding/opencode`

这些内容天然具备“系列阅读”属性，但当前站点只有：

- 顶部导航：`首页 / 文章 / 简历`
- 文章总列表页：`/articles`
- 文章详情页：`/articles/[slug]`

现有分类系统只识别 `content/blog/` 下的一级目录，因此 AI 相关文章会统一归入 `swd`，无法表达“Claude Code 专栏”“OpenCode 专栏”这样的二级主题聚合关系。

这会带来两个问题：

1. 用户很难发现同一主题下的完整系列文章。
2. 系列文章缺少连续阅读路径，无法突出“专栏”价值。

## 2. 目标

本次设计目标：

1. 在博客右上角新增 `AI` 导航入口。
2. 为 AI 相关的“成系列内容”提供独立专栏入口和聚合页。
3. 保持“手动策展”原则：只有明确构成专栏的系列内容进入 AI 专栏；零散 AI 文章继续留在普通博客流中。
4. 让系列文章支持有序阅读与上一篇/下一篇跳转。
5. 尽量复用现有目录结构、文章路由和页面风格，避免对现有 frontmatter 做批量改造。

## 3. 非目标

本次不做以下事情：

- 不把系统抽象成“全站通用专栏平台”。
- 不修改现有文章 frontmatter，不新增 `series` / `column` 字段。
- 不调整现有分类、标签、搜索机制。
- 不改变文章详情页的主路由结构。
- 不把所有 AI 文章自动纳入专栏；是否纳入仍由配置决定。

## 4. 核心设计决策

### 4.1 范围

仅做 **AI 专栏**，而不是通用专栏系统。

原因：

- 当前最明确且已形成稳定内容分组的是 AI Coding 方向。
- 先解决最强需求，避免过早抽象。
- 如果未来要扩展到其他领域，可以在本方案基础上演进，而不是一开始就引入更高复杂度。

### 4.2 策展原则

采用 **手动策展**。

规则：

- 结构完整、具有连续阅读价值的系列文章 → 进入 AI 专栏。
- 零散 AI 文章 → 继续出现在普通文章列表中，不强行归入专栏。

这样可以避免“只要带 AI 标签就自动进专栏”的噪音问题，保持专栏质量。

### 4.3 数据来源策略

采用 **静态配置 + 目录匹配**，不侵入 frontmatter。

即：

- 在 `lib/columns.ts` 中显式定义每个专栏。
- 每个专栏通过 `contentDir` 指向现有内容目录。
- 构建时根据目录路径收集专栏文章。

原因：

- 当前目录结构已经天然表达了系列边界。
- 无需批量修改现有 19+ 篇文章元数据。
- 新增专栏时，只需要增加一条配置。
- “是否进入专栏”由配置显式表达，符合手动策展原则。

## 5. 信息架构与路由

采用两层结构：

1. **AI 专栏列表页**：展示所有 AI 专栏
2. **专栏文章列表页**：展示某个专栏内的全部文章

### 5.1 路由设计

新增路由：

- `/ai`：AI 专栏首页
- `/ai/[column]`：某个 AI 专栏的文章列表页，例如 `/ai/claudecode`

沿用现有路由：

- `/articles/[slug]`：文章详情页

不新增专栏文章详情专用路由，避免：

- URL 体系重复
- SEO canonical 分裂
- 详情页逻辑复制

## 6. 页面与交互设计

### 6.1 顶部导航

在现有导航中增加：

- `AI`

目标位置：

- `首页 / 文章 / AI / 简历`

桌面端与移动端导航都需要同步支持。

### 6.2 `/ai` 页面

页面职责：展示当前所有已策展的 AI 专栏。

采用 **卡片网格布局**。

每张卡片展示：

- 图标
- 专栏标题
- 专栏简介
- 文章数量
- 点击后进入对应专栏页

选择卡片网格而非扁平列表的原因：

- 当前专栏数量少（初期 2 个），卡片更有“栏目入口”感。
- 更容易在首页级入口中体现主题区隔。
- 后续增加到 3-6 个专栏时仍可自然换行扩展。

### 6.3 `/ai/[column]` 页面

页面职责：展示某一专栏下的全部文章。

采用 **带序号的时间线布局**。

页面内容包括：

- 面包屑：`AI 专栏 / Claude Code 实战`
- 专栏标题、描述、文章总数、最近更新时间（取该专栏内文章的最大 `date`）
- 按阅读顺序排列的文章列表

每篇文章条目展示：

- 序号（1, 2, 3...）
- 标题
- 日期
- 简短摘要
- 点击进入文章详情页

选择时间线布局的原因：

- 强调“系列”“连续学习路径”的产品心智。
- 与普通文章列表形成明显差异，突出专栏价值。
- 与“日期升序阅读”的规则天然匹配。

### 6.4 文章详情页中的专栏上下文

如果当前文章属于某个 AI 专栏，则在文章正文后的导航区域增加一块 **专栏系列导航**。

展示信息：

- 当前所属专栏名
- 当前序号 / 总篇数，例如 `3 / 10`
- 专栏内上一篇
- 专栏内下一篇

放置位置建议：

- 在分享按钮和通用 `PostNavigation` 之间，或紧邻通用导航之前

原因：

- 用户从专栏进入文章后，可以无缝连续阅读。
- 用户即使从搜索、首页或外部链接进入，也能感知这篇文章属于某个系列。
- 不需要改动文章主体内容，仅增强阅读路径。

## 7. 数据模型设计

新增一个专栏配置模块：`lib/columns.ts`。

### 7.1 类型定义

```ts
export interface ColumnConfig {
  slug: string;
  title: string;
  description: string;
  icon?: string;
  contentDir: string;
}

export interface ColumnWithPosts extends ColumnConfig {
  posts: Post[];
}
```

### 7.2 初始配置

首批配置两个专栏：

```ts
const AI_COLUMNS: ColumnConfig[] = [
  {
    slug: "claudecode",
    title: "Claude Code 实战",
    description: "从入门到进阶，系统整理 Claude Code 的工作流、记忆与自动化实践。",
    icon: "🤖",
    contentDir: "swd/ai-coding/claudecode",
  },
  {
    slug: "opencode",
    title: "OpenCode 深度探索",
    description: "围绕 OpenCode 的安装配置、Agent 使用与进阶实践展开的系列专栏。",
    icon: "⚡",
    contentDir: "swd/ai-coding/opencode",
  },
];
```

## 8. 数据获取设计

### 8.1 现状

`lib/blog.ts` 当前已经具备：

- `getAllPosts()`：返回全部已发布文章，按日期降序
- `getPostBySlug()`：根据 slug 查详情
- `getAdjacentPosts()`：获取全站维度的上一篇/下一篇

但 `Post` 结构中没有记录原始相对路径，因此当前无法稳定地按 `content/blog` 内的目录前缀做过滤。

### 8.2 推荐实现

为 `Post` 增加一个非展示型字段：

```ts
relativePath: string;
```

来源：

- 直接复用 `parsePostFile()` 中已经计算出的 `relativePath`

这样可新增：

```ts
export function getPostsByDirectory(dir: string): Post[]
```

行为：

- 从 `getAllPosts()` 结果中过滤 `relativePath` 以 `${dir}/` 开头的文章
- 再按日期升序排序，作为专栏阅读顺序

注意：`relativePath` 在存储和比较前，应统一标准化为 **POSIX 风格路径**（使用 `/` 分隔）。这样可以避免在不同操作系统下路径分隔符不一致导致的匹配失败。`lib/blog.ts` 中的 `getRelativePath()` 已经使用 `path.relative()`，在 macOS / Linux 下天然返回 POSIX 路径；但为保险起见，应显式添加标准化处理。

原因：

- 避免重复扫描文件系统
- 逻辑简单，和当前缓存策略兼容
- 后续若要支持更多目录级聚合，也可复用

### 8.3 `lib/columns.ts` 中的辅助函数

建议提供以下函数：

- `getAIColumns()`：返回所有带文章数据的 AI 专栏
- `getAIColumnBySlug(slug: string)`：返回单个专栏及其文章
- `getColumnContextByPost(post: Post)`：若文章属于某专栏，返回其专栏信息、当前位置、专栏内上一篇/下一篇

其中 `getColumnContextByPost(post)` 用于详情页专栏导航展示。

## 9. 详细实现落点

### 9.1 修改 `types/blog.ts`

为 `Post` 增加：

- `relativePath: string`

这是支持目录匹配的关键字段。

### 9.2 修改 `lib/blog.ts`

需要做的事情：

1. 在 `parsePostFile()` 返回的 `Post` 中写入 `relativePath`
2. 新增 `getPostsByDirectory(dir: string)`
3. 保持现有缓存逻辑不变

注意：

- 专栏内排序与全站文章排序不同：
  - 全站列表：日期降序
  - 专栏列表：日期升序

### 9.3 新增 `lib/columns.ts`

职责：

- 管理 AI 专栏配置
- 聚合专栏文章
- 生成详情页专栏上下文

不建议把这些逻辑继续塞进 `lib/blog.ts`，原因是：

- `blog.ts` 当前已承担文件扫描、解析、聚合、搜索等职责
- 专栏是新的内容组织维度，应保持独立边界

### 9.4 新增 `app/ai/page.tsx`

页面职责：

- 读取所有 AI 专栏
- 输出页面标题与描述
- 以卡片网格方式渲染专栏入口

风格上应复用当前站点页面节奏：

- `py-12 px-6`
- 中心容器宽度控制
- 使用现有 Tailwind 语义色和卡片边框风格

### 9.5 新增 `app/ai/[column]/page.tsx`

页面职责：

- 读取指定 slug 的专栏
- 若不存在，调用 `notFound()`
- 输出专栏元信息和时间线列表

页面还应支持：

- `generateStaticParams()`：静态导出所有专栏页
- `generateMetadata()`：生成专栏级标题、描述、OG/Twitter 信息

### 9.6 修改 `components/Header.tsx`

在 `navItems` 中加入：

```ts
{ href: "/ai", label: "AI" }
```

由于 `HeaderClient` 已经同时支持桌面和移动菜单渲染，因此这里无需额外重复维护两套导航数据。

注意：当前 `header-client.tsx` 的导航激活逻辑为 `pathname === item.href`（精确匹配），因此访问 `/ai/claudecode` 时 `AI` 导航项不会高亮。为了在 `/ai/*` 子路由下也能保持 `AI` 高亮状态，需要将激活判断从精确匹配改为 **前缀匹配**：

```ts
// 对 /ai 使用前缀匹配，其余保持精确匹配
const isActive = item.href === "/"
  ? pathname === "/"
  : pathname.startsWith(item.href);
```

此改法同时也让 `/articles/*` 在文章详情页下能正确高亮 `文章` 导航项。

### 9.7 修改文章详情页链路

现有详情页结构：

- `app/articles/[slug]/page.tsx` 负责组装数据
- `components/article-content.tsx` 负责正文、分享、上一篇/下一篇、评论

推荐做法：

1. 在详情页中根据当前 `post` 计算 `columnContext`
2. 将 `columnContext` 传入 `ArticleContent`
3. 在 `ArticleContent` 中按条件渲染专栏导航组件

建议新增一个独立组件，例如：

- `components/column-navigation.tsx`

原因：

- 不污染现有 `PostNavigation` 的职责
- 专栏导航和全站导航是两套语义，不应混为一个组件
- 单独组件更方便控制样式和后续扩展

## 10. 排序与阅读顺序规则

专栏文章排序固定为 **日期升序**。

约定：

- 最早发布的文章视为第一篇
- 最晚发布的文章视为最后一篇

这样有三个好处：

1. 与现有内容演进顺序一致
2. 不需要额外维护序号字段
3. 对 Claude Code / OpenCode 这类系列内容最符合阅读直觉

如果未来出现“发布日期不等于阅读顺序”的特殊系列，再考虑是否演进为显式排序字段；本期不提前设计。

## 11. SEO 与元信息

新增 `/ai` 与 `/ai/[column]` 后，需要补充各自 metadata。

### 11.1 Metadata

### `/ai`

- title: `AI 专栏 | 袁慎建`
- description: 聚合 AI Agent / AI Coding 相关系列文章

### `/ai/[column]`

- title: `${专栏标题} | AI 专栏 | 袁慎建`
- description: 使用专栏描述或首篇摘要

注意：

- 专栏文章详情页仍沿用原文章 URL 作为 canonical
- 不创建新的详情页镜像地址，避免 SEO 权重分散

### 11.2 Sitemap

当前 `app/sitemap.ts` 是手工维护的，新增路由不会被自动发现。需要同步更新：

- 新增 `/ai` URL
- 新增所有"有已发布文章的专栏"对应的 `/ai/[column]` URL
- 数据来源应与 `getAIColumns()` 共用同一套过滤结果，确保空专栏不进入 sitemap

修改文件：`app/sitemap.ts`

## 12. 错误处理与边界条件

### 12.1 专栏 slug 不存在

- `/ai/[column]` 调用 `notFound()`

### 12.2 配置目录为空

如果某个专栏配置存在，但对应目录没有可发布文章：

- `/ai` 页面默认不展示空专栏
- `/ai/[column]` 的 `generateStaticParams()` 同样排除空专栏，不为其生成静态页
- `getAIColumnBySlug()` 对空专栏返回 `null`，由页面调用 `notFound()`
- `/ai` 列表展示、`generateStaticParams()`、metadata 生成三处应共用同一套过滤逻辑，确保"无已发布文章 = 不存在"的规则一致
- 这样可以避免未完成专栏提前暴露，同时不会在静态导出时生成无内容页面

### 12.3 文章不属于任何专栏

- 详情页不显示专栏导航
- 保持现有阅读体验不变

### 12.4 文章属于专栏但在首篇/末篇

- 缺失的上一篇或下一篇位置留空或弱化展示
- 不影响组件整体布局稳定性

## 13. 对现有系统的影响评估

### 13.1 低风险项

- 顶部导航仅新增一个入口
- 新增页面均为独立路由
- 详情页增强是条件渲染，不影响非专栏文章

### 13.2 需要注意的地方

- `Post` 类型新增字段后，要确保相关调用点不会因类型变化遗漏
- 详情页专栏导航和现有 `PostNavigation` 需注意信息层级，不要视觉重复过强
- 静态导出时需确保 `/ai/[column]` 的 `generateStaticParams()` 完整输出

## 14. 验收标准

满足以下条件则视为本设计实现成功：

1. 顶部导航出现 `AI` 入口，桌面端和移动端都可访问。
2. `/ai` 页面可展示 Claude Code 与 OpenCode 两个专栏卡片。
3. 点击专栏卡片能进入对应 `/ai/[column]` 页面。
4. 专栏页文章按日期升序展示，并带有明确阅读顺序序号。
5. 点击专栏内文章后，进入现有文章详情页。
6. 若文章属于专栏，详情页能显示专栏内上一篇/下一篇导航。
7. 若文章不属于专栏，详情页行为与当前保持一致。
8. 不需要修改现有文章 frontmatter 即可完成上线。

## 15. 后续演进空间（不在本期范围内）

未来如有需要，可以在本方案上继续演进：

- 把 AI 专栏扩展为“主题专栏系统”
- 支持专栏封面图
- 支持专栏简介页更丰富的导读内容
- 支持在首页增加 AI 专栏推荐区块
- 支持显式排序字段而不是仅按日期排序

当前不做这些扩展，避免超出本次范围。

## 16. 建议实施顺序

建议按以下顺序实现：

1. 扩展 `Post` 类型并补齐 `relativePath`
2. 实现 `getPostsByDirectory()`
3. 新增 `lib/columns.ts`
4. 完成 `/ai` 页面
5. 完成 `/ai/[column]` 页面
6. 接入顶部导航 `AI`
7. 在详情页增加专栏导航
8. 补充 metadata 与静态参数
9. 更新 `app/sitemap.ts`
10. 运行 lint / typecheck / build 验证
11. 补充最小单元测试

## 17. 测试要求

项目已有 `tests/lib/blog.test.ts`，覆盖了 `getAllPosts()`、`getAdjacentPosts()`、`getPostsByCategory()` 等核心逻辑。本次新增功能至少需要以下测试覆盖：

### 17.1 必须覆盖

- `getPostsByDirectory(dir)` ：验证能按目录过滤、升序排序、排除未发布文章
- `getAIColumnBySlug(slug)` ：验证正常返回、空专栏返回 null、不存在的 slug 返回 null
- `getColumnContextByPost(post)` ：验证属于专栏的文章返回正确上下文（位置、上下篇），不属于专栏的文章返回 null
- 空专栏过滤：验证 `getAIColumns()` 不返回无文章的专栏
- 专栏内升序排序：验证文章按日期从早到晚排列

### 17.2 测试文件建议

- `tests/lib/columns.test.ts`：专栏相关逻辑
- 可在现有 `tests/lib/blog.test.ts` 中追加 `getPostsByDirectory()` 测试

---

本方案的核心原则是：**只做 AI、手动策展、零 frontmatter 侵入、复用现有目录结构与文章详情路由。**
