---
title: "BMad Method 实战入门：从安装到第一次 Build"
date: '2026-09-12'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - 敏捷
published: true
brief: >-
  小任务不需要完整的研发仪式。本文用 Python 待办事项 CLI 体验 BMad v6.12.0 的安装和第一次 bmad-build，重点说明如何判断任务规模、审批计划，并用真实命令验证结果。
---

> 小任务直接 Build，大任务先建立共同契约。

## 什么时候直接用 bmad-build

一个目标、少量文件、没有跨系统协调的改动，通常适合直接运行 `bmad-build`。它会先调查仓库，再决定需要多少规划；简单任务可以在同一会话完成，复杂任务则会要求更完整的计划。

这次练习只做一个本地 Python 3 待办事项 CLI：添加任务、查看任务、完成任务，数据保存到 JSON 文件。不做标签、优先级、截止日期、数据库或网络访问。

## 安装稳定版

先检查环境：

```bash
node --version
npm --version
uv --version
git --version
```

创建实验目录：

```bash
mkdir bmad-learning-lab
cd bmad-learning-lab
git init
```

查看工具 ID 并安装 BMM、BMB 和当前使用的 AI 编程工具：

```bash
npx bmad-method install --list-tools
npx bmad-method install
```

本系列以 BMad Method v6.12.0 为基线。需要复现同一环境时，还要保存 `_bmad/_config/manifest.yaml` 中的安装器和外部模块版本；只重复运行“最新稳定版”命令，未来得到的版本可能不同。[安装文档](https://docs.bmad-method.org/start/install-bmad/)

安装后运行：

```text
/bmad-help 检查当前 BMad 安装，并列出可用能力。
```

## 用一个小需求体验 Build

在新的 AI 会话中输入：

```text
/bmad-build

在当前空仓库中实现一个 Python 3 待办事项 CLI。

- `task add "内容"` 添加任务
- `task list` 按创建顺序列出任务
- `task done <id>` 完成任务
- 数据保存到本地 JSON 文件
- 支持 `--db <path>`，便于测试
- 使用 uv 管理项目，使用 pytest 编写测试
- 不访问网络，不引入数据库和 Web 框架
- 正常结果写 stdout，错误写 stderr；非法 ID 返回非零退出码
```

计划出现后，重点看三件事：命令语法是否符合需求，JSON 数据和错误行为是否说清楚，测试是否覆盖退出码与 stdout/stderr。计划扩大成 Web 服务或数据库时，应先收回范围。

## Build 的价值在于先判断，再动手

一次典型的 `bmad-build` 会调查代码和上下文，识别意图缺口、不可逆操作与变更范围，然后选择轻量或完整路径。实现结束后，它还会审查当前改动并保存实现记录。[Build a Change](https://docs.bmad-method.org/build/build-a-change/)

这不是让每个小改动都变慢，而是把人工注意力放到真正会改变结果的选择上。

## 用真实命令验收

不要只看 Agent 的总结：

```bash
uv run pytest
uv run task --db /tmp/bmad-task-lab.json add "学习 bmad-build"
uv run task --db /tmp/bmad-task-lab.json list
uv run task --db /tmp/bmad-task-lab.json done 1
uv run task --db /tmp/bmad-task-lab.json done 999
echo $?
```

需要确认测试实际运行、数据跨命令保留、非法 ID 返回非零退出码。测试没有完整执行时，只能报告“未完整验证”。

## 什么时候应该先写 Spec

需求包含多个独立能力、会改共享数据模型、需要多次会话或涉及多个系统时，先用 `bmad-spec` 建立契约，再按 Story 实现。`bmad-build` 适合一个实现单元，不负责替你管理整个 Epic。

官方资料：

- [Install BMad](https://docs.bmad-method.org/start/install-bmad/)
- [Build a Change](https://docs.bmad-method.org/build/build-a-change/)
- [BMad Method v6.12.0 Release](https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.12.0)
