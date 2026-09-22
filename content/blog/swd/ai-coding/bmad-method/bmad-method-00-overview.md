---
title: "BMad Method 是什么：从 AI 编程工作流到研发体系"
date: '2026-09-11'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - 敏捷
  - 研发治理
published: true
brief: >-
  BMad Method 不是模型，也不是 IDE，而是一套建立在敏捷实践上的 AI 研发协作方法。它通过 Agent、Workflow、Skill、Module 和可追踪产物，让需求、架构、实现、审查与验收保持连续。本文简要说明 BMad 的全称、架构、理念、适用范围和版本演进。
---

> BMad 的核心价值，是让 AI 在持续参与研发时保持上下文、决策和证据的连续。

这篇是 BMad Method 实战系列的序章。后续文章会用 Task CLI 展开具体实践。

> [打开 BMad 架构与协作交互图（HTML 版）](/interactive/bmad-method/overview.html)

## BMad 是什么

BMad 的全称是 **Breakthrough Method of Agile AI-driven Development**，即“敏捷 AI 驱动开发的突破性方法”。

BMad Method 是建立在敏捷实践上的开源、可定制 Agent 与 Workflow 集合，覆盖意图澄清、规划、架构、实现和验证。[官方方法介绍](https://www.bmadcode.com/method)将它定位为一套让人保留判断、让 AI 承担协作与执行的开发方法。

它不是模型、IDE 或单一命令，而是运行在 AI 编程工具之上的研发方法。

| 名称 | 含义 |
| --- | --- |
| BMad Method / BMM | 软件研发主模块，提供研发阶段、Agent、Workflow 和 Skill |
| BMad Builder / BMB | 创建、验证和分发自定义 Agent、Workflow 与 Module |
| Skill | 在 AI 编程工具中调用的能力入口，如 `bmad-build`、`bmad-spec` |
| Module | 组织一组 Skill、配置和帮助注册信息的可安装单元 |

## 架构：模块、Skill 与产物

BMad 可以用三层理解：

| 层次 | 职责 | 示例 |
| --- | --- | --- |
| AI 编程工具 | 提供会话、文件、命令和模型调用 | Claude Code、Codex、Cursor |
| BMad Skill | 接入 Agent、Workflow 或独立工具能力 | `bmad-build`、`bmad-spec` |
| BMad 方法 | 规定上下文、决策、产物和验证如何衔接 | Spec、Story、Review、Retro |

Skill 是入口，Agent、Workflow、Task 和 Tool 是不同的能力形态；Module 负责组织、配置和分发这些能力。

产物链可以概括为：

```text
意图
  ↓
Spec / PRD / UX / Architecture
  ↓
Epic / Story / stories.yaml
  ↓
代码 / 测试 / Review / 实现记录
  ↓
Retro / Verdict / Action Items
```

这些产物让新的会话能够回到明确的需求、约束和证据，而不是只依赖聊天摘要。

## 四个阶段

| 阶段 | 关注点 | 常见产物 |
| --- | --- | --- |
| Analysis | 问题、方向和证据 | Brief、PRFAQ、Research |
| Planning | 产品目标和需求契约 | PRD、SPEC.md |
| Solutioning | UX、架构和 Epic 协调 | DESIGN.md、Architecture、Epics |
| Implementation | 单元实现、审查和 Epic 验收 | Code、Tests、Review、Retro |

四个阶段是可伸缩的上下文层次，不是所有任务都必须完整经过的审批链。小改动可以直接进入 Build；大型变更才需要更多规划产物。[官方 Workflow Map](https://docs.bmad-method.org/workflow-map-diagram.html)

## 核心理念

- **人保留判断**：产品目标、架构取舍、开放问题和验收结论不能交给 Agent 猜测。
- **上下文有来源**：需求、约束、代码、测试和 Review 结果分别承担不同证明责任。
- **流程匹配风险**：小任务少些仪式，大任务增加规划、协调和验证。
- **小批量交付**：一个 Story 是可实现、可审查、可验证的工作单元。
- **规则可以定制**：官方 Skill 负责通用流程，`AGENTS.md`、Override 和自定义 Module 承载项目差异。

## BMad 适合什么场景

- AI 需要跨多个会话参与同一个功能或 Epic。
- 需求、架构、实现和验收需要保持可追踪。
- AI 生成代码的速度已经超过团队审查和验证能力。
- 项目存在安全、合规、回滚或发布约束。
- 团队希望把成熟做法封装成 Skill，并用 Eval 检验边界。

BMad 不能替代产品判断、架构决策和真实用户反馈，也不适合给几分钟即可审完的低风险修改套上完整 Epic 流程。

## 版本演进

| 阶段 | 变化 |
| --- | --- |
| v4（2025） | 形成 npm 安装、模块化和跨工具分发框架 |
| v6 Alpha / Beta（2025 年末至 2026 年初） | Skill 命名、安装器、`bmad-help` 和模块生态逐步统一 |
| v6.11（2026-08） | Quick Dev 主线收敛为 `bmad-build`，旧实施入口进入迁移期 |
| v6.12（2026-09） | Build 按调查结果决定流程深度，Review 强化证据化分流 |

详细变化见官方 [Releases](https://github.com/bmad-code-org/BMAD-METHOD/releases) 和 [CHANGELOG](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/CHANGELOG.md)。

## 一句话理解

BMad 给人和 AI 之间的协作增加了一套可伸缩的上下文、决策和证据结构。后续系列会在这个框架上加入 Build、Spec、Story、Review、Retro、Override、Skill、Eval 和 Module。

官方资料：

- [BMad Method README](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/README.md)
- [BMad Method](https://www.bmadcode.com/method)
- [BMad Workflow Map](https://docs.bmad-method.org/workflow-map-diagram.html)
- [Skills Reference](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/reference/commands.md)
