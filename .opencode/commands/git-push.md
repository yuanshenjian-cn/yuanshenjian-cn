---
agent: build
description: 执行 git push 来向远程仓库推送本地的commit
---

## 你的任务
帮助用户将本地的git commit push 到远程的git仓库，确保只推送当前分支的commits。

## 执行流程

### 1. 获取当前分支与远程分支

获取信息：
```bash
git branch --show-current
git branch -r | grep -v "HEAD" | sed 's/origin\///' | sort -u
git remote
```

### 2. 确定目标分支

**如果用户提供了参数**（`$ARGUMENTS`）：
- 直接使用参数作为目标分支名
- 验证分支是否存在

**如果没有提供参数**：
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

### 4. 预览与确认

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

### 5. 执行推送

用户确认后执行：
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
/git-push                    # 交互式选择分支
/git-push main               # 直接推送到origin/main
/git-push feature-branch     # 推送到指定远程分支
```

## 安全机制

- 推送前必须展示所有待推送commit
- 强制用户确认后才执行
- 支持取消操作
- 显示完整推送命令预览
