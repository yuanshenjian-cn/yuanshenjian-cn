---
agent: build
description: 执行 git commit 和 push（参数"1"时需要确认commit，其他参数作为远程分支名）
model: zhipuai-coding-plan/glm-4.7
---
<CommitMessage>
  $ARGUMENTS
</CommitMessage>

## 你的任务

分析当前工作区代码变更，执行 git commit，然后推送到远程仓库。

**参数规则**：
- 参数为 `"1"` → commit 需要确认，push 到当前分支的远程
- 参数为分支名（如 `main`、`feature-branch`）→ commit 无需确认，push 到指定远程分支
- 参数为其他内容 → commit 无需确认（作为提示信息），push 到当前分支的远程

## 执行流程

### 1. 获取当前分支与远程分支

```bash
git branch --show-current
git branch -r | grep -v "HEAD" | sed 's/origin\///' | sort -u
git remote
```

### 2. 检查工作区状态

```bash
git status
git diff --stat
git diff HEAD
```

**判断状态**：
- 无变更 → 仅执行 push（跳过步骤 3-7）
- 有变更 → 进入步骤 3

### 3. 分析变更内容

**统计变更**：
- 新增文件数
- 修改文件数
- 删除文件数
- 文件类型分布

**分析变更性质**：
- 新增功能 → `feat`
- Bug 修复 → `fix`
- 文档更新 → `docs`
- 代码重构 → `refactor`
- 配置/杂项 → `chore`
- 样式调整 → `style`
- 测试相关 → `test`

### 4. 判断是否需要用户确认

**检查参数 {CommitMessage}**：
- 如果参数为 `"1"` → 需要用户确认，进入步骤 5.1
- 其他情况 → 不需要确认，进入步骤 5.2

### 5. 生成提交信息

**如果用户在斜杠命令参数后填充了{CommitMessage}（且参数不是"1"或分支名），就使用{CommitMessage}作为参考信息，否则就为用户智能生成。**

**信息格式**：

```
<type>: {CommitMessage}
```

**生成规则**：
- 使用现在时态（add, fix, update 而非 added, fixed）
- 首字母小写
- 简洁明了，不超过 72 字符
- 英文描述

**示例**：
- 添加新功能 → `feat: add user login authentication`
- 修复问题 → `fix: resolve data validation error`
- 更新文档 → `docs: update readme with setup instructions`
- 重构代码 → `refactor: simplify error handling logic`

### 6. 用户确认（仅在参数为"1"时执行）

**展示变更统计和建议提交信息**：

```
📊 变更统计：
- 新增：{n} 个文件
- 修改：{n} 个文件
- 删除：{n} 个文件

📝 建议提交信息：{type}: {description}

是否执行 commit？
[确认提交] [修改信息] [取消]
```

**处理用户选择**：
- **确认提交** → 执行 commit，继续步骤 7
- **修改信息** → 使用 `question` 工具让用户输入新信息，然后重新确认
- **取消** → 结束流程，不执行提交和推送

### 7. 执行提交（有变更时）

```bash
git add -A
git commit -m "{CommitMessage}"
```

**成功反馈**：

```
✅ Commit 成功！

提交信息：{CommitMessage}
提交哈希：{commit-hash}
```

### 8. 确定目标分支

**如果用户提供了参数且不是"1"**：
- 直接使用参数作为目标分支名
- 验证分支是否存在

**如果没有提供参数或参数为"1"**：
- 使用当前本地分支同名的远程分支作为目标

### 9. 获取待推送的commit列表

```bash
git log origin/{branch}..HEAD --oneline
git diff --stat origin/{branch}..HEAD
```

**分析内容**：
- commit数量和哈希
- commit信息摘要
- 变更文件统计（新增/修改/删除）

### 10. 执行推送

```bash
git push origin {local-branch}:{remote-branch}
```

**成功反馈**：

```
✅ Push 成功！

本地分支: {local-branch}
远程分支: origin/{remote-branch}
推送的commits: {n}个
```

**失败处理**：
- 显示错误信息
- 常见错误提示（权限、冲突等）
- 提供解决方案建议

## 使用示例

```
/git-push                    # 自动提交并推送到当前分支
/git-push 1                  # 提交前确认，然后推送到当前分支
/git-push main               # 自动提交并推送到origin/main
/git-push "添加用户认证模块" # 使用提示信息自动提交并推送
/git-push "fix memory leak" # 使用英文描述自动提交并推送
```

## 规范要求

- 提交信息使用英文
- 遵循 Conventional Commits 规范（feat/fix/docs/refactor/chore/style/test）
- 参数为"1"时需要用户确认，其他情况直接执行
- 展示详细的变更统计供参考
- 支持用户自定义提交信息
- 支持推送到指定远程分支
