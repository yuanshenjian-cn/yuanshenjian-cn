---
agent: build
description: 创建新的Agent skill
---

<SkillDescription>
  $ARGUMENTS
</SkillDescription>

## 你的任务
基于用户提供的功能描述{SkillDescription}，自动提炼技能名称和功能说明，经过用户确认后创建技能文件。

## 执行流程

### 1. 获取功能描述

**检查用户是否提供描述参数 {SkillDescription}**：
- 已提供 → 使用提供的{SkillDescription}作为功能说明
- 未提供 → 使用 `question` 工具提示用户输入功能描述

### 2. 提炼技能信息

**根据功能描述智能提炼**：
- **技能名称**（kebab-case）：
  - 从描述中提取核心功能关键词
  - 转换为小写，用连字符连接
  - 示例：`代码审查助手` → `code-review-helper`
  - 示例：`生成单元测试` → `generate-unit-tests`
  
- **一句话描述**：
  - 概括功能的核心用途
  - 包含关键词便于识别使用场景
  - 简洁明了，不超过 50 字

**向用户确认**：
```
根据您的描述，我提炼了以下技能信息：

技能名称：{skill-name}
功能描述：{description}

是否确认创建？
[确认并创建] [修改名称] [修改描述] [取消]
```

**处理用户反馈**：
- 确认并创建 → 进入步骤 3
- 修改名称 → 询问用户期望的名称 → 重新确认
- 修改描述 → 询问用户更准确的描述 → 重新提炼 → 重新确认
- 取消 → 结束流程

### 3. 创建技能文件

**生成 SKILL.md**：

```yaml
---
description: {提炼的描述}
---

{根据描述生成的核心指令}

## 使用示例

{生成的使用示例}
```

**目录结构**：
```
opencode/skills/{skill-name}/
├── SKILL.md              # 技能主要指令
└── README.md             # 可选：详细文档（引导用户后续补充）
```

**目标路径**：`.opencode/skills/{skill-name}/SKILL.md`

### 4. 完成通知

**创建成功后**：
```
✅ 技能 "{skill-name}" 创建成功！

文件位置：.opencode/skills/{skill-name}/SKILL.md

使用方式：
/{skill-name}  # 调用技能
```

## 质量标准

- 技能名称使用 kebab-case（小写字母 + 连字符）
- 描述包含关键词，便于识别使用场景
- 内容简洁，建议 SKILL.md 不超过 100 行
- 引导用户在 README.md 中补充详细文档

现在开始创建新技能。
