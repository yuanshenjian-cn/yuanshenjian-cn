---
title: "Oh My OpenAgent（OpenCode 版）：Atlas 与 Sisyphus 的编排架构"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
  - Oh My OpenAgent
published: true
brief: >-
  OpenCode 版 Oh My OpenAgent 把 Sisyphus、Prometheus、Atlas 和 Category Worker 放在一条有边界的编排链中：Sisyphus 负责主会话和 ultrawork，Prometheus 负责计划，Atlas 执行已批准计划，Category Worker 承担具体实现，并说明它们的状态、权限、切换时机和配置关系。
---

> Sisyphus 负责把任务推向完成，Atlas 负责把已批准的计划落地；Prometheus 连接需求和计划，Category Worker 负责一个具体交付物。

## 四个角色先分清

OpenCode edition 的核心 Agent 不是平级的四个聊天入口：

| Agent | 主要职责 | 典型入口 |
| --- | --- | --- |
| Sisyphus | 主会话编排、ultrawork、研究和委派 | 默认入口，或输入 ulw |
| Prometheus | 访谈、探索和计划生成 | /ulw-plan |
| Atlas | 读取已批准计划并持续执行 | /ulw-execute |
| Category Worker | 具体实现、测试和 QA | task(category=...) |

Hephaestus 是另一条直接实现入口，适合已经明确范围的代码任务。Oracle、Librarian、Explore 和 Multimodal Looker 则负责受限咨询和只读研究。

## Sisyphus：当前会话的主编排

Sisyphus 运行在主会话中，负责理解请求、维护工作记录、选择专业 Agent 和 Category，并把结果收回主线。输入：

```text
ulw 完成用户权限重构，保持公开 API 不变，运行相关测试并说明剩余风险。
```

Sisyphus 会按工作类型委派：

```text
task(subagent_type="explore", prompt="找出权限校验的调用链")
task(subagent_type="librarian", prompt="查找依赖的官方权限配置")
task(category="deep", prompt="实现并验证权限重构")
```

Explore 和 Librarian 是只读研究 Agent，deep 是 Category Worker。Sisyphus 不应该把三个不同目的混成一个模糊的子任务。

Sisyphus 的 ultrawork 重点是让主会话主动推进，不是把控制权交给另一个“万能执行器”。模型、权限和测试仍然决定任务能否真正完成。

## Prometheus：把需求写成可执行计划

输入：

```text
/ulw-plan
```

Prometheus 会先读取项目和资料，再判断需求是否清楚。它会留下仍需要用户决定的偏好，生成 brief，等待确认后写入 .omo/plans/。

Prometheus 的 planner prompt 是强制保留的。对 agents.prometheus 设置的 prompt 和 prompt_append 会追加到官方基础提示中，不能把规划约束替换掉。

计划阶段可能调用 Metis 和 Momus：

- Metis 负责找隐含意图、范围膨胀、缺失验收条件和边界风险；
- Momus 负责检查计划的依据、清晰度、可执行性和 QA 场景。

这两个计划 Agent 不是代码实现者。它们的价值在于让执行计划尽量不把关键决定留给后续 Worker。

## Atlas：执行已批准计划

Prometheus 计划确认后输入：

```text
/ulw-execute
```

OpenCode edition 的 ulw-execute hook 会：

1. 选择 Prometheus 生成的计划；
2. 初始化 boulder 状态；
3. 注入计划、目标、worktree 和 PR 上下文；
4. 把会话切换到 Atlas；
5. 由 Atlas 按计划推进执行。

Atlas 不是一个只做“阶段编排”的旁观者。它会执行写入、调用 Category Worker、处理验证和持续状态，并由 atlas hook 在会话空闲时继续未完成的 boulder 工作。

如果 Atlas 没有注册，hook 会回退到 Sisyphus。正常配置下，/ulw-execute 的执行入口应理解为 Atlas。

## Category Worker：真正承接修改

Atlas 不直接把所有细节塞到一个大 prompt 中，而是把工作按 Category 拆给 Worker：

```typescript
task({
  category: "quick",
  prompt: "修复这个单文件中的类型错误，并运行对应测试。",
});

task({
  category: "visual-engineering",
  load_skills: ["frontend"],
  prompt: "实现响应式设置页并完成视觉验证。",
});
```

Category Worker 使用 Category 的模型和 Skill 配置，不能继续用 task 无限向下委派。它应该拥有单一、可验证的交付物。

## 运行状态如何连接起来

这套编排依赖几类状态：

| 状态 | 位置 | 负责什么 |
| --- | --- | --- |
| 计划草稿 | .omo/drafts/ | 保存 brief、决策和缺口 |
| 正式计划 | .omo/plans/ | 作为 ulw-execute 输入 |
| boulder | .omo/boulder.json | 记录当前执行工作 |
| notepad | 插件运行状态 | 保存 Sisyphus 或 Atlas 的工作记录 |
| Goal | .omo/goal/ | 保存持久目标 |
| 执行证据 | .omo/ulw-execute/ledger.jsonl | 记录验证和审查结果 |

Sisyphus 产生和维护主线，Prometheus 产生计划，Atlas 消费计划并更新执行状态。把这些文件当作模型记忆会误判恢复行为；它们是插件用于跨会话判断进度的外部状态。

## 权限和 hook 的分工

OpenCode edition 有几类与 Agent 相关的保护：

- Prometheus 只能把计划相关写入限制在 .omo/*.md；
- no-sisyphus-gpt 防止 Sisyphus 使用不兼容的 GPT 路由；
- no-hephaestus-non-gpt 保证 Hephaestus 走适配的 GPT 路由；
- sisyphus-junior-notepad 管理受限执行器的工作记录；
- atlas hook 负责 boulder 的继续执行和会话状态。

这些 hook 不替代 OpenCode 原生 permission。OpenCode 的 edit、bash、external_directory 和 MCP 权限仍然由 opencode.json 控制；插件 hook 负责它自己的角色边界。

## 两条工作流的差异

### 目标清楚：Sisyphus + ulw

目标能够用一句话描述，且你愿意让主 Agent 自己决定拆分方式：

```text
ulw 为订单导入增加重复记录保护，保持现有响应结构并补充测试。
```

Sisyphus 会在当前会话中探索、委派和验证。此时不会自动切换到 Atlas。

### 需要可审查计划：Prometheus + Atlas

任务涉及多模块、不可逆决策或团队协作时：

```text
/ulw-plan
/ulw-execute
```

Prometheus 负责把需求变成计划，用户确认后 Atlas 负责执行。计划、执行和验证的责任边界更清楚，也更适合跨会话恢复。

## Agent 顺序和配置

OpenCode edition 的 Tab 默认顺序是：

```text
Sisyphus → Hephaestus → Prometheus → Atlas
```

可以在统一配置的 [opencode] 区块中覆盖：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/omo.schema.json",
  "[opencode]": {
    "agent_order": [
      "sisyphus",
      "hephaestus",
      "prometheus",
      "atlas"
    ],
    "agents": {
      "sisyphus": {
        "model": "provider/orchestrator-model"
      },
      "prometheus": {
        "model": "provider/planner-model"
      },
      "atlas": {
        "model": "provider/executor-model"
      }
    }
  }
}
```

不要把 OpenCode 原生 Build、Plan 和插件的 Sisyphus、Prometheus 当成同一组 Agent。OpenCode 原生 Agent 由 opencode.json 管理，插件专属 Agent 由统一 omo.jsonc 的 [opencode] 区块管理。

## Team Mode 放在另一条并行线上

普通 Category Worker 适合独立任务，Team Mode 适合多个成员需要共享发现、认领任务和互发消息的场景。Team Mode 默认关闭，最多 8 个成员，提供 12 个 team_* 工具和可选 tmux 视图：

```jsonc
{
  "[opencode]": {
    "team_mode": {
      "enabled": true,
      "max_parallel_members": 4,
      "max_members": 8
    }
  }
}
```

如果任务之间互不依赖，background task 更简单。Team Mode 增加了共享状态和清理成本，不应只是为了打开更多窗口。

## 最终判断

Sisyphus 适合“目标清楚但拆分麻烦”的任务，Prometheus 适合“需要先把计划说清楚”的任务，Atlas 适合“计划已批准，开始持续执行”的任务，Category Worker 适合“已经拆成一个可验证工作单元”的任务。

把四个角色混成一个“多 Agent 协作”标签，会掩盖最重要的区别：谁负责决策，谁负责写计划，谁负责执行，谁只提供研究结论。

## 官方参考

- [OpenCode edition 配置](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/opencode-config.md)
- [Oh My OpenAgent 编排系统指南](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/orchestration.md)
- [Oh My OpenAgent 功能参考](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/features.md)
- [Team Mode](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/team-mode.md)
