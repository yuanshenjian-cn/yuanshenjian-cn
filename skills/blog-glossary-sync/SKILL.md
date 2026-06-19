---
name: blog-glossary-sync
description: >
  从本博客仓库的 content/ 目录（文章、AI 简报、投资简报、专栏等）提取候选术语，与现有术语库去重对比后，生成并执行 curl 脚本批量写入 core-service 术语库。
  当用户提到“提取术语”“同步到术语库”“扫描文章更新术语”“把博客术语整理到术语库”“从简报/文章里提取术语”时使用。
  默认行为：生成候选列表 + curl 脚本，等待用户 review 和确认后再执行写入。
argument-hint: "[范围，如 全部/某目录/某文件] [模式，如 只创建/也更新]"
---

# 博客术语库同步 Skill

## 功能概述

扫描仓库 `content/` 下的 Markdown / MDX 内容，用 LLM 提取有价值的术语（含别名、定义、详细解释、相关文章），与 `core-service` 已有术语去重，最终生成可执行的 curl 脚本，将新术语写入（或更新）到术语库 `knowledge_terms` 表。

## 默认行为

| 参数 | 默认值 |
|------|--------|
| 扫描范围 | `content/` 下全部 `.md` / `.mdx` |
| 操作模式 | 生成候选 + 生成脚本，**不自动执行写入** |
| 更新策略 | 既创建新术语，也更新已有术语（当定义/解释/别名等发生变化时） |
| 输出文件 | `scripts/sync-glossary.sh`（curl 脚本）、`scripts/glossary-candidates.json`（候选列表，供 review） |
| 认证方式 | 读取环境变量 `ADMIN_PASSWORD` 和 `CORE_SERVICE_URL` |

## 环境变量

执行前确保环境变量已设置（可在 shell 中 export，或让 skill 提示用户设置）：

```bash
# 本地开发（core-service/.env 中已配置 ADMIN_API_KEY）
export CORE_SERVICE_URL="http://localhost:8001"
export ADMIN_API_KEY="<local-api-key>"

# 生产环境（api.yuanshenjian.cn）
export CORE_SERVICE_URL="https://api.yuanshenjian.cn"
export ADMIN_API_KEY="<production-api-key>"
```

`ADMIN_API_KEY` 用于机器对机器的自动化调用，直接通过 `Authorization: Bearer <key>` 访问 admin 术语接口，无需登录、CSRF 或 Turnstile。

## 术语字段与映射

每个候选术语必须包含以下字段：

- `term`：术语原文（必填）
- `aliases`：别名数组，可为空
- `definition`：一句话定义（用于文章页 hover tooltip）
- `explanation`：详细解释（用于 AI 顾问上下文增强）
- `related_article_slugs`：相关文章 slug 数组，可从文件路径推断
- `domains`：生效域数组，必须从下方列表选择
- `scenes`：生效场景数组，必须从下方列表选择
- `status`：固定为 `"enabled"`
- `updated_by`：固定为 `"admin"`

### 可选的 domain 值

`ai`、`investment`、`health`、`article`

### 可选的 scene 值

`article`、`ai-briefing`、`investment-briefing`、`ai-column`、`health-column`、`investment-column`、`author`

### 路径到 domain/scene 的参考映射

LLM 应根据内容主题自主选择，但可参考以下路径规则：

| 路径前缀 | 推荐 domain | 推荐 scene |
|----------|-------------|------------|
| `content/ai-briefings/` | `ai` | `ai-briefing` |
| `content/investment-briefings/` | `investment` | `investment-briefing` |
| `content/blog/health/` | `health` | `article` |
| `content/blog/investment/` | `investment` | `article` |
| `content/blog/swd/ai-coding/` | `ai` | `article` |
| `content/blog/` 其他 | `article` | `article` |

如果某篇文章明显跨域（例如一篇 AI 编程文章同时适合 `ai` 和 `article`），可给多个 domain；但 scene 尽量保持单一、明确。

## 工作流程

### 1. 前置检查

- 检查 `ADMIN_PASSWORD` 和 `CORE_SERVICE_URL` 是否已设置；未设置则提示用户，不继续。
- 确认后端可访问：`curl -s "$CORE_SERVICE_URL/api/v1/health"` 或任意公开接口。

### 2. 发现内容文件

用 Glob 查找：

```
content/blog/**/*.{md,mdx}
content/ai-briefings/**/*.{md,mdx}
content/investment-briefings/**/*.{md,mdx}
```

如果用户指定了范围（如“只扫 AI 简报”），则按范围过滤。

### 3. 拉取现有术语

用 curl 带 `ADMIN_API_KEY` 拉取现有术语：

```bash
curl -s \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Origin: $ADMIN_CONSOLE_ORIGIN" \
  "$CORE_SERVICE_URL/api/v1/admin/knowledge-terms"
```

记录每个现有术语的 `id`、`term`、`aliases`，用于去重和更新判断。

### 4. 分批提取候选术语

将内容文件按 5~10 篇一批读取（避免上下文过长），用 LLM 提取术语。每批返回 JSON 数组：

```json
[
  {
    "term": "RAG",
    "aliases": ["检索增强生成", "Retrieval-Augmented Generation"],
    "definition": "通过检索外部知识来增强大语言模型生成能力的技术框架。",
    "explanation": "RAG 在生成回答前先从向量数据库或知识库中检索相关文档片段，把检索结果注入 prompt，从而提升回答的事实性和可解释性。典型流程分为三步：1）将文档切分成片段并 embedding 存入向量库；2）用户提问时检索最相关片段；3）把片段与问题一起拼入 prompt 让模型生成答案。例如，询问‘公司年假政策’时，系统先从员工手册中检索相关章节，再让模型基于这些章节作答，避免胡编。",
    "related_article_slugs": ["rag-intro"],
    "domains": ["ai"],
    "scenes": ["article"]
  }
]
```

LLM 提示词要求：
- 只提取对读者可能有理解门槛的术语、缩写、技术概念、产品名、方法论等。
- 普通常用词、人名、公司名（除非有特定技术含义）不提取。
- 优先提取已在文章中给出定义或解释的术语。
- 别名要包含常见中文/英文说法。
- domain 和 scene 必须从上述固定列表选择，可多选 domain，scene 尽量单一。
- **explanation 必须详尽、准确，并包含具体示例**。建议按以下结构组织（控制在 150~300 字）：
  1. **核心定义**：用一句话概括术语是什么。
  2. **关键要点**：2~3 条核心机制、原则或注意事项。
  3. **典型场景**：该术语在实际工作/开发/投资中如何应用。
  4. **具体示例**：给出一个简短、可理解的例子，必要时包含伪代码、命令或对比。
- explanation 避免空话和重复，应让未接触过该术语的读者也能看懂。

### 5. 合并与去重

- 合并所有批次结果。
- 按 `term` 去重（大小写不敏感）。
- 与现有术语去重：
  - 如果候选 `term` 与某现有术语的 `term` 或任一 `alias` 匹配（大小写不敏感），则视为**更新**。
  - 否则视为**创建**。
- 对更新项，只保留发生变化的字段；可生成 `PUT /api/v1/admin/knowledge-terms/{id}` 请求。

### 6. 生成 review 文件

写入 `scripts/glossary-candidates.json`，结构示例：

```json
{
  "create": [ { ... } ],
  "update": [ { "id": "...", "term": "...", "changes": { ... } } ]
}
```

同时在对话中给出一个清晰的摘要表格：

| 操作 | 术语 | domain | scene | 来源文章 |
|------|------|--------|-------|----------|
| 创建 | RAG | ai | article | rag-intro |
| 更新 | LLM | ai | article | — |

### 7. 生成 curl 脚本

写入 `scripts/sync-glossary.sh`，内容包含：

```bash
#!/bin/bash
set -euo pipefail

CORE_URL="${CORE_SERVICE_URL:-http://localhost:8001}"
ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"
ORIGIN="${ADMIN_CONSOLE_ORIGIN:-http://localhost:5173}"

COMMON_HEADERS=(
  -H "Content-Type: application/json"
  -H "Origin: $ORIGIN"
  -H "Authorization: Bearer $ADMIN_API_KEY"
)

# 创建新术语
curl -s "${COMMON_HEADERS[@]}" \
  -X POST "$CORE_URL/api/v1/admin/knowledge-terms" \
  -d '{...}'

# 更新已有术语
curl -s "${COMMON_HEADERS[@]}" \
  -X PUT "$CORE_URL/api/v1/admin/knowledge-terms/{id}" \
  -d '{...}'
```

生产环境下，脚本应自动或按环境变量设置 `CORE_SERVICE_URL=https://api.yuanshenjian.cn`、`ADMIN_CONSOLE_ORIGIN=https://admin.yuanshenjian.cn`。

### 8. 等待用户 review

明确告诉用户：
- `scripts/glossary-candidates.json` 可手动编辑。
- 确认无误后，运行 `bash scripts/sync-glossary.sh` 执行写入。
- 若需要重新生成，可再次调用本 skill。

**在收到用户明确说“执行”“运行脚本”“写入”之前，不要执行 `bash scripts/sync-glossary.sh`。**

### 9. 执行（仅在用户明确授权后）

用户确认后，运行：

```bash
bash scripts/sync-glossary.sh
```

执行后检查输出，如有 401/403/429 等错误，向用户解释原因（常见：密码错误、CSRF 失败、限流）。

## 边界与注意事项

- 不要在未授权时自动写入术语库。
- 不要把脚本中的 `ADMIN_API_KEY` 硬编码进文件；脚本应使用环境变量。
- 如果内容文件很多，注意分批读取，避免单次请求过大。
- 如果某术语已存在但用户不希望更新，允许用户从 `glossary-candidates.json` 中删除对应项后重新生成脚本。
- 生成脚本后建议 `chmod +x scripts/sync-glossary.sh`。
- 使用 `ADMIN_API_KEY` 调用术语接口不受 admin 登录限流影响。
