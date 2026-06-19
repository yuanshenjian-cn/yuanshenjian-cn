# blog-glossary-sync

从本博客仓库的 `content/` 目录（博客文章、AI 简报、投资简报等）提取候选术语，与 `core-service` 术语库去重对比后，生成可执行的 curl 脚本批量写入术语库。

## 触发方式

### 方式一：Slash command（推荐）

在 opencode 中输入：

```
/sync-glossary
```

即可激活 `blog-glossary-sync` skill。

### 方式二：自然语言

以下说法都会触发 skill：

- “提取博客术语并同步到术语库”
- “扫描文章更新术语库”
- “把简报里的术语整理到术语库”
- “从 content/ 里提取术语”

## 环境准备

### 本地开发

`core-service/.env` 中已配置 `ADMIN_API_KEY`，启动 core-service 后直接使用：

```bash
export CORE_SERVICE_URL="http://localhost:8001"
export ADMIN_API_KEY="$(grep ADMIN_API_KEY core-service/.env | cut -d= -f2)"
```

### 生产环境

生产 core-service 地址为 `https://api.yuanshenjian.cn`，需要在 Render 环境变量中配置 `ADMIN_API_KEY`。

```bash
export CORE_SERVICE_URL="https://api.yuanshenjian.cn"
export ADMIN_API_KEY="<你的生产 ADMIN_API_KEY>"
```

`ADMIN_API_KEY` 通过 `Authorization: Bearer <key>` 调用 admin 术语接口，无需登录、CSRF 或 Turnstile，适合脚本自动化。

## 工作流

```
content/ 下的 Markdown/MDX
        │
        ▼
  扫描并分批读取内容
        │
        ▼
  LLM 提取候选术语
  （term / aliases / definition / explanation / domains / scenes / related_article_slugs）
        │
        ▼
  拉取现有术语库去重
  区分「创建」和「更新」
        │
        ▼
  生成 scripts/glossary-candidates.json
  生成 scripts/sync-glossary.sh
        │
        ▼
  用户 review / 编辑候选列表
        │
        ▼
  用户确认后执行 bash scripts/sync-glossary.sh
```

## 输出文件

| 文件 | 说明 |
|------|------|
| `scripts/glossary-candidates.json` | 提取后的候选术语列表，分 `create` 和 `update` 两组，可人工编辑 |
| `scripts/sync-glossary.sh` | 由 `render_sync_script.py` 生成的可执行 curl 脚本 |

## 字段映射

每个候选术语包含：

- `term`：术语原文
- `aliases`：别名数组（可包含中英文）
- `definition`：一句话定义，用于博客文章页 hover tooltip
- `explanation`：详细解释，用于 AI 顾问上下文增强。**要求包含核心定义、关键要点、典型场景和具体示例**，避免空话。
- `related_article_slugs`：相关文章 slug 数组
- `domains`：生效域，可选 `ai` / `investment` / `health` / `article`
- `scenes`：生效场景，可选 `article` / `ai-briefing` / `investment-briefing` / `ai-column` / `health-column` / `investment-column` / `author`
- `status`：固定为 `"enabled"`
- `updated_by`：固定为 `"admin"`

`domains` 和 `scenes` 由 LLM 根据内容主题从固定列表中选择，确保文章页 `TermHighlighter` 和 AI 顾问能正确检索到。

## 配套脚本

### fetch_existing_terms.sh

拉取当前术语库：

```bash
export CORE_SERVICE_URL="http://localhost:8001"
export ADMIN_API_KEY="<api-key>"
bash skills/blog-glossary-sync/scripts/fetch_existing_terms.sh > existing-terms.json
```

### render_sync_script.py

根据 `glossary-candidates.json` 生成 curl 脚本：

```bash
export CORE_SERVICE_URL="http://localhost:8001"
export ADMIN_API_KEY="<api-key>"
python skills/blog-glossary-sync/scripts/render_sync_script.py scripts/glossary-candidates.json > scripts/sync-glossary.sh
bash scripts/sync-glossary.sh
```

## 安全说明

- 默认行为**只生成候选和脚本，不自动执行写入**。
- 不要把 `ADMIN_API_KEY` 硬编码到脚本或提交到 Git。
- 生产环境 `ADMIN_API_KEY` 仅在 Render 环境变量中配置。
- 使用 API Key 调用术语接口不受 admin 登录限流影响。

## 后端依赖

本 skill 依赖 `core-service` 的管理员 API Key 鉴权：

- 环境变量：`ADMIN_API_KEY`
- 请求头：`Authorization: Bearer <ADMIN_API_KEY>`
- 受保护接口：`/api/v1/admin/knowledge-terms/*`

管理员登录（admin console UI）仍保留原有的 session + CSRF 机制，不受影响。
