---
title: "Claude Code 第六篇：设置、权限与 Auto Mode"
date: '2026-09-19'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: "Claude Code 的安全配置不是一个开关，而是设置优先级、权限规则、权限模式、Auto Mode 和 Bash 沙箱的组合。本文把这些边界拆开，帮助个人开发者和团队写出能解释、能审计的配置。"
---

> 安全配置的目标不是让 Claude 什么都不能做，而是让每一次放权都有明确范围和可追溯的理由。

## 设置来源有五层

同一个键在多个地方出现时，Claude Code 按以下优先级取值：

```text
Managed settings
        ↓
--settings / 命令行
        ↓
.claude/settings.local.json
        ↓
.claude/settings.json
        ↓
~/.claude/settings.json
```

| 来源 | 常见位置 | 适合放什么 |
|------|----------|------------|
| Managed | 管理员控制台、MDM、系统级 managed-settings.json | 组织必须执行的策略 |
| CLI | `--settings` 或命令行参数 | 一次运行的实验和自动化参数 |
| Local | `.claude/settings.local.json` | 个人项目例外，通常 gitignored |
| Project | `.claude/settings.json` | 团队共享的权限、Hooks 和偏好 |
| User | `~/.claude/settings.json` | 跨项目的个人设置 |

设置优先级和权限规则优先级是两件事。权限规则本身按 deny、ask、allow 的顺序判断；更高层来源还可以让用户无法绕开组织策略。编辑后可以用 `/config`、`/permissions` 和 `/status` 检查实际状态，不要只凭文件内容推断。

## 规则写成工具边界

权限规则的基本形状是 `Tool` 或 `Tool(specifier)`：

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Bash(git diff *)"
    ],
    "ask": [
      "Bash(git push *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./secrets/**)"
    ]
  }
}
```

规则评估顺序是 deny → ask → allow。匹配到 deny 的动作不会因为更具体的 allow 规则而放行；需要人工确认的动作可以放入 ask，即使会话正在 `acceptEdits` 或 Auto Mode 中也会保留确认点。

### Bash 规则要留出边界

```text
Bash(npm test)       只匹配这一条命令
Bash(npm run *)       匹配 npm run 后面的子命令
Bash(git push *)      为所有 push 保留确认
```

`Bash(*)` 会放开整个 Bash 工具，风险远高于只允许一个命令。Bash 模式匹配的是 Claude 写出的命令文本，不是完整的 Shell 语义；复杂的包装器、变量展开和重定向可能让你以为的边界失效。真正需要严格拦截的动作，用 deny 或 Hook，不要试图用一条宽泛的 Bash 通配符表达安全策略。

### Read / Edit 规则保护敏感路径

Read 和 Edit 的路径规则支持工作目录相对路径、项目根相对路径、主目录路径以及绝对路径。绝对路径使用双斜线形式：

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Edit(./secrets/**)",
      "Read(//Users/example/.ssh/**)"
    ]
  }
}
```

Claude Code 还能识别 Bash 中常见的 `cat`、`head`、`sed`、`tee` 和重定向目标，并把 Read / Edit 的 deny 规则应用到这些明确路径。无法静态识别的任意子进程仍可能绕过应用层规则，需要 Bash 沙箱承担 OS 级限制。

### MCP 和 Subagent 也可以限制

```json
{
  "permissions": {
    "allow": [
      "mcp__docs__search"
    ],
    "deny": [
      "mcp__payments__*",
      "Agent(Explore)"
    ]
  }
}
```

对于 MCP 工具，名称形如 `mcp__服务器__工具`。如果要拒绝整个工具，直接写工具名；如果只想限制某个参数模式，则使用带 specifier 的规则。

## 工作目录不是配置目录

Claude Code 默认围绕启动目录和已授权的工作目录工作。临时增加目录可以用：

```bash
claude --add-dir ../shared-docs
```

会话内也可以运行：

```text
/add-dir ../shared-docs
```

持久配置写入：

```json
{
  "permissions": {
    "additionalDirectories": ["../shared-docs"]
  }
}
```

额外目录主要授予文件访问权，不会自动把那里的所有 `.claude/` 配置当成当前项目配置。需要共享 Skill、Subagent 或 MCP 时，应使用明确的项目、用户或插件作用域。

## Auto Mode 是第二道判断

Auto Mode 中，Claude Code 会让安全分类器检查动作，而不是每次都让用户点击确认。它和权限规则的关系是串联的：权限 deny 或 ask 先决定边界，分类器再判断剩余动作是否符合安全规则。

分类器通常会拦截或要求重新确认的动作包括：

- 下载并执行外部代码；
- 把敏感数据发往不可信的外部目标；
- 生产部署、迁移和不可逆删除；
- 强制推送、修改共享基础设施或授予权限；
- 绕过安全保护的 Shell 参数。

当 Auto Mode 把正常的内部操作误判为外部风险时，应补充可信基础设施，而不是把所有动作加入 allow。个人信任信息放在用户设置的 `autoMode.environment`，组织级信息放进托管设置：

```json
{
  "autoMode": {
    "environment": [
      "$defaults",
      "Source control: github.example.com/acme",
      "Trusted internal domains: *.corp.example.com",
      "Key internal services: Jenkins at ci.example.com"
    ]
  }
}
```

`$defaults` 保留 Claude Code 自带规则。`autoMode` 不应从共享项目设置中读取，因为仓库本身不能替当前机器声明“哪些外部目标可信”。可以用下面的命令查看规则：

```bash
claude auto-mode defaults
claude auto-mode config
```

如果需要完全关闭 Auto Mode，可在设置中写：

```json
{
  "disableAutoMode": "disable"
}
```

它也可以放在 `permissions` 对象中；企业环境应在 Managed 层设置，防止用户配置重新打开。

## Bash 沙箱提供 OS 级隔离

权限规则主要约束 Claude Code 能不能调用工具，Bash 沙箱约束命令和子进程真正能访问什么。两者互补：权限负责“这个动作是否应该运行”，沙箱负责“即使运行，它能碰到哪里”。

交互式启用沙箱：

```text
/sandbox
```

常见设置如下：

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "excludedCommands": ["docker"],
    "filesystem": {
      "allowWrite": ["/tmp/build"],
      "denyRead": ["~/.ssh", "~/.aws"]
    }
  }
}
```

macOS、Linux 和 WSL 2 的沙箱实现不同；原生 Windows 不提供同样的内置 Bash 沙箱。Linux 环境还需要安装文档要求的隔离依赖。`allowUnsandboxedCommands` 允许命令在沙箱失败后走普通权限流程，若环境要求命令绝不越界，应将它设为 `false` 并设置 `failIfUnavailable`。

沙箱不是容器，也不会自动隔离内置 Read / Edit 工具、浏览器登录状态或远程系统。高风险 CI 仍应使用专用容器、低权限账户和最小网络出口。

## Hook 适合确定性安全检查

如果一个规则必须每次执行，Hook 比提示词更可靠。例如，`PreToolUse` 可以在 Bash 执行前检查命令：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/check-command.sh"
          }
        ]
      }
    ]
  }
}
```

Hook 可以通过退出码 2 阻断动作，也可以输出结构化结果返回 `allow`、`deny`、`ask` 或修改后的输入。Hook 返回 `allow` 不能覆盖权限 deny；安全边界应放在权限系统，Hook 更适合做动态检查、格式化、审计和通知。

当前 Hook 类型包括本地 command、HTTP、MCP tool、prompt 和 agent。常用事件有 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PermissionRequest`、`SubagentStart`、`Stop`、`PreCompact`、`ConfigChange` 和 `SessionEnd`。具体事件和输入字段以 `/hooks` 与官方 Hooks 参考为准。

## 企业托管要放在最高层

企业可以通过 Managed settings 或管理控制台统一下发：

- 禁止 Bypass 或 Auto Mode；
- 只允许组织批准的 MCP 和 Plugin marketplace；
- 只允许 Managed Hooks、Managed 权限规则或托管读取路径；
- 设置模型白名单、最大 effort 和数据处理边界；
- 用 OpenTelemetry 监控使用和缓存情况。

共享项目设置适合团队协作，但不能替代组织策略。涉及生产凭证、个人数据和外部发布时，应在托管层设置 deny 或 ask，再在项目层补充具体工作流。

## 三类场景的起点配置

### 个人开发

从 Manual 或 `acceptEdits` 开始，只允许常用的测试和只读 Git 命令：

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Bash(git status)",
      "Bash(git diff *)"
    ],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./.env)", "Read(./secrets/**)"],
    "defaultMode": "default"
  }
}
```

### 团队仓库

将项目级 allow、ask、deny、Hooks 和 MCP 审批规则提交到仓库，同时把个人例外留在 `settings.local.json`。对部署、推送和外部消息使用 ask，而不是完全依赖模型判断。

### CI

非交互运行通常使用 `-p`、`--bare`、`--allowedTools` 或 `dontAsk`，并在容器中运行：

```bash
claude --bare -p "运行测试并报告失败原因" \
  --permission-mode dontAsk \
  --allowedTools "Read,Bash(npm test)"
```

CI 不应该把整个 `Bash` 或 `Write` 工具放进白名单。自动修复任务也应把工作区、凭证和推送目标限制在专用分支，并让 Pull Request 负责人工审查。

## 常见误区

| 误区 | 更稳妥的做法 |
|------|--------------|
| 用 `CLAUDE.md` 代替安全拦截 | 用 deny、ask、沙箱或 Hook |
| 用 `Bash(*)` 省掉所有提示 | 只允许具体的命令前缀 |
| 把 Auto Mode 的信任配置写进项目设置 | 放到用户或 Managed 的 `autoMode` |
| 以为 deny 只拦截模型内置 Read | 对外部命令、沙箱和敏感路径做纵深防御 |
| 在 CI 使用 Bypass，却没有容器 | 先建立隔离环境，再考虑无人值守 |
| 修改设置后只看 JSON 文件 | 用 `/permissions`、`/status` 和 `claude auto-mode config` 验证 |

安全配置的质量，最终看的是“能否说明一条动作为什么被允许、为什么被阻止”。当设置、权限、沙箱和 Hook 各自承担清楚的责任，Claude 才能在安全边界内获得真正的自动化空间。

官方参考：[设置优先级](https://code.claude.com/docs/en/settings)、[权限](https://code.claude.com/docs/en/permissions)、[权限模式](https://code.claude.com/docs/en/permission-modes)、[沙箱](https://code.claude.com/docs/en/sandboxing)、[Auto Mode 配置](https://code.claude.com/docs/en/auto-mode-config)。
