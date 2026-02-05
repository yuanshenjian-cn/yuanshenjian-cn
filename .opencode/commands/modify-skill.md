---
agent: build
description: 修改已有的Agent Skill
---

<SkillName>
  $ARGUMENTS
</SkillName>

## 你的任务
修改现有的 Claude Code/OpenCode skill。支持通过参数指定 skill，或从列表中选择，然后根据用户的修改描述智能更新 skill 文件。

## 执行流程

### 1. 获取目标 Skill

**检查用户是否提供 skill 名称参数{SkillName}** ：
- **已提供** → 使用该名称作为目标 skill
  - 验证 skill 是否存在（检查 `.opencode/skills/{SkillName}/SKILL.md`）
  - 存在 → 进入步骤 2
  - 不存在 → 提示 skill 不存在，列出所有可用 skill 让用户重新选择

- **未提供** → 列出所有可用 skill 供用户选择
  - 使用 `Glob` 扫描 `.opencode/skills/**/SKILL.md`
  - 提取所有 skill 名称
  - 使用 `question` 工具展示选择列表
  - 用户选择后进入步骤 2，{SkillName}则为用户所选择的值

**Skill 列表示例**：
```
请选择要修改的 skill：
[ ] blog-writer              - 智能博客写作助手
[ ] sequence-diagram-generator - 将 Mermaid 时序图转换为图片
[ ] ddd-coding-standards     - DDD 分层架构代码规范
```

### 2. 获取修改描述

**使用 `question` 工具询问用户**：
```
已选择 skill：{skill-name}

请描述您希望如何修改此 skill：
（例如：添加对 Vue 文件的支持、修改执行流程第二步、更新示例代码等）
```

**收集用户输入的修改需求**

### 3. 读取现有 Skill 文件

**读取目标文件**：`.opencode/skills/{SkillName}/SKILL.md`

**分析当前内容**：
- Frontmatter 字段（description, argument-hint, allowed-tools 等）
- 主要章节结构
- 核心指令和流程
- 使用示例

### 4. 智能更新 Skill

**根据用户修改描述执行更新**：

**可能的修改类型**：
1. **修改描述** → 更新 frontmatter description
2. **添加功能** → 在对应章节添加新内容
3. **修改流程** → 更新执行步骤
4. **更新示例** → 修改使用示例
5. **添加工具** → 更新 allowed-tools
6. **调整参数** → 修改 argument-hint

**更新原则**：
- 保持原有结构和格式
- 仅修改用户指定的部分
- 确保 frontmatter 语法正确
- 维护章节完整性

### 5. 确认修改内容

**向用户展示修改预览**：
```
即将对 skill "{SkillName}" 进行以下修改：

【修改摘要】
- 修改了 frontmatter 中的 description
- 在"执行流程"章节添加了新步骤
- 更新了使用示例

【关键变更预览】
{展示修改前后的对比或摘要}

是否确认保存？
[确认保存] [继续修改] [取消]
```

**处理用户反馈**：
- 确认保存 → 进入步骤 6
- 继续修改 → 返回步骤 2，允许补充更多修改
- 取消 → 结束流程，不保存任何更改

### 6. 保存更新

**备份原文件**：将原 SKILL.md 备份为 `SKILL.md.bak`

**写入更新后的内容**

**完成通知**：
```
✅ Skill "{skill-name}" 更新成功！

文件位置：.opencode/skills/{skill-name}/SKILL.md
备份位置：.opencode/skills/{skill-name}/SKILL.md.bak

修改内容：
- {修改点 1}
- {修改点 2}
...
```

## 质量标准

- 保留原有 frontmatter 结构
- 维持章节逻辑完整性
- 仅修改用户明确指定的部分
- 自动创建备份，支持回滚
- 更新后保持 Markdown 格式规范

现在开始修改 skill。
