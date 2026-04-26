# 博客写作规则

> 本文件定义当前博客工程的写作规则与约束，供 blog-writer skill 写作前快速核对。

---

## Frontmatter 规范

```yaml
---
title: "文章标题"          # 必填，字符串
date: 'YYYY-MM-DD'         # 必填，格式固定
tags:                      # 必填，字符串数组，至少一项
  - 标签1
  - 标签2
published: false           # 必填；草稿默认 false，用户明确要求发布时才 true
brief: >-                  # 必填，字符串，200字左右摘要（可折行）
  摘要内容...
---
```

**注意**：
- `published` 字段若存在必须是布尔值（`true` / `false`），不能是字符串
- 博客解析逻辑是 `published !== false` 才发布；因此草稿必须显式写 `published: false`
- `tags` 必须是字符串数组，不能是逗号分隔的单字符串
- `date` 格式统一为 `'YYYY-MM-DD'`（带引号）
- 新文章默认使用当前系统日期；历史复盘或补档文章按用户指定日期
- `brief` 建议用 `>-` 折叠式写法避免换行问题

---

## 文件格式

- **只能是 `.md`**，不要产出 `.mdx` 或含 JSX 的文件
- 正文不出现一级标题 `#`
- 文件名为英文 kebab-case（全小写，连字符分隔）

---

## Slug 规则

- **slug = 文件名（不含扩展名）**，例如 `tdd-introduction`
- slug 必须在整个仓库唯一（跨目录检查），因为文章详情页只按 slug 查找
- 新文章写作前必须用 `npm run validate-post -- --check-path` 验证 slug 不冲突

---

## 真实目录层级

```
content/blog/
├── career/                    # 职业发展（自由文章）
├── fitness/                   # 运动健康（自由文章）
├── investment/                # 投资理财（自由文章）
├── life/                      # 生活杂谈（自由文章）
├── talkshow/                  # 脱口秀（自由文章，固定风格：浮夸搞笑）
└── swd/                       # 软件开发
    ├── agile/                 # 敏捷（含子目录 coaching/）
    ├── oo/                    # 面向对象
    ├── xp/                    # 极限编程（含子目录 tdd/ simple-design/ testing/ refactoring/）
    └── ai-coding/             # AI 编程（含以下已注册专栏）
        ├── ai-frontier/       # AI 前沿专栏（大模型发布/评测/格局分析）
        ├── claudecode/        # Claude Code 专栏（Claude Code 使用技巧）
        ├── opencode/          # OpenCode 专栏（OpenCode 工具使用）
        └── codex/             # Codex 专栏（OpenAI Codex 工具）
```

**重要**：
- 上述目录是已存在的目录，写作前无需创建
- 只有用户明确要求新增专栏时，才走新增专栏流程（需同步更新 `lib/columns.ts` 和 `components/column-icons.tsx`）
- 不存在"AI 软开"作为独立顶层目录，正确路径是 `swd/ai-coding/`
- 早期真实文章可能包含章节分割线、`## 总结` 等旧格式；新文章必须遵守 `anti-patterns.md`，不要照搬旧格式

---

## 4 个 AI 专栏说明

| 专栏 | 路径 | 适合内容 |
|------|------|---------|
| AI 前沿 | `swd/ai-coding/ai-frontier/` | 大模型发布解读、评测分析、行业格局 |
| Claude Code | `swd/ai-coding/claudecode/` | Claude Code 功能教程、使用技巧、配置 |
| OpenCode | `swd/ai-coding/opencode/` | OpenCode 工具使用、配置、技巧 |
| Codex | `swd/ai-coding/codex/` | OpenAI Codex CLI 工具使用 |

---

## npm run build 说明

`npm run build` 现在只执行 `next build`，**不再触发图片优化**。

如需完整生产构建（含图片优化），请使用 `npm run build:prod`：
1. 运行图片优化脚本，**可能修改 `public/images/` 下的文件**
2. 构建输出到 `/dist` 目录

**因此**：
- 写完文章后，**默认只运行 `npm run validate-post` 做轻量校验**
- `npm run build` 仅作为用户明确要求时的最终验证，且需提前告知副作用
- 本地预览用 `npm run dev`，不触发图片优化

## validate-post 说明

项目已提供 `scripts/validate-post.js`，命令为：

```bash
npm run validate-post -- --check-path "content/blog/.../slug.md"
npm run validate-post -- "content/blog/.../slug.md"
npm run validate-post -- --strict-writing "content/blog/.../slug.md"
```

校验内容包括：
- 路径必须位于 `content/blog/`
- 扩展名必须是 `.md`
- 目标目录必须存在
- slug 必须全仓唯一
- frontmatter 必须包含合法的 `title`、`date`、`tags`、`brief`
- `published` 必须存在且是布尔值
- `--strict-writing` 额外校验以下项目：
  - 正文一级标题（`# `）
  - 章节分割线（正文中独立的 `---`）
  - MDX/JSX 语法（`className=`、`import ... from`、大写组件标签等）
  - 以下禁用短语（出现即报错）：

    | 禁用短语 |
    |---------|
    | 总的来说 |
    | 综上所述 |
    | 值得一提的是 |
    | 值得注意的是 |
    | 深入探讨 |
    | 全面分析 |
    | 深度解析 |
    | 至关重要 |
    | 尤为重要 |
    | 不可或缺 |
    | 不难发现 |
    | 由此可见 |
    | 可以说 |
    | 可谓 |
    | 毋庸置疑 |
    | 本文将 |
    | 接下来我们将 |
    | 多维度分析 |
    | 重新定义 |
    | 颠覆式 |
    | 划时代 |

---

## 常用 Tags 参考

从现有文章提取的常用标签：

**AI 前沿类**：`AI前沿`、`大模型`、`LLM`、`Anthropic`、`OpenAI`、`Google`、`模型评测`、`选型指南`、`Claude`、`GPT`、`Gemini`

**AI 编程工具类（优先复用现有写法）**：`AI 编程`、`ClaudeCode`、`OpenCode`、`Codex`、`MCP`

**软件开发类**：`软件开发`、`极限编程`、`TDD`、`敏捷`、`面向对象`、`重构`、`简单设计`

**职业/生活类**：`职业成长`、`运动健康`、`投资理财`、`生活`

**使用建议**：优先复用仓库里已经大量使用的标签写法，例如当前 Claude Code 系列使用的是 `ClaudeCode`，而不是 `Claude Code`。

> **注意**：`AI 编程` 含空格是刻意设计——它是领域分类标签（"AI 编程"这件事），与工具类标签（`ClaudeCode`、`OpenCode`、`Codex` 无空格）区分。领域标签用"描述这件事"，工具标签用"产品名"写法。

---

## 推荐参考文章路径

风格参考优先用真实文章，而非 `samples/` 虚构样例（samples 仅作节奏参考）：

| 类型 | 推荐参考 |
|------|---------|
| AI 前沿评测 | `content/blog/swd/ai-coding/ai-frontier/llm-three-giants-2026.md` |
| Claude Code 教程 | `content/blog/swd/ai-coding/claudecode/claude-code-getting-started.md` |
| TDD/XP 技术分享 | `content/blog/swd/xp/tdd/tdd-introduction.md` |
| 职业经验分享 | `content/blog/career/3-mistakes-of-first-tl.md` |
| 观点评论 | `content/blog/swd/agile/understand-agile-manifesto-deeply.md` |

**注意**：`samples/` 中的文章数据（如基准分数、价格）可能已过时，**不得复用其中的具体事实数据**，只能参考其写作节奏和结构。
