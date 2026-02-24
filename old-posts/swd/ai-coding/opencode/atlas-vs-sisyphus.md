# Atlas vs Sisyphus：OhMyOpenCode 双 orchestrator 架构解析

在 OhMyOpenCode（OmO）插件中，Atlas 和 Sisyphus 是两个核心 orchestrator 代理，它们共同构成了多代理协调系统的双核引擎。理解它们的工作原理、设计哲学和协作关系，对于掌握 OmO 的高级用法至关重要。

## 角色定位：指挥家 vs 高级工程师

### Sisyphus ：全能主协调器

Sisyphus 是 OmO 的默认主代理，定位为"像 senior engineer 一样工作的 AI 开发者"。它的核心职责是：

- **意图解析**：通过 IntentGate 分析用户的真实意图
- **动态规划**：根据任务复杂度创建 todo 列表
- **智能委派**：决定什么时候自己执行，什么时候调用 subagent
- **并行执行**：同时启动多个 background task 加速工作

Sisyphus 拥有广泛的工具权限——它可以读写文件、执行命令、通过 `task()` 调用其他代理。但出于安全考虑，**`call_omo_agent` 工具被明确禁止**，Sisyphus 只能通过 `task()` 进行任务委派，不能直接调用特定 agent。

**权限对比：Sisyphus vs Sisyphus-Junior**

| Agent                                | `task()` | `call_omo_agent` | 使用场景               |
| ------------------------------------ | ---------- | ------------------ | ---------------------- |
| **Sisyphus** (主协调器)        | ✅ 允许    | ❌**禁止**   | 动态规划、灵活委派     |
| **Sisyphus-Junior** (子执行器) | ❌ 禁止    | ✅**允许**   | 执行具体任务、自主探索 |

这种设计形成**权限互补**：协调器通过 `task()` 灵活委派，执行者通过 `call_omo_agent` 自主获取信息。源码依据：

**Sisyphus 权限配置**（`src/plugin-handlers/tool-config-handler.ts:56-66`）：

```typescript
const sisyphus = agentByKey(params.agentResult, "sisyphus");
if (sisyphus) {
  sisyphus.permission = {
    ...sisyphus.permission,
    call_omo_agent: "deny",  // ❌ 明确禁止
    task: "allow",           // ✅ 允许使用 task 委派
    "task_*": "allow",
    teammate: "allow",
  };
}
```

**Sisyphus-Junior 权限配置**（`src/agents/sisyphus-junior/agent.ts:29-30,97`）：

```typescript
// Core tools that Sisyphus-Junior must NEVER have access to
// Note: call_omo_agent is ALLOWED so subagents can spawn explore/librarian
const BLOCKED_TOOLS = ["task"]  // ❌ 禁止 task
// ...
merged.call_omo_agent = "allow"  // ✅ 显式允许 call_omo_agent
```

> **重要限制**：`call_omo_agent` 工具**仅允许调用特定类型的 agent**：`explore`、`librarian`、`oracle`、`hephaestus`、`metis`、`momus`、`multimodal-looker`（`src/tools/call-omo-agent/constants.ts:1-9`）。其中 `explore` 和 `librarian` 用于代码库探索和文档查询，其他代理用于特定专业任务。

### Atlas：纯协调指挥家

Atlas 的设计理念截然相反——**它不直接写代码**，而是专注于协调和验证。Atlas 的定位是"指挥家，不是乐手；将军，不是士兵"。

Atlas 的**委派工具在 agent 配置层被限制**（`src/agents/atlas/agent.ts:102-106`）：

```typescript
// Atlas agent 配置明确禁止 task 和 call_omo_agent 工具
const restrictions = createAgentToolRestrictions([
    "task",
    "call_omo_agent",
])
```

然而，Atlas 的**系统提示**（`src/agents/atlas/default.ts:22-37`）教导它使用 `task()` 进行委派：

```typescript
// Atlas prompt 明确教导使用 task()
Complete ALL tasks in a work plan via `task()` until fully done.

Use `task()` with EITHER category OR agent:
task(
  category="[category-name]",
  load_skills=["skill-1", "skill-2"],
  run_in_background=false,
  prompt="..."
)
```

Atlas 在 agent 配置层被限制 `task` 和 `call_omo_agent` 工具权限，但在**插件配置处理阶段**通过 `tool-config-handler.ts` 重新授予 `task` 权限（仍禁止 `call_omo_agent`）。这确保 Atlas 可以使用 `task()` 进行任务委派，但不能直接调用特定的 explore/librarian 等 agent。

**权限重授机制源码**（`src/plugin-handlers/tool-config-handler.ts:45-55`）：

```typescript
const atlas = agentByKey(params.agentResult, "atlas");
if (atlas) {
  atlas.permission = {
    ...atlas.permission,
    task: "allow",              // ✅ 重新授予 task 权限
    call_omo_agent: "deny",     // ❌ 保持禁止 call_omo_agent
    "task_*": "allow",
    teammate: "allow",
  };
}
```

**关键区别**：

- **Atlas**：主要使用 `task()` 进行**category-based 委派**（推荐），但也支持 `subagent_type` 指定特定代理（如 `oracle`）
- **Sisyphus**：同样只能使用 `task()`，但它是**主协调器**，拥有更广泛的任务规划能力
- **Sisyphus-Junior**：被**禁止**使用 `task()`，但**允许**使用 `call_omo_agent()` 直接调用特定 agent

Atlas 的核心工作是：

- 读取预定义的计划（Plan）
- 分析任务依赖关系，制定并行化策略
- 委派给 **Sisyphus-Junior**（category-based subagent）执行具体任务
- **严格验证**结果（读代码、跑测试、检查 LSP）
- 维护跨会话状态（Boulder State）

## 工作机制对比

### Sisyphus 的工作流程

```typescript
// Phase 0: Intent Gate - 解析用户真实意图
"I detect [implementation] intent — user wants to add auth. 
 My approach: [explore → plan → delegate]."

// Phase 1: 创建 Todo 列表
todowrite([
  { content: "分析现有代码结构", status: "in_progress" },
  { content: "实现 JWT middleware", status: "pending" },
  { content: "添加登录路由", status: "pending" }
])

// Phase 2: 并行探索（Background Tasks）
task(subagent_type="explore", run_in_background=true, ...)
task(subagent_type="librarian", run_in_background=true, ...)

// Phase 3: 执行或委派
// - 简单任务：自己直接执行
// - 复杂任务：委派给 category-based subagent
task(category="quick", run_in_background=false, ...)

// Phase 4: 验证
lsp_diagnostics()
bash("bun test")
```

### Atlas 的工作流程

```typescript
// Step 0: 注册 Boulder 跟踪
todowrite([{ id: "orchestrate-plan", content: "Complete ALL tasks", status: "in_progress" }])

// Step 1: 分析 Plan 文件
Read(".sisyphus/plans/feature-xyz.md")
// 解析出：总任务数、可并行组、依赖链

// Step 2: 初始化 Notepad 系统
mkdir -p .sisyphus/notepads/feature-xyz/
// learnings.md, decisions.md, issues.md, problems.md

// Step 3: 并行委派（关键差异）
// Atlas 通过 task() 同时启动多个 Sisyphus-Junior subagent 执行具体任务
// 虽然 Atlas 被配置为限制使用 task 工具，但在实际工作流程中通过系统协调机制调用
// 注意：每个 task() 使用 run_in_background=false 同步等待，但在单个消息中可并行发起多个
task(category="quick", load_skills=[], run_in_background=false, prompt="Task 1...")
task(category="quick", load_skills=[], run_in_background=false, prompt="Task 2...")
task(category="deep", load_skills=[], run_in_background=false, prompt="Task 3...")

// Step 4: 验证每一个结果
// - 读每一个修改的文件
// - 运行 LSP diagnostics
// - 执行测试
// - 检查 boulder state

// Step 5: Loop Until Done
// 重复直到所有任务完成
```

## 核心差异详解

| 维度               | Sisyphus                    | Atlas                                      |
| ------------------ | --------------------------- | ------------------------------------------ |
| **代码权限** | 完整（读写文件、执行命令）  | **零**（只能委派）                   |
| **适用场景** | 日常开发、探索性任务        | 复杂多步骤计划（Ralph Loop）               |
| **会话范围** | 单会话 + Background Tasks   | 多会话协调（Boulder Session Tree）         |
| **状态管理** | 当前会话的 todo API         | Boulder State JSON + Notepad               |
| **并行策略** | 探索类任务后台并行          | 执行类任务前台并行（多 subagent）          |
| **验证职责** | 自我验证                    | **强制 QA Gate**（4-Phase Protocol） |
| **模型要求** | claude-opus-4-6 / kimi-k2.5 | kimi-k2.5 / claude-sonnet-4-6              |

**注**：以上为主模型配置。两者都有备用模型链（fallback chain）以确保高可用性：

- Sisyphus: claude-opus-4-6 → kimi-k2.5-free → glm-5 → big-pickle
- Atlas: kimi-k2.5-free → claude-sonnet-4-6 → gpt-5.2

**Fallback 链源码**（`src/shared/model-requirements.ts:16-91`）：

```typescript
export const AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  sisyphus: {
    fallbackChain: [
      { providers: ["anthropic", "github-copilot", "opencode"], model: "claude-opus-4-6", variant: "max" },
      { providers: ["opencode"], model: "kimi-k2.5-free" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["opencode"], model: "big-pickle" },
    ],
  },
  atlas: {
    fallbackChain: [
      { providers: ["opencode"], model: "kimi-k2.5-free" },
      { providers: ["anthropic", "github-copilot", "opencode"], model: "claude-sonnet-4-6", variant: "extended" },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.2" },
    ],
  },
}
```

### 代码修改权限

这是两者最根本的区别。Atlas 的 Prompt 中反复强调：

```markdown
**YOU DO**:
- Read files (for context, verification)
- Run commands (for verification)
- Use lsp_diagnostics, grep, glob
- Manage todos
- Coordinate and verify

**YOU DELEGATE**:
- All code writing/editing  ← 绝对禁止
- All bug fixes
- All test creation
- All documentation
- All git operations

**NEVER**:
- Write/edit code yourself - always delegate
```

这种设计的哲学是：**最贵的模型应该只做 orchestration**，代码实现交给便宜些的 specialist models。

### 并行执行模式

**Sisyphus 的并行**：

```typescript
// 探索类任务：后台并行（不阻塞）
task(subagent_type="explore", run_in_background=true)
task(subagent_type="librarian", run_in_background=true)
// Sisyphus 继续工作，稍后收集结果

// 执行类任务：串行或同步等待
task(category="quick", run_in_background=false)  // 阻塞等待
```

**Atlas 的并行**：

```typescript
// Atlas 通过 task() 委派给 Sisyphus-Junior 执行具体任务
// 在同一个消息中同时发起多个 task() 调用，实现 subagent 级别的并行
// 每个 task() 使用 run_in_background=false 同步等待结果
task(category="quick", load_skills=[], run_in_background=false, prompt="Task A...")
task(category="quick", load_skills=[], run_in_background=false, prompt="Task B...")
task(category="quick", load_skills=[], run_in_background=false, prompt="Task C...")
// Atlas 同时启动3个 Sisyphus-Junior subagent，各自独立执行
```

> 注意：Atlas 使用 `task(category="...")` 委派给 Sisyphus-Junior。虽然 Atlas 的 agent 配置限制了 task 工具，但在实际 orchestration 流程中通过系统协调层调用。

### 并行机制的关键区别

两种并行模式有本质差异：

| 特性               | Sisyphus 后台并行                            | Atlas 消息级并行            |
| ------------------ | -------------------------------------------- | --------------------------- |
| **参数**     | `run_in_background=true`                   | `run_in_background=false` |
| **阻塞性**   | 非阻塞，立即返回 task_id                     | 阻塞，等待任务完成          |
| **结果收集** | 使用 `background_output(task_id)` 稍后收集 | 直接在响应中返回结果        |
| **适用场景** | 探索类任务（explore/librarian）              | 执行类任务（需要等待结果）  |
| **并发控制** | BackgroundManager 管理（默认5并发）          | 消息级并发，受限于响应时间  |

**关键理解**：

- **Sisyphus** 使用 `run_in_background=true` 启动真正的异步后台任务，适合耗时较长的探索任务
- **Atlas** 在单个消息中同时发起多个 `task()` 调用（每个 `run_in_background=false`），实现 subagent 级别的并行执行，适合需要立即获得结果的任务

### 状态持久化

**Sisyphus**：依赖当前会话的 todo API

```typescript
const response = await ctx.client.session.todo({ path: { id: sessionID } })
```

**Atlas**：使用 Boulder State 持久化到文件

```json
// .sisyphus/boulder.json
{
  "active_plan": "/path/to/project/.sisyphus/plans/feature-xyz.md",
  "started_at": "2026-02-23T10:30:00.000Z",
  "session_ids": [
    "ses_abc123",
    "ses_def456",
    "ses_ghi789"
  ],
  "plan_name": "feature-xyz",
  "agent": "atlas"
}
```

**Boulder State 完整机制**（`src/hooks/atlas/event-handler.ts`）：

Boulder continuation 的决策流程包含多个检查点：

```
session.idle event
  → 是否属于 boulder session_ids？
  → 是否有 abort error？（跳过）
  → 失败次数 < 2？（防止无限循环）
  → 是否有运行中的后台任务？（等待）
  → Agent 是否匹配 boulder 配置？
  → Plan 是否未完成？
  → 5秒冷却期是否已过？
  → 注入 continuation prompt
```

**关键常量**：

- `CONTINUATION_COOLDOWN_MS = 5000`（5秒冷却期）
- `MAX_CONSECUTIVE_FAILURES = 2`（失败2次后暂停）

**Notepad 系统**（`.sisyphus/notepads/{plan-name}/`）：

Notepad 用于在 subagent 间传递累积知识，由 Atlas 创建并管理：

```
.sisyphus/notepads/{plan-name}/
├── learnings.md    # 代码约定、模式发现
├── decisions.md    # 架构决策记录
├── issues.md       # 已知问题、陷阱
└── problems.md     # 未解决的阻塞
```

**工作流程**：

1. **创建**：Atlas 在 Step 2 初始化 Notepad 目录
2. **读取**：每个 subagent 在开始前读取相关 Notepad 文件
3. **追加**：subagent 完成后追加发现（使用 `Write` 追加，绝不覆盖）
4. **继承**：后续 subagent 获得累积的知识上下文

这种设计让 Atlas 能够：

- 跨会话跟踪进度
- 在子代理失败后恢复（session resume）
- 通过 Notepad 在 subagent 间传递知识

## Hook 层的协作机制

在 OhMyOpenCode 的 Hook 系统中，Atlas 和 Sisyphus 的 continuation 机制是分开的：

### TodoContinuationEnforcer（Sisyphus）

```typescript
// 处理除 prometheus/compaction 外的所有会话
DEFAULT_SKIP_AGENTS = ["prometheus", "compaction"]

session.idle
  → 是否主会话？
  → 仍有未完成 todos？
  → 2秒倒计时 → 注入 CONTINUATION_PROMPT
```

### Atlas Hook（Boulder Orchestrator）

```typescript
// 处理 boulder/ralph/background 会话
session.idle
  → 是否属于 boulder session_ids？
  → 或是否 background task 会话？
  → Agent 是否匹配 boulder 配置？
  → Plan 是否未完成？
  → 5秒冷却 → 注入 continuation prompt
```

两者都监听 `session.idle` 事件，但通过不同的条件判断来避免冲突。

## 实际场景对比

### 添加一个 API 端点（Sisyphus）

```bash
用户：帮我加一个用户注册的 API 端点
```

**Sisyphus 的处理**：

1. Intent Gate：识别为"实现"意图
2. 创建 todos：分析代码 → 实现 handler → 添加路由 → 写测试
3. 可能启动 explore 找现有模式（background）
4. 自己实现或委派给 quick category
5. 验证：LSP + 测试

### Ralph Loop 全栈功能开发（Atlas）

```bash
用户：/ralph-loop "实现完整的 OAuth2 认证系统，包括前端登录页、后端 API、数据库模型"
```

**Atlas 的处理**：

1. Prometheus 生成 Plan（10个任务）
2. Atlas 启动，创建 Boulder State
3. **并行委派**：

   - Task 1-3：Sisyphus-Junior (quick) 创建数据库模型、API 路由、中间件
   - Task 4-6：Sisyphus-Junior (visual-engineering) 创建登录页面组件
   - Task 7：Sisyphus-Junior (deep) 实现 token 刷新逻辑
4. **4-Phase 验证**每个结果：

   Atlas 的 4-Phase QA Protocol 确保每个委派任务都得到严格验证：

   - **Phase 1: Automated Verification**

     - `lsp_diagnostics()` → ZERO errors at project level
     - `bun run build` or `bun run typecheck` → exit code 0
     - `bun test` → ALL tests pass
   - **Phase 2: Manual Code Review**（NON-NEGOTIABLE）

     - `Read` EVERY file the subagent created or modified
     - Check line by line: logic correctness, stubs/TODOs, edge cases
     - Cross-reference: subagent's claims vs actual code
   - **Phase 3: Hands-On QA**（if applicable）

     - Frontend/UI: Browser testing via `/playwright`
     - TUI/CLI: Interactive testing via `interactive_bash`
     - API/Backend: Real requests via `curl`
   - **Phase 4: Boulder State Check**

     - `Read(".sisyphus/tasks/{plan-name}.yaml")`
     - Count remaining `- [ ]` tasks
     - Confirm current progress
5. 失败的任务使用 session_id 恢复
6. Loop until all tasks complete

## 如何选择？

**使用 Sisyphus（默认）**：

- 日常开发任务
- 需要探索和灵活性的工作
- 不确定如何分解的开放式任务
- 不需要跨会话持久化的短期任务

**使用 Atlas（Ralph Loop / Plan）**：

- 复杂多步骤项目
- 需要严格验证的关键功能
- 需要并行执行多个独立子任务
- 需要跨会话恢复的长时任务

## 协作关系总结

```
用户请求
    │
    ▼
┌─────────────────────────────────────┐
│  Intent Gate (Sisyphus 或 Atlas)    │
│  - 如果是 Plan 路径 → 启用 Atlas    │
│  - 否则 → Sisyphus 处理             │
└─────────────────────────────────────┘
    │
    ├──► Sisyphus 路径 ─────────────────┐
    │   - 动态规划                      │
    │   - 灵活委派                      │
    │   - 自我执行或调用 subagent       │
    │   - TodoContinuationEnforcer      │
    │       监控完成                    │
    │
    └──► Atlas 路径 ────────────────────┐
        - 读取预定义 Plan               │
        - Boulder State 管理            │
        - 纯协调，零代码实现            │
        - 严格 4-Phase 验证             │
        - 多 subagent 并行              │
        - Atlas Hook 监控完成           │
```

## 技术细节补充

### BackgroundManager 的并发控制

```typescript
// 每个模型默认 5 个并发槽
private concurrencyManager: ConcurrencyManager

// 队列机制
private queuesByKey: Map<string, QueueItem[]>  // 按模型/provider分队列
```

### Sub Agent 的会话创建

每个 `task()` 调用都会创建一个**独立的子会话**：

```typescript
const createResult = await this.client.session.create({
  body: {
    parentID: input.parentSessionID,  // 记录父会话关系
    title: `${input.description} (@${input.agent} subagent)`,
  }
})
const sessionID = createResult.data.id
subagentSessions.add(sessionID)  // 注册为子会话
```

### Metis/Momus 的角色与工具权限

**重要澄清**：Metis 和 Momus 是 **read-only / pre-planning 代理**，它们的工具权限有特定限制：

```typescript
// Metis 的工具限制（src/agents/metis.ts）
createAgentToolRestrictions([
  "write", "edit", "apply_patch", "task"  // task 被禁止！
])

// Momus 的工具限制（src/agents/momus.ts）
createAgentToolRestrictions([
  "write", "edit", "apply_patch", "task"  // task 被禁止！
])
```

**关键区别**：Metis/Momus **不能使用 `task` 工具**，但**保留 `call_omo_agent` 工具权限**。

这意味着：

- ❌ 不能使用 `task(category="...")` 委派给 Sisyphus-Junior
- ✅ **可以**使用 `call_omo_agent(run_in_background=true)` 启动 background task

**实际能力**：

- **Metis**：预规划分析时，可以并行启动多个 `call_omo_agent(subagent_type="explore")` 进行代码库探索
- **Momus**：质量审核时，可以并行启动多个 `call_omo_agent(subagent_type="librarian")` 查找参考资料

`call_omo_agent` 支持 `run_in_background` 参数（REQUIRED），设为 `true` 时启动后台任务，行为与 `task` 工具的 background 模式相同。

**与 Sisyphus 的区别**：

- Sisyphus：使用 `task()` 进行 category-based 委派（更灵活的模型选择）
- Metis/Momus：使用 `call_omo_agent()` 进行固定代理委派（仅 explore/librarian 两种）

## 结语

Atlas 和 Sisyphus 代表了两种 orchestration 哲学：

- **Sisyphus** 是"高级工程师"模式——它像人类开发者一样思考、规划、执行，必要时寻求帮助。
- **Atlas** 是"技术负责人"模式——它专注于架构设计、任务分解、质量把控，把实现细节交给团队成员。

理解这种分工，能够帮助你在不同场景下选择合适的代理模式，发挥 OhMyOpenCode 的最大效能。
