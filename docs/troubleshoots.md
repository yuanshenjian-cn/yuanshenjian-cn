# Troubleshoots

> 记录项目中已经定位并修复过、且值得后续复用的重要问题。

---

## 2026-06-14 AI 简报字数校验把来源标签中的汉字计入正文

### 现象

使用 `just validate-content` 校验新写的 AI 简报时，报错：

```text
AI 简报正文汉字数（不含来源章节）应为 900~1300（当前：1319）
```

但用独立脚本统计正文（不含 `## 来源` 章节）时，中文字符数实际为 1299，落在 900~1300 范围内。

### 根因

`scripts/validate-post.js` 中的 `removeSections()` 函数使用正则：

```javascript
const sectionMatch = result.match(new RegExp(`^##\\s+${escapedHeading}\\s*$[\\s\\S]*?(?=^##\\s+|$)`, "m"));
```

该正则在多行模式下，`$` 会匹配每一行的行尾。`[\s\S]*?` 是非贪婪匹配，当它在来源章节第一个列表项末尾遇到换行符时，`(?=^##\s+|$)` 中的 `$` 会在当前行行尾（换行符之前）直接匹配成功，导致匹配提前结束。结果只移除了 `## 来源` 标题行，而来源列表中的 `[官方]`、`[媒体报道]` 等标签里的汉字被误计入正文。

### 临时处理

将正文实际中文字符数控制在 1280 以内，使包含来源标签后的统计值不超过 1300。

### 修复建议

1. 将 `removeSections()` 中的 lookahead 改为只匹配下一个同层级标题或字符串绝对末尾，避免 `$` 在行尾提前匹配。例如使用行级解析或 `(?=^##\s+|$(?!\s))` 等更严格的结尾判断。
2. 同步检查投资简报是否受同一 bug 影响。

### 结论

在脚本修复前，写 AI 简报时应预留约 20 字余量，避免 `[官方]` / `[媒体报道]` 标签中的汉字被误统计导致校验失败。

## 2026-06-14 `site/components` 命名与分层长期失配会放大维护成本

### 现象

`site/components/` 下长期同时存在两类问题：

1. 组件文件命名混用 PascalCase 与 kebab-case
2. 布局、主题、系统、文章、搜索、AI hooks、消息常量等职责平铺在同一目录或放错层

继续在这个状态下开发时，新文件很容易跟着历史惯性继续落到根目录，或者把 hook / 常量继续塞进 `components/`。

### 根因

`site/AGENTS.md` 已明确要求“组件文件 PascalCase、其他文件 kebab-case”，但工程历史实现没有持续执行，导致：

1. 目录结构不能表达职责边界
2. import 路径风格持续漂移
3. `components/ai` 中混入 hook 和消息常量，破坏 `components/` / `hooks/` / `lib/` 分层

### 修复

先做低风险、机械可替换的归类与迁移：

1. 布局组件迁到 `site/components/layout/`
2. 主题组件迁到 `site/components/theme/`
3. 系统组件迁到 `site/components/system/`
4. 文章相关组件迁到 `site/components/article/`
5. 搜索组件迁到 `site/components/search/`
6. AI hook 迁到 `site/hooks/ai/`
7. AI 消息常量迁到 `site/lib/ai/`

同时配套更新 import，确保这类整理先“修边界、保行为”，而不是夹带大规模业务重构。

### 结论

目录整理最怕一口气全量搬迁。更稳妥的做法是先迁移职责最清晰、引用面可控的一批文件，让工程重新回到可持续演进的分层上，再继续处理剩余历史文件。

## 2026-06-14 本地 SQLite 会掩盖线上 PostgreSQL 的 JSON 查询问题

### 现象

本地启动 `core-service` 时，场景顾问可以正常返回；但部署到 Render + PostgreSQL 后，同一条请求在知识库检索阶段报错，最终表现为顾问对话无内容。

### 根因

本地默认链路原先使用 SQLite，线上使用 PostgreSQL。某些 SQLAlchemy 写法在 SQLite 上可以“看起来能跑”，但到了 PostgreSQL 就会因为 JSON 列类型和操作符差异直接失败，例如：

1. SQLite 把 JSON 当文本处理，很多字符串匹配不会立刻报错
2. PostgreSQL 对 `JSON` / `JSONB` 操作更严格，错误的 `.contains()` 编译结果会直接触发类型异常

这会让本地联调产生“接口没问题”的错觉，直到上线才暴露数据库方言兼容问题。

### 修复

1. 本地开发默认数据库从 SQLite 切到 Postgres
2. `just run-core-migrations`、`just start-core-service` 及相关联调命令不再覆盖 `DATABASE_URL`，统一改为读取 `core-service/.env.local` 或当前 shell 环境
3. 新增 `just start-local-pgvector-postgres`，本地默认用 `pgvector/pgvector:pg16` 在 `127.0.0.1:5437` 提供 `ysj_blog` 数据库
4. `core-service/.env.example`、`core-service/README.md` 改为以 `postgresql+asyncpg://postgres:postgres@127.0.0.1:5437/ysj_blog` 为本地示例
5. `Settings` 在缺少 `DATABASE_URL` 时直接报错，避免静默回退到 SQLite

### 结论

只要生产环境使用 PostgreSQL，本地默认联调环境也应该尽量保持 PostgreSQL。一旦本地和线上数据库方言不一致，RAG、JSON 条件、迁移和限流这类依赖数据库行为的逻辑都可能出现“本地正常、线上翻车”的假象。

## 2026-06-14 PostgreSQL 上不能对 `JSON` 列直接用 SQLAlchemy `.contains([...])` 做场景过滤

### 现象

线上 Render 使用 PostgreSQL 时，调用 `POST /api/v1/ai-assistant/advisor/stream` 会在知识库检索阶段报错：

```text
asyncpg.exceptions.UndefinedFunctionError: operator does not exist: json ~~ text
```

SQL 日志里可以看到类似条件：

```sql
knowledge_documents.scenes LIKE '%' || $4::JSON || '%'
knowledge_documents.domains LIKE '%' || $5::JSON || '%'
```

本地 SQLite 环境不一定会暴露这个问题，因此容易出现“本地能答、线上 200 但无内容”的错觉。

### 根因

`core-service/app/contexts/knowledge_base/infra/knowledge_context_query_service.py` 原本对 `scenes` / `domains` 这两个 `JSON` 数组列使用：

1. `KnowledgeDocumentPO.scenes.contains([scene])`
2. `KnowledgeDocumentPO.domains.contains([domain])`

这两个列在 PostgreSQL 里是 `JSON`，不是 `JSONB`。SQLAlchemy 对 generic `JSON` 的 `.contains()` 不会编译成 PostgreSQL 的 JSON 包含操作符，而是退化成字符串 `LIKE` 匹配，最终触发 `json ~~ text` 报错。

### 修复

把场景/领域过滤改成对 JSON 文本做成员匹配：

1. `cast(column, Text).like(literal('%"article"%'))`
2. `cast(column, Text).like(literal('%"ai"%'))`

这样生成的 SQL 形如：

```sql
CAST(knowledge_documents.scenes AS TEXT) LIKE '%' || $4::VARCHAR || '%'
```

关键点不是只有 `CAST(... AS TEXT)`，还要避免继续使用 `.contains()` 这类可能被方言重写的语法糖，直接生成显式 `TEXT LIKE TEXT`，才能稳定避免 PostgreSQL 上出现 `$4::JSON` 这类错误绑定。

补充回归测试 `test_query_service_casts_json_scope_filters_for_postgresql`，确保 SQL 编译结果包含 `CAST(... AS TEXT)`，不再出现 `knowledge_documents.scenes LIKE` 这类错误形式。

### 结论

如果字段在 PostgreSQL 中是 `JSON` 而不是 `JSONB`，不要直接依赖 SQLAlchemy generic `JSON.contains()` 做数组成员过滤。要么显式转 `JSONB` 再用包含操作符，要么像本项目这样在受控字符串数组场景下改用 `CAST(... AS TEXT)` 做精确成员匹配。

## 2026-06-14 场景顾问首个 SSE chunk 之前抛异常时会表现成 200 空响应

### 现象

线上调用 `POST /api/v1/ai-assistant/advisor/stream` 时，浏览器 Network 面板显示 `200 OK`，但 Response / Preview 为空，对话窗里也没有任何回答内容。

本地启动 `core-service` 调同一个大模型配置时可以正常返回，问题只在线上部署环境出现。

### 根因

`ai_assistant` 的顾问流接口使用 `StreamingResponse`。如果异常发生在**第一个 SSE chunk 发出之前**，例如：

1. 知识库查询报错
2. 已发布资料读取报错
3. prompt 组装阶段报错

那么 HTTP 响应头仍然可能先被 FastAPI/ASGI 发送出去，于是浏览器看到的是 `200`；但因为生成器在首包前就中断，body 实际为空，看起来就像“成功但没返回”。

原实现里，只有 LLM provider 调用阶段做了 SSE `error` 兜底；前面的顾问上下文构建阶段一旦报错，会直接把流打断。

### 修复

在 `core-service/app/contexts/ai_assistant/application/stream_ai_advisor_app_service.py` 的 `execute()` 顶层增加异常兜底：

1. 记录 `advisor stream failed before completion` 异常日志
2. 向前端补发 `event: error`
3. 再补发 `event: done`

补充回归测试 `test_stream_ai_advisor_returns_error_event_when_context_loading_fails`，覆盖“知识库查询在首包前抛异常”场景，确保不再出现空流。

### 结论

只要使用 SSE / `StreamingResponse`，就不能只在“真正调用 LLM”那一段兜底。任何会发生在首包前的步骤，都必须转换成可见的 SSE 错误事件；否则线上最直观的症状就是 `200 OK` + 空响应，排查成本很高。

## 2026-06-13 栏目页顾问知识库空命中时不能回退到全站文章

### 现象

在 `/investment` 投资栏目页问候“哈喽”这类与栏目无关的开放式问题时，顾问回答里会出现 OpenAI、Claude、GLM、MiMo、地中海饮食等明显跨栏目的文章推荐。

### 根因

`core-service/app/contexts/ai_assistant/application/stream_ai_advisor_app_service.py` 在 `contexts` 仍然为空时，会无条件回退到 `load_article_recommendation_candidates()[:5]`，把全站推荐池（AI / 健康 / 投资混在一起）拼进 prompt。栏目页携带 `scene` / `domain` / `page_slug` 等过滤条件，但这条最终的全站 fallback 完全忽略它们，于是模型基于全站资料作答，看起来像是在投资栏目里串迷。

### 修复

为最终的全站推荐 fallback 加守卫：当请求带任意 `article_slug` / `page_slug` / `domain` / `scene` 时就跳过全站推荐，保持 `contexts` 为空，让 prompt 走“当前知识库没有检索到足够资料。”分支，由模型坦诚回应资料不足，而不是召出跨栏目文章。

补充回归测试 `test_stream_ai_advisor_skips_global_fallback_when_column_scoped`：当 KB 返回空且 `scene=investment-column` 时，`load_article_recommendation_candidates` 不应被调用，跨栏目候选标题不会出现在 prompt 中。

### 结论

场景顾问的“兜底”必须分级守卫：作者页有 author fallback、单篇文章有 article fallback、栏目页则宁可让模型说“资料不足”，也不能跳过 scene/domain 边界召回全站文章。任何看起来兜底的逻辑，只要不考虑当前栏目语义，就会在生产里制造跨栏目串迷。

## 2026-06-13 栏目页顾问推荐文章时必须把文章 URL 注入提示词

### 现象

在 `/health` 等栏目页里，用户问“有哪些文章”“推荐几篇文章”时，顾问可能只回答纯文本标题，或者无法稳定基于栏目下文章内容推荐可点击的站内文章。

### 根因

场景顾问的前端聊天窗虽然已经支持 Markdown 渲染，但后端传给 LLM 的知识上下文只有正文片段，没有把文章标题和 URL 一起注入。模型不知道文章链接，自然只能输出纯文本标题。

另外，“有哪些文章 / 推荐文章”这类导航型问题不一定会命中文章正文关键词。如果仍然按普通问答做关键词过滤，会把同栏目文章候选过滤掉。

### 修复

1. 场景顾问应用层把检索上下文扩展为“标题 / 链接 / 内容”
2. 提示词明确要求推荐站内文章时使用 Markdown 链接，例如 `[文章标题](/articles/example-slug)`
3. 聊天窗 Markdown 链接统一 `target="_blank"`，点击后新标签打开
4. 检索层识别“有哪些文章 / 推荐文章 / 推荐阅读”等导航型问题，保留同栏目候选并按文章去重

### 结论

“引用事件”只够前端展示依据，不等于 LLM 知道文章链接。只要要求模型在正文里推荐可点击文章，就必须把 URL 明确放进 prompt 上下文。

## 2026-06-13 场景顾问中文问题不能只按空格拆词

### 现象

在 `/health` 页面询问“陈皮怎么喝更健康”时，知识库里明明已有陈皮文章，顾问却回答当前资料主要是地中海饮食，无法基于资料回答陈皮问题。

### 根因

`/health` 页面传入的 `scene=health`、`domain=health`、`pageSlug=health` 是正确的，后端也会在页面级资料没命中时回退到整个健康域。

真正的问题在检索层：原逻辑只用 `query.lower().split()` 按空格拆关键词。中文问题通常没有空格，“陈皮怎么喝更健康”会被当成一个完整关键词，导致包含“陈皮”的文章也无法命中。

同时，检索 SQL 先 `limit top_k` 再做内存过滤，容易只拿到健康域前几篇文章，错过后面的陈皮文章。

### 修复

`KnowledgeContextQueryService` 改为：

1. 对中文连续文本生成 2 到 6 字短语，用于匹配“陈皮”这类主题词
2. 先取更大的 scoped candidate 集合，再按关键词命中得分重排，最后返回 `top_k`
3. 标题和分片标题命中权重大于正文命中，避免“健康”这种泛词压过“陈皮”主题词

### 结论

中文 RAG 检索不能只依赖空格拆词。栏目页这类场景还要先扩大同域候选集，再做主题词重排，否则“页面下确实有文章”也可能因为候选截断或中文整句匹配而被漏掉。

## 2026-06-13 场景顾问检索在带过滤条件时不能回退到全量知识库

### 现象

场景顾问接到 `scene` / `domain` / `page_slug` 过滤参数时，如果目标页面没有命中资料，回答会意外引用其他栏目内容。

典型表现：

- 作者页提问时，回答依据却变成健康或 AI 栏目文章
- 栏目页 `page_slug` 没有对应文档时，本该退回同栏目资料，结果退回了全站任意资料

### 根因

`core-service/app/contexts/knowledge_base/infra/knowledge_context_query_service.py` 里原先的回退逻辑是：

1. 先带 `article_slug` / `page_slug` / `scene` / `domain` 查一次
2. 只要第一次没命中，并且存在任一过滤条件，就直接退回到**不带任何过滤条件**的全量查询

这会破坏场景顾问的边界，尤其在作者页这类主要依赖后续 fallback 资料的场景里，会先被全量知识库“误命中”，从而吃掉正确的作者资料 fallback。

### 修复

把回退策略改成两级：

1. 先按 `page_slug + scene/domain` 精确查
2. 若只是在 `page_slug` 上没命中，则去掉 `page_slug`，但**保留 `scene/domain` 继续查**
3. 只有在一开始就完全没有任何过滤条件时，才允许走全量回退

### 结论

场景顾问的检索回退必须遵守“逐步放宽，但不越过场景边界”的原则。`page_slug` 可以放宽，`scene` 和 `domain` 不能在回退时一并丢掉，否则会把顾问回答污染成跨栏目混答。

## 2026-06-13 本地 SQLite schema 漂移会导致场景顾问查询直接报缺列

### 现象

本地调用 `POST /api/v1/ai-assistant/advisor/stream` 时，后端在知识库检索阶段报错：

```text
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: knowledge_chunks.embedding_dimensions
```

### 根因

`core-service` 的 ORM 已经为 `knowledge_chunks` 和 `knowledge_documents` 增加了新字段，但本地 `dev.db` 仍停留在旧 revision，表结构没有同步升级。

这会导致查询服务生成的 SQL 已经选择了：

- `knowledge_chunks.embedding_dimensions`
- `knowledge_chunks.embedding_status`
- `knowledge_documents.knowledge_source_id`
- `knowledge_documents.domains`
- `knowledge_documents.scenes`
- `knowledge_documents.tags`

而本地 SQLite 里这些列还不存在，于是运行期直接报错。

另外，`test.db` 上执行 `alembic upgrade head` 看到的 `table visitors already exists` 不是这次迁移本身有问题，而是因为该库之前已被 pytest 建过表、但没有 Alembic 版本表，属于脏测试库重复跑初始化迁移。

### 修复

1. 新增并收敛知识库增量迁移：`core-service/migrations/versions/9ad634c7ec9e_contextual_ai_advisor_knowledge_base.py`
2. 对本地开发库执行：

```bash
DATABASE_URL="sqlite+aiosqlite:///./dev.db" APP_ENV=test .venv/bin/python -m alembic -c alembic.ini upgrade head
```

3. 升级后确认：

- `alembic_version` 变为 `9ad634c7ec9e`
- `knowledge_chunks` 已包含 `embedding_dimensions`、`embedding_status`
- `knowledge_documents` 已包含 `knowledge_source_id`、`domains`、`scenes`、`tags`

### 结论

只要修改了知识库相关 PO，并且查询 SQL 会直接选取新列，就不能依赖“旧本地库也先跑起来”的侥幸路径，必须同步生成 Alembic migration 并先升级本地 SQLite。迁移烟测也要使用全新的临时库，避免被 `test.db` 这类脏库误导。

## 2026-06-02 切换到 `uv --directory core-service` 后，Alembic 不能再使用 `core-service/migrations`

### 现象

执行 `just run-core-migrations` 或 `just start-core-service` 报错：

```text
FAILED: Path doesn't exist: core-service/migrations.
```

### 根因

`uv --directory core-service run ...` 会先把工作目录切到 `core-service/`，这时 `core-service/alembic.ini` 里的旧相对路径：

- `script_location = core-service/migrations`
- `prepend_sys_path = core-service`

会被解析成错误的双重路径：

- `core-service/core-service/migrations`

### 修复

把 `core-service/alembic.ini` 改为以 `core-service/` 为工作目录的相对路径：

```ini
[alembic]
script_location = migrations
prepend_sys_path = .
```

### 结论

当运行链路统一切到 `uv --directory core-service`、Render `rootDir=core-service` 或 CI `working-directory: core-service` 后，`alembic.ini` 里的相对路径也必须一起收口，不能继续带 `core-service/` 前缀。

## 2026-06-03 未配置 `CORE_SERVICE_DATABASE_URL` 时，`rag-sync` 不应把整次 push 标红

### 现象

GitHub Actions 的 `RAG Sync` workflow 在 `Sync public RAG content` 步骤失败，报错类似：

```text
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

### 根因

`rag-sync.yml` 会把：

- `CORE_SERVICE_DATABASE_URL`
- `EMBEDDING_BASE_URL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL_ID`

注入到 `core-service` 的 CLI。未配置时，GitHub Actions 会把对应值展开成空字符串，而不是完全不传；后端在导入数据库层时执行：

```python
create_async_engine(settings.database_url, ...)
```

最终等价于 `create_async_engine("")`，于是 URL 解析直接失败。

### 修复

给 `rag-sync.yml` 增加前置检查：

1. 任一必要 secret / variable 缺失时，输出 `ready=false`
2. 后续数据库 URL 校验和内容同步步骤只在 `ready=true` 时运行
3. 缺少配置时打印明确日志，并优雅跳过 workflow

### 结论

`RAG Sync` 在当前项目里应视为“按需启用”的生产能力，而不是主站/后端基础部署的阻断项。没配 RAG 所需 secrets 时，workflow 应跳过而不是失败。

## 2026-06-03 `rag-sync` 的 `CORE_SERVICE_DATABASE_URL` 必须使用 asyncpg 风格 URL

### 现象

GitHub Actions 的 `Sync public RAG content` 步骤失败，报错：

```text
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string
```

### 根因

`rag-sync` 会导入 `core-service/app/shared/infra/database.py`，当前项目已统一使用 async SQLAlchemy：

```python
create_async_engine(settings.database_url, ...)
```

因此 `CORE_SERVICE_DATABASE_URL` 必须使用 async SQLAlchemy 可识别的连接串。常见错误有两类：

1. 误填成旧同步驱动 `postgresql+psycopg://...` 或裸 `postgresql://...`
2. 密码里包含原始 `#`，没有编码成 `%23`

另外，当前项目使用 `postgresql+asyncpg://`，连接串查询参数应写成：

- `ssl=require`

而不是：

- `sslmode=require`

### 正确示例

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?ssl=require
```

如果密码里有 `#`，例如：

```text
abc#123
```

则 URL 中必须写成：

```text
abc%23123
```

### 修复

1. 将 GitHub Secret `CORE_SERVICE_DATABASE_URL` 改成 `postgresql+asyncpg://...?...ssl=require`
2. 如果 Render 里的 `DATABASE_URL` 也用了同一条旧值，一并修正
3. 对密码中的特殊字符做 URL encode，尤其是 `# -> %23`

### 防回归

`rag-sync.yml` 已新增前置校验步骤，会明确阻断以下问题：

- Secret 为空
- 驱动不是 `postgresql+asyncpg://`
- URL 中仍包含原始 `#`

## 2026-06-03 `site-ci` 的根级 Vitest 不能在 `site/` 目录下执行

### 现象

GitHub Actions 的 `Run tests` 步骤在 `site` 内测试通过后，根级 workspace 测试仍然失败，典型报错包括：

```text
Error: Cannot find module '/.../site/scripts/validate-post.js'
ENOENT: no such file or directory, open 'skills/ai-briefing/SKILL.md'
```

### 根因

根因有两层：

1. `npm exec vitest ...` 在 CI 的 npm 版本下需要显式 `--`
2. 更关键的是，`site/vitest.workspace.config.ts` 会加载仓库级测试：

- `scripts/tests/**`
- `skills/tests/**`

这些测试依赖的相对路径是按仓库根目录设计的。如果在 `working-directory: site` 下执行，就会错误地去找：

- `site/scripts/validate-post.js`
- `site/skills/...`

从而导致根级测试失败。

### 修复

把测试拆成两步：

```bash
npm run test
./site/node_modules/.bin/vitest run -c site/vitest.workspace.config.ts
```

其中：

- `npm run test` 在 `site/` 目录执行，负责主站自身测试
- workspace tests 在仓库根目录执行，负责 `scripts/tests`、`skills/tests`

### 结论

带仓库根级测试的 Vitest workspace，如果包含依赖相对路径的脚本测试，必须在仓库根目录执行；不能简单沿用 `working-directory: site`。

## 2026-06-03 `core-service-ci` 的 migration smoke 不能与 pytest 共用默认 SQLite 文件

### 现象

GitHub Actions 的 `Migration smoke` 步骤执行：

```text
uv run --frozen --no-sync alembic -c alembic.ini upgrade head
```

报错：

```text
sqlite3.OperationalError: table visitors already exists
```

### 根因

`core-service-ci.yml` 先跑 pytest，再跑 Alembic migration smoke。两步都没有显式覆盖 `DATABASE_URL`，于是都会落到同一个默认 SQLite 文件。

测试阶段会先创建业务表，但不会写入 Alembic 版本表；后续 migration smoke 再执行 `0001_initial` 时，Alembic 认为这是一个空库，于是尝试重复建表，最终触发：

```text
table visitors already exists
```

### 修复

给两个步骤使用不同数据库文件：

```text
pytest           -> sqlite+aiosqlite:///./test.db
migration smoke  -> sqlite+aiosqlite:///./migration-smoke.db
```

同时显式设置：

```text
APP_ENV=test
```

### 结论

在 CI 中，只要同一个 job 既跑测试又跑 Alembic migration smoke，就不要共用默认 SQLite 文件；必须把测试库和迁移烟测库隔离开。

## 2026-06-03 Render 上 Alembic 不能直接把含 `%23` 的 `DATABASE_URL` 写入 configparser

### 现象

Render 启动命令执行 Alembic migration 时失败：

```text
ValueError: invalid interpolation syntax in 'postgresql+asyncpg://...Ysj%23blog2026...'
```

### 根因

这里有两个问题：

1. Alembic 的 config 底层是 Python `configparser`，它会把 `%` 当成插值语法。数据库密码里的 `#` 被正确 URL encode 成 `%23` 后，`configparser` 会因为裸 `%` 抛 `invalid interpolation syntax`。
2. 当前 `core-service` 已使用 async SQLAlchemy `create_async_engine()` 和 `AsyncSession`，生产 `DATABASE_URL` 必须使用 `postgresql+asyncpg://`。

### 当前项目的正确连接串

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?ssl=require
```

说明：

- `asyncpg` 适用于 async SQLAlchemy 链路，需要 `create_async_engine()` 和 `AsyncSession`
- 当前项目已经走 async SQLAlchemy，所以不能继续使用 `postgresql+psycopg://` 或裸 `postgresql://`
- 当前 asyncpg 连接串使用 `?ssl=require`，不要写 `?sslmode=require`
- 密码里的 `#` 仍然必须 URL encode 成 `%23`

### 修复

1. Alembic 写入 `sqlalchemy.url` 前，把 `%` 转义成 `%%`：

```python
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))
```

2. `Settings` 增加数据库 URL 校验，发现 `postgresql+psycopg://`、裸 `postgresql://`、`sqlite+pysqlite://` 或裸 `sqlite://` 时直接报错，避免 async engine 误用同步 driver。
3. Render 的 `DATABASE_URL` 必须同步改成 `postgresql+asyncpg://...?...ssl=require`。

### 结论

URL encode 是正确的，`%23` 可以被数据库驱动还原成 `#`；问题在 Alembic configparser 需要额外转义 `%`。生产后端和 Alembic 都走 async SQLAlchemy，所以 Render 上必须使用 `asyncpg` 连接串。

## 2026-06-03 Render asyncpg 启动时报 `unexpected keyword argument 'sslmode'`

### 现象

Render 启动命令执行 Alembic migration 时失败：

```text
TypeError: connect() got an unexpected keyword argument 'sslmode'
```

### 根因

`core-service` 已使用 SQLAlchemy asyncpg driver：

```text
postgresql+asyncpg://...
```

这个 driver 会把 URL 查询参数直接传给 `asyncpg.connect()`。`asyncpg.connect()` 接受 `ssl` 参数，不接受 psycopg/libpq 风格的 `sslmode` 参数。

### 修复

把 Render 的 `DATABASE_URL` 从：

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?sslmode=require
```

改成：

```text
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/postgres?ssl=require
```

密码中的特殊字符仍然需要 URL encode，例如 `# -> %23`。

### 结论

asyncpg 生产连接串使用 `?ssl=require`；`sslmode=require` 只适用于 psycopg/libpq 风格连接串。

## 2026-06-03 FastAPI `TestClient` 未触发 lifespan 时，SQLite fresh DB 会缺表

### 现象

GitHub Actions 的 `core-service` pytest 在评论集成测试失败：

```text
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such table: visitors
```

### 根因

`core-service` 切到 async SQLAlchemy 后，SQLite 开发/测试库的自动建表逻辑从模块导入期移动到了 FastAPI lifespan：

```python
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if settings.database_url.startswith("sqlite"):
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    yield
```

但测试里直接写：

```python
client = TestClient(app)
```

这种用法不会保证进入 lifespan 上下文。开发机上如果 `test.db` 曾被旧测试或迁移创建过表，测试可能侥幸通过；CI 使用 fresh SQLite 文件时，就会在第一次查询 `visitors` 表时报缺表。

### 修复

所有依赖 app lifespan 的 FastAPI 测试都应使用上下文管理器：

```python
with TestClient(app) as client:
    response = client.get("/healthz")
```

这样测试请求前会先执行 lifespan，SQLite 表结构也会先创建。

### 结论

迁移到 FastAPI lifespan 后，测试不能再依赖 `TestClient(app)` 的裸实例化；凡是依赖 startup/lifespan 初始化的测试，都必须使用 `with TestClient(app) as client:`。

## 2026-06-04 Render Key Value 只适合短窗口，不适合作为 AI 日预算真相源

### 现象

AI、评论和管理员登录原先都使用进程内 `InMemoryRateLimiter`，多实例部署时无法共享状态；同时 `daily_budget_usage` 和 `rate_limit_buckets` 表曾处于半成品状态，没有真正承接业务限流。

### 根因

短窗口限流和日预算是两类不同问题：

- 短窗口限流需要低延迟、可丢失、跨实例共享的计数器，适合 Render Key Value / Valkey
- AI 日请求数、日 token 预算和审计是账本语义，需要持久化和可追溯，必须落 Postgres
- 进程内 memory 只能作为 Key Value 故障降级，不能作为正常预算判断缓存

### 修复

1. 短窗口限流统一走 `ShortWindowRateLimiter`，默认使用 Render Key Value，异常或未配置时降级到 memory fallback。
2. Valkey 多窗口限流采用 Lua 原子脚本，先检查所有窗口，只有全部允许时才递增，避免被拒请求污染长窗口。
3. AI 日预算重建为 `daily_budget_usage(usage_date, budget_key, request_count, token_count, updated_at)`。
4. AI 请求先预扣估算 token，流式响应结束后从 `done` 事件读取真实 usage 并补差，同时写入 `ai_request_events`。
5. 删除旧 `rate_limit_buckets` PO 和表，避免误以为 Postgres 短窗口表仍是主路径。

### 结论

Render Key Value 是短窗口治理组件，不是预算账本。AI 预算和审计的真相源必须是 Postgres；memory fallback 只能降低 Key Value 故障时的可用性损失，不能承担跨实例一致性。

## 2026-06-04 Cloudflare 橙云后不能继续信任客户端 `X-Forwarded-For`

### 现象

生产环境如果直接使用 `X-Forwarded-For` 作为限流 IP，攻击者可以伪造 header 绕过 IP 桶；灰云直连 Render 和橙云代理阶段的可信 header 也不同。

### 根因

`X-Forwarded-For` 是普通客户端也能发送的 header，除非应用前面有可信代理并剥离/重写该 header，否则不能作为生产可信 IP。Cloudflare 橙云后，应优先读取 Cloudflare 注入的 `CF-Connecting-IP`；灰云阶段则应继续使用 socket IP。

### 修复

1. 新增 `TRUST_CF_CONNECTING_IP` 配置。
2. 灰云验证阶段设为 `false`，使用 Render socket IP。
3. `api.yuanshenjian.cn` 切到 Cloudflare 橙云后设为 `true` 并重新部署。
4. `hash_request_ip()` 和统一 `RequestIdentityResolver` 都通过同一套可信 IP 策略解析。

### 结论

Cloudflare 橙云只提供外层代理和粗限流能力，不替代应用内主体解析、Turnstile、短窗口限流与 Postgres 日预算。生产默认不要信任客户端提供的 `X-Forwarded-For`。
