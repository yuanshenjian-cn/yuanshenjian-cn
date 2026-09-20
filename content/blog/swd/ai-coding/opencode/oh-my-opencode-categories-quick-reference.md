---
title: "Oh My OpenAgent（OpenCode 版）：Category 速查手册"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
  - Oh My OpenAgent
published: true
brief: >-
  Category 是 Oh My OpenAgent 用来描述工作类型的模型和提示词预设。内容覆盖当前内置 Category、Category Worker 的执行边界、Category 与 Agent 和 Skill 的区别、模型解析优先级、自定义配置和常用组合。
---

> Category 不是另一个 Agent 名字，而是告诉 task：这项工作需要怎样的模型、推理方式和工作习惯。

## Category、Agent 和 Skill 不是一回事

可以用三个问题区分：

| 概念 | 回答的问题 | 例子 |
| --- | --- | --- |
| Agent | 谁来承担这个职责？ | explore、librarian、momus |
| Category | 这是什么类型的工作？ | deep、quick、writing |
| Skill | 需要什么知识、工具和工作流？ | frontend、playwright、git-master |

主 Agent 使用 task 工具时，可以指定 Category：

```typescript
task({
  category: "visual-engineering",
  prompt: "为设置页增加响应式表单和错误状态。",
});
```

Category 会创建一个新的 Category Worker。Worker 会使用该 Category 的模型、推理和 Skill 配置，但不能继续使用 task 向下委派。它是一个专注执行单元，不是新的总协调器。

Category 属于共享的 task 路由层。OpenCode edition 另外注册 Sisyphus、Hephaestus、Prometheus、Atlas 等专属 Agent；Agent 负责固定角色，Category 负责描述工作类型，两者不是同一张注册表。

## 当前内置 Category

默认 Category 会随插件自动提供。下面的模型是当前路由参考，实际运行时只会从你已连接并注册的 provider 中选择可用项。

| Category | 模型族参考 | 适合的工作 |
| --- | --- | --- |
| visual-engineering | claude-fable-5-1、claude-opus-5、Kimi K3 | 前端、UI/UX、样式、动画和设计系统 |
| architect | claude-fable-5-1 | 模块边界、架构拆分和取舍 |
| ultrabrain | gpt-6-astra、gpt-5.6-sol | 高难度逻辑和复杂架构决策 |
| deep | gpt-6-astra、gpt-5.6-sol | 复杂研究、浏览器、后端、算法和多步骤任务 |
| artistry | claude-fable-5-1、Kimi K3、claude-opus-5 | 非常规方案和创意实现 |
| quick | kimi-for-coding-highspeed | 单文件、拼写、机械性和低风险修改 |
| unspecified-low | grok-4.6 | 不属于其他类别的轻量任务 |
| unspecified-high | gpt-6-astra、claude-opus-5、GLM、Kimi K3 | 不属于其他类别但需要较强推理的任务 |
| writing | claude-fable-5-1、Kimi K3 | 文档、说明和技术写作 |

表中的模型族只是官方配置中的参考路由，不把具体 reasoning 等级当成唯一稳定事实。不同官方参考页对个别 Category 的推理档位存在差异，实际结果应该以：

```bash
opencode models
```

确认自己的模型列表。需要查看插件最终解析时，可以使用：

```bash
bunx oh-my-openagent doctor --verbose
```

## 什么时候选哪个 Category

### quick 适合小而确定的工作

单文件改名、机械性替换、补充一个简单测试或修复拼写，适合 quick。它的目标是减少路由和上下文成本：

```typescript
task({
  category: "quick",
  prompt: "修复这个单文件中的类型错误，保持现有接口和测试结构。",
});
```

如果一个 quick 任务开始涉及多个模块、架构决策或不确定的外部资料，就应该拆分或换成 unspecified-high、deep 或 architect。

### visual-engineering 适合可见的交互

视觉工程不仅是写 CSS，还包括布局、状态、动效、响应式行为和设计系统的一致性。给它提供截图、现有组件路径、交互边界和验收尺寸，比只说“做得好看”更有效。

### deep 和 ultrabrain 负责不同强度的问题

deep 适合有较多探索和执行动作的复杂任务，例如浏览器行为、后端逻辑和多步调试。ultrabrain 更适合单个高难度的逻辑或架构问题。

不要把多个独立目标塞进一次 deep 调用。一个 Worker 只有一个清楚的交付物时，结果更容易验证；互不依赖的目标应拆成多个并行任务。

### architect 是咨询通道

architect 适合让模型分析模块边界、依赖方向和拆分策略。它通常承担建议，不应该被描述成“直接实现整个功能”的执行通道。

### writing 适合文档和自然语言

writing 适合 README、迁移说明、API 文档和技术文章。给它明确受众、事实来源、格式要求和不应改变的术语，效果通常比通用高推理模型更稳定。

## 模型解析顺序

一个 Category 任务的模型大致按这个顺序解析：

1. Category 中明确指定的 model 或 models；
2. Category 的内置模型链；
3. OpenCode 当前可用的系统模型。

在 OpenCode 插件中，Category 的模型路由与主会话模型是两条链。主 Agent 当前选用的模型不会自动覆盖 Category Worker，除非配置明确这样做。

同一条解析链还用于运行时重试。某个 provider 失败后，系统会沿着已解析的备用链继续尝试，而不是随意跳到另一类 Category。

## 自定义 Category

统一插件配置位于：

- 用户级 ~/.omo/omo.jsonc；
- 项目级 .omo/omo.jsonc；
- OpenCode 专属配置放在 [opencode] 区块。

覆盖内置 Category：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/omo.schema.json",
  "[opencode]": {
    "categories": {
      "quick": {
        "model": "provider/fast-model",
        "reasoning": "low"
      },
      "deep": {
        "models": [
          "provider/strong-model",
          "provider/backup-model"
        ],
        "reasoning": "high"
      }
    }
  }
}
```

新增一个 Category：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/omo.schema.json",
  "[opencode]": {
    "categories": {
      "database": {
        "description": "数据库迁移、查询计划和数据层测试",
        "model": "provider/backend-model",
        "reasoning": "high",
        "prompt_append": "先检查现有迁移和测试，再修改数据层。不要直接执行破坏性命令。",
        "tools": {
          "bash": true
        }
      }
    }
  }
}
```

Category 常用字段：

| 字段 | 用途 |
| --- | --- |
| description | 显示在 task 描述中的职责说明 |
| model | 主要模型 |
| models | 有序模型链 |
| reasoning | 推理档位 |
| temperature | 采样温度 |
| top_p | 采样范围 |
| prompt_append | 追加到系统提示的内容 |
| provider_options | provider 专属请求参数 |
| max_tokens | 最大输出 token |
| max_prompt_tokens | 委派任务的提示 token 上限 |
| tools | 是否启用指定工具 |
| is_unstable_agent | 强制放入后台并进行监控 |
| disable | 禁用该 Category |

配置优先使用 models 和 reasoning；推理档位和 provider 专属参数应按当前 schema 及目标模型文档填写。

## Category 和 Skill 怎么组合

Category 决定工作方式，Skill 提供具体能力。两者组合时，先判断工作类型，再加载能够改变结果的 Skill：

```typescript
task({
  category: "visual-engineering",
  load_skills: ["frontend"],
  prompt: "把这个表格改造成响应式移动端组件，并保留键盘导航。",
});
```

常见组合：

| 工作 | Category | Skill 方向 |
| --- | --- | --- |
| UI 组件 | visual-engineering | frontend、visual-qa |
| 架构评审 | architect | review-work |
| 浏览器验证 | deep | playwright |
| 小范围修复 | quick | git-master |
| 文档整理 | writing | remove-ai-slops |

不要为了“增强能力”把所有 Skill 都加载进去。每个 Skill 都会增加提示上下文和可能的工具，只有与当前交付物相关的 Skill 才值得加入。

## Category 与只读 Agent 的配合

一个稳定的复杂任务通常是：

1. Explore 查找本地代码和影响面；
2. Librarian 查找外部官方资料；
3. architect 或 ultrabrain 评估结构和取舍；
4. 用指定 Category Worker 实现；
5. 由主 Agent 运行测试并检查结果。

前两步只读，适合并行；实现步骤的写入范围要明确。不要让两个 Worker 同时修改同一份配置或同一个模块。

## 成本和失败处理

成本控制不应只靠换便宜模型。更有效的做法是：

- 用 quick 处理机械性任务；
- 让 Explore 和 Librarian 使用快速模型；
- 只给 deep 和 ultrabrain 一个清楚的目标；
- 限制 background_task 的 providerConcurrency 和 modelConcurrency；
- 对不需要外部网络的 Category 禁用 websearch 和远程 MCP；
- 用 max_prompt_tokens 限制委派上下文。

如果 Category 不可用，不要默默假设它已经切换到了另一个模型。检查 provider 是否认证、模型是否出现在 opencode models、Category 是否被 disable，以及 fallback 链是否真的存在。

## 使用 ulw 让主 Agent 自动选择

任务本身足够清楚，但你不想手动拆分时，可以在 prompt 中加入 ulw：

```text
ulw 完成订单导入功能，保持现有 CSV 格式，新增测试并说明失败场景。
```

主 Agent 会根据任务类型选择 Category、Skill 和只读 Agent。ulw 不是 Category，也不会替代权限配置。敏感项目仍然应该提前收紧 permission 和外部目录规则。

## 结尾的选择建议

Category 的稳定接口是工作类型和交付边界，不是某个永远不变的模型名称。把 prompt 写成“目标、约束、输入、输出、验收”，把模型和 fallback 留给配置层管理，后续更换 provider 时不需要重写整个工作流。

简单任务选 quick，复杂执行选 deep，单个高难度决策选 ultrabrain，架构取舍选 architect，界面工作选 visual-engineering，文字工作选 writing。遇到不确定的通用任务，再使用 unspecified-low 或 unspecified-high。

## 官方参考

- [Oh My OpenAgent Features Reference](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/features.md)
- [Oh My OpenAgent Configuration Reference](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/configuration.md)
- [编排系统指南](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/orchestration.md)
- [OpenCode Agents](https://opencode.ai/docs/agents/)
