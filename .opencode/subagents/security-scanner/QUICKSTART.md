# Security Scanner 快速入门

## 安装

无需安装，直接在 opencode 中使用：

```bash
# 调用 security-scanner subagent
@security-scanner --help
```

## 基本用法

### 1. 扫描整个项目

```bash
@security-scanner scan --path ./src
```

### 2. 扫描并输出报告

```bash
@security-scanner scan --path ./src --output report.json
```

### 3. 扫描指定文件

```bash
@security-scanner scan --file ./src/auth.js
```

## 高级用法

### 指定扫描规则

只扫描 SQL 注入和 XSS：

```bash
@security-scanner scan --rules sql-injection,xss --path ./src
```

### 设置严重级别

只报告高危及以上问题：

```bash
@security-scanner scan --severity-threshold high --path ./src
```

### 排除文件

跳过测试文件和文档：

```bash
@security-scanner scan --path ./src --exclude "test/**,docs/**"
```

## 配置示例

### CI/CD 集成

`.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Security Scanner
        run: |
          @security-scanner scan \
            --path ./src \
            --output security-report.json \
            --severity-threshold high
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json
```

### 预提交钩子

`.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 只对变更的文件进行快速扫描
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx|py|java|go)$' || true)

if [ -n "$STAGED_FILES" ]; then
  echo "Running security scan on staged files..."
  @security-scanner scan --path . --include "$STAGED_FILES" --scan-level quick --severity-threshold high
fi
```

## 输出解读

### 扫描报告示例

```json
{
  "scanId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "summary": {
    "totalFiles": 100,
    "totalIssues": 5,
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1
  }
}
```

### 严重级别说明

| 级别 | 颜色 | 响应时间 | 说明 |
|------|------|----------|------|
| Critical | 🔴 | 立即 | 可能导致系统被完全控制 |
| High | 🟠 | 24小时 | 可能导致数据泄露 |
| Medium | 🟡 | 1周 | 需要特定条件才能利用 |
| Low | 🔵 | 下次迭代 | 理论上的安全问题 |

## 常见问题

### Q: 扫描太慢怎么办？
A: 
1. 使用 `--scan-level quick` 进行快速扫描
2. 使用 `--exclude` 排除不需要扫描的目录
3. 只对变更的文件进行扫描

### Q: 误报太多怎么办？
A:
1. 提高严重级别阈值 `--severity-threshold high`
2. 在代码中添加白名单注释
3. 调整 `checkPatterns` 只启用相关规则

### Q: 如何集成到 CI/CD？
A: 参考上面的 GitHub Actions 示例，设置自动扫描并在发现高危漏洞时阻止部署。

### Q: 支持哪些编程语言？
A: 支持 JavaScript/TypeScript、Python、Java、Go、PHP、Ruby、C/C++、C# 等主流语言。

## 最佳实践

1. **定期扫描**: 每周至少运行一次全量扫描
2. **增量扫描**: 每次提交前扫描变更文件
3. **及时修复**: 高危漏洞应在 24 小时内修复
4. **团队协作**: 分享扫描结果和修复经验
5. **持续改进**: 根据误报情况调整规则

## 获取帮助

- 查看完整文档: `.opencode/subagents/security-scanner/AGENT.md`
- 配置参考: `.opencode/subagents/security-scanner/CONFIGURATION.md`
- 使用示例: `.opencode/subagents/security-scanner/QUICKSTART.md` (本文档)

---

开始使用：`@security-scanner scan --path ./src`
