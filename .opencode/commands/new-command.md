---
agent: build
description: 创建一个新的 Agent command
---

<CommandDescription>
  $ARGUMENTS
</CommandDescription>

## 你的任务
根据用户提供的功能描述 {CommandDescription}，自动提炼 command 名称，在 `.opencode/commands/` 目录下创建简单的 `.md` 文件。

## 执行流程

### 1. 获取功能描述

**检查用户是否提供描述参数**（通过 $ARGUMENTS）：
- 已提供 → 使用提供的描述作为功能说明
- 未提供 → 使用 `question` 工具提示用户输入功能描述

### 2. 提炼命令名称

**根据功能描述提炼命令名称**（kebab-case）：
- 从描述中提取核心功能关键词
- 转换为小写，用连字符连接
- 示例：`生成项目 README` → `generate-readme`
- 示例：`代码质量检查` → `code-quality-check`

**向用户确认**：
```
根据您的描述，我提炼了以下信息：

命令名称：{command-name}
功能描述：{用户提供的描述}

将在 .opencode/commands/{command-name}.md 创建命令文件。

是否确认创建？
[确认并创建] [修改名称] [取消]
```

**处理用户反馈**：
- 确认并创建 → 进入步骤 3
- 修改名称 → 询问用户期望的名称 → 重新确认
- 取消 → 结束流程

### 3. 创建命令文件

**根据功能描述自动生成完整的命令指令**：

- 定义命令元数据，固定格式如下：
  ```markdown
  ---
  agent: build
  description: {提炼的新建命令简要描述}
  ---
  ```
- 获取用户输入的参数（如果存在）
- 分析用户输入的功能描述，提炼核心任务目标
- 设计执行步骤和流程（如：输入处理、核心逻辑、输出格式）
- 推荐适用的工具组合（Read/Write/Glob/Grep/Bash/question 等）
- 定义预期的输出或成果
- 提供示例用法，展示命令的实际使用场景
- 提供规范要求（可选）

**生成命令文件结构**：

```markdown
---
agent: build
description: {提炼的简要描述}
---

## 你的任务
具体的任务目标描述

## 执行流程
详细的执行步骤描述

## 使用示例
如何使用该命令的示例，比如 /new-command ***

## 规范要求（可选）
如果用户明确提出规范要求，一定要参考，如果没有明确提出规范要求，智能补充必要的规范描述和要求。
```

**目标路径**：`.opencode/commands/{command-name}.md`

**使用 Write 工具创建文件**。

**示例**：用户描述"检查代码质量"，生成的文件应包含：
- 如何扫描代码文件（Glob）
- 如何检测问题（Grep 查找模式）
- 如何输出报告（格式化的检查结果）

### 4. 完成通知

**创建成功后**：
```
✅ Command "{command-name}" 创建成功！

文件位置：.opencode/commands/{command-name}.md

使用方式：
/{command-name}  # 调用命令
```

## Command 规范

### 文件位置
- 所有 command 文件位于 `.opencode/commands/` 目录
- 文件名使用 kebab-case（如 `new-command.md`, `code-review.md`）
- 文件扩展名为 `.md`

### 文件结构
参考`执行流程`第3步中的文件结构。

### 质量标准
- 命令名称使用 kebab-case（小写字母 + 连字符）
- 描述简洁明了
- 文件位于正确的目录（.opencode/commands/）
