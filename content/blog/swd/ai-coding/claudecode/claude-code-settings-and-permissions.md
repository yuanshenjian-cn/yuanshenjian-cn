---
title: "Claude Code 第六篇：设置、权限与 Auto Mode"
date: '2026-04-06'
tags: ['软件开发', 'AI 编程', 'ClaudeCode']
published: true
brief: "深入 Claude Code 的四层设置体系、细粒度权限规则语法、Auto Mode 分类器配置与沙箱化纵深防御，帮你在安全与效率之间找到最佳平衡点。"
---

## 引言：安全与效率的永恒博弈

前五篇我们已经能用 Claude Code 完成日常开发任务。但随着使用深入，你会遇到这样的场景：

- 团队成员 A 希望 Claude 自动运行 `npm test`，成员 B 担心误执行 `rm -rf`
- 你想让 Claude 推送到公司 GitLab，但 Auto Mode 把它当成"数据泄露"拦截了
- CI/CD 环境里需要完全无人值守，开发机上却想保留确认提示
- 新来的实习生需要限制 Claude 只能读不能写

Claude Code 提供了一套**四层设置 + 细粒度权限 + Auto Mode 分类器 + OS 级沙箱**的完整安全体系来应对这些挑战。本篇将系统拆解每一层。

> **前置阅读**：本篇假设你已熟悉[第四篇](/articles/claude-code-interactive-mode-and-built-in-commands)中介绍的六种权限模式（Default / AcceptEdits / Plan / Auto / DontAsk / BypassPermissions），这里将深入权限*规则*层面而非模式层面。

---

## 设置系统：四层配置与优先级

### 配置作用域一览

Claude Code 采用分层配置，每一层有明确的定位：

| 作用域 | 文件位置 | 影响范围 | 是否共享 | 典型用途 |
|--------|---------|---------|---------|---------|
| **Managed** | 服务器 / MDM / plist / 系统级 `managed-settings.json` | 机器上所有用户 | 由 IT 部署 | 组织安全策略、合规要求 |
| **User** | `~/.claude/settings.json` | 你的所有项目 | 否 | 个人偏好（主题、语言、模型） |
| **Project** | `.claude/settings.json` | 项目所有协作者 | 提交到 git | 团队权限、Hooks、MCP |
| **Local** | `.claude/settings.local.json` | 仅你在此项目 | 否（gitignored） | 个人覆盖、测试配置 |

### 优先级规则

当同一设置在多层出现时，**更具体的层级获胜**：

```
Managed（最高）> CLI 参数 > Local > Project > User（最低）
```

**关键规则**：

- **Managed 不可覆盖**：即使用 `--allowedTools` 也无法绕过 Managed 的 deny 规则
- **deny 优先于 allow**：若 User 层 allow，但 Project 层 deny，则被阻止
- **数组类设置合并**：`permissions.deny`、`sandbox.filesystem.allowWrite` 等数组类设置在各层之间是**合并**而非替换

### 各功能的配置位置

不同功能在各作用域的文件位置不同：

| 功能 | User 位置 | Project 位置 | Local 位置 |
|------|----------|-------------|-----------|
| Settings | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| Subagents | `~/.claude/agents/` | `.claude/agents/` | — |
| MCP Servers | `~/.claude.json` | `.mcp.json` | `~/.claude.json`（每项目段） |
| Plugins | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| CLAUDE.md | `~/.claude/CLAUDE.md` | `CLAUDE.md` 或 `.claude/CLAUDE.md` | `CLAUDE.local.md` 或 `.claude/CLAUDE.local.md` |
| Rules | `~/.claude/rules/` | `.claude/rules/` | — |

### /config 命令与 JSON Schema

交互式配置入口：

```bash
/config              # 打开分页设置界面
```

在 settings.json 顶部添加 `$schema` 可获得编辑器自动补全：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": { ... }
}
```

---

## 权限规则：细粒度控制

### 权限模型

Claude Code 的权限模型分三层：

| 工具类型 | 示例 | 默认需要批准？ | "是，不再询问" 的作用范围 |
|---------|------|------------|-----------------|
| 只读 | 文件读取、Grep | 否 | 不适用 |
| Bash 命令 | Shell 执行 | 是 | 每项目目录 + 命令，永久有效 |
| 文件修改 | Edit / Write | 是 | 仅当前会话 |

规则按 **deny → ask → allow** 顺序评估，第一个匹配的规则生效。这意味着 **deny 永远优先**。

### 规则语法：Tool 或 Tool(specifier)

#### 匹配所有使用

```json
{
  "permissions": {
    "allow": ["Bash"],       // 允许所有 Bash 命令
    "deny": ["WebFetch"]     // 禁止所有网络获取
  }
}
```

`Bash(*)` 等同于 `Bash`，匹配所有命令。

#### Bash 通配符

Bash 规则支持 `*` 通配符，可出现在任意位置：

| 规则 | 匹配 | 不匹配 |
|------|------|--------|
| `Bash(npm run build)` | 精确匹配 `npm run build` | `npm run test` |
| `Bash(npm run *)` | `npm run test`、`npm run lint` | `npm install` |
| `Bash(* --version)` | `node --version`、`python --version` | `node --help` |
| `Bash(git * main)` | `git checkout main`、`git merge main` | `git push origin dev` |

**空格敏感**：`Bash(ls *)` 匹配 `ls -la` 但不匹配 `lsof`；`Bash(ls*)` 两者都匹配。因为空格前缀的 `*` 强制单词边界。

**复合命令自动拆分**：批准 `git status && npm test` 时，Claude Code 会为 `npm test` 单独保存规则，未来 `npm test` 无论前面连什么都会被识别。单个复合命令最多保存 5 条规则。

**Shell 运算符感知**：`Bash(safe-cmd *)` 不会让 `safe-cmd && other-cmd` 获得权限，Claude Code 理解 `&&`、`||`、`;` 等运算符。

> **安全警告**：试图用 Bash 模式约束命令参数是脆弱的。例如 `Bash(curl http://github.com/ *)` 无法匹配 URL 前加选项、不同协议、重定向等变体。对于 URL 过滤，更推荐用 `WebFetch(domain:...)` 权限 + 沙箱网络隔离。

#### Read / Edit 路径规则

Read 和 Edit 规则遵循 **gitignore 规范**，有四种路径前缀：

| 前缀 | 含义 | 示例 |
|------|------|------|
| `//path` | 文件系统**绝对**路径 | `Read(//Users/alice/secrets/**)` |
| `~/path` | 相对**主目录** | `Read(~/Documents/*.pdf)` |
| `/path` | 相对**项目根目录** | `Edit(/src/**/*.ts)` |
| `path` 或 `./path` | 相对**当前目录** | `Read(*.env)` |

> **易错点**：`/Users/alice/file` 不是绝对路径！它相对于项目根目录。绝对路径必须用 `//`。

通配符区别：`*` 匹配单个目录中的文件，`**` 递归匹配目录。

> **重要限制**：Read/Edit 的 deny 规则仅适用于 Claude 的**内置文件工具**，不阻止 Bash 中的 `cat .env`。要实现 OS 级阻止，需启用沙箱。

#### WebFetch 域名匹配

```json
{
  "permissions": {
    "allow": ["WebFetch(domain:example.com)"],
    "deny": ["WebFetch(domain:evil.com)"]
  }
}
```

#### MCP 工具权限

```json
{
  "permissions": {
    "allow": ["mcp__github__create_issue"],        // 精确工具
    "deny": ["mcp__puppeteer"]                      // 整个服务器的所有工具
  }
}
```

格式：`mcp__<服务器名>__<工具名>`，用 `mcp__<服务器名>` 或 `mcp__<服务器名>__*` 匹配服务器所有工具。

#### Agent（Subagent）权限

```json
{
  "permissions": {
    "deny": ["Agent(Explore)"]    // 禁用 Explore 子代理
  }
}
```

也可通过 CLI 标志：`--disallowedTools 'Agent(Explore)'`。

### 实用配置示例

**前端项目**——允许常用命令，阻止敏感文件和危险操作：

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git diff *)",
      "Bash(git status *)",
      "Bash(git log *)",
      "Bash(git commit *)",
      "Bash(* --version)",
      "Bash(* --help *)"
    ],
    "deny": [
      "Bash(git push *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

**只读审查模式**——仅允许读取和分析，禁止一切修改：

```json
{
  "permissions": {
    "defaultMode": "plan",
    "deny": [
      "Edit",
      "Bash(rm *)",
      "Bash(git push *)"
    ]
  }
}
```

### 工作目录

默认情况下，Claude 只能访问启动它的目录。扩展方式：

| 方式 | 用法 | 持久性 |
|------|------|--------|
| CLI 参数 | `--add-dir ../docs` | 仅当前会话 |
| 交互命令 | `/add-dir ../docs` | 仅当前会话 |
| 设置文件 | `additionalDirectories: ["../docs"]` | 持久 |

> **注意**：额外目录仅授予**文件访问权限**，不会成为完整的配置根目录。大多数 `.claude/` 配置不会从额外目录加载，但 Skills 和部分插件设置例外。

---

## Auto Mode 深入

第四篇介绍了 Auto Mode 是六种权限模式之一——它使用后台分类器自动批准或拒绝操作。本节深入其配置机制。

### 分类器的工作方式

Auto Mode 的分类器模型会对每个工具调用进行评估：

```
用户请求 → Claude 决定调用工具 → 分类器评估 → 允许/拒绝/提示
```

分类器内部的优先级：

1. **soft_deny 规则**先阻止（如强制推送、数据泄露、`curl | bash`）
2. **allow 规则**作为例外覆盖 soft_deny
3. **显式用户意图**可覆盖两者——但必须是**直接且具体**的指令（"强制推送此分支"有效，"清理存储库"无效）

### 配置源限制

分类器**不从共享项目设置（`.claude/settings.json`）读取** `autoMode`，防止恶意仓库注入自己的 allow 规则。只从以下来源读取：

| 配置源 | 文件 | 用途 |
|--------|------|------|
| 个人设置 | `~/.claude/settings.json` | 个人信任的基础设施 |
| 项目本地设置 | `.claude/settings.local.json` | 每项目信任的存储桶/服务（gitignored） |
| 托管设置 | managed-settings.json 等 | 组织级强制信任基础设施 |

各来源的条目被**合并**。开发者可以用个人条目扩展 `environment`、`allow`、`soft_deny`，但不能删除托管设置提供的条目。

### 配置信任基础设施（environment）

对大多数组织，`autoMode.environment` 是**唯一需要设置的字段**。它用自然语言告诉分类器哪些是你的内部资源：

```json
{
  "autoMode": {
    "environment": [
      "Organization: Acme Corp. Primary use: software development",
      "Source control: github.example.com/acme-corp and all repos under it",
      "Cloud provider: AWS",
      "Trusted cloud buckets: s3://acme-build-artifacts",
      "Trusted internal domains: *.corp.example.com",
      "Key internal services: Jenkins at ci.example.com"
    ]
  }
}
```

条目是**散文描述**（不是正则表达式或工具模式），分类器将它们作为自然语言规则读取。按你向新工程师描述基础设施的方式编写即可。

**推荐渐进式配置**：

1. 先用默认值运行
2. 添加源代码控制组织和关键内部服务（解决最常见误报，如推送到自己的仓库被拦截）
3. 添加信任域和云存储桶
4. 其余在遇到阻止时按需填写

### 覆盖 allow 和 soft_deny

> **危险操作**：设置 `allow` 或 `soft_deny` 会**替换该部分的整个默认列表**！如果你只设置一条 `soft_deny`，所有内置阻止规则（强制推送、数据泄露、`curl | bash`、生产部署等）都会消失。

安全操作流程：

```bash
# 1. 查看完整默认规则
claude auto-mode defaults

# 2. 复制输出到设置文件，然后按需增删

# 3. 确认最终生效的规则
claude auto-mode config

# 4. 让 AI 审查你的自定义规则
claude auto-mode critique
```

示例——在默认规则基础上放宽 staging 部署：

```json
{
  "autoMode": {
    "environment": [
      "Source control: github.example.com/acme-corp"
    ],
    "allow": [
      "...copy full default allow list here first...",
      "Deploying to staging namespace is allowed: isolated from production, resets nightly"
    ],
    "soft_deny": [
      "...copy full default soft_deny list here first...",
      "Never run database migrations outside the migrations CLI"
    ]
  }
}
```

### 审查 Auto Mode 拒绝

当 Auto Mode 拒绝某个操作时：

1. 屏幕出现通知
2. 被拒绝的操作记录在 `/permissions` → **"最近拒绝"** 选项卡
3. 在被拒绝的操作上按 **`r`**，将其标记为"重试"
4. 退出对话框后，Claude Code 发消息告诉模型可以重试该操作

要以编程方式响应拒绝，可使用 `PermissionDenied` Hook。

### 禁用 Auto Mode

在任何 settings.json 中设置：

```json
{
  "disableAutoMode": "disable"
}
```

效果：从 `Shift+Tab` 循环中移除 `auto`，启动时拒绝 `--permission-mode auto`。在托管设置中设置最有效，因为用户无法覆盖。

---

## 沙箱化：OS 级纵深防御

### 为什么需要沙箱

权限系统控制 Claude 的**内置工具**可以做什么，但 Bash 子进程可以绕过——`cat .env` 不受 `Read(./.env)` deny 规则限制。沙箱提供 **OS 级强制执行**，限制所有 Bash 命令及其子进程的文件系统和网络访问。

| 安全层 | 作用对象 | 强制级别 | 覆盖范围 |
|--------|---------|---------|---------|
| 权限系统 | Claude 内置工具（Bash、Read、Edit、WebFetch、MCP） | 应用级 | 所有工具 |
| 沙箱 | Bash 命令及其子进程 | OS 级 | 仅 Bash |

两者是**互补**关系，推荐同时使用实现纵深防御。

### 沙箱的两大隔离

**文件系统隔离**：

- 默认写入：仅当前工作目录及子目录
- 默认读取：整个机器（除某些被拒绝目录）
- OS 级强制：macOS 用 Seatbelt，Linux 用 bubblewrap，所有子进程继承限制

**网络隔离**：

- 通过沙箱外的代理服务器控制
- 仅允许访问批准的域名
- 新域名请求触发权限提示
- 适用于所有子进程

### 启用与配置

```bash
/sandbox        # 交互式启用，显示依赖检查
```

**Linux 前置依赖**（macOS 开箱即用）：

```bash
# Ubuntu/Debian
sudo apt-get install bubblewrap socat

# Fedora
sudo dnf install bubblewrap socat
```

**两种沙箱模式**：

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| **Auto Allow** | 沙箱内命令自动批准，无法沙箱化的命令回退到权限流程 | 日常开发，追求效率 |
| **Regular Permissions** | 所有命令都走权限流程，沙箱仅提供 OS 级保护 | 高安全要求 |

Auto Allow 模式**独立于权限模式**运行——即使你不在 AcceptEdits 模式，沙箱化的 bash 命令也会自动执行。

### 沙箱设置速查

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "failIfUnavailable": false,
    "excludedCommands": ["docker", "git"],
    "allowUnsandboxedCommands": true,
    "filesystem": {
      "allowWrite": ["~/.kube", "/tmp/build"],
      "denyWrite": ["/etc", "/usr/local/bin"],
      "denyRead": ["~/.aws/credentials"],
      "allowRead": ["."]
    },
    "network": {
      "allowUnixSockets": ["~/.ssh/agent-socket"],
      "allowAllUnixSockets": false
    }
  }
}
```

路径前缀规则（注意与 Read/Edit 权限规则**不同**）：

| 前缀 | 沙箱中的含义 | Read/Edit 权限中的含义 |
|------|-----------|-----------------|
| `/path` | 绝对路径 | 项目根相对路径 |
| `~/path` | 主目录相对 | 主目录相对 |
| `./path` | 项目根相对 | 当前目录相对 |

> **逃生舱机制**：当命令因沙箱限制失败时，Claude 可能使用 `dangerouslyDisableSandbox` 参数在沙箱外重试，此时走常规权限流程。设置 `"allowUnsandboxedCommands": false` 可完全禁用此逃生舱。

### 沙箱不覆盖的内容

- **内置文件工具**（Read、Edit、Write）：由权限系统控制，不走沙箱
- **Computer Use**：在真实桌面运行，不在隔离环境
- **WebFetch**：有自己的域名权限控制

---

## Hooks 扩展权限评估

Hooks 是第七篇的重点，这里仅介绍其与权限系统的交互。

**PreToolUse Hook** 可在权限提示前运行自定义脚本来动态评估：

```
工具调用 → PreToolUse Hook → 权限规则评估 → 执行/拒绝
```

Hook 返回值的效果：

| Hook 返回 | 效果 | 与权限规则的关系 |
|----------|------|-------------|
| `"allow"` | 跳过提示 | deny/ask 规则**仍然生效**（deny 优先） |
| 退出码 2 | 阻止调用 | **优先于** allow 规则 |
| 其他 | 不影响 | 正常走权限流程 |

典型用途：允许所有 Bash 但用 Hook 阻止特定危险命令：

```json
{
  "permissions": { "allow": ["Bash"] },
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{ "type": "command", "command": "~/.claude/validate-bash.sh" }]
    }]
  }
}
```

---

## 托管设置：企业级管控

### 仅 Managed 生效的设置

以下设置只在 Managed 层有效，放在用户或项目设置中无效：

| 设置 | 用途 |
|------|------|
| `allowedChannelPlugins` | 频道插件白名单 |
| `allowManagedHooksOnly` | 仅允许 Managed Hooks |
| `allowManagedMcpServersOnly` | 仅允许 Managed MCP |
| `allowManagedPermissionRulesOnly` | 仅允许 Managed 权限规则 |
| `blockedMarketplaces` | 插件市场黑名单 |
| `channelsEnabled` | 启用频道功能 |
| `pluginTrustMessage` | 自定义插件信任警告 |
| `sandbox.filesystem.allowManagedReadPathsOnly` | 仅 Managed 读取路径 |
| `sandbox.network.allowManagedDomainsOnly` | 仅 Managed 网络域名 |
| `strictKnownMarketplaces` | 限制插件市场来源 |

### 部署方式

| 方式 | 平台 | 位置 |
|------|------|------|
| 服务器托管 | 通用 | Claude.ai 管理员控制台 |
| MDM | macOS | `com.anthropic.claudecode` preferences 域 |
| 注册表 | Windows | `HKLM\SOFTWARE\Policies\ClaudeCode` |
| 基于文件 | macOS | `/Library/Application Support/ClaudeCode/` |
| 基于文件 | Linux | `/etc/claude-code/` |
| 基于文件 | Windows | `C:\Program Files\ClaudeCode\` |

**Drop-in 目录**：`managed-settings.d/` 目录中的 `*.json` 文件按字母顺序合并，方便不同团队独立部署策略片段。使用数字前缀控制顺序（如 `10-telemetry.json`、`20-security.json`）。

---

## 分场景实战配置

### 个人开发者

场景：个人项目，追求效率，适度安全。

```json
// ~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(npm *)",
      "Bash(git diff *)",
      "Bash(git status *)",
      "Bash(git log *)",
      "Bash(git commit *)",
      "Bash(* --version)",
      "Bash(* --help *)"
    ],
    "deny": [
      "Bash(curl *)",
      "Bash(wget *)",
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

### 团队项目

场景：多人协作，需要统一标准，允许合理自由度。

```json
// .claude/settings.json（提交到 git）
{
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Bash(npm run *)",
      "Bash(npx vitest *)",
      "Bash(git diff *)",
      "Bash(git status)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash(git push --force *)",
      "Bash(rm -rf *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "filesystem": {
      "denyRead": ["~/.ssh", "~/.aws"]
    }
  }
}
```

### 企业 CI/CD

场景：无人值守，需要最大自动化 + 最严格安全。

```json
// managed-settings.json（IT 部署）
{
  "permissions": {
    "defaultMode": "dontAsk",
    "allow": [
      "Bash(npm run *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(curl *)",
      "Bash(wget *)",
      "WebFetch"
    ],
    "disableBypassPermissionsMode": "disable"
  },
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false
  },
  "allowManagedPermissionRulesOnly": true,
  "allowManagedHooksOnly": true
}
```

---

## 高频设置速查表

以下精选日常最常调整的设置项（完整列表见[官方文档](https://code.claude.com/docs/zh-CN/settings)）：

### 行为与偏好

| 设置键 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `model` | string | 覆盖默认模型 | `"claude-sonnet-4-6"` |
| `effortLevel` | string | 努力级别 | `"low"` / `"medium"` / `"high"` |
| `language` | string | 响应语言 | `"chinese"` |
| `outputStyle` | string | 输出风格 | `"Explanatory"` |
| `alwaysThinkingEnabled` | bool | 默认启用扩展思考 | `true` |

### 安全与权限

| 设置键 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `permissions.defaultMode` | string | 默认权限模式 | `"acceptEdits"` |
| `permissions.allow` | array | 允许规则列表 | `["Bash(npm *)"]` |
| `permissions.deny` | array | 拒绝规则列表 | `["Read(./.env)"]` |
| `disableAutoMode` | string | 禁用 Auto Mode | `"disable"` |
| `disableBypassPermissionsMode` | string | 禁用 Bypass 模式 | `"disable"` |

### 沙箱

| 设置键 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `sandbox.enabled` | bool | 启用沙箱 | `true` |
| `sandbox.autoAllowBashIfSandboxed` | bool | 沙箱内自动批准 | `true` |
| `sandbox.failIfUnavailable` | bool | 不可用时硬失败 | `true` |
| `sandbox.excludedCommands` | array | 沙箱外运行的命令 | `["docker"]` |
| `sandbox.filesystem.allowWrite` | array | 额外写入路径 | `["~/.kube"]` |

### 会话与清理

| 设置键 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `cleanupPeriodDays` | number | 非活跃会话清理周期 | `20` |
| `autoUpdatesChannel` | string | 更新渠道 | `"stable"` / `"latest"` |
| `includeGitInstructions` | bool | 系统提示含 Git 说明 | `true` |

---

## 安全最佳实践清单

基于官方安全指南，按场景整理：

### 处理敏感代码

- ✅ 批准前审查所有建议的更改
- ✅ 为敏感仓库使用项目级权限设置
- ✅ 启用沙箱并配置 `denyRead` 阻止敏感路径
- ✅ 使用 `/permissions` 定期审计权限设置
- ✅ 考虑使用 Devcontainer 获得额外隔离

### 防止提示注入

- ✅ 权限系统在任何操作前要求批准
- ✅ 不要直接将不受信任内容管道传给 Claude
- ✅ 验证对关键文件的修改建议
- ✅ 沙箱确保即使注入成功，也无法修改系统文件或泄露数据
- ✅ Web Fetch 使用独立上下文窗口，避免注入恶意提示

### 团队协作

- ✅ 用 Managed 设置强制执行组织标准
- ✅ 通过 `.claude/settings.json` 共享权限配置
- ✅ 用 OpenTelemetry 监控 Claude Code 使用情况
- ✅ 用 `ConfigChange` Hook 审计设置变更
- ✅ 用 `/bug` 报告可疑行为

---

## 常见问题

| 问题 | 答案 |
|------|------|
| 如何查看当前生效的所有权限？ | `/permissions` 命令，列出所有规则及来源 |
| allow 和 deny 冲突时谁赢？ | **deny 永远赢**，评估顺序 deny → ask → allow |
| Auto Mode 把正常操作拦截了怎么办？ | 在 `/permissions` "最近拒绝"选项卡按 `r` 重试，或配置 `autoMode.environment` |
| 沙箱和权限需要同时开吗？ | 推荐同时开，权限控制工具级，沙箱控制 OS 级，互补 |
| 项目设置会覆盖我的个人设置吗？ | 是的，Project 优先于 User（但 Local 优先于 Project） |
| `bypassPermissions` 真的跳过一切吗？ | 不，`.git`、`.claude`、`.vscode`、`.idea`、`.husky` 目录的写入仍需确认 |
| 如何在 CI 中完全无人值守？ | 用 `--permission-mode dontAsk` + 预配置 `allow` 规则 |
| 沙箱在 Docker 中能用吗？ | Linux 上需要 `enableWeakerNestedSandbox`，安全性会削弱 |
| settings.json 改了不生效？ | 检查优先级——更高层级可能覆盖了。用 `/config` 或 `claude auto-mode config` 查看实际生效值 |
| 如何阻止 Claude 读取 .env？ | 权限 `deny: ["Read(./.env)"]` + 沙箱 `denyRead: ["./.env"]`，双保险 |

---

## 小结

本篇系统梳理了 Claude Code 的安全与配置体系：

| 层级 | 机制 | 作用 |
|------|------|------|
| **设置系统** | 四层作用域 + 优先级 | 统一配置管理 |
| **权限规则** | deny → ask → allow + 工具特定语法 | 细粒度工具控制 |
| **Auto Mode** | 分类器 + 自然语言策略 | 智能自动批准 |
| **沙箱** | OS 级文件/网络隔离 | 纵深防御 |
| **Hooks** | PreToolUse 运行时评估 | 动态权限扩展 |
| **托管设置** | 不可覆盖的组织策略 | 企业级管控 |

安全配置的核心原则：**从最小权限开始，按需放宽，定期审计**。下一篇我们将进入 Claude Code 的扩展架构——Skills、Sub-agents、Agent Teams、Hooks、MCP 与 Plugins 的全景图。
