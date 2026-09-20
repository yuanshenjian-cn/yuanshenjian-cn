---
title: "Claude Code 省 Token 技巧"
date: '2026-09-19'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: >-
  Claude Code 的成本主要受上下文长度、缓存命中、模型选择和代理数量影响。把无关任务分开、让大段输出在隔离上下文处理、合理选择 effort 和缓存 TTL，通常比机械地频繁清空会话更有效。
---

> 省 Token 的核心不是少说话，而是不让无关内容反复进入每一轮请求。

## 先理解每一轮请求在处理什么

模型不会在请求之间永久记住对话。Claude Code 会把系统提示、工具定义、项目上下文、历史消息、工具结果和当前输入重新组织后发送。Prompt caching 会复用其中没有变化的前缀，缓存读取按更低的价格计费；真正昂贵的往往是长上下文反复发生缓存未命中。

可以把一次会话看成三层：

| 层 | 内容 | 常见变化 |
|----|------|----------|
| 系统提示 | 核心指令和工具定义 | 工具集合、插件或模型发生变化 |
| 项目上下文 | `CLAUDE.md`、Auto Memory、未限定路径的 Rules | 新会话、`/clear`、`/compact` |
| 对话历史 | 用户消息、模型回答、工具结果 | 每一轮都会增加 |

上下文越长不一定越好。只要任务已经换题，旧历史就成了每一轮都要重新携带的噪音。

## 任务边界比固定清理频率更重要

继续当前会话适合这些情况：目标没有变、前面读取的文件仍然相关、已有决策可以直接支撑下一步。切换到无关任务时，`/clear` 通常更省；需要保留主线但历史太长时，用 `/compact`。

```text
/rename auth-fix
/clear
```

这样旧会话仍然可以用 `/resume auth-fix` 找回。不要把“每隔十轮一定 `/clear`”当成规则，也不要为了不丢上下文把登录、支付、文档和部署全部放在一个会话里。

`/compact` 本身要读取并总结当前历史，会产生一次压缩请求。任务已经完成、下一件事完全无关时，`/clear` 没有这笔压缩成本；任务仍在进行时，`/compact` 则能保留比新会话更有用的决策脉络。

## 把长内容留在文件里

不要把几万行日志、整份网页或完整构建输出直接粘进提示词。把它们保存到文件，再告诉 Claude 文件路径和筛选条件：

```text
请读取 build-error.log，只筛选最后一次失败及其前后 30 行。
结合 src/compiler/ 下相关文件，定位根因，不要把整份日志复制到回答中。
```

如果输入只是一次性文本，可以用管道，但要留意非交互模式的 stdin 上限：

```bash
git diff main...HEAD | claude -p \
  "只列出潜在的安全问题和文件位置" \
  --bare \
  --allowedTools "Read"
```

需要反复使用的过滤逻辑可以放进 Hook，让 Claude 只收到错误行、摘要或结构化数据。一个好的 Skill 也能提供项目地图，减少每次从目录结构重新探索的成本。

## 让 CLAUDE.md 保持短而稳定

`CLAUDE.md` 在会话启动时进入上下文，适合放：

- 包管理器、构建和测试命令；
- 目录职责和关键架构边界；
- 提交、验证和安全要求；
- Claude 无法从代码推断的失败经验。

不适合放进基础上下文的是偶尔才用的 API 手册、完整部署指南和大段历史背景。把它们移到 Skill 或按路径加载的 Rules，只有相关任务才付出上下文成本。官方建议把每份 `CLAUDE.md` 控制在约 200 行以内，长度只是参考，清晰度比数字更重要。

## 用缓存，但不要把缓存当成免费

缓存命中会降低重复前缀的处理成本，但以下操作可能让下一次请求重新读取大段历史：

- 切换模型；
- 在大多数模型上切换 effort；
- 开关快速模式；
- 让已加载到前缀的 MCP 工具发生变化；
- 禁用整个工具；
- 执行 `/compact`；
- 累积很多图片；
- 更新 Claude Code 后重建系统提示。

因此，任务开始时先确定模型和 effort，避免在长会话中反复调整。`opusplan` 会在 Plan 和执行阶段使用不同模型，属于有意的模型切换；适合需要强规划、但不希望所有执行回合都用高成本模型的任务。

缓存 TTL 取决于计费方式和请求类型。主会话在订阅计划的计划内用量中通常使用较长的缓存生命周期；API Key、云厂商和 usage credits 场景默认更短。需要明确控制时，可以在设置里写：

```json
{
  "promptCacheTtl": "1h",
  "subagentPromptCacheTtl": "5m"
}
```

也可以用环境变量：

```json
{
  "env": {
    "CLAUDE_CODE_PROMPT_CACHE_TTL": "1h",
    "CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL": "5m"
  }
}
```

`1h` 的缓存写入费率高于 `5m`。短时间密集工作、很少跨过五分钟空档时，延长 TTL 不一定更省；经常离开会话再回来时，长 TTL 才可能减少重建前缀的成本。需要调试缓存行为时，可以使用 `FORCE_PROMPT_CACHING_5M=1` 强制采用短 TTL。

`/usage` 可以查看会话用量和缓存统计。想做长期观察，可以配置 status line 或 OpenTelemetry，关注 `cache_read_input_tokens` 与 `cache_creation_input_tokens` 的比例，而不是只看总输出字数。

## effort 要和任务难度匹配

`effort` 控制模型愿意投入的推理深度。短小、确定的动作不必使用最高等级：

```text
/effort low
/effort medium
/effort high
```

复杂架构、跨模块调试和开放式研究可以使用 `xhigh` 或 `max`（具体可用等级取决于模型）。当前模型还支持 `ultracode`，它不仅提高 effort，还会为实质任务安排动态工作流：

```text
/effort ultracode
```

这会启动更多代理并增加延迟和用量，应该留给需要并行探索、交叉核验或长时间自主工作的任务。简单的文案改动、局部重命名和已有测试覆盖的修复，不值得为此付出额外编排成本。

## 选模型时先看完成成本

日常编码通常从 `sonnet` 开始；复杂架构、长链路调试和高价值审查可以切到 `opus`；需要长时间自主推进或模型能力仍不够时，再考虑 `fable`。简单的 Subagent 可以在定义中指定 `haiku`，把日志筛选、文件搜索和资料整理放到更快的模型上。

```markdown
---
name: log-summarizer
description: Summarize long test and build logs without changing files.
model: haiku
tools: Read, Grep, Glob
---
```

`fable` 和 `best` 适合更长的 agentic 任务，但 Fable 可能使用 usage credits。模型选择器会提示相应费用或限制；不要因为任务“看起来复杂”就默认打开最贵模型。

## 大上下文只在它能减少返工时使用

支持 1M 上下文的模型适合大型代码库、长文档和需要跨很多文件保持线索的任务，但上下文越大，读取和缓存的成本也越高。更稳妥的习惯是：

- 先用精确搜索缩小范围；
- 大文件按章节或函数读取；
- 把长日志交给 Subagent 处理；
- 只在确实需要时选择 `[1m]` 模型别名；
- 如果项目不需要 1M，可以用 `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` 隐藏 1M 选项。

```text
/model sonnet[1m]
```

1M 不是“把整个仓库都塞进来”的许可。上下文里每一段内容都应该服务于当前判断。

## MCP 工具要少而精

Claude Code 会延迟加载支持 Tool Search 的 MCP 工具，大量闲置工具不一定会在启动时完整占用上下文。但工具描述、服务器连接和返回结果仍会增加选择噪音与运行成本。

优先使用命令行工具的场景仍然成立：`git`、`gh`、`aws`、`gcloud`、`sentry-cli` 和项目自有脚本通常比一组 MCP schema 更轻。只有当 MCP 提供了 CLI 没有的权限、数据关联或交互能力时，才值得长期启用。

可以在 `/mcp` 中关闭当前不用的服务器，并在 `/context` 中看它们实际占用多少上下文。不要只因为某个服务器“以后可能用到”就一直开着。

## 用 Subagent 隔离高输出任务

测试日志、文档搜索、代码库盘点和独立审查都容易产生大量中间输出。把它们放进 Subagent，主会话只接收结论，通常比在主会话里边看边总结更省：

```text
用只读 Subagent 扫描 src/ 下所有 API 路由的鉴权检查。
返回：文件、路由、证据、风险等级和无法确认的地方，不要修改文件。
```

Agent Teams 更适合加速相互独立的工作，不适合省 Token。每个队友都有自己的上下文，队伍越大，总用量通常越高。Dynamic workflow 还会增加编排和验证代理，只有任务规模足够大时才值得。

## 每天可以坚持的几条习惯

- 一个会话围绕一个相关任务，不把完全无关的工作混在一起；
- 目标未变就继续，目标变了就 `/clear`；
- 长内容用路径和筛选条件，不整段粘贴；
- 开始任务时确定模型和 effort，减少中途切换；
- 把稳定约定放进 `CLAUDE.md`，把偶尔流程放进 Skill；
- 用 Subagent 隔离高输出探索，用 Hook 过滤确定性数据；
- 让 `/usage`、`/context` 和 status line 帮你发现缓存未命中和上下文膨胀。

成本控制最后会回到一个判断：当前上下文是否还在帮助任务完成。如果答案是否定的，重新开始通常比守着一段已经失去相关性的历史更便宜；如果答案是肯定的，保持稳定的模型、工具和项目上下文，缓存才有机会发挥作用。

官方参考：[Prompt caching](https://code.claude.com/docs/en/prompt-caching)、[成本管理](https://code.claude.com/docs/en/costs)、[模型配置](https://code.claude.com/docs/en/model-config)、[上下文窗口](https://code.claude.com/docs/en/context-window)。
