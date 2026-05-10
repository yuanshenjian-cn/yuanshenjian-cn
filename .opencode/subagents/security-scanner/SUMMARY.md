# Security Scanner SubAgent 配置说明

## 目录结构

```
.opencode/subagents/security-scanner/
├── config.json          # 配置文件（扫描规则、严重程度定义）
├── AGENT.md            # Agent 行为定义（检测能力、扫描流程）
├── README.md           # 使用文档
├── CONFIGURATION.md    # 详细配置指南
└── QUICKSTART.md       # 快速入门
```

## 核心功能

1. **漏洞检测**（20+ 种类型）
   - XSS、SQL注入、命令注入、路径遍历
   - CSRF、SSRF、LDAP/XML注入
   - 不安全的反序列化、弱加密算法

2. **敏感信息扫描**
   - API密钥、访问令牌、密码
   - 私钥、证书
   - AWS/GitHub/Slack 等云服务凭证

3. **依赖安全分析**
   - 已知 CVE 漏洞检测
   - 依赖树分析
   - 废弃包识别

4. **代码模式分析**
   - 不安全的 CORS 配置
   - 弱随机数生成
   - 缺失身份验证

## 使用方法

### 基本命令

```bash
# 扫描整个项目
@security-scanner scan --path ./src

# 扫描并输出报告
@security-scanner scan --path ./src --output report.json

# 扫描特定文件
@security-scanner scan --file ./src/auth.js
```

### 高级用法

```bash
# 指定扫描规则
@security-scanner scan --rules xss,sql-injection --path ./src

# 设置严重级别阈值
@security-scanner scan --severity-threshold high --path ./src

# 排除文件
@security-scanner scan --path ./src --exclude "test/**,docs/**"
```

## 配置选项

### 扫描级别 (scanLevel)

- `quick`: 快速扫描（只检查高危漏洞）
- `standard`: 标准扫描（推荐）
- `comprehensive`: 全面扫描（最慢但最完整）

### 严重级别 (severityThreshold)

- `low`: 报告所有问题
- `medium`: 报告中危及以上
- `high`: 报告高危及以上
- `critical`: 只报告严重问题

### 检查模式 (checkPatterns)

完整列表见 `config.json`，包括：
- xss, csrf, sql-injection
- command-injection, path-traversal
- hardcoded-secrets, insecure-cors
- 等等...

## 严重级别说明

| 级别 | 图标 | 响应时间 | 说明 |
|------|------|----------|------|
| Critical | 🔴 | 立即 | SQL注入、RCE、生产密钥泄露 |
| High | 🟠 | 24小时 | XSS、反序列化、弱加密 |
| Medium | 🟡 | 1周 | CSRF、CORS配置、信息泄露 |
| Low | 🔵 | 下次迭代 | 注释敏感信息、过时依赖 |

## 输出报告格式

```json
{
  "scanId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "summary": {
    "totalFiles": 100,
    "totalIssues": 10,
    "critical": 1,
    "high": 2,
    "medium": 4,
    "low": 3
  },
  "issues": [
    {
      "id": "SEC-001",
      "type": "sql-injection",
      "severity": "critical",
      "file": "src/db/query.js",
      "line": 45,
      "message": "检测到字符串拼接的 SQL 查询",
      "remediation": "使用参数化查询",
      "cwe": "CWE-89",
      "owasp": "A03:2021"
    }
  ]
}
```

## CI/CD 集成示例

### GitHub Actions

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

## 更多文档

- **完整功能说明**: 见 `AGENT.md`
- **详细配置指南**: 见 `CONFIGURATION.md`
- **快速入门教程**: 见 `QUICKSTART.md`
- **使用文档**: 见 `README.md`

## 故障排除

### 扫描太慢？
- 使用 `--scan-level quick`
- 使用 `--exclude` 排除不需要扫描的目录
- 只对变更的文件进行扫描

### 误报太多？
- 提高严重级别阈值 `--severity-threshold high`
- 在代码中添加白名单注释
- 禁用不相关的检查规则

### 漏报问题？
- 使用 `--scan-level comprehensive`
- 检查 `fileTypes` 是否包含目标文件
- 确认 `excludePatterns` 没有误排除

---

**开始使用**: `@security-scanner scan --path ./src`
