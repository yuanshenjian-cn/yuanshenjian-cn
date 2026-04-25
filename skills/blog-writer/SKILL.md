---
name: blog-writer
description: 当前博客工程专用写作助手，用于在本博客仓库中策划、起草、校审并落盘博客文章。遇到“写博客”“起草文章”“把素材整理成博文”“润色成一篇博客”“想写一篇关于 XX 的文章”等需求时都应使用，尤其当任务涉及目录选择、文件名、frontmatter、样例参考、事实校验或发布状态判断时。
argument-hint: "[文章主题、素材或写作想法]"
allowed-tools: Read, Glob, Grep, Write, Bash, WebFetch, Tavily, question
---

# Skill: blog-writer

## 启动前必读

1. 读取 `project-context.md` — 了解工程事实（路径、frontmatter、slug 规则）
2. 读取 `anti-patterns.md` — 禁止项，写作全程最高优先级
3. 读取 `patterns.md` — 推荐项，指导写作方向

**资源优先级**：`anti-patterns.md` > `patterns.md` > `styles/` > 真实文章参考 > `samples/` > `categories/`

---

## 通道判断

| 条件 | 通道 |
|------|------|
| 描述包含具体主题 + 基本诉求 | 快速通道 |
| 描述模糊，或只说"想写点关于XX的" | 引导通道 |

---

## Preflight 确认（所有通道必做）

在开始写作前，**必须与用户明确以下所有参数**，不得跳过：

| 参数 | 说明 | 默认值 |
|------|------|------|
| **目标目录** | 完整路径，如 `content/blog/swd/ai-coding/ai-frontier/` | 根据主题推断 |
| **文件名/slug** | 英文 kebab-case，全仓唯一 | 根据标题推断 |
| **文章类型** | 技术分享/观点评论/AI前沿评测/经验分享等 | 根据内容推断 |
| **写作风格** | 专业严谨/轻松幽默/简洁明了/故事叙述/朴实稳重/浮夸搞笑 | 专业严谨 |
| **目标字数** | 粗略范围 | 2000 字 |
| **是否立即发布** | `published: true` 还是草稿 `false` | **默认 false（草稿）** |

确认格式示例：

> 根据你的描述，我的推荐是：
> - 📁 目标目录：`content/blog/swd/ai-coding/ai-frontier/`
> - 📄 文件名：`kimi-k2-7-deep-dive.md`（slug：`kimi-k2-7-deep-dive`）
> - 🗂 文章类型：AI 前沿评测
> - 🎨 写作风格：专业严谨
> - 📝 目标字数：约 4000 字
> - 📢 发布状态：草稿（published: false）
>
> 有需要调整的吗？没有的话直接开始写。

用户确认后才进入写作。

---

## 快速通道

### 第一步：Preflight 确认

自动推断参数 → 展示确认表单（见上方 Preflight 格式）→ 用户确认或调整。

### 第二步：写作

1. 读取 `styles/{风格}.md`
2. 如有 `user-input/` 素材，**仅在用户已明确指定文件名时读取该文件**；未指定则询问
3. 参考真实文章（优先 `content/blog/` 真实文章，其次 `samples/`）
4. **仅限 AI 前沿/模型评测/数据密集文章**：确认已收集三类素材（官方数据、权威媒体、社区反馈），素材不足时主动补充
5. **写入前先做路径预检**：
   ```bash
   npm run validate-post -- --check-path "content/blog/{目录}/{文件名}.md"
   ```
6. 预检通过后撰写正文并写入 `.md` 文件（**默认 `published: false`**，除非用户在 Preflight 中明确要求发布）

### 第三步：路径验证

文件写入后运行：
```bash
npm run validate-post -- "content/blog/{目录}/{文件名}.md"
```

验证通过后再进入校审；若失败则修正 frontmatter 或路径问题。

### 第四步：校审

草稿保存后自动进入校审，参见下方「校审协议」。

---

## 引导通道

### 第一步：聊出主题（最多 2 轮）

每次只问一个问题帮助锁定方向。**第 2 轮后必须给出 2–3 个方向建议让用户选，不再追问。**

### 第二步：Preflight 确认

同快速通道第一步。

### 第三步：提出大纲

给出 3 个标题方向，用户选 1 个（或提出修改）。

### 第四步：写作 + 路径验证 + 校审

同快速通道第二至四步。

---

## 发布位置

### 已注册目录（直接使用，无需创建）

```
content/blog/career/                          ← 职业发展（自由文章）
content/blog/fitness/                         ← 运动健康（自由文章）
content/blog/investment/                      ← 投资理财（自由文章）
content/blog/life/                            ← 生活杂谈（自由文章）
content/blog/talkshow/                        ← 脱口秀（固定风格：浮夸搞笑）
content/blog/swd/agile/                       ← 敏捷（自由文章 or 含 coaching/ 子目录）
content/blog/swd/oo/                          ← 面向对象
content/blog/swd/xp/                          ← 极限编程（含 tdd/ simple-design/ testing/ refactoring/）
content/blog/swd/ai-coding/ai-frontier/       ← AI 前沿专栏
content/blog/swd/ai-coding/claudecode/        ← Claude Code 专栏
content/blog/swd/ai-coding/opencode/          ← OpenCode 专栏
content/blog/swd/ai-coding/codex/             ← Codex 专栏
```

### 新增专栏（需用户明确要求）

只有用户明确说"新建一个 XX 专栏"时，才走新增流程：需同步更新 `lib/columns.ts` 和 `components/column-icons.tsx`。

---

## 输出格式

```markdown
---
title: "文章标题"
date: 'YYYY-MM-DD'
tags:
  - 标签1
  - 标签2
published: false
brief: >-
  根据全文提炼的 200 字左右摘要。
---

> 一句话提炼文章核心判断。

正文...
```

**硬性规则**：
- 只输出 `.md` 文件，不产出 `.mdx` 或含 JSX 语法的文件
- 正文不出现一级标题 `#`
- 文件名为英文 kebab-case
- slug（文件名无扩展名）必须全仓唯一，写作前用 `validate-post` 验证
- `published` 默认 `false`；只有用户在 Preflight 中明确说"直接发布"才改为 `true`

---

## 草稿保存

1. 确认目录存在（对照 `project-context.md` 检查，已有目录无需创建）
2. 写入前运行预检：`npm run validate-post -- --check-path "content/blog/{目录}/{文件名}.md"`
3. 预检通过后写入文件
4. 写入后运行全文校验：`npm run validate-post -- "content/blog/{目录}/{文件名}.md"`

**输出提示**：
- **成功**：`✅ 草稿已保存：content/blog/{目录}/{文件名}.md（published: {true|false}）`
- **验证失败**：显示错误，询问用户如何处理，不强行写入

**关于 `npm run build`**：
- **默认不运行**，构建耗时较长
- `npm run build` 只执行 `next build`，不再触发图片优化
- 只在用户明确要求最终验证时运行
- 本地预览用 `npm run dev`

---

## 校审协议

**触发时机**：草稿文件保存完成后自动执行。
**核心原则**：校审结果只写入报告，不修改原文；等用户确认后再执行修改。
**报告存放**：`.draft/review-{dir}-{slug}.md`

---

### 事实校审（仅限特定文章类型）

**触发条件**（满足任一即触发，其他文章跳过事实校审只做风格校审）：
- 文章包含版本号、发布日期、定价、基准测试分数等具体数据
- 包含"X 公司发布/宣布/表示"等引用性陈述
- tags 含有：`AI前沿`、`大模型`、`技术评测`、`选型指南`

**执行方式**：
1. 提取所有可验证的客观声明
2. 版本时效性：仅当文章定位是"选型建议/当前格局判断"时，检查版本是否已被更新取代；"发布解读/历史复盘"类文章不做此检查
3. 用 WebFetch / Tavily 验证，信息源优先级：官方来源 > 权威媒体 > 社区博主
4. 打标：✅ 已验证 / ⚠️ 可能过时 / ❌ 建议修正 / 🔍 无法验证

---

### 风格校审（每篇必做）

**执行方式**：
1. 优先参考与本文同类的真实文章（见 `project-context.md`），其次参考 `samples/`
2. 对照五个维度：开头方式、段落节奏、语言温度、结尾方式、Markdown 用法
3. 给出具体调整建议（位置 + 问题 + 调整方向 + 参考依据）

---

### 报告格式

报告保存为 `.draft/review-{dir}-{slug}.md`：

```markdown
# 校审报告：{文章标题}

**文章路径**：`content/blog/{目录}/{slug}.md`
**校审时间**：{YYYY-MM-DD}

---

## 事实校审

> 跳过（非 AI 前沿/数据密集型文章）
> 或按四类打标输出...

---

## 风格校审

**参照文章**：`content/blog/{真实文章路径}`
**整体判断**：基本符合 / 部分偏差 / 建议较大调整

### 符合个人风格 ✓
...

### 建议调整
| 位置 | 问题 | 调整建议 | 风格维度 | 参考依据 |
|------|------|---------|---------|---------|

---

## 修复建议

### 待确认修复（N 项）
| 位置 | 建议修复内容 | 类型 |

### 需手动决策（N 项）
| 问题 | 类型 | 需要用户决策的原因 |
```

---

### 校审完成后

1. 告知用户报告保存路径
2. 展示待确认修复项摘要 + 需手动决策项
3. **等待用户指令**，根据用户决策修改原文
4. 所有问题处理完毕后，如用户要求可运行 `npm run build` 最终验证（耗时较长，不修改图片文件）
