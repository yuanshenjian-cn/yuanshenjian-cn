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
  BMad Method 不要求每个改动都走一套重流程。本文用 Python 待办事项 CLI 做训练项目，带你安装 BMad v6.12.0、辨认稳定版与预发布渠道，并用 bmad-build 完成一次小型 Build。重点放在如何判断任务规模、审批计划、实际运行测试和保存实现证据。
---

> BMad 的入门重点不是记住一串命令，而是学会让流程深度匹配变更风险。

这是一组十篇文章组成的 BMad Method 实战系列。序章先解释 BMad 的概念和架构；从这篇开始，贯穿全系列的练习项目是一个 Python 待办事项 CLI：先完成添加、查看、完成任务，再为它规划标签 Epic，最后把客户研发治理规则做成可复用的 Skill 和 Module。

当前基线是 BMad Method v6.12.0。v6.11 已经把 Quick Dev 的主入口收敛为 `bmad-build`，并把 `bmad-generate-project-context` 等旧能力迁移到 `bmad-project-context`；`bmad-dev-story` 和 `bmad-create-story` 也不再是 Spec-backed Epic 的实施主线。v6.12 又调整了 Build 的轻量路径和 Review 的证据记录。旧教程里的命令即使还能通过兼容转发工作，也不应该继续作为新项目的默认写法。

## 先把稳定版安装在可复现的目录里

BMad 的安装器需要 Node.js 20.12 或更高版本。`bmad-build` 等部分工作流还会通过 `uv` 运行 Python。先检查本机环境：

```bash
node --version
npm --version
uv --version
git --version
```

创建一个干净实验目录，并让 Git 记录后续变化：

```bash
mkdir bmad-learning-lab
cd bmad-learning-lab
git init
```

先查看当前安装器支持哪些 AI 编程工具：

```bash
npx bmad-method install --list-tools
```

交互式安装时，选择 `bmm` 作为研发流程，选择 `bmb` 作为后续创建 Skill 和 Module 的 Builder，再选择你实际使用的 AI 编程工具。默认选择稳定渠道即可：

```bash
npx bmad-method install
```

预发布渠道适合参与 BMad 开发或验证新功能，不适合作为客户项目的默认基线：

```bash
npx bmad-method@next install
```

安装完成后，项目中通常会出现 `_bmad/`，以及由安装器为具体工具生成的 Skill 目录。目录名称随工具变化，不要把某一个工具的路径当成固定约定。

## 用 bmad-help 验证安装，而不是只看安装器退出

重新打开 AI 编程工具，在实验目录中运行：

```text
/bmad-help 我刚安装完 BMad，请检查安装状态并告诉我有哪些可用能力。
```

至少检查三件事：

- AI 工具能识别 `bmad-help`。
- 帮助结果里能找到 `bmad-build`、`bmad-spec` 等本次要用的能力。
- `_bmad/_config/manifest.yaml` 存在，且没有未处理的 `uv` 或 Skill 加载警告。

如果 Skill 没出现，先重启 AI 工具或重新加载窗口，再回头检查安装器最后打印的目标目录。安装器退出码为 0 只能说明安装过程结束，不能说明当前工具已经加载了全部能力。

## 第一个练习故意保持在一次 Build 的范围内

我们不先写 PRD、架构和 Story，而是先实现一个边界清晰的小功能：本地 Python 3 待办事项 CLI。

它只需要四个用户动作：添加任务、查看任务、完成任务，以及用 `--db` 指定测试用 JSON 文件。它不访问网络，不引入数据库，也不加入标签、优先级和截止日期。

在新的 AI 会话中运行：

```text
/bmad-build

在当前空仓库中实现一个 Python 3 待办事项 CLI。

功能：
1. `task add "内容"`：添加任务。
2. `task list`：按创建顺序列出任务。
3. `task done <id>`：完成指定任务。
4. 数据保存在本地 JSON 文件。
5. 支持通过 `--db <path>` 指定存储文件，便于测试。
6. 不访问网络。
7. 使用 pytest 编写自动化测试。
8. 使用 uv 管理和运行项目。

约束：
- 不加入标签、优先级、截止日期。
- 不引入数据库和 Web 框架。
- 错误信息输出到 stderr，正常结果输出到 stdout。
- 非法任务 ID 返回非零退出码。
```

## 观察 Build 如何决定流程深度

当前 `bmad-build` 的价值在于它会先调查，再决定需要多少仪式。一个典型运行大致经过：

```text
调查仓库
→ 解析意图和已有上下文
→ 检查意图缺口、不可逆操作和变更范围
→ 按风险决定轻量 Spec 或完整计划
→ 请求计划批准
→ 实现、测试、独立审查和修复
→ 保存实现记录并提交本地变更
```

这次练习属于轻量路径：目标单一，文件数量少，没有跨系统协调，也没有数据迁移。官方文档把典型单元描述为一个目标、少量文件和大约数百行生产代码。它不是“越小越不用想”，而是把思考集中在真正会改变结果的选择上。

计划出现后，不要只回复“继续”。至少核对这些问题：

- CLI 参数和子命令是否与请求一致。
- JSON 中的任务 ID 是否稳定，重复执行 `done` 会怎样。
- 数据文件不存在或 JSON 损坏时，错误如何反馈。
- 测试是否检查退出码、stdout 和 stderr。
- 计划有没有偷偷引入 Web 服务、数据库或本次不需要的领域字段。

如果计划把一个本地 CLI 扩大成服务端应用，先要求它回到原始范围。计划阶段的返工成本比实现后拆除错误架构低得多。

## 用实际命令验收，不照抄 Agent 的总结

Build 完成后，打开它列出的文件和 Git diff，再亲自运行测试与关键路径：

```bash
uv run pytest
uv run task --db /tmp/bmad-task-lab.json add "学习 bmad-build"
uv run task --db /tmp/bmad-task-lab.json list
uv run task --db /tmp/bmad-task-lab.json done 1
```

再验证一个错误路径：

```bash
uv run task --db /tmp/bmad-task-lab.json done 999
echo $?
```

你要看到的是实际测试退出码、测试数量、三次命令之间数据确实保留，以及非法 ID 返回非零退出码。若测试没有运行、依赖缺失、审查被降级或只完成了部分行为，结论应写成“未验证”或“部分验证”。

这次练习的产物不只有代码：还应有测试、可审查的 Git 变更，以及 BMad 写下的实现记录。它们会成为下一篇接入项目上下文时的真实输入。

## 这一步适合谁，不适合谁

如果你的任务只有一个清晰目标，影响文件很少，而且能在一次会话中完成，直接从 `bmad-build` 开始通常最省力。

如果需求包含多个独立能力、需要多次实现，或者会改变共享数据模型，就不要把整段需求塞进一次 Build。下一步应该先用 `bmad-spec` 写下共同契约，再按 Story 分批实现。

官方资料：

- [BMad Method v6.12.0 Release](https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.12.0)
- [Install BMad](https://docs.bmad-method.org/start/install-bmad/)
- [Build a Change](https://docs.bmad-method.org/build/build-a-change/)
