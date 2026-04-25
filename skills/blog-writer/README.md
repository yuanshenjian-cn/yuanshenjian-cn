# 博客写作助手 Skill

当前博客工程专用写作助手，深度适配 `/Users/ysj/Personal/blog` 工程结构。支持快速通道（主题明确时直接写）和引导通道（主题模糊时聊出来），生成符合规范的 `.md` 文件，并提供轻量风格校审报告。

## 快速开始

```bash
# 描述清晰 → 快速通道，AI 推断参数后 Preflight 确认
/blog-writer 写一篇关于 Claude Opus 4.7 工具调用能力的深度分析，AI 前沿专栏，约 4000 字

# 描述模糊 → 引导通道，AI 通过问答聊出主题
/blog-writer 我想写点关于最近跑步的东西
```

## 工作流

```
快速通道：推断参数 → Preflight 确认 → 写作 → validate-post → 保存草稿 → 校审报告 → 用户确认修改
引导通道：聊出主题 → Preflight 确认 → 确定大纲 → 写作 → validate-post → 保存草稿 → 校审报告 → 用户确认修改
```

**重要**：
- 草稿默认 `published: false`，只有用户在 Preflight 中明确要求发布才改为 `true`
- 默认不运行 `npm run build`（会触发图片优化、修改 `public/images/`）；本地预览用 `npm run dev`

## 已注册目录

```
content/blog/career/
content/blog/fitness/
content/blog/investment/
content/blog/life/
content/blog/talkshow/                      ← 固定风格：浮夸搞笑
content/blog/swd/agile/
content/blog/swd/oo/
content/blog/swd/xp/                        ← 含 tdd/ simple-design/ testing/
content/blog/swd/ai-coding/ai-frontier/     ← AI 前沿专栏
content/blog/swd/ai-coding/claudecode/      ← Claude Code 专栏
content/blog/swd/ai-coding/opencode/        ← OpenCode 专栏
content/blog/swd/ai-coding/codex/           ← Codex 专栏
```

## 写作风格

| 风格 | 适用场景 |
|------|---------|
| 专业严谨 | 技术分析、AI 评测（默认） |
| 轻松幽默 | 入门教程、经验分享 |
| 简洁明了 | 工具推荐、快速阅读 |
| 故事叙述 | 成长故事、经历回顾 |
| 朴实稳重 | 踩坑总结、技术反思 |
| 浮夸搞笑 | 脱口秀（固定风格） |

## 校审机制

- **事实校审**：仅对 AI 前沿/模型评测/含具体数据的文章触发，其他文章跳过
- **风格校审**：每篇必做，对照真实文章样例（优先 `content/blog/` 真实文章）
- 校审结果只写报告，不直接修改原文

报告保存至：`.draft/review-{dir}-{slug}.md`

## 文件结构

```
blog-writer/
├── SKILL.md              # 技能定义（主流程）
├── project-context.md    # 工程事实（路径/frontmatter/slug/tags）
├── anti-patterns.md      # 写作禁止清单（最高优先级）
├── patterns.md           # 写作推荐建议
├── README.md             # 本文件
├── categories/           # 文章结构建议（可选参考）
├── styles/               # 风格参考
├── samples/              # 样例节奏参考（含 index.md 导航）
└── user-input/           # 用户素材输入目录
```

## 系统要求

- Node.js 20+
- 支持的 Agent：OpenCode、Claude Code 等
