---
title: Oh My OpenCode：Categories 速查手册
date: '2026-02-11'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
  - Oh My OpenCode
published: true
brief: >-
  我系统梳理 oh-my-openagent 的 Category 机制，重点介绍当前最常用的 4 个核心 Category（visual-engineering、ultrabrain、deep、quick），以及 writing、unspecified-low、unspecified-high 这些通用补位项。Category 是针对特定领域优化的 Agent 配置预设，通过 `task(category="xxx")` 调用时由 Sisyphus-Junior 执行器完成工作。本文还介绍 Category 与 Skill 的组合策略、自定义 Category 配置方法、模型解析优先级机制，以及实际开发中的最佳实践。
---

## 什么是 Category？

仓库和推荐的 plugin entry 现在都叫 `oh-my-openagent`，但 npm 包名和命令行仍然是 `oh-my-opencode`。我下面提到安装命令时沿用旧命令名，提到仓库和配置文件时则优先用新名字。

**Category 是针对特定领域优化的 Agent 配置预设**。它回答的核心问题是：**"这是什么类型的工作？"**

当你使用 `task()` 工具指定 `category` 参数时，系统会：

1. **创建 Sisyphus-Junior 执行器**：一个专用的子 Agent
2. **应用预配置**：自动设置模型、温度、提示词等
3. **执行任务**：专注完成，不会无限委托

```
task(category="visual-engineering", prompt="创建响应式仪表板组件")
         ↓
    Category 预设生效
         ↓
    Sisyphus-Junior 执行
         ↓
      任务完成
```

### Category vs Agent vs Skill

| 概念 | 定义 | 回答的问题 | 示例 |
|------|------|------------|------|
| **Agent** | 固定身份的专家 | "谁来做？" | Sisyphus、Oracle、Librarian |
| **Category** | 运行时配置预设 | "什么类型的工作？" | visual-engineering、ultrabrain |
| **Skill** | 领域知识和工具 | "需要什么能力？" | git-master、playwright |

三者可以组合使用：

```typescript
task(
  category="visual-engineering",  // 使用前端优化配置
  load_skills=["frontend-ui-ux", "playwright"],  // 加载设计知识和浏览器工具
  prompt="实现一个漂亮的登录页面"
)
```

## 当前最值得记住的 7 个 Categories

我现在会先记住 4 个核心 Category，再把另外 3 个通用补位项当成兜底选项。这样选型时不会乱。

### Category 快速参考表

| Category | 默认模型 | 变体 / 推理强度 | 适用场景 | 成本 |
|----------|---------|----------------|----------|------|
| `visual-engineering` | `google/gemini-3.1-pro` | - | 前端、UI/UX、设计、样式、动画 | 中 |
| `ultrabrain` | `openai/gpt-5.4` | `xhigh` | 硬逻辑、复杂架构、关键决策 | 高 |
| `deep` | `openai/gpt-5.4` | `medium` | 自主研究 + 执行、复杂改造 | 高 |
| `quick` | `openai/gpt-5.4-mini` | - | 单文件修改、拼写修复、小修小补 | 低 |
| `writing` | `google/gemini-3-flash` | - | 文档、README、技术写作 | 低 |
| `unspecified-low` | `anthropic/claude-sonnet-4-6` | - | 不好分类但复杂度中等的任务 | 中 |
| `unspecified-high` | `anthropic/claude-opus-4-7` | `max` | 不好分类但要求高质量的任务 | 高 |

### visual-engineering（视觉工程）

这是我做前端和 UI 任务时最常用的 Category，默认路由到 `google/gemini-3.1-pro`。

**适用场景**：
- 开发 React/Vue 组件
- 实现响应式布局
- 处理交互细节、视觉层次、动画过渡
- 把设计稿或截图快速落成页面

```typescript
task(
  category="visual-engineering",
  prompt="创建一个带有动画效果的数据可视化仪表板，使用 Tailwind CSS"
)
```

### ultrabrain（超脑）

这是默认的高推理路由，走 `openai/gpt-5.4` 的 `xhigh` 配置。我通常把它留给真正需要深度权衡的任务。

**适用场景**：
- 系统架构评审和设计
- 复杂业务逻辑分析
- 多方案权衡和关键决策
- 很硬的算法和流程推理

```typescript
task(
  category="ultrabrain",
  prompt="分析当前微服务架构的性能瓶颈，提出优化方案"
)
```

### deep（深度）

`deep` 也是 `gpt-5.4`，但推理强度降到 `medium`。它不是纯分析，而是偏向“研究明白以后继续动手做”。

**适用场景**：
- 理解复杂代码库
- 调试疑难问题
- 重构已有模块
- 需要一边研究一边实现的任务

**与 ultrabrain 的区别**：
- **ultrabrain**：更适合硬逻辑和架构决策
- **deep**：更适合研究之后继续推进实现

```typescript
task(
  category="deep",
  prompt="重构这个认证模块，提高可测试性和可维护性"
)
```

### quick（快速）

`quick` 默认路由到 `openai/gpt-5.4-mini`。我把它当成“便宜、快、别想太多”的修补刀。

**适用场景**：
- 修复拼写错误
- 单文件小修改
- 简单重命名
- 小范围格式清理

```typescript
task(
  category="quick",
  prompt="把 README.md 中的所有 'opencode' 改为 'OpenCode'"
)
```

### writing（写作）

`writing` 走 `google/gemini-3-flash`，适合把思路整理成能直接给人看的文字。

**适用场景**：
- 编写技术文档
- 撰写 README
- API 文档生成
- 博客文章起草

```typescript
task(
  category="writing",
  prompt="为这个 API 端点编写详细的文档说明"
)
```

### unspecified-low（未指定-低）

有些任务不太适合硬塞进某个专业分类，但复杂度也没高到要开超高推理，这时我会用 `unspecified-low`。

**适用场景**：
- 不适合其他 Category 的普通任务
- 中等复杂度的实现
- 需要稳定输出，但不需要极高推理投入

```typescript
task(
  category="unspecified-low",
  prompt="添加一个新的配置选项到设置页面"
)
```

### unspecified-high（未指定-高）

如果任务难归类，但我又明确希望模型投入更高，`unspecified-high` 会比 `unspecified-low` 更稳。

**适用场景**：
- 不适合其他 Category 但需要高投入的任务
- 复杂功能实现
- 我更看重输出质量而不是速度的场景

```typescript
task(
  category="unspecified-high",
  prompt="实现一个完整的用户权限管理系统"
)
```

## Sisyphus-Junior：Category 的执行者

当使用 Category 时，实际执行任务的是 **Sisyphus-Junior**（小西西弗斯）。

### 什么是 Sisyphus-Junior？

| 属性 | 详情 |
|------|------|
| **角色** | 推石头者·少年版 |
| **模型** | 继承自指定的 Category |
| **特点** | 专注执行，不能再次委托 |
| **成本** | 根据使用的 Category 决定 |

### 核心限制

```typescript
// Sisyphus-Junior 的权限
{
  read: true,      // ✅ 可以读取文件
  write: true,     // ✅ 可以写入文件
  edit: true,      // ✅ 可以编辑文件
  bash: true,      // ✅ 可以执行命令
  task: false,     // ❌ 不能创建新任务（防止无限委托）
  call_omo_agent: true  // ✅ 可以调用其他 Agent
}
```

### 为什么禁止 task 工具？

防止**无限委托循环**：

```
❌ 没有限制的情况：
Sisyphus → Category A → Sisyphus-Junior → task(Category B) 
    → Sisyphus-Junior → task(Category C) → ...无限循环

✅ 有限制的情况：
Sisyphus → Category → Sisyphus-Junior → 专注执行 → 完成
```

## Category 与 Skill 的组合策略

通过组合 Category 和 Skill，可以创建强大的**专业代理组合**：

### 设计师组合（UI 实现）

```typescript
task(
  category="visual-engineering",
  load_skills=["frontend-ui-ux", "playwright"],
  prompt="实现一个精美的登录表单组件"
)
```

**效果**：
- `visual-engineering`：使用 Gemini 3.1 Pro 的视觉能力
- `frontend-ui-ux`：注入设计原则和美学指导
- `playwright`：完成后自动截图验证

### 架构师组合（设计评审）

```typescript
task(
  category="ultrabrain",
  load_skills=[],
  prompt="评审当前系统的微服务架构设计"
)
```

**效果**：
- `ultrabrain`：使用 GPT-5.4 xhigh 的深度推理
- 空 skills：纯推理，专注架构分析

### 维护者组合（快速修复）

```typescript
task(
  category="quick",
  load_skills=["git-master"],
  prompt="修复类型错误并提交"
)
```

**效果**：
- `quick`：使用快速的 GPT-5.4 mini 路由
- `git-master`：自动生成规范的 commit message

### 文档专家组合

```typescript
task(
  category="writing",
  load_skills=["frontend-ui-ux"],
  prompt="为这个组件库编写使用文档"
)
```

**效果**：
- `writing`：使用适合写作的模型
- `frontend-ui-ux`：理解 UI 组件的设计意图

## 自定义 Category 配置

在 `oh-my-openagent.json` 或 `oh-my-openagent.jsonc` 中可以自定义或覆盖 Category；如果你已经在用旧的 `oh-my-opencode.json[c]`，它也仍然兼容。

### 配置文件位置

| 优先级 | 位置 | 说明 |
|--------|------|------|
| 1（最高） | `.opencode/oh-my-openagent.jsonc` | 项目级推荐配置 |
| 2 | `~/.config/opencode/oh-my-openagent.jsonc` | 用户级推荐配置 |
| 3 | `.opencode/oh-my-opencode.jsonc` | legacy 项目级配置 |
| 4 | `~/.config/opencode/oh-my-opencode.jsonc` | legacy 用户级配置 |

### 配置字段参考

```typescript
interface CategoryConfig {
  model?: string          // AI 模型 ID
  variant?: string        // 模型变体：max, xhigh, medium, low
  temperature?: number    // 温度：0.0 ~ 2.0
  top_p?: number          // 核采样：0.0 ~ 1.0
  prompt_append?: string  // 追加到系统提示词
  thinking?: {            // 思考模式配置
    type: "enabled" | "disabled"
    budgetTokens?: number
  }
  reasoningEffort?: "low" | "medium" | "high" | "xhigh"
  textVerbosity?: "low" | "medium" | "high"
  tools?: Record<string, boolean>  // 对 category 路由附加工具限制
  maxTokens?: number      // 最大响应 token
  description?: string    // 描述（显示在提示词中）
  is_unstable_agent?: boolean  // 标记不稳定，强制后台模式
}
```

### 示例配置

```jsonc
{
  "categories": {
    // 1. 创建自定义 Category
    "korean-writer": {
      "model": "google/gemini-3-flash",
      "temperature": 0.5,
      "prompt_append": "You are a Korean technical writer. Maintain a friendly and clear tone."
    },
    
    // 2. 覆盖内置 Category
    "visual-engineering": {
      "model": "google/gemini-3.1-pro",
      "temperature": 0.8,
      "prompt_append": "Use shadcn/ui components and Tailwind CSS."
    },

    // 3. 配置深度思考模式
    "deep-reasoning": {
      "model": "anthropic/claude-opus-4-7",
      "thinking": {
        "type": "enabled",
        "budgetTokens": 32000
      },
      "tools": {
        "websearch_web_search_exa": false
      }
    },

    // 4. 使用国产模型
    "quick": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "ultrabrain": {
      "model": "zai-coding-plan/glm-5"
    }
  }
}
```

## 关键：模型解析优先级

Categories 本身就带有内置默认值；如果你没有覆写，系统会先走这些默认路由。

### 解析流程

```
┌─────────────────────────────────────────────────────────────┐
│                    模型解析优先级                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 用户配置的模型（oh-my-openagent.json[c]）          │
│           ↓ 如果没有配置                                    │
│  Step 2: Category 的内置默认值                              │
│           ↓ 如果未覆写该 Category                           │
│  Step 3: 其他系统级默认模型或 provider 回退                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 常见问题

```json
// opencode.json
{ "model": "anthropic/claude-sonnet-4-6" }

// oh-my-openagent.json（空的 categories）
{}

// 结果：仍然会优先使用 Category 自带的默认模型
// - quick 继续走 quick 的默认路由
// - ultrabrain 继续走高推理默认路由
// - visual 继续走 visual-engineering 的默认路由
```

### 推荐配置

```json
{
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3.1-pro"
    },
    "ultrabrain": {
      "model": "openai/gpt-5.4",
      "variant": "xhigh"
    },
    "quick": {
      "model": "openai/gpt-5.4-mini"
    },
    "unspecified-low": {
      "model": "anthropic/claude-sonnet-4-6"
    },
    "unspecified-high": {
      "model": "anthropic/claude-opus-4-7",
      "variant": "max"
    },
    "writing": {
      "model": "google/gemini-3-flash"
    },
    "deep": {
      "model": "openai/gpt-5.4",
      "variant": "medium"
    }
  }
}
```

我自己的习惯是：只覆写我明确想改掉的 Category。其余的让它继续走内置默认值，配置反而更干净。

## Provider 优先级链

每个 Category 都有 Provider fallback 机制，当首选模型不可用时自动切换：

| Category | 默认模型 | Provider 优先级链 |
|----------|---------|------------------|
| `visual-engineering` | `gemini-3.1-pro` | google → anthropic → zai-coding-plan |
| `ultrabrain` | `gpt-5.4` | openai → google → anthropic |
| `deep` | `gpt-5.4` | openai → anthropic → google |
| `quick` | `gpt-5.4-mini` | openai → anthropic → google |
| `unspecified-low` | `claude-sonnet-4-6` | anthropic → openai → google |
| `unspecified-high` | `claude-opus-4-7` | anthropic → openai → google |
| `writing` | `gemini-3-flash` | google → anthropic → zai-coding-plan → openai |

### 检查配置

```bash
bunx oh-my-opencode doctor --verbose
```

输出示例：

```
✓ Model Resolution
  ├─ Sisyphus: anthropic/claude-opus-4-7 (via anthropic)
  ├─ visual-engineering: google/gemini-3.1-pro (via google)
  ├─ ultrabrain: openai/gpt-5.4 (via openai)
  ├─ quick: openai/gpt-5.4-mini (via openai)
  └─ ...
```

## 实际使用场景

### 场景：快速开发 UI 组件

**需求**：开发一个响应式的导航栏组件

```bash
# 在 OpenCode TUI 中输入：
ulw 用 visual-engineering 实现一个响应式导航栏，包含 logo、菜单和移动端汉堡按钮
```

**执行过程**：
1. `ulw` 触发 Ultrawork 模式
2. Sisyphus 识别为前端任务
3. 使用 `visual-engineering` Category
4. Sisyphus-Junior 使用 Gemini 3.1 Pro 执行

### 场景：深度架构分析

**需求**：分析当前系统的性能瓶颈

```bash
# 在 OpenCode TUI 中输入：
用 ultrabrain 分析当前系统的性能瓶颈，提出优化方案
```

**执行过程**：
1. 识别需要深度推理
2. 使用 `ultrabrain` Category
3. GPT-5.4 xhigh 进行分析
4. 输出详细的优化建议

### 场景：批量小修改

**需求**：修复项目中的所有 TypeScript 类型错误

```bash
# 在 OpenCode TUI 中输入：
ulw 用 quick 修复所有的 TypeScript 类型错误
```

**执行过程**：
1. `ulw` 触发并行处理
2. 使用 `quick` Category（快速便宜）
3. GPT-5.4 mini 批量处理
4. 每个文件独立处理，最后汇总

### 场景：技术文档编写

**需求**：为新功能编写文档

```bash
# 在 OpenCode TUI 中输入：
用 writing 为这个新的 API 端点编写文档
```

**执行过程**：
1. 使用 `writing` Category
2. Gemini 3 Flash 进行写作
3. 生成规范的 API 文档

## 最佳实践

### 选择正确的 Category

| 你的需求 | 推荐 Category | 理由 |
|----------|--------------|------|
| 开发 UI 组件 | `visual-engineering` | 视觉能力强 |
| 架构设计/分析 | `ultrabrain` | 深度推理 |
| 复杂功能实现 | `deep` | 自主工作 |
| 小修改/批量处理 | `quick` | 快速便宜 |
| 不确定的任务（简单） | `unspecified-low` | 通用 |
| 不确定的任务（复杂） | `unspecified-high` | 高质量 |
| 文档/写作 | `writing` | 文本生成 |

### 配置你的 Categories

如果你要改默认路由，直接在 `oh-my-openagent.json[c]` 里覆写：

```json
{
  "categories": {
    "quick": { "model": "openai/gpt-5.4-mini" },
    "visual-engineering": { "model": "google/gemini-3.1-pro" },
    "ultrabrain": { "model": "openai/gpt-5.4", "variant": "xhigh" }
  }
}
```

### 组合 Skills 增强能力

```typescript
// UI 开发 + 设计知识 + 浏览器验证
task(category="visual-engineering", load_skills=["frontend-ui-ux", "playwright"], ...)

// Git 操作 + 原子提交
task(category="quick", load_skills=["git-master"], ...)
```

### 使用 ulw 自动选择

如果不确定用哪个 Category，直接用 `ulw`：

```bash
ulw 实现用户认证功能
```

Sisyphus 会自动分析任务类型并选择合适的 Category。

### 监控成本

| Category | 相对成本 | 使用频率建议 |
|----------|---------|--------------|
| `quick` | 🟢 低 | 大量使用 |
| `writing` | 🟢 低 | 按需使用 |
| `visual-engineering` | 🟡 中 | 按需使用 |
| `unspecified-low` | 🟡 中 | 按需使用 |
| `deep` | 🟠 高 | 谨慎使用 |
| `ultrabrain` | 🔴 很高 | 少量使用 |
| `unspecified-high` | 🔴 很高 | 少量使用 |

## 配置速查表

### 内置 Categories 完整配置

```json
{
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3.1-pro",
      "description": "Frontend, UI/UX, design, styling, animation"
    },
    "ultrabrain": {
      "model": "openai/gpt-5.4",
      "variant": "xhigh",
      "description": "Deep logical reasoning, complex architecture"
    },
    "deep": {
      "model": "openai/gpt-5.4",
      "variant": "medium",
      "description": "Goal-oriented autonomous problem-solving"
    },
    "quick": {
      "model": "openai/gpt-5.4-mini",
      "description": "Trivial tasks, single file changes, typo fixes"
    },
    "unspecified-low": {
      "model": "anthropic/claude-sonnet-4-6",
      "description": "Tasks that don't fit other categories, low effort"
    },
    "unspecified-high": {
      "model": "anthropic/claude-opus-4-7",
      "variant": "max",
      "description": "Tasks that don't fit other categories, high effort"
    },
    "writing": {
      "model": "google/gemini-3-flash",
      "description": "Documentation, prose, technical writing"
    }
  }
}
```

### 使用命令速查

```bash
# UI 任务
task(category="visual-engineering", prompt="实现登录表单")

# 架构分析
task(category="ultrabrain", prompt="分析系统架构")

# 复杂实现
task(category="deep", prompt="重构认证模块")

# 快速修复
task(category="quick", prompt="修复类型错误")

# 文档编写
task(category="writing", prompt="编写 API 文档")

# 组合 Skills
task(category="visual-engineering", load_skills=["frontend-ui-ux"], prompt="...")
```

## 总结

Oh My OpenCode 的 Categories 系统是一个强大的**任务分类和资源配置**机制：

| 核心概念 | 说明 |
|----------|------|
| **7 个常用 Category** | 覆盖前端、通用实现、写作和高推理场景 |
| **Sisyphus-Junior** | Category 任务的专用执行器 |
| **模型优化** | 每个 Category 针对场景选择最优模型 |
| **Skill 组合** | Category + Skill 创建专业代理 |
| **自定义配置** | 在 oh-my-openagent.json[c] 中灵活定制 |

**记住**：先吃内置默认值，只有当你明确想改路由时再覆写。

## 参考资料

- [oh-my-openagent 仓库](https://github.com/code-yeongyu/oh-my-openagent)
- [oh-my-openagent 文档目录](https://github.com/code-yeongyu/oh-my-openagent/tree/dev/docs)
- [Configuration Reference](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/configurations.md)
- [Oh My OpenCode Agent 速查手册](/articles/oh-my-opencode-agents-quick-reference)
