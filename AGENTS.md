# AGENTS.md — 个人博客仓库开发规范

> 本仓库以根目录为统一 workspace。日常开发、联调、AI 助手会话默认都在根目录工作。
> **每个子工程都有独立的 AGENTS.md**，开始任何子工程内的代码改动前，必须先阅读对应文件并按其规范执行。

## 通用规则

- **回复语言**：使用中文与用户交流。

---

## 子工程规范强制约束（最高优先级）

> 该约束高于本文件中其他章节。任何冲突以子工程的 `AGENTS.md` 为准。

### 触发条件 → 必读文件

| 当任务涉及… | 动手前必须先阅读 |
|---|---|
| `site/**` 的任何文件（前端组件、页面、样式、类型、测试） | [`site/AGENTS.md`](./site/AGENTS.md) |
| `core-service/**` 的任何文件（API、service、模型、迁移、配置） | [`core-service/AGENTS.md`](./core-service/AGENTS.md) |
| `admin-console/**` 的任何文件 | （暂沿用根目录通用规范） |
| `content/**` 的内容文件 | 见下方「内容规范」一节 |

### 工作流强制要求

1. **先读后写**：修改子工程文件前，必须先读取并遵守对应 `AGENTS.md`，不得凭记忆或假设动手。
2. **跨子工程改动**：一次任务涉及多个子工程时，每个子工程的 `AGENTS.md` 都必须遵守，不得用一份覆盖另一份。
3. **冲突解决**：根目录与子工程规范冲突时，**子工程 `AGENTS.md` 优先**；本文件只承担跨工程协作、根级命令、Git 等通用约束。
4. **新增子工程**：若新增带独立技术栈的子目录，应同步建立其 `AGENTS.md`，并在下方表格注册。
5. **修改 `site/**` 前端代码时**：必须同时参考 `site/AGENTS.md` 中的组件命名、目录边界与前端质量门禁。

---

## 仓库结构与子目录职责

| 目录 | 职责 | 子工程规范 |
|---|---|---|
| `site/` | Next.js 15 公开主站前端（博客展示、评论、AI 入口） | [`site/AGENTS.md`](./site/AGENTS.md) |
| `admin-console/` | Vite + React 独立管理后台 SPA（评论审核、数据概览） | 暂未独立，沿用根目录规范 |
| `core-service/` | FastAPI 统一后端（公开 API + 管理 API） | [`core-service/AGENTS.md`](./core-service/AGENTS.md) |
| `content/` | Markdown / MDX 文章源（博客、AI 简报、投资简报） | — |
| `scripts/` | 构建辅助脚本（AI 数据生成、图片优化等） | — |
| `config/` | 仓库级公共配置 | — |
| `docs/` | 工程文档 | — |
| `.claude/` / `.opencode/` | AI 助手 skills、记忆、提示词配置 | — |

---

## 核心命令

所有日常开发与联调统一在仓库根目录通过 `just` 完成：

```bash
just start-site                           # 启动主站前端
just start-admin-console                  # 启动管理后台
just start-core-service                   # 启动后端服务（自动执行迁移）
just start-site-and-core-service          # 主站 + 后端联调
just start-admin-console-and-core-service # 后台 + 后端联调
just start-all-services                   # 三端联调
just check-site                           # 主站 typecheck/lint/test
just check-admin-console                  # 管理后台 typecheck/build
just check-core-service                   # 后端 Ruff/mypy/pytest
just check                                # 全仓关键校验
just build-site                           # 主站构建
just build-site-prod                      # 主站完整生产构建
just preview-site                         # 预览主站构建产物
just run-core-migrations                  # 执行后端数据库迁移
just validate-content                     # 校验内容
```

---

## 内容（`content/`）规范

- 博客文章位于 `content/blog/`，AI 简报位于 `content/ai-briefings/YYYY/MM/`，投资简报位于 `content/investment-briefings/YYYY/MM/`
- 必需 frontmatter 字段：`title`、`date`
- 可选字段：`tags`、`published`、`brief`
- 修改内容后执行 `just validate-content` 验证

---

## 环境变量

```bash
cp .env.example .env.local
```

各子工程的具体环境变量见对应子目录的 `AGENTS.md` 或 `.env.example`。

---

## 部署

- **平台**：GitHub Pages + Cloudflare CDN
- **域名**：yuanshenjian.cn
- **工作流**：`.github/workflows/site-ci.yml`
- **触发**：推送到 `main` 分支
- **Node.js**：20.x

---

## Git 规则

- 禁止使用 `--no-verify`
- force push 必须使用 `--force-with-lease`
- 非用户明确要求，不主动提交 commit
- commit message 使用中文，遵循 Conventional Commits 格式
