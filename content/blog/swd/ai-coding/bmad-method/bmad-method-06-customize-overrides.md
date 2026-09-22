---
title: "BMad Method 定制：用 Override 注入团队研发规则"
date: '2026-09-17'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - 研发治理
  - AGENTS.md
published: true
brief: >-
  团队规则不该散落在每次提示词里，也不该直接改 BMad 安装目录。本文用 bmad-customize 说明 Agent Override、Workflow Override、三层合并和稀疏配置的边界。
---

> Override 的作用，是在默认能力上叠加团队规则，而不是复制一份 BMad。

## Agent Override：改变一个角色的长期行为

例如，让 Developer Agent 始终关注测试、CLI 输出和旧数据兼容：

```text
/bmad-customize

为 bmad-agent-dev 添加团队规则：
- 用户可观察行为变化前，先识别并更新测试。
- 不得跳过、禁用或删除已有测试。
- 测试未完整运行时，明确写“未完整验证”。
- CLI 变更检查退出码、stdout 和 stderr。
- 持久化格式变化验证旧数据兼容性。

这是团队规则。请创建稀疏 Override，并验证合并结果。
```

项目文件通常是：

```text
_bmad/custom/bmad-agent-dev.toml
```

## Workflow Override：改变一次流程的运行方式

为 `bmad-code-review` 增加 CLI 契约审查器时，检查公开参数、输出流、退出码、旧数据兼容和具体代码证据。具体字段以已安装 Skill 的 `customize.toml` 为准；v6.12 使用 `{diff_file}`，旧教程中的 `{diff_output}` 已废弃。

Agent Override 影响角色行为，Workflow Override 影响工作流行为。不要把一个 Story 的临时要求写成永久规则。

## 三层配置

```text
_bmad/custom/<skill>.user.toml   个人偏好
_bmad/custom/<skill>.toml        团队规则
Skill 自带 customize.toml        默认配置
```

优先级从上到下，团队配置应提交 Git，个人配置通常忽略。Override 只写要改的字段：复制整份默认配置，会把未来更新一起遮住。

全仓库规则放 `AGENTS.md`，单个 Agent 或 Workflow 的行为放 Override，安装答案和模块变量放 central config。三者不要重复维护同一条规则。[Customize BMad](https://docs.bmad-method.org/customize/customize-bmad/)

## 验证实际生效的配置

```bash
uv run _bmad/scripts/resolve_customization.py \
  --skill <已安装的 Skill 目录> \
  --project-root "$PWD" \
  --key agent
```

再开一个新会话，让目标 Agent 复述它必须遵守的规则，并观察这些规则是否真的影响了测试、输出流、退出码和兼容性检查。
