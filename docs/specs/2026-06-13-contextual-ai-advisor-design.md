# 场景感知 AI 顾问设计

## 背景

当前博客系统已经具备公开主站、管理后台、FastAPI 后端、AI 流式问答和初步 RAG 知识库能力。现有 AI 能力主要包括文章页问答、作者页问答、首页文章推荐、AI 简报推荐、投资简报推荐，以及尚未被前端使用的通用 `advisor` 流式接口。

本设计目标是在不重建整套 AI 能力的前提下，将现有能力升级为“场景感知 AI 顾问”：用户在健康、投资、AI、作者、文章等不同页面唤起顾问时，系统自动切换上下文、知识检索范围、回答边界和快捷问题。

## 目标

- 在健康、投资、AI、作者、文章页提供统一的 AI 顾问入口。
- 回答以站内/RAG 资料为主，必要时补充一般常识，并明确区分资料依据和常识补充。
- 健康与投资场景使用强安全边界，不输出诊断、处方、买卖建议、收益预测或仓位命令。
- RAG 知识库支持数据库配置、后台运营、手动重建索引和 PostgreSQL `pgvector` 向量检索。
- 前端统一文章页、栏目页、作者页的 AI 体验，避免多个助手入口分裂。
- 多轮对话只保留当前浏览器会话最近几轮，不做账号级长期记忆。

## 非目标

- 不做用户账号体系或跨设备长期记忆。
- 不做完整知识库运营平台的版本管理、审核流、复杂权限和外部网页/PDF 自动抓取。
- 不让 AI 生成医疗诊断、治疗方案、处方建议、交易指令、收益预测或个股结论。
- 不在第一版引入独立向量数据库服务，除非后续明确需要替换 `pgvector`。

## 产品体验

### 入口形态

采用组合方案：栏目页/作者页/文章页导读附近放轻量提示卡片，右下角提供真正的聊天面板。

- 支持页面包括 `/health`、`/investment`、`/ai`、`/author`、对应栏目详情页和文章页。
- 其他页面第一版暂不显示悬浮按钮，后续可扩展为 `blog_navigation` 场景。
- 提示卡片用于解释当前顾问能力，例如“问健康顾问：如何安全开始跑步？”。
- 右下角聊天面板展示当前身份，例如健康顾问、投资顾问、AI 顾问、作者助理、文章追问。

### 场景体验

- 健康顾问：聚焦运动、恢复、训练原则、风险信号和专业求助触发条件。
- 投资顾问：聚焦信息整理、风险框架、资产配置原则和阅读路径。
- AI 顾问：聚焦模型、工具、厂商动态、AI 编程和博客 AI 文章导航。
- 作者助理：基于作者公开资料和文章解释作者观点、推荐阅读，不冒充作者本人。
- 文章顾问：围绕当前文章追问，并结合文章所属栏目决定默认领域。

### 快捷问题

快捷问题随 `scene` 和 `domain` 变化，由页面配置传入，不在组件内写死领域规则。

- 健康：如何安全开始跑步、如何安排恢复、哪些信号需要停止训练。
- 投资：如何理解某类资产风险、如何建立观察框架、推荐相关投资简报。
- AI：某模型有什么变化、某工具适合什么场景、推荐相关 AI 文章。
- 作者：作者关注哪些主题、从哪里开始读、如何理解某类观点。

### 引用与不确定性

- 回答区统一展示引用来源。
- 引用不足时必须明确说明资料不足。
- 允许补充一般常识，但必须用文案区分“基于资料”和“一般常识补充”。
- 健康和投资回答必须包含风险或限制，不给确定性结论。

## RAG 与数据模型

### 总体方向

知识库从“只同步 `content/**`”升级为“数据库可配置知识源 + 内容同步导入源”。现有 `knowledge_documents`、`knowledge_chunks` 可扩展使用；现有 `rag_sync_runs` 需要通过迁移演进为统一的索引运行概念，不建议推倒重建。

核心对象：

- `knowledge_sources`：知识源配置。
- `knowledge_documents`：可引用资料。
- `knowledge_chunks`：向量检索单元。
- `knowledge_index_runs`：索引重建记录；通过 Alembic 从现有 `rag_sync_runs` 演进而来，第一版不长期维护两套表名。

### 知识源

`knowledge_sources` 负责运营配置，建议字段包括：

- `id`
- `name`
- `source_kind`
- `domains`
- `scenes`
- `status`
- `source_uri`
- `sync_strategy`
- `content_config`
- `notes`
- `created_at`
- `updated_at`
- `updated_by`

第一版支持的 `source_kind`：

- `published_content`：由仓库内容同步生成，只能查看和重建索引，不在后台直接编辑正文。
- `manual_note`：后台手工维护的知识，如健康原则、投资原则、AI 术语。
- `structured_profile`：结构化资料，如作者资料、模型档案、固定观察清单。
- `external_link_placeholder`：仅预留建模，不实现网页抓取。

### 文档与分块

`knowledge_documents` 负责可引用资料，建议扩展字段包括：

- `knowledge_source_id`
- `source_id`
- `source_type`
- `slug`
- `title`
- `summary`
- `url`
- `domains`
- `scenes`
- `tags`
- `visibility`
- `published_at`
- `content_hash`
- `metadata`

`knowledge_chunks` 负责检索单元，建议字段包括：

- `document_id`
- `chunk_index`
- `heading`
- `content`
- `token_count`
- `content_hash`
- `embedding`
- `embedding_model`
- `metadata`

现有 `embedding` 字段是 JSON，生产第一版需要迁移为 `pgvector` 类型。SQLite 不支持 `pgvector`，本地和单元测试保留降级策略：关键词兜底、mock 向量检索或跳过 PostgreSQL 集成测试。

### 迁移与兼容

- `knowledge_sources.source_kind` 表达知识源配置类型，`knowledge_documents.source_type` 保留现有“文档内容类型”语义。
- 现有 `knowledge_documents.source_type` 的 `article`、`ai_briefing`、`investment_briefing` 继续有效，不迁移为 `published_content`。
- `knowledge_documents.source_id` 保留现有外部唯一 ID 语义，例如 `article:slug`；新增 `knowledge_source_id` 外键指向 `knowledge_sources.id`，避免偷换现有列含义。
- `published_content` 是 `knowledge_sources.source_kind`，它可以产生 `article`、`ai_briefing`、`investment_briefing` 等多类 document。
- 索引运行表统一使用 `knowledge_index_runs` 作为业务和物理命名；迁移时从现有 `rag_sync_runs` 改名或搬迁数据，不在 domain/application 层继续暴露 `rag_sync_run` 命名。
- PostgreSQL 迁移需要先启用 `vector` 扩展，再新增 `embedding_vector vector(N)` 或将现有列迁移为 `vector(N)`；SQLite 继续保留 JSON/mock 路径。
- JSON 向量不能可靠直接 `ALTER` 为 `vector(N)`，推荐使用“新增向量列 -> 重新生成 embedding -> 切换查询 -> 清理旧列”的迁移步骤。
- `vector(N)` 的维度是 schema 约束；更换同维度 embedding 模型只需要全量重建索引，更换不同维度模型必须先做 DDL 迁移再重建索引。

### 领域与过滤

`domain` 建议包括：

- `health`
- `investment`
- `ai`
- `author`
- `general`

资料可以属于多个 `domain`。检索流程先按 `domain + scene + source_type + tags + visibility` 过滤，再用 `pgvector` 做相似度召回，必要时混合关键词兜底。

### 向量检索

第一版使用 PostgreSQL + `pgvector`，但后端边界按可替换向量库设计：

- `EmbeddingGateway`：负责将文本转为向量。
- `KnowledgeRetrievalGateway`：负责按过滤条件和 query 返回 chunks 与引用。
- `PgvectorKnowledgeRetrievalGateway`：第一版实现。

`embedding_model` 和向量维度必须进入配置。更换同维度 embedding 模型时，旧 chunk 需要被标记为待重建；更换向量维度时，必须先完成 `vector(N)` schema 迁移，再全量重建索引，避免不同模型或维度的向量混用。

## 后端设计

### 上下文边界

后端实现必须遵守 `core-service` 的轻量 DDD 分层，不能扩大现有跨上下文 infra 直接依赖。

- `ai_assistant` 负责公开顾问 use case、场景解析、Prompt 构建、SSE 编码、LLM 调用和请求预算。
- `knowledge_base` 负责知识源、文档、chunk、embedding、索引运行和向量检索实现。
- `KnowledgeRetrievalGateway` 抽象放在 `ai_assistant/domain/`，由 `knowledge_base/infra/` 提供实现，在 interface 层装配注入。
- `EmbeddingGateway` 抽象放在 `knowledge_base/domain/`，provider 实现放在 `knowledge_base/infra/`。
- 场景安全 prompt 放在 `ai_assistant/domain/`，不要让 `ai_assistant/application` 直接 import `knowledge_base/domain` 的 prompt builder。
- 后续重构时应移除 `ai_assistant/infra` 对 `knowledge_base/infra` 的直接 import，通过 gateway 或应用装配隔离。

### 公开顾问接口

复用并扩展现有 `/api/v1/ai-assistant/advisor/stream` 作为主入口。

请求体建议：

```json
{
  "message": "用户问题",
  "conversation_id": "当前浏览器会话内的对话 ID",
  "scene": "health_advisor",
  "domain": "health",
  "page_context": {
    "path": "/health/running",
    "column_slug": "running",
    "article_slug": null,
    "article_title": null
  },
  "cf_turnstile_response": "token"
}
```

`scene` 建议包括：

- `health_advisor`
- `investment_advisor`
- `ai_advisor`
- `author_assistant`
- `article_advisor`
- `blog_navigation`

`page_context` 只接受白名单字段。后端不能接受前端传入系统提示词，也不能把任意上下文字段直接拼进 prompt。字段约束建议：

- `path`：只允许站内相对路径，最大 256 字符。
- `column_slug`：只允许字母、数字、短横线和下划线，最大 80 字符。
- `article_slug`：只允许字母、数字、短横线和下划线，最大 120 字符。
- `article_title`：仅作为展示和日志辅助，最大 160 字符，进入 prompt 前必须转义或改用后端根据 `article_slug` 读取的可信标题。
- `author_slug`：第一版固定为当前博客作者时可为空；若未来支持多作者，再按 slug 白名单扩展。

现有 `advisor` DTO 中的 `turnstile_token` 字段统一迁移为 `cf_turnstile_response`，与现有 `/chat/stream` DTO 命名保持一致。由于 `/advisor/stream` 尚未被主站使用，不需要兼容旧前端调用。DTO 文件仍使用当前 use case 命名演进，例如 `stream_ai_advisor_dto.py`，但类名和字段要表达新的场景顾问语义；如果后续拆分新 use case，应按 `core-service/AGENTS.md` 使用独立 `*Req` / `*Resp` DTO 文件。

顾问接口使用单一 Turnstile action：`contextual_ai_advisor`。后端需要在 `TURNSTILE_ACTIONS` 中显式注册各顾问 scene，或者让 `/advisor/stream` 固定校验该 action；不能依赖 `ai_{scene}` fallback，避免出现 `ai_ai_advisor` 这类错误 action。

引用对象 schema 使用 camelCase，并与现有前端消费保持一致：

```json
{
  "id": "chunk-id-or-document-id",
  "title": "来源标题",
  "url": "/articles/example",
  "sourceType": "article-section",
  "excerpt": "引用摘要",
  "domain": "health"
}
```

`sourceType` 第一版建议支持 `article-section`、`ai-briefing-section`、`investment-briefing-section`、`manual-note`、`structured-profile`、`author-section`。

### 编排流程

公开顾问调用流程：

1. 校验 Origin 和 Turnstile。
2. 按 `advisor_daily_request_limit` 做请求预算控制。
3. 校验 `scene`、`domain`、`page_context` 白名单。
4. 读取当前 `conversation_id` 最近几轮对话，或接收前端随请求携带的最近几轮消息。
5. 基于问题、场景和页面上下文检索知识库。
6. 构建场景安全 prompt。
7. 流式调用 LLM。
8. SSE 返回 `answer-delta`、`references`、`done`、`error`。
9. 记录 AI 请求事件、RAG 命中和 token 用量。第一版只记录匿名会话 ID、IP hash、User-Agent hash 和页面上下文，不记录可识别个人身份的信息。

第一版多轮历史建议由前端从 `sessionStorage` 随请求发送最近几轮摘要，后端不写入 `ai_conversations` / `ai_messages`。如后续需要服务端持久化，再明确数据保留周期、匿名化字段和清理策略。

### Prompt 边界

- 健康：拒绝诊断、处方、急症判断和个体化治疗，替代为科普、风险信号、求助建议。
- 投资：拒绝买卖指令、收益预测、个股结论和仓位命令，替代为风险框架、信息整理、阅读路径。
- 作者：明确不代表作者本人，不编造私密经历、联系方式或未公开观点。
- AI：回答模型和工具问题时优先引用站内资料，不足时标明常识补充。

### 管理 API

知识库管理 API 放在现有 admin 路由下，复用后台鉴权。

第一版接口：

- 列出知识源。
- 创建 `manual_note` / `structured_profile` 知识源。
- 更新 `manual_note` / `structured_profile` 知识源。
- 启用/停用知识源。
- 软删除手工知识源。
- 触发手动重建索引。
- 查看最近索引运行状态和失败原因。

`published_content` 由同步任务生成，只允许查看和重建索引，不允许后台直接编辑内容正文；后台变更不能反写 `content/**` 文件。

### 配置与降级

- `config.yml` 需要增加 embedding provider、model、dimensions 和 batch size 配置，统一通过 `settings` 访问。
- 未配置 embedding provider 时，索引重建按钮应返回明确错误，不静默生成空向量。
- 公开顾问在 embedding 不可用或当前环境不支持 `pgvector` 时，可降级为关键词检索，但响应中仍应保留资料不足提示。
- `scene_profiles` 需要显式增加顾问 scene，或在应用服务中统一归并到 `advisor` profile。

## 前端设计

### 主站组件

新增统一的 `ContextualAIAdvisor`：

- 右下角唤起按钮。
- 聊天面板。
- 输入框。
- 流式回答。
- 引用列表。
- 快捷问题。
- 场景身份与安全说明。

新增轻量 `AdvisorPromptCard`：

- 放在栏目页、作者页、文章页导读附近。
- 展示当前顾问能帮什么。
- 点击快捷问题可打开右下角面板并填入问题。

建议将 Turnstile、SSE、错误处理、引用渲染抽成通用 hook，复用现有 `PageAIAssistantProvider` 的成熟逻辑，减少 `AiRecommendWidget`、`BriefingRecommendWidget`、`ArticleAiAssistant` 等组件的重复维护。

### 页面接入

页面只负责传入：

- `scene`
- `domain`
- `pageContext`
- `quickTopics`
- `title`
- `description`
- `safetyNotice`

路径、场景和领域的第一版映射：

- `/health`、`/health/[column]` -> `scene=health_advisor`，`domain=health`
- `/investment`、`/investment/[column]` -> `scene=investment_advisor`，`domain=investment`
- `/ai`、`/ai/[column]` -> `scene=ai_advisor`，`domain=ai`
- `/author` -> `scene=author_assistant`，`domain=author`
- `/articles/[slug]` -> `scene=article_advisor`，`domain` 由文章所属栏目派生；健康栏目为 `health`，投资栏目为 `investment`，AI 栏目为 `ai`，无法派生时使用 `general`

文章页保留“基于当前文章追问”的体验，但统一到顾问面板中。文章所属栏目决定默认 `domain`，`article_slug` 参与 RAG 过滤和引用排序。

作者页使用 `author_assistant`，首屏文案明确“我是作者助理，不代表作者本人发言”。

作者结构化资料的单一真相源必须沿用 `site/lib/author-profile-data.js`。`site/public/ai-data/author.json` 是由构建脚本生成的产物，第一版可以通过同步任务读取构建产物或直接从单一真相源派生为 `structured_profile` document；不建议在后台或构建产物中重新维护一份会与主站作者资料漂移的作者正文。

### 会话状态

- 会话保存在 `sessionStorage`，刷新后可继续当前浏览器会话，关闭标签页或清理会话后丢失。
- 按 `scene + path` 分隔，避免不同栏目问题串场。
- 只保留最近几轮对话。
- 不做账号级长期记忆或跨设备同步。

### 输入与引用

- 顾问输入长度建议从现有 200 提升到 500 左右。
- 引用展示统一支持文章、简报、手工知识、作者资料。
- 没有引用时显示资料不足提示。

### 既有组件收敛

- 第一版优先用 `ContextualAIAdvisor` 替换文章页 `ArticleAiAssistant` 和作者页 `AuthorAIAssistant` 的公开聊天入口。
- 首页文章推荐、AI 简报推荐、投资简报推荐可以继续保留原业务形态，但应逐步复用同一套 Turnstile、SSE、错误处理和引用渲染 hook。
- 在共用 hook 落地前，避免一次性重写所有推荐组件，降低回归风险。

## 管理后台设计

在现有 `admin-console` 增加“知识库”导航项，与“评论审核 / 数据概览 / AI 用量 / 系统”并列。

页面主体保持轻量：知识源列表 + 当前知识源编辑面板。管理后台第一版沿用现有 `App.tsx` 的 `useState<Page>` 切页模式，只新增 `Page = "knowledge-base"` 和 `KnowledgeBasePage.tsx`，不引入 `react-router` 或新的前端路由依赖。

### 列表字段

- 名称
- 类型
- domain
- 适用场景
- 启用状态
- 更新时间
- 文档数
- chunk 数
- embedding 状态
- 最近一次索引结果

### 编辑字段

- 名称
- 类型
- domain
- 适用场景
- 启用状态
- 标题
- 正文或结构化配置
- 标签
- 来源 URL
- 备注

### 操作

- 新增知识源。
- 编辑手工知识源。
- 启用/停用知识源。
- 软删除手工知识源。
- 手动触发重建索引。
- 查看最近失败原因。

第一版只允许编辑 `manual_note` 和 `structured_profile`。`published_content` 由内容仓库同步产生，后台只展示和允许重建索引。

管理 API 路由前缀沿用现有 admin API 风格，鉴权复用当前 admin session cookie。后台页面不直接调用公开 `/advisor/stream`，只调用 admin 知识库管理 API。

## 安全与风控

- 后端必须做 `scene/domain/page_context` 白名单校验。
- 健康和投资红线必须放在后端 prompt 层，不能只靠前端说明。
- 健康和投资场景建议增加轻量红线检测器，对用户输入和模型输出做关键词/意图级兜底拦截，不能只依赖系统 prompt。
- Turnstile action 建议新增 `contextual_ai_advisor`，第一版可统一使用一个顾问动作。
- 顾问请求使用独立 `advisor_daily_request_limit`。
- 日志记录请求事件、RAG 命中引用、无引用率、拒答率、token 用量和索引失败率。
- `ai_request_events` 和 `rag_query_events` 可承接大部分观测；如果需要统计无引用率和拒答率，应在阶段一迁移中增加明确状态字段或 metadata 标记。
- 管理后台 API 复用现有 admin 鉴权，不对公开站点开放。
- 手工知识源删除优先软删除或停用，避免误删影响答案。

## 测试策略

后端测试：

- Prompt 红线：健康拒绝诊断/处方，投资拒绝买卖/收益预测。
- `scene/domain/page_context` 白名单解析。
- RAG domain 过滤。
- `pgvector` 相似度查询。
- embedding 模型不匹配时触发重建。
- 管理后台知识源 CRUD。
- SSE 事件顺序和错误处理。

前端测试：

- 不同页面派生正确 `scene` 和 `domain`。
- 快捷问题打开聊天面板并提交正确上下文。
- `scene + path` 会话隔离。
- 流式回答、错误状态、引用列表渲染。

验证命令：

- `just check-site`
- `just check-admin-console`
- `just check-core-service`
- 修改内容时额外执行 `just validate-content`

`pgvector` 集成测试需要 PostgreSQL + `pgvector` 服务。默认 SQLite 测试只覆盖关键词/mock 路径；CI 是否增加 PostgreSQL service 应在实施计划中单独确认。

## 分阶段实施建议

### 阶段一：后端基础与 RAG 模型

- 先完成迁移设计评审：`source_kind/source_type` 兼容、`knowledge_source_id` 外键、`knowledge_index_runs` 命名、`pgvector` 列迁移和 SQLite 降级策略。
- 扩展知识库数据模型和迁移。
- 接入 `pgvector`。
- 建立 `EmbeddingGateway` 和 `KnowledgeRetrievalGateway`。
- 扩展 `/advisor/stream` 请求体和场景 prompt。
- 补齐后端测试。

### 阶段二：管理后台知识库页

- 增加后台“知识库”导航和页面。
- 实现知识源列表、编辑、启停和手动重建索引。
- 展示索引状态和失败原因。

### 阶段三：主站统一顾问体验

- 新增 `ContextualAIAdvisor` 和 `AdvisorPromptCard`。
- 接入健康、投资、AI、作者、栏目详情页。
- 迁移文章页现有 AI 助手到统一顾问体验。
- 抽取共用 Turnstile、SSE、错误处理和引用渲染 hook，首页/简报推荐组件是否同步迁移由实施计划评估。

### 阶段四：体验与观测增强

- 优化引用展示和无引用提示。
- 增加 RAG 命中率、拒答率、无引用率等观测。
- 根据真实使用情况决定是否加入定时索引、外部链接抓取或独立向量库。

## 关键取舍

- 选择现有 `admin-console` 管理知识库，而不是新建后台平台，降低系统复杂度。
- 选择 `pgvector` 作为第一版向量库，但通过 gateway 抽象保留后续替换空间。
- 选择后台手动重建索引，而不是保存时立即生成 embedding，避免编辑流程被外部 embedding API 阻塞。
- 选择当前浏览器会话轻量多轮，而不是长期记忆，降低隐私和账号体系复杂度。
- 选择强安全边界，牺牲部分“像专家一样直接给结论”的体验，换取公开网站的风险可控。
