---
agent: build
description: 执行 git push 来向远程仓库推送本地的commit（带参数"1"时需要确认）
model: zhipuai-coding-plan/glm-4.7
---
## 你的任务

帮助用户将本地的git commit push 到远程的git仓库，确保只推送当前分支的commits。

**确认机制**：
- **不带参数或参数不是"1"**：直接执行 push，不需要用户确认
- **参数为"1"**：执行前让用户确认，保持原有的确认流程

## 执行流程

### 1. 获取当前分支与远程分支

获取信息：

```bash
git branch --show-current
git branch -r | grep -v "HEAD" | sed 's/origin\///' | sort -u
git remote
```

### 2. 判断是否需要用户确认

**检查参数**：

- 如果参数为 `"1"` → 需要用户确认，跳到步骤 2.1
- 其他情况 → 不需要确认，跳到步骤 2.2

### 2.1 确定目标分支（需要确认）

**如果用户提供了除"1"外的参数**（`$ARGUMENTS`）：

- 直接使用参数作为目标分支名
- 验证分支是否存在

**如果没有提供参数**：

- 使用 `question` 工具让用户选择
- 默认选中与当前本地分支同名的远程分支
- 选项包括：
  - 所有远程分支列表
  - 手动输入其他分支名
  - 取消操作

### 2.2 确定目标分支（无需确认）

**如果用户提供了参数**（`$ARGUMENTS`）：

- 直接使用参数作为目标分支名
- 验证分支是否存在

**如果没有提供参数**：

- 使用当前本地分支同名的远程分支作为目标

### 3. 获取待推送的commit列表

- 使用 `question` 工具让用户选择
- 默认选中与当前本地分支同名的远程分支
- 选项包括：
  - 所有远程分支列表
  - 手动输入其他分支名
  - 取消操作

### 3. 获取待推送的commit列表

```bash
git log origin/{branch}..HEAD --oneline
git diff --stat origin/{branch}..HEAD
```

**分析内容**：

- commit数量和哈希
- commit信息摘要
- 变更文件统计（新增/修改/删除）

### 4. 预览与确认（仅在参数为"1"时执行）

展示信息：

```
📍 当前分支: {current-branch}
🎯 目标分支: origin/{target-branch}

📋 待推送的commits ({n}个):
{hash} {message}
{hash} {message}
...

📊 变更统计:
- 新增: {n} 个文件
- 修改: {n} 个文件  
- 删除: {n} 个文件

⚠️  即将执行: git push origin {current-branch}:{target-branch}

是否确认推送？
```

**处理用户选择**：

- **确认推送** → 执行 `git push origin {local-branch}:{remote-branch}`
- **取消** → 结束流程

### 5. 执行推送（无需确认时直接执行，确认时在用户选择后执行）

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
/git-push                    # 直接推送到当前分支的远程，无需确认
/git-push 1                  # 需要确认后再推送
/git-push main               # 直接推送到origin/main，无需确认
/git-push feature-branch     # 直接推送到指定远程分支，无需确认
```

## 安全机制

- 参数为"1"时需要用户确认，其他情况直接执行
- 展示所有待推送commit
- 支持取消操作（仅在确认模式下）
- 显示完整推送命令预览
