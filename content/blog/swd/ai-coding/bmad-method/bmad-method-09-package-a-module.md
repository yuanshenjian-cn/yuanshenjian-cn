---
title: "BMad Module：把多个 Skill 打包成可分发能力"
date: '2026-09-20'
tags:
  - 软件开发
  - AI 编程
  - BMad Method
  - BMad Builder
  - 研发治理
published: true
brief: >-
  Module 把多个 Skill 组织成可安装、可发现、可配置的能力包。本文用 aidev-risk-gate 和 aidev-delivery-report 演示 IM、Workflow Builder、CM、VM 及干净项目安装，明确哪些是示意流程，哪些需要真实验证。
---

> Skill 解决一个问题，Module 负责让一组能力可以被安装、发现和维护。

`aidev-risk-gate` 负责实现前的客户风险评估。再增加一个 `aidev-delivery-report`，读取 Spec、Story 记录、Review 和 Retro，生成客户交付报告；它只汇总证据，不重新审查代码。

## 先确定两个 Skill 的边界

模块名为 `AI Delivery Governance`，代码为 `aidev`。结构可以是：

```text
ai-delivery-governance/
└── skills/
    ├── aidev-risk-gate/
    └── aidev-delivery-report/
```

结构还不稳定时，用 Module Builder 的 IM 先确定愿景、能力、配置项和依赖；两个 Skill 本身用 Workflow Builder 构建。

## 用 CM 打包

```text
/bmad-module-builder

请将以下目录打包为多 Skill Module：
<绝对路径>/ai-delivery-governance/skills
```

多 Skill 模块通常会生成 Setup Skill：

```text
skills/
├── aidev-risk-gate/
├── aidev-delivery-report/
└── aidev-setup/
    ├── SKILL.md
    ├── assets/module.yaml
    ├── assets/module-help.csv
    └── scripts/
```

`module.yaml` 保存模块身份和配置变量；`module-help.csv` 让 `bmad-help` 发现能力；`marketplace.json` 负责分发路径。具体目录以 Builder 的实际输出为准。[Build Your First Module](https://bmad-builder-docs.bmad-method.org/tutorials/build-your-first-module/)

## 用 VM 验证模块

```text
/bmad-module-builder

验证以下 Module：
<绝对路径>/ai-delivery-governance/skills
```

VM 检查结构、引用、Help 条目、配置变量和描述质量。目录看起来完整，不能替代真实 VM 结果；文章中的目录和命令是示意流程。

## 在干净项目里安装

```bash
npx bmad-method install \
  --directory /path/to/clean-test-project \
  --modules bmm \
  --custom-source /path/to/ai-delivery-governance \
  --tools <tool-id> \
  --yes
```

安装后运行：

```text
/aidev-setup
/bmad-help
```

确认 `aidev-risk-gate` 和 `aidev-delivery-report` 能被发现，输入文件缺失时会明确提示，升级或重复安装也不会破坏其他 Module。

## 发布前检查

- Skill 名称、触发条件和输出路径稳定。
- 没有客户机密、Token 或真实业务数据。
- 两个 Skill 都有 Artifact Eval 和 Trigger Eval。
- VM 和干净项目安装都实际运行过。
- README 说明依赖、配置和数据边界。
- 发布使用 Git tag 或明确版本，而不是永远跟随主分支。

到这里，BMad 的原生流程和扩展方式就连起来了：方法负责研发协作，Skill 负责具体能力，Eval 负责回归，Module 负责分发。[What Are BMad Modules?](https://bmad-builder-docs.bmad-method.org/explanation/what-are-modules/)
