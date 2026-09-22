---
title: "BMad Method 项目上下文：把团队规则写进 AGENTS.md"
date: '2026-09-13'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - AGENTS.md
published: true
brief: >-
  项目上下文不该是代码目录说明书，而应记录 Agent 无法轻易推断、却容易造成高代价错误的团队规则。本文用 bmad-project-context 把测试、兼容性和 CLI 行为约定写进 AGENTS.md。
---

> AGENTS.md 记录的不是“仓库里有什么”，而是“哪些错误不能再犯”。

Task CLI 完成第一次 Build 后，仓库已经有真实代码、测试和用户行为。此时补充项目上下文，能让后续会话少猜几次。

## 什么值得写进 AGENTS.md

适合长期保留：

- Python 命令统一通过 `uv` 运行。
- 完整测试命令是 `uv run pytest`。
- CLI 正常输出写 stdout，错误写 stderr。
- JSON 存储格式必须兼容旧数据，或提供显式迁移。
- 用户可观察行为变化必须有测试。
- 测试未完整执行时，报告必须写明验证范围。

不必重复：

- 目录树和依赖列表。
- 代码中一眼能看出的类名、函数名。
- “变量名要有意义”这类通用建议。

判断标准很简单：删掉这条规则后，Agent 是否更容易做出代价高的错误？

## 让 bmad-project-context 保留高价值规则

在新的会话中输入：

```text
/bmad-project-context

请检查当前仓库的项目上下文。

需要记录的规则：
- Python 命令通过 uv 运行，测试命令是 `uv run pytest`。
- CLI 正常结果写 stdout，错误写 stderr。
- JSON 存储格式必须兼容旧数据。
- 用户可观察行为变化必须更新测试。
- 测试不完整时不得声称测试通过。

请先检查仓库，再展示准备写入 AGENTS.md 的完整区块。
```

当前版本会读取已有的 `AGENTS.md`、编辑器规则、项目配置和 CI，验证命令与路径，并在获得批准后写入 BMad 管理区块：

```markdown
<!-- bmad:context -->
项目特有的、经过验证的规则
<!-- /bmad:context -->
```

标记之外的手写内容不会被刷新覆盖。[Project Context 文档](https://docs.bmad-method.org/existing-codebases/set-and-maintain-project-context/)

## AGENTS.md、Override 和 central config

三者职责不同：

| 位置 | 适合放什么 |
| --- | --- |
| `AGENTS.md` | 整个仓库都要遵守的规则 |
| `_bmad/custom/<skill>.toml` | 某个 Agent 或 Workflow 的行为定制 |
| central config | 安装答案和模块级配置 |

同一条规则不要在三处重复维护。全仓库的测试和兼容性要求放 `AGENTS.md`；只有 Developer Agent 特有的提醒，才放进它的 `persistent_facts`。[Customize BMad](https://docs.bmad-method.org/customize/customize-bmad/)

## 写入后检查

```bash
git diff -- AGENTS.md
uv run pytest
```

确认没有删除手写规则，也没有把实现细节写成永久约束。共享规则应提交 Git；个人偏好应放在个人配置中。

旧教程里的 `bmad-generate-project-context` 和 `bmad-document-project` 已由 `bmad-project-context` 接替，新项目使用当前入口即可。
