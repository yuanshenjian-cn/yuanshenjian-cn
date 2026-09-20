---
title: "OpenCode 提效配置手册：从权限到扩展能力"
date: '2026-09-19'
tags:
  - 软件开发
  - AI 编程
  - OpenCode
published: true
brief: >-
  OpenCode 的配置分为运行时、TUI、Agent、规则、Skills、MCP 和插件几个层次。内容以可维护和可回滚为目标，整理配置文件位置、上下文压缩、快照、权限、模型、Agent、格式化、LSP、MCP、插件和自定义命令，并给出一份适合项目起步的安全基线。
---

> 配置 OpenCode 时，先把“模型能做什么”说清楚，再考虑“模型还能接入什么”。权限和规则是工作流的一部分，不是最后才补的开关。

## 配置文件各管一层

OpenCode 支持 JSON 和 JSONC。JSONC 可以写注释和尾逗号，适合项目配置：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "provider/model-id"
}
```

常见文件位置：

| 文件或目录 | 作用 |
| --- | --- |
| ~/.config/opencode/opencode.json | 用户级运行时配置 |
| 项目根目录 opencode.json | 项目级运行时配置 |
| ~/.config/opencode/tui.json | 用户级 TUI 配置 |
| 项目根目录 tui.json | 项目级 TUI 配置 |
| ~/.config/opencode/agents/ | 用户级 Agent |
| .opencode/agents/ | 项目级 Agent |
| ~/.config/opencode/commands/ | 用户级自定义命令 |
| .opencode/commands/ | 项目级自定义命令 |
| ~/.config/opencode/skills/ | 用户级 Skills |
| .opencode/skills/ | 项目级 Skills |
| ~/.config/opencode/plugins/ | 用户级插件 |
| .opencode/plugins/ | 项目级插件 |

配置会合并，不是后一个文件完全替换前一个文件。标准顺序从远程组织配置、全局配置、环境变量指定的配置、项目配置，到 .opencode 目录和托管配置；冲突键由后面的来源覆盖。项目配置适合放进 Git，密钥不应写进去。

可以用环境变量指定文件或目录：

```bash
export OPENCODE_CONFIG=/path/to/custom-config.json
export OPENCODE_CONFIG_DIR=/path/to/custom-config-directory
export OPENCODE_TUI_CONFIG=/path/to/custom-tui.json
```

OPENCODE_CONFIG 指向一份运行时配置，OPENCODE_CONFIG_DIR 还会参与查找 agents、commands、modes 和 plugins。修改后可以用下面的命令检查解析结果：

```bash
opencode debug config
```

## 先处理上下文和回滚

### Compaction 只保留真正有用的历史

长会话会积累大量工具输出。OpenCode 默认可以在上下文接近上限时压缩：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "compaction": {
    "auto": true,
    "prune": false,
    "reserved": 10000
  }
}
```

auto 控制是否自动压缩，prune 控制是否移除较旧的工具输出，reserved 是压缩时保留的 token 缓冲。prune 并不应该盲目打开；如果后续任务经常依赖旧命令输出，过度清理会让模型重复读取文件。

手动压缩使用：

```text
/compact
```

### Snapshot 决定能否在会话内回滚

快照默认开启，用于记录 Agent 操作造成的文件变化：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "snapshot": true
}
```

大型仓库、子模块很多的项目可能因为快照索引产生额外磁盘和时间开销。可以设置 snapshot: false，但这样会失去 TUI 中的相关回滚能力。决定关闭前，先确认团队已有可靠的 Git 分支、提交和测试流程。

### 自动更新要和安装方式配套

OpenCode 默认会检查并下载更新，也可以关闭：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "autoupdate": "notify"
}
```

autoupdate 可以是 true、false 或 notify。notify 只提示有更新，不负责安装；使用 Homebrew 等包管理器安装时，自动更新行为还会受到安装方式限制。

## TUI 配置独立管理

TUI 的主题、快捷键、鼠标、滚动和通知写在 tui.json：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "opencode",
  "leader_timeout": 2000,
  "keybinds": {
    "leader": "ctrl+x",
    "command_list": "ctrl+p",
    "session_compact": "<leader>c",
    "model_list": "<leader>m",
    "agent_cycle": "tab"
  },
  "mouse": true,
  "scroll_speed": 3,
  "diff_style": "auto",
  "attention": {
    "enabled": false
  }
}
```

keybinds 会和内置默认值合并，只需要写要修改的快捷键。Leader 默认是 Ctrl+X，leader_timeout 控制按下 Leader 后等待下一键的时间。

滚动加速打开后会覆盖 scroll_speed。diff_style 可以使用 auto 或 stacked。mouse 设为 false 后，终端通常更容易选择和复制 TUI 中的文字。

attention 可以配置完成、询问、权限、错误和子 Agent 完成时的系统通知与声音。团队环境中先确认终端和操作系统的通知策略，再决定是否打开。

## 权限是最直接的提效手段

OpenCode 的 permission 值有三种：

| 值 | 行为 |
| --- | --- |
| allow | 自动执行 |
| ask | 执行前询问 |
| deny | 阻止执行 |

默认配置偏宽松。可以先收紧所有操作，再放开每天需要的命令：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "edit": "ask",
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "pnpm test*": "allow",
      "rm -rf *": "deny"
    }
  }
}
```

规则支持通配符，最后匹配项生效。bash 匹配的是解析后的命令，因此带参数的命令通常要写成 git diff* 或 pnpm test*，只写 git diff 可能覆盖不到实际调用。

external_directory 用于控制工作区之外的路径：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "external_directory": {
      "~/projects/shared/**": "allow"
    },
    "edit": {
      "~/projects/shared/**": "deny"
    }
  }
}
```

用户级配置的 .env 文件默认会受到读取保护。不要为了方便把所有外部目录和所有 Bash 命令设为 allow；那会把提效配置变成不可见的风险放大器。

CLI 的 auto 模式可以自动批准没有显式 deny 的询问：

```bash
opencode --auto
opencode run --auto "运行测试并修复失败用例"
```

auto 不会覆盖 deny。它更适合隔离环境或权限规则已经写清楚的自动化任务。

## Provider 和模型配置

OpenCode 通过 provider、model 和 small_model 选择模型：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {},
  "model": "provider/model-id",
  "small_model": "provider/small-model-id"
}
```

凭据可以通过 TUI 的 /connect 或 CLI 的 auth 命令管理：

```bash
opencode auth login
opencode auth list
opencode auth logout
```

可用模型列表来自已连接的 provider：

```bash
opencode models
opencode models --refresh
```

provider 的能力并不完全相同。超时、流式响应、缓存、图片和推理参数都可能有自己的限制。需要覆盖请求超时时，可以在 provider 的 options 中设置：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "provider-id": {
      "options": {
        "timeout": 600000,
        "headerTimeout": 300000,
        "chunkTimeout": 30000
      }
    }
  }
}
```

模型 ID 不应写在共享项目配置中，除非团队确实希望固定它。更稳妥的方式是项目只保存 provider 无关的 Agent 和权限，个人在全局配置中选择模型。

## Agent 配置从职责开始

OpenCode 内置 Build、Plan 两个 primary agent，以及 General、Explore、Scout 三个 subagent。自定义 Agent 主要用这些字段：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "review": {
      "description": "Review code without making changes",
      "mode": "subagent",
      "model": "provider/model-id",
      "temperature": 0.1,
      "steps": 8,
      "permission": {
        "edit": "deny",
        "bash": "ask",
        "webfetch": "allow"
      }
    }
  }
}
```

description 让主 Agent 知道何时委派，mode 决定使用方式，model 覆盖模型，steps 限制工具操作轮数，permission 负责真正的能力边界。prompt 可以引用配置文件所在目录下的文本：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "review": {
      "description": "Review code",
      "prompt": "{file:./prompts/review.txt}"
    }
  }
}
```

subagent 未指定 model 时，默认继承调用它的 primary agent 的模型。default_agent 只能设置为 primary。subagent_depth 默认是 1，可以避免子 Agent 无限制嵌套。

新配置优先使用 permission。permission 可以按工具名称和工具输入进行细分，适合为 Bash 命令建立可读的 allowlist。

## Rules 和 Skills 让上下文可复用

项目规则通常放在根目录 AGENTS.md 中。/init 会扫描项目并生成或更新它，内容适合包括：

- 构建、Lint、测试命令；
- 目录结构和模块边界；
- 代码风格、命名和错误处理；
- 需要遵守的操作顺序；
- 生成文件、环境变量和已知限制。

还可以通过 instructions 引用其他规则：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "CONTRIBUTING.md",
    "docs/rules/*.md"
  ]
}
```

Skills 使用目录中的 SKILL.md，项目级路径是 .opencode/skills/name/SKILL.md，全局路径是 ~/.config/opencode/skills/name/SKILL.md。Skills 会被模型按需加载，适合写可复用的领域知识和工作流，而不是写某一次任务的临时要求。

OpenCode 还兼容 .claude/skills/ 和 .agents/skills/。多个来源出现同名 Skill 时，要避免内容重复和优先级不清。

## MCP 只接入需要的工具

本地 MCP：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "local-tools": {
      "type": "local",
      "command": ["npx", "-y", "example-mcp"],
      "environment": {
        "EXAMPLE_TOKEN": "{env:EXAMPLE_TOKEN}"
      },
      "timeout": 5000
    }
  }
}
```

远程 MCP：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "remote-docs": {
      "type": "remote",
      "url": "https://example.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:REMOTE_TOKEN}"
      }
    }
  }
}
```

远程服务支持 OAuth 时，OpenCode 可以处理认证和令牌保存：

```bash
opencode mcp list
opencode mcp auth remote-docs
opencode mcp logout remote-docs
```

MCP 的每个工具都会增加模型上下文。启用前先确认工具数量、网络范围、凭据来源和失败时的行为；一个只用于偶尔查资料的 MCP，不一定值得在每个项目中常驻。

## Plugins、Formatters 和 LSP

插件可以从本地目录或 npm 加载：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "example-plugin",
    "@example/team-plugin"
  ]
}
```

Formatter 和 LSP 默认不必启用。需要时可以使用内置配置：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "formatter": true,
  "lsp": true
}
```

也可以只禁用某个内置实现：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "formatter": {
    "prettier": {
      "disabled": true
    }
  },
  "lsp": {
    "typescript": {
      "disabled": true
    }
  }
}
```

插件、Formatter 和 LSP 都可能执行本地命令或读取工作区。启用后要把它们当作代码依赖和权限主体审查。

## 自定义命令让重复任务变短

项目级命令放在 .opencode/commands/，例如 test.md：

```markdown
---
description: Run the focused test suite
agent: build
---

运行与当前改动相关的测试。
先识别测试命令，再执行并解释失败原因。
```

也可以在 opencode.json 中定义：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "test": {
      "template": "运行与当前改动相关的测试，并解释失败原因。",
      "description": "Run focused tests",
      "agent": "build"
    }
  }
}
```

在 TUI 中输入 /test 即可调用。命令模板适合稳定动作，具体文件和验收条件仍然应该由当前 prompt 提供。

## 一份适合项目起步的基线

下面的配置偏保守，先让读取和搜索自动通过，修改和命令执行前询问：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "compaction": {
    "auto": true,
    "prune": false,
    "reserved": 10000
  },
  "snapshot": true,
  "share": "manual",
  "permission": {
    "*": "ask",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "edit": "ask",
    "bash": "ask",
    "webfetch": "ask",
    "websearch": "ask"
  },
  "subagent_depth": 1
}
```

这不是所有项目的通用答案。安全要求高的项目可以进一步拒绝外部目录、网络访问和危险命令；个人实验项目可以放宽，但应该明确知道放宽了什么。

## 排查配置问题

遇到模型或工具异常时，可以按下面的顺序缩小范围：

1. 用 opencode debug config 检查最终配置；
2. 用 opencode auth list 确认 provider 凭据；
3. 用 opencode models --refresh 确认模型 ID；
4. 检查 Agent 的 mode、permission 和 model；
5. 暂时关闭插件、MCP、Formatter 或 LSP，判断是否是扩展引起；
6. 查看 TUI 和 CLI 是否加载了不同的配置文件。

配置的目标不是把 OpenCode 变成另一个固定产品，而是让项目规则、模型选择、工具权限和验证动作都可见、可调整、可回滚。

## 官方参考

- [OpenCode Config](https://opencode.ai/docs/config/)
- [OpenCode Permissions](https://opencode.ai/docs/permissions/)
- [OpenCode Agents](https://opencode.ai/docs/agents/)
- [OpenCode TUI](https://opencode.ai/docs/tui/)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers/)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Commands](https://opencode.ai/docs/commands/)
