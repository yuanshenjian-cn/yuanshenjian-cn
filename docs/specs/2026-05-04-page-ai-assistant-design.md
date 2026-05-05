# 页面级 AI 助手设计文档

**日期**：2026-05-04  
**状态**：已实现  
**范围**：文章详情页、作者页  

---

## 1. 目标

本次为博客新增两类页面级 AI 能力：

1. **文章详情页 AI 助手**：帮助读者在不通读全文的前提下，快速理解文章重点，并继续围绕当前文章内容提问。
2. **作者页 AI 助手**：帮助招聘者或合作方，基于作者页现有内容快速提问，了解作者经历、擅长方向、证书、兴趣与岗位匹配度。

本次方案有四个硬约束：

- **回答必须依据当前页面内容**
- **每次回答都要显式展示依据**
- **首版保持轻量，只做单轮问答**
- **文章页主入口必须前置，不要求用户滚动到文末**

---

## 2. 当前现状与范围边界

### 2.1 已有 AI 能力

当前站点已落地的 AI 能力只有首页 `recommend` 场景：

- 前端入口：`components/ai/ai-recommend-widget.tsx`
- 请求封装：`lib/ai-client.ts`
- 类型定义：`types/ai.ts`
- Worker 场景：`blog-ai-worker/src/scenes/recommend.ts`
- 数据源：`public/ai-data/index.json`

这条链路只适合：

- 按主题推荐文章
- 返回推荐说明和文章列表

不适合直接复用为页面内容问答，因为当前索引只包含全站文章元数据，没有页面级内容上下文。

### 2.2 页面结构现状

#### 文章详情页

- 路由：`app/articles/[slug]/page.tsx`
- 顶部头部：`components/article-header.tsx`
- 正文与底部区域：`components/article-content.tsx`
- 目录：`components/table-of-contents.tsx`

当前桌面/移动结构不同：

- **移动端**：`app/articles/[slug]/page.tsx` 先单独渲染 `ArticleHeader`，再渲染 `ArticleContent(showHeader=false)`
- **桌面端**：`ArticleHeader` 由 `ArticleContent` 内部渲染

因此，任何“标题下方”的 AI 主入口都不能只靠视觉描述，必须在页面层明确插入位置，避免桌面和移动端重复或错位渲染。

#### 作者页

- 路由：`app/author/page.tsx`
- 模块：`ResumeHero`、`ResumeSkills`、`ResumeEducation`、`ResumeExperience`、`ResumeProjects`、`ResumeExtras`

当前作者页是**单作者简历页**，不是多作者系统，也没有文章 frontmatter 的 `author` 字段。

### 2.3 本次非目标

本次不做：

- 首页 AI 推荐重构
- 专栏页 AI 导读
- 搜索 AI 增强
- 全站统一 AI 中心
- 多轮聊天记忆
- 向量检索或外部知识库
- 作者人格化闲聊

范围严格控制在：

- 文章详情页
- 作者页

---

## 3. 设计原则

### 3.1 证据优先

页面级 AI 的核心不是“像 ChatGPT 一样自由回答”，而是：

> **把当前页面内容更快、更可信地解释给用户。**

因此，每次回答都必须展示“回答依据”：

- 文章页：展示小节标题、对应摘录
- 作者页：展示来源模块，如“经历概览”“技能证书”“兴趣爱好”等

回答依据主要由 `references` 模块承担，正文应直接、自然地回答用户问题，不依赖模板化来源前缀。

### 3.2 单轮优先

首版只做：

- 单轮问答
- 快捷问题按钮
- 页面级内容上下文
- 引用与依据展示

首版不做：

- 多轮记忆
- conversation history
- 页面内聊天记录持久化

### 3.3 前置触达优先

文章页 AI 的首要价值是：

> 用户刚进入页面，就能快速判断“这篇文章在讲什么、值不值得继续细读”。

所以文章页 AI 不能只放在文末。

### 3.4 复用适度

首页推荐和页面问答虽然都经过 `aiChat` / Worker，但定位不同：

- 首页：推荐导流型
- 页面级：页面理解型

因此只复用底层协议与请求能力，不强行把首页组件抽成同一个通用 UI。

---

## 4. 文章详情页设计

## 4.1 定位

文章详情页 AI 助手定位为：

> **AI 快速读懂这篇文章**

它是页面理解助手，不是泛化知识助手。

### 4.2 双入口设计

文章页采用**双入口，轻重分层**。

#### 入口 A：前置主入口

- 标题：`AI 快速读懂这篇文章`
- 位置：**文章标题/元信息下方，正文上方**
- 作用：快速摘要与理解

#### 入口 B：文末次入口

- 标题：`继续问 AI`
- 位置：**评论区前**
- 作用：承接用户读完后的进一步单轮提问

### 4.3 双入口的状态边界

虽然页面有两个入口，但首版仍然是单轮问答，不做多轮会话。

因此这里明确约束：

- `继续提问` = **发起新的独立单轮请求**
- 不携带前一次问答历史
- 两个入口共享同一套页面级状态展示即可，但**不是聊天历史**

也就是说：

- 可以共享“当前最近一次回答”
- 但不能把它定义成连续对话上下文

### 4.4 插入位置约束

为了兼容当前桌面/移动双结构，文章页前置 AI 卡不能简单插到 `ArticleHeader` 或 `ArticleContent` 内部。

推荐页面编排方式：

- 由 `app/articles/[slug]/page.tsx` 在页面层统一决定“头部下方 AI 主入口”的渲染位置
- `ArticleContent` 只负责正文与文末次入口

这样可以避免：

- 移动端和桌面端重复渲染
- 主入口位置不一致

### 4.5 默认快捷问题

前置主入口默认展示 4 个总结导向快捷问题：

1. `3 行总结这篇文章`
2. `这篇文章的核心观点是什么`
3. `这篇文章适合谁读`
4. `看完这篇文章我能获得什么`

### 4.6 回答边界

文章页采用**严格拒绝超范围**策略。

如果问题超出文章内容：

- 不猜测
- 不补充页面外知识
- 明确回答：`当前文章没有明确提到这一点，我只能依据这篇文章现有内容回答。`

---

## 5. 作者页设计

## 5.1 定位

作者页 AI 助手定位为：

> **问 AI：快速了解作者**

主要面向：

- 招聘者
- 合作方
- 初次访问的外部联系人

### 5.2 入口布局

作者页只保留一个前置主入口：

- 标题：`问 AI：快速了解作者`
- 位置：`ResumeHero` 下方、`ResumeSkills` 之前

### 5.3 默认快捷问题

首版建议提供：

1. `作者有哪些核心工作经历`
2. `作者擅长什么方向`
3. `作者有哪些证书或资质`
4. `作者更适合什么岗位`
5. `作者有哪些值得关注的优势`

### 5.4 回答边界

作者页采用：

> **事实严格引用 + 归纳谨慎表述**

#### 事实类问题

例如：

- 工作经历
- 项目经历
- 证书与资质
- 教育背景

必须严格依据页面内容回答。

#### 归纳类问题

例如：

- 更适合什么岗位
- 哪些能力最突出
- 更偏技术还是管理

允许基于页面内容做有限归纳，但正文应直接、自然地回答用户问题，例如：

> 我更倾向于作者适合兼顾 AI 应用落地与研发效能提升的岗位方向。

同时增加一个硬约束：

- 只能基于页内已出现的经历、技能、证书、项目与兴趣做有限归纳
- 不输出薪资建议、级别判断、招聘决策建议、行业适配结论
- 岗位推荐收敛为 **2~4 个岗位方向**，并且每个方向都要有对应依据
- 回答依据主要由 `references` 模块承担，避免在正文里使用“页面中显示……”“根据当前作者页展示的信息……”这类模板化前缀

---

## 6. 数据单一来源设计

这是本次设计最重要的技术约束之一。

## 6.1 文章数据来源

文章页 AI 数据的单一来源是现有文章源文件：

- `content/blog/**/*.md`
- `content/blog/**/*.mdx`

构建脚本从文章源文件派生页面级 AI JSON，不允许额外维护第二份文章副本。

## 6.2 作者页数据来源

作者页当前内容散落在多个组件与局部常量中。如果直接在构建脚本里硬编码一份 `author.json`，会形成影子数据。

因此本次必须先建立**单一权威数据源**。

### 方案约束

新增一个共享结构化数据模块，作为作者页与 AI 数据生成的共同来源。

建议新增：

- `lib/author-profile-data.js`
- `lib/author-profile.ts`

该模块负责输出：

- Hero 简介
- 技能与证书
- 教育背景
- 经历概览
- 项目经历
- 额外信息

其中：

- `lib/author-profile-data.js` 作为原始共享数据源
- `lib/author-profile.ts` 作为 TS 封装与页面消费入口

然后：

- 作者页 UI 组件从这份结构化数据渲染
- `public/ai-data/author.json` 也从这份结构化数据生成

### 明确禁止

禁止出现以下情况：

- 页面渲染一套数据
- `author.json` 手写另一套数据
- 手动修改 `public/ai-data/author.json` 构建产物

否则后续内容会快速漂移。

---

## 7. 页面级 AI 数据文件设计

## 7.1 文章数据文件

新增：

`public/ai-data/articles/{slug}.json`

建议结构：

```json
{
  "slug": "example-post",
  "title": "示例文章",
  "date": "2026-05-04T00:00:00.000Z",
  "excerpt": "文章摘要",
  "tags": ["AI"],
  "sections": [
    {
      "id": "intro",
      "anchorId": "intro",
      "heading": "前言",
      "content": "这一节的纯文本内容",
      "excerpt": "这一节的引用摘录"
    }
  ]
}
```

### section 切分契约

为保证“引用展示”能真实落地，本次必须明确 `sections` 的生成规则：

1. 以 Markdown 标题为 section 边界，复用与当前 `extractHeadings()` 一致的标题识别规则
2. 对于文章开头在第一个标题之前的导语内容，统一归入一个保留 section：
   - `id = "intro"`
   - `heading = "前言"`
3. 如果整篇文章**没有任何标题**，则整篇内容退化为一个 `intro` section，而不是放弃生成页面级 AI 数据
4. section 的 `anchorId` 必须和页面目录使用的 slug 规则保持一致，保证可跳转
5. 重复标题的 `anchorId` 需复用当前 slugger 行为，保证稳定唯一
6. `content` 只保留纯文本，不保留 HTML
7. 代码块内容不进入 `content`，避免引用区出现大段代码
8. `excerpt` 从该 section 文本中截取短摘要，用于引用展示
9. `anchorId` 对文章 section 为必填，因为文章目录和标题锚点天然存在

## 7.2 作者数据文件

新增：

`public/ai-data/author.json`

建议结构：

```json
{
  "slug": "author",
  "title": "袁慎建",
  "summary": "AI 效率工程师 | 研发效能专家 | 敏捷开发教练",
  "sections": [
    {
      "id": "hero",
      "heading": "个人简介",
      "content": "在 Thoughtworks 10 年多年……",
      "excerpt": "在 Thoughtworks 10 年多年，经历多个国内外交付、咨询和技术人员培养项目……"
    },
    {
      "id": "experience",
      "heading": "经历概览",
      "content": "2025.05 ~ 2025.12 Locammend 智能顾问 - 技术负责人……",
      "excerpt": "Locammend 智能顾问技术负责人，聚焦 AI 辅助效能提升和 AI 应用开发。"
    }
  ]
}
```

### 作者 section 规则

作者页 section 直接来自共享结构化数据模块，来源模块需与页面模块名称对齐，例如：

- `hero`
- `skills`
- `education`
- `experience`
- `projects`
- `extras`

这样引用显示时才能稳定映射到当前页面语义。

### author section 的锚点规则

作者页当前并不是所有模块天然都有稳定 DOM 锚点，因此：

- `PageReference.anchorId` 对作者页允许为空
- 如果某个模块未来补上稳定锚点，则可以填入
- 首版即使没有锚点，也必须保留 `id/title/excerpt/sourceType`

也就是说：

- 文章页 `anchorId` 必填
- 作者页 `anchorId` 可选

---

## 8. Scene / Context / Response 硬契约

本次不能继续只用示例 JSON，必须定义明确契约。

## 8.1 类型级请求契约

前后端都应使用判别联合，而不是继续把 `context` 保持为松散对象。

### RecommendRequest

```ts
interface RecommendRequest {
  scene: "recommend";
  message: string;
  context?: undefined;
  cf_turnstile_response: string;
}
```

### ArticleRequest

```ts
interface ArticleRequest {
  scene: "article";
  message: string;
  context: {
    slug: string;
  };
  cf_turnstile_response: string;
}
```

### AuthorRequest

```ts
interface AuthorRequest {
  scene: "author";
  message: string;
  context: {
    page: "author";
  };
  cf_turnstile_response: string;
}
```

### 联合请求类型

```ts
type AIChatRequest = RecommendRequest | ArticleRequest | AuthorRequest;
```

这意味着：

- `recommend` 不接受页面 context
- `article` 必须携带 `context.slug`
- `author` 必须携带 `context.page = "author"`
- 不允许 `scene: "article"` 与 `context.page: "author"` 这类混搭

## 8.2 类型级响应契约

首页推荐与页面问答使用不同引用结构，不能复用同一个 `AIReference`。

### RecommendReference

```ts
interface RecommendReference {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
}
```

### PageReference

```ts
interface PageReference {
  id: string;
  title: string;
  excerpt: string;
  sourceType: "article-section" | "author-section";
  anchorId?: string;
}
```

### 非流式响应

```ts
interface RecommendResponse {
  answer: string;
  references: RecommendReference[];
  usage?: AIUsage;
}

interface PageResponse {
  answer: string;
  references: PageReference[];
  usage?: AIUsage;
}
```

### 流式事件类型

```ts
type PageStreamEvent =
  | { type: "answer-delta"; delta: string }
  | { type: "references"; references: PageReference[] }
  | { type: "done"; usage?: AIUsage }
  | { type: "error"; message: string };
```

## 8.3 示例请求

### 首页推荐（已存在）

```json
{
  "scene": "recommend",
  "message": "推荐几篇 AI 编程文章",
  "cf_turnstile_response": "token"
}
```

### 文章页问答

```json
{
  "scene": "article",
  "message": "3 行总结这篇文章",
  "context": {
    "slug": "example-post"
  },
  "cf_turnstile_response": "token"
}
```

### 作者页问答

```json
{
  "scene": "author",
  "message": "作者更适合什么岗位",
  "context": {
    "page": "author"
  },
  "cf_turnstile_response": "token"
}
```

## 8.4 页面级引用必须由 Worker 组装

页面级问答里，模型**不能直接输出完整引用对象**。

模型最多只能返回：

- `section id`
- 或有限数量的 `section ids`

然后由 Worker 基于本地 `sections` 数据执行以下步骤：

1. 校验 section id 是否存在
2. 从本地 section 映射中读取 `title`
3. 从本地 section 映射中读取 `excerpt`
4. 组装 `sourceType`
5. 组装 `anchorId`

也就是说：

- `title`
- `excerpt`
- `sourceType`
- `anchorId`

都必须由 Worker 生成，而不是信任模型返回。

这样才能防止模型伪造依据。

## 9. 流式输出设计

用户已确认：页面级 AI 采用**真实流式输出**，而不是前端打字机假流式。

## 9.1 适用范围

首版仅为页面级场景提供流式输出：

- `article`
- `author`

首页 `recommend` 暂不强制改为流式，继续保持现有 JSON 响应。

## 9.2 流式目标

用户提交问题后：

1. 页面立即进入“AI 正在整理中”
2. 回答正文边生成边显示
3. 回答结束后，再一次性展示引用依据

## 9.3 为什么采用“正文流式 + 引用尾部一次性返回”

这是本次推荐方案，因为：

- 正文流式最能提升体感速度
- 引用结构化信息更适合在尾部一次性返回
- 可以避免前端同时处理文本增量和引用增量的复杂状态

## 9.4 模型输出到 Worker 流式解析的硬契约

为了同时满足：

- 正文真实流式输出
- Worker 负责引用校验与组装
- 前端不直接接触模型原始结构化尾部

本次明确 page scene 的模型输出协议如下：

### 模型输出协议

模型在 `article` / `author` 场景中必须输出：

1. **先输出纯正文答案**
2. **在结尾输出固定分隔符**
3. **分隔符后输出一个 JSON 尾部对象**

格式示例：

```text
这篇文章主要讨论如何……
它更适合已经有一定……
<<<AI_PAGE_REFERENCES>>>
{"sectionIds":["intro","section-2"]}
```

### 约束

- 分隔符固定为：`<<<AI_PAGE_REFERENCES>>>`
- 分隔符前全部视为正文，可流式向前端转发
- 分隔符后必须是单个 JSON 对象
- JSON 目前只允许包含：
  - `sectionIds: string[]`
- 模型不能直接输出引用对象，不能直接输出 `title/excerpt/anchorId`

### Worker 处理流程

Worker 在流式场景中必须这样处理：

1. 持续接收 provider 的原始流
2. 在遇到分隔符前，把文本增量转成 `answer-delta` 事件发给前端
3. 遇到分隔符后，停止向前端转发原始文本
4. 缓存尾部 JSON 字符串
5. 在流结束后解析 `sectionIds`
6. 基于本地 section 映射组装 `PageReference[]`
7. 发送 `references` 事件
8. 最后发送 `done` 事件

### 失败策略

- 如果模型没有输出合法分隔符或尾部 JSON 无法解析：
  - 已输出的正文仍保留
  - `references` 为空
  - Worker 发送 `done`
  - 不因为引用失败而整段回答报错

也就是说：

- 正文可成功，引用可降级为空
- 但不允许伪造引用

## 9.5 浏览器侧消费方式

由于页面级 AI 请求必须满足以下条件：

- 使用 `POST`
- 需要发送 `message`
- 需要发送 `context`
- 需要发送 `cf_turnstile_response`

因此浏览器端**不能使用 `EventSource`**。

本次明确规定：

> 页面级流式响应必须使用 `fetch` + `ReadableStream` 手动解析 SSE。

也就是说，前端需要：

1. 发起 `fetch("/chat/stream", { method: "POST", body: ... })`
2. 从 `response.body` 中读取字节流
3. 解析 `text/event-stream` 协议
4. 按事件类型更新页面状态

## 9.5 协议设计

新增页面级流式接口，例如：

- `POST /chat/stream`

协议采用 `text/event-stream`。

事件类型建议如下：

### `answer-delta`

```text
event: answer-delta
data: {"delta":"这篇文章主要讨论……"}
```

### `references`

```text
event: references
data: {"references":[...]}
```

### `done`

```text
event: done
data: {"usage":{"promptTokens":120,"completionTokens":80,"totalTokens":200}}
```

### `error`

```text
event: error
data: {"message":"AI 暂时无法整理当前页面内容，请稍后再试。"}
```

## 9.6 Provider 抽象闭环

当前 Worker 的 provider 抽象仍然是一次性 `chat()` 返回，这不足以支撑真实流式。

因此页面级 AI 要求新增一条明确能力：

```ts
interface LLMProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat?(request: ChatRequest): Promise<ReadableStream<Uint8Array>>;
}
```

首版实现约束：

- 页面级流式问答只在 `streamChat` 可用的 provider 上启用
- 如果当前激活 provider 不支持流式：
  - 页面级流式功能不降级成“假流式”
  - 而是直接退回页面级非流式 `/chat` 响应，前端按非流式模式展示完整结果
- `usage` 在流式场景中允许只在 `done` 阶段返回；如果上游 provider 不提供 usage，则允许缺省

## 9.7 流式错误策略

如果流已经输出了一部分正文，但后续失败：

- 保留已输出内容
- 在结果区域追加“回答已中断”的提示
- 不伪造完整回答
- 不补假引用

## 9.8 首版兼容策略

首版保留双接口：

- `/chat`：现有 JSON 响应，继续服务首页 `recommend`，也可作为页面级问答的非流式兜底
- `/chat/stream`：页面级 AI 的优先入口

这样风险最小，不会影响首页既有能力。

## 10. Worker 场景设计

## 10.1 场景集合

Worker 场景扩展为：

- `recommend`
- `article`
- `author`

## 10.2 Turnstile action 契约

当前首页已使用固定 action：

- `homepage_recommend`

为避免 Worker 端只有一个 `TURNSTILE_EXPECTED_ACTION` 无法支撑多场景，本次明确改为**按 scene 定义 action**：

- `recommend` -> `homepage_recommend`
- `article` -> `article_page_ai`
- `author` -> `author_page_ai`

Worker 校验逻辑需要改为：

- 根据 `scene` 读取该场景期望 action
- 再校验 Turnstile 返回值是否匹配

而不是继续沿用单一全局 action。

## 10.3 场景职责

### `article`

- 根据 `context.slug` 读取 `articles/{slug}.json`
- 在页面级上下文中回答问题
- 严格限制回答范围为当前文章内容
- 输出正文流式结果与尾部引用

### `author`

- 读取 `author.json`
- 在作者页上下文中回答问题
- 对事实类问题严格引用
- 对归纳类问题有限归纳
- 输出正文流式结果与尾部引用

## 10.4 Prompt 规则

### 文章页 prompt 规则

- 只能依据当前文章内容回答
- 不知道就明确说明当前文章未提及
- 不补充页面外知识
- 正文应直接、自然地回答用户问题，避免“页面中显示……”或“当前文章页展示的信息……”这类页面化措辞
- 回答尽量简洁
- 最终只返回 1~3 个 section id

### 作者页 prompt 规则

- 事实类问题必须基于页面内容
- 岗位匹配类问题可有限归纳
- 正文应直接、自然地回答用户问题，不鼓励模板化来源前缀
- 回答依据主要由 `references` 模块承担，避免使用“页面中显示……”或“根据当前作者页展示的信息……”这类页面化措辞
- 不输出薪资、级别、招聘决策建议
- 最终只返回 1~3 个 section id

## 10.5 Worker 引用组装职责

Worker 在页面级问答中必须承担以下职责：

1. 维护当前页面 sections 的本地映射
2. 校验模型返回的 section ids 是否真实存在
3. 过滤无效或重复 id
4. 最多保留 1~3 条引用
5. 最终组装 `PageReference[]`

不允许把模型返回的自由文本直接当成引用展示。

## 11. 前端组件设计

## 11.1 推荐拆分

为了避免过度设计，组件拆分收敛为三层：

1. **页面级状态容器**：持有流式状态、in-flight、abortController、requestId、最近一次回答
2. **通用页面问答组件**：负责输入、快捷问题、流式结果、引用展示、错误态
3. **场景包装组件**：负责文章页或作者页的标题、副文案、快捷问题、scene/context

### 建议文件

- `components/ai/page-ai-assistant-provider.tsx`
- `components/ai/ai-page-assistant.tsx`
- `components/ai/article-ai-assistant.tsx`
- `components/ai/author-ai-assistant.tsx`

### 页面级共享状态承载方案

文章页由于存在两个入口，因此必须明确状态宿主：

- 由单个页面级 client 容器（或 provider）持有共享状态
- 前置入口与文末入口都只是这个容器下的两个 `variant`
- 最近一次回答区域也由该容器统一管理

具体约束：

- `app/articles/[slug]/page.tsx` 负责挂载页面级 AI 状态容器
- 前置入口与文末入口通过 props 或 context 连接到同一状态容器
- 两个入口都不各自保存独立请求状态
- 页面级最近一次回答由同一状态容器决定最终显示位置

首版推荐的显示方式是：

- 前置入口展示完整的主结果区域
- 文末入口只展示输入与触发区，触发后滚动或同步更新前置主结果区域

这样可以避免页面上同时出现两块互相竞争的流式回答区。

## 11.2 首页组件关系

首页 `AiRecommendWidget` 继续保持独立。

原因：

- 首页是推荐型
- 页面级是内容型
- 两者只复用底层 `ai-client` 能力与 Turnstile 思路，不强行统一交互壳

## 11.3 配置缺失时的页面策略

页面级 AI 不是可有可无的小挂件，因此不能沿用首页当前“显示后点了再报错”的策略。

本次明确策略：

页面级 AI 组件的显示条件不只取决于 `workerUrl` 是否非空，因为当前 `lib/config.ts` 中默认值 `"/api/ai"` 并不代表页面级 AI 真的可用。

因此需要新增单独的页面级就绪判定，例如：

- `config.ai.pageAssistantEnabled`

其值由以下条件共同决定：

- `NEXT_PUBLIC_AI_ENABLED !== "false"`
- `NEXT_PUBLIC_AI_PAGE_ASSISTANT_ENABLED !== "false"`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 存在
- 页面级 AI 所需接口已在当前环境部署完成

页面级 AI 展示策略：

- `pageAssistantEnabled === false`：页面级 AI 入口不渲染
- `turnstileSiteKey` 缺失：页面级 AI 入口不渲染
- 页面级 stream 接口未部署：页面级 AI 入口不渲染或整体关闭

也就是说，页面级 AI 入口的展示前提是“页面级能力已完整接通”，而不是仅凭默认路径存在。

---

## 11.4 双入口并发与取消策略

由于文章页存在前置入口与文末入口两个触发点，而页面级 AI 又采用真实流式输出，因此必须定义并发规则。

本次明确：

- 同一页面同一时刻只允许 **一个 in-flight 请求**
- 新请求发起时，必须 `abort` 当前旧请求
- 前端需维护 `requestId` 或等价机制，确保只有最近一次请求可以写入页面状态
- 两个入口共享一套流式状态与最近一次回答区域

这意味着：

- 前置入口提交后，文末入口进入禁用状态
- 文末入口提交后，前置入口进入禁用状态
- 旧流如果晚到，也不能覆盖新流

## 12. 引用展示设计

## 12.1 显示要求

每次回答后都要显示依据区，数量控制在 1~3 条。

### 文章页

- 标题：小节名
- 文本：section 摘录
- 可附带页面锚点跳转

### 作者页

- 标题：模块名
- 文本：该模块摘录
- 可附带页面锚点跳转

## 12.2 文本规则

- `excerpt` 尽量短
- 不展示大段正文
- 不展示原始代码块

---

## 13. 错误与兜底策略

## 13.1 页面内容缺失

如果 `articles/{slug}.json` 或 `author.json` 缺失：

- Worker 返回明确错误
- 前端展示轻量错误态
- 不展示空白占位区域

## 13.2 LLM 调用失败

页面级问答不适合像首页推荐那样做“内容推荐兜底”。

因此策略是：

- 上游失败时返回统一可读错误
- 不伪造问答结果

推荐文案：

> AI 暂时无法整理当前页面内容，请稍后再试。

## 13.3 流式中断

若已输出部分正文后失败：

- 保留已输出正文
- 标记“回答已中断”
- 不补假引用

---

## 14. 会话与缓存策略

## 14.1 首版不做会话缓存

首版只有单轮问答，因此：

- 不启用 Durable Object
- 不启用 KV 会话缓存
- 不保存会话历史

## 14.2 二阶段演进方向

后续如果增加追问，则采用：

- 存储：**Durable Object**
- 会话键：`sessionId + pageKey`
- 最近 10 轮
- 默认 TTL 300 秒
- 配置项可外置：
  - `AI_MEMORY_ENABLED`
  - `AI_MEMORY_MAX_TURNS`
  - `AI_MEMORY_TTL_SECONDS`

明确不使用 IP 作为会话主键。

---

## 15. 受影响文件

### 前端

- `app/articles/[slug]/page.tsx`
- `components/article-content.tsx`
- `app/author/page.tsx`
- `lib/ai-client.ts`
- `types/ai.ts`
- `scripts/build-ai-data.js`
- `lib/author-profile.ts`（新增）

### 新增前端组件

- `components/ai/ai-page-assistant.tsx`
- `components/ai/article-ai-assistant.tsx`
- `components/ai/author-ai-assistant.tsx`

### Worker

- `blog-ai-worker/src/index.ts`
- `blog-ai-worker/src/types.ts`
- `blog-ai-worker/src/scenes/article.ts`
- `blog-ai-worker/src/scenes/author.ts`
- `blog-ai-worker/src/prompts/article.ts`
- `blog-ai-worker/src/prompts/author.ts`

### 测试

- `tests/lib/ai-client.test.ts`
- `tests/blog-ai-worker/*`
- `tests/components/*`

---

## 16. 成功标准

### 文章页

- 用户一进入文章页即可看到 `AI 快速读懂这篇文章`
- 至少 4 个总结向快捷问题可用
- 自由提问可用
- 回答正文流式输出
- 回答结束后展示 1~3 条依据
- 超出文章内容的问题会被明确拒绝扩展

### 作者页

- 招聘者一进入作者页即可看到 AI 入口
- 快捷问题覆盖经历、擅长、证书、岗位匹配
- 回答正文流式输出
- 回答结束后展示 1~3 条依据
- 岗位匹配类回答保持谨慎归纳，正文直接自然，依据通过引用区展示

### 技术层

- 新增 `article` / `author` 场景
- 构建产物新增 `articles/{slug}.json` 与 `author.json`
- 页面级数据与页面渲染共享单一内容源
- 新增 `/chat/stream` 页面级流式接口
- 现有首页 `recommend` 不被破坏

---

*文档结束*
