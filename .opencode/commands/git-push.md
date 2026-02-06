---
agent: build
description: 执行 git push 来向远程仓库推送本地的commit
model: zhipuai-coding-plan/glm-4.7
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

- 使用当前本地分支同名的远程分支作为目标

### 3. 获取待推送的commit列表

```bash
git log origin/{branch}..HEAD --oneline
git diff --stat origin/{branch}..HEAD
```

**分析内容**：

- commit数量和哈希
- commit信息摘要
- 变更文件统计（新增/修改/删除）

### 4. 执行推送

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
/git-push                    # 直接推送到当前分支的远程
/git-push main               # 直接推送到origin/main
/git-push feature-branch     # 直接推送到指定远程分支
```

## 安全机制

- 展示所有待推送commit
- 显示完整推送命令预览
