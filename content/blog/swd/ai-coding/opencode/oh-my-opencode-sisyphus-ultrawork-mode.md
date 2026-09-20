---
title: "Oh My OpenAgent（OpenCode 版）：ultrawork 工作模式怎么用"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
  - Oh My OpenAgent
published: true
brief: >-
  ultrawork 让 Sisyphus 主动探索、规划、委派和验证。内容覆盖 ulw 的适用任务、Category 与只读 Agent 的配合、Prometheus 规划、Atlas 执行、Goal 和 Team Mode。
---

> ultrawork 不是一句“让模型更努力”的口号，而是让 Sisyphus 把探索、委派、验证和收尾都纳入同一个任务目标。

## 什么时候输入 ulw

在任务描述中加入 ulw 或 ultrawork，主 Agent 会采用更主动的编排方式：

```text
ulw 完成用户权限重构，保持公开 API 不变，运行相关测试并汇报未覆盖的边界。
```

它适合：

- 需要跨多个模块的功能；
- 需要先探索再实施的棕地改造；
- 可以拆成多个独立调查或实现单元的任务；
- 你希望主 Agent 自动选择 Category、Skill 和研究 Agent 的任务。

它不适合每一次拼写修改。简单任务直接使用 Build 往往更快，也更容易看清一次调用改了什么。

## ultrawork 的真实工作模型

OpenCode edition 的编排链由 Sisyphus、Prometheus、Atlas 和 Category Worker 组成：

```text
用户请求
  ↓
Sisyphus：理解目标、维护主线、安排委派
  ├─ Explore / Librarian / Oracle：只读研究和咨询
  ├─ Prometheus：生成并审查执行计划
  ├─ Atlas：执行已批准的计划
  └─ Category Worker：实现、测试或 QA
```

Sisyphus 使用当前会话模型。普通 ulw 任务留在 Sisyphus 主线上；/ulw-execute 会把 Prometheus 的计划、boulder 和 worktree/PR 上下文注入 Atlas，由 Atlas 继续执行。Category Worker 负责一个具体交付物，不能继续用 task 无限向下委派；Explore 和 Librarian 负责只读研究。

这条边界决定了 prompt 应该写清楚目标和验收条件。ulw 可以帮你安排工作，但不能替你猜出“做完”究竟意味着什么。

## 让 ulw 选择正确的路由

### 任务类型要具体

Sisyphus 会根据工作类型选择 Category。你可以在 prompt 中给出倾向，但不必写死具体模型：

```text
ulw 用 visual-engineering 实现这个表单。
要求保留现有组件库、键盘导航和移动端布局。
```

或者让它处理复杂后端逻辑：

```text
ulw 分析缓存失效问题。
先由只读 Agent 找出读写路径，再交给 deep Category 实现修复并运行测试。
```

### 研究和实现要分开

Explore 适合查当前仓库，Librarian 适合查官方文档和上游实现。它们不能修改文件，也不应该被当成实现 Worker。

Category 适合执行：

| Category | 工作类型 |
| --- | --- |
| quick | 单文件和机械性修改 |
| visual-engineering | UI、样式和动画 |
| deep | 复杂研究、浏览器、后端和算法 |
| ultrabrain | 单个高难度逻辑或架构问题 |
| architect | 模块边界和设计取舍 |
| writing | 文档和技术写作 |

需要加载领域知识时，再配合 load_skills：

```typescript
task({
  category: "visual-engineering",
  load_skills: ["frontend"],
  prompt: "实现响应式设置页，并用现有组件完成视觉验证。",
});
```

## 需要正式计划时使用 ulw-plan

ulw 适合“目标已经清楚，交给 Sisyphus 决定怎么拆”。如果任务范围大、存在不可逆选择，或需要把计划交给别人审查，应使用：

```text
/ulw-plan
```

Prometheus 会先探索代码和资料，再判断需求是否清楚：

- 目标清楚时，只询问仍然需要由你决定的偏好；
- 目标不清楚时，采用并说明合理默认值；
- 能从仓库中查到的事实，不留给用户重复回答；
- 破坏性、不可逆或涉及花费的决定，仍然需要你确认。

它会先给出 brief。你说可以之后，计划才会写入 .omo/plans/。Metis 会检查隐藏意图、范围膨胀和验收标准，Momus 会检查文件依据、任务可执行性和 QA 场景。

Metis 和 Momus 只在满足计划 gate 时出现：明确请求了 ulw-plan，当前会话接触过 .omo/plans/ 计划文件，而且还没有进入 ulw-execute。普通 ulw 任务不会强行启动它们。

## 使用 ulw-execute 执行已批准计划

计划写好并确认后：

```text
/ulw-execute
```

Atlas 会按计划中的 checkbox 推进工作。每一项通常经历：

- 重新读取计划和引用；
- 按推荐 Category 拆分 Worker；
- 运行自动化检查；
- 记录手工 QA 和结果证据；
- 处理清理和遗留状态；
- 通过检查后再进入下一项。

ulw-execute 可以指定计划名称，也可以使用 worktree、make-pr 和 ship 等选项。后两项会涉及外部 GitHub 状态，只有在你明确需要时才使用。

## 验证不能交给一句“请确认”

ultrawork 的价值在于把验证变成任务的一部分。一个好的请求至少说明：

1. 成功时必须观察到什么；
2. 哪些测试或命令必须运行；
3. 哪些行为不能改变；
4. 失败时要留下什么信息；
5. 哪些情况需要停下来询问。

例如：

```text
ulw 为导入接口增加重复记录保护。
保持现有响应结构，不修改数据库迁移。
完成后运行导入相关测试，并补一个重复请求场景。
如果现有数据约束不足，先停止并说明需要的迁移选择。
```

这样的约束比要求模型先达到某个抽象的确定性更有用。确定性无法直接证明，但可以通过文件、命令和测试留下可审查证据。

## 持久目标用 Goal 管理

需要跨多个会话或空闲继续推进时，可以启用 Goal：

```jsonc
{
  "[opencode]": {
    "goal": {
      "enabled": true,
      "auto_start": false
    }
  }
}
```

启用后可以在 TUI 中使用：

```text
/goal "完成支付模块重构并通过集成测试"
/goal
/goal pause
/goal resume
/goal clear
```

Goal 默认关闭。它适合目标明确、可以持续验收的工作，不适合把模糊愿望留给 Agent 长时间自行猜测。需要停止所有持续机制时，可以使用：

```text
/stop-continuation
```

当前持续目标由 /goal 管理，不要把一个不存在的 OpenCode slash command 当作持续执行开关。

## Team Mode 适合相互沟通的并行任务

当多个 Worker 需要共享发现、认领任务和互相发送消息时，可以启用 Team Mode：

```jsonc
{
  "[opencode]": {
    "team_mode": {
      "enabled": true
    }
  }
}
```

Team Mode 默认关闭，提供 lead、最多 8 个成员、共享任务清单、消息通道、可选 worktree 和 tmux 视图。它有 12 个 team_* 工具。

如果任务之间互不依赖，普通的 background task 更简单。Team Mode 的成本在于状态、通信和清理都需要管理，不应该只是为了看到更多窗口而打开。

## 让持续任务保持可控

### 给每个 Worker 一个交付物

不要把“调查、实现、写文档、补测试”全部塞给一次 deep 调用。可以拆成多个并行任务：

```typescript
task({ category: "deep", prompt: "只分析缓存失效原因，返回根因和复现步骤。" });
task({ category: "quick", prompt: "只为已有修复补充单元测试，不改变实现。" });
task({ category: "writing", prompt: "根据已确认的行为更新 API 文档。" });
```

写入范围重叠时，不要并行修改同一个文件。让 Sisyphus 先合并研究结果，再安排顺序执行。

### 让配置承载稳定规则

用户级配置放在 ~/.omo/omo.jsonc，项目级配置放在 .omo/omo.jsonc。模型选择可以在全局覆盖，项目配置更适合保存 Category 说明、权限和团队共享的工作习惯。

OpenCode 自身的 opencode.json 和 tui.json 仍然负责 provider、权限、TUI 和原生 Agent。插件配置与核心配置分开，故障时更容易定位。

### 控制上下文

每个 Skill、MCP 和外部资料都会增加上下文。ulw 不意味着所有工具都应该加载。只读研究完成后，应让 Sisyphus 带着结论继续，而不是把所有原始输出永久塞进每个 Worker。

## 什么时候不要用 ultrawork

- 单文件拼写或格式化；
- 已经知道唯一修改点的局部修复；
- 需要立刻确认一个命令输出；
- 任务权限、数据边界或验收条件还没有确定；
- 你还不知道是否允许修改工作区。

这些场景先用 Build 或 Plan。编排层越重，越需要清楚的目标来抵消额外开销。

## 一句话判断

目标清楚但拆分麻烦，用 ulw；需要书面计划和审查，用 /ulw-plan 后接 /ulw-execute；需要跨会话持续目标，用 /goal；需要成员之间实时沟通，才启用 Team Mode。

ultrawork 的质量不来自一句固定口令，而来自 Sisyphus 能否拿到正确上下文、选择合适的 Worker，并用测试和证据完成收尾。

## 官方参考

- [Oh My OpenAgent 编排系统指南](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/orchestration.md)
- [Oh My OpenAgent 功能参考](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/features.md)
- [Oh My OpenAgent 配置参考](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/configuration.md)
- [Oh My OpenAgent Team Mode](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/team-mode.md)
