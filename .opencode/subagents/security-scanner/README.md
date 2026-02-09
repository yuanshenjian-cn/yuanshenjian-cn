# Security Scanner SubAgent

## 简介

`security-scanner` 是一个用于检测代码安全漏洞和敏感信息泄露风险的 opencode subagent。

## 功能特性

- **漏洞检测**: XSS、CSRF、SQL注入、命令注入、路径遍历等
- **敏感信息扫描**: API密钥、密码、令牌、私钥等
- **依赖安全分析**: 检测已知漏洞的依赖包
- **代码模式分析**: 识别不安全的编程实践

## 目录结构

```
security-scanner/
├── config.json    # 配置文件
├── AGENT.md       # Agent 定义文档
└── README.md      # 使用说明（本文档）
```

## 使用方法

### 在 opencode 中调用

```bash
# 扫描整个项目
@security-scanner scan --path ./src

# 扫描指定目录并输出报告
@security-scanner scan --path ./src --output security-report.json

# 扫描特定文件
@security-scanner scan --file ./src/auth.js

# 指定扫描规则
@security-scanner scan --rules xss,sql-injection --path ./src

# 设置严重级别阈值
@security-scanner scan --severity-threshold high --path ./src
```

### 配置说明

config.json 中的配置项：

- `scanLevel`: 扫描级别 (`quick` | `standard` | `comprehensive`)
- `severityThreshold`: 严重程度阈值 (`low` | `medium` | `high` | `critical`)
- `checkPatterns`: 启用的检查模式列表

### 输出报告格式

扫描完成后会生成 JSON 格式的报告，包含：

- 扫描摘要（文件数、问题数、各等级漏洞数量）
- 详细漏洞列表（类型、位置、严重程度、修复建议）
- 依赖安全分析结果

## 支持的漏洞类型

| 漏洞类型 | 描述 | 严重程度 |
|---------|------|---------|
| XSS | 跨站脚本攻击 | High |
| CSRF | 跨站请求伪造 | Medium |
| SQL Injection | SQL 注入攻击 | Critical |
| Command Injection | 命令注入攻击 | Critical |
| Path Traversal | 路径遍历攻击 | High |
| Insecure Dependencies | 不安全的依赖 | Medium |
| Hardcoded Secrets | 硬编码密钥 | Critical |
| Weak Cryptography | 弱加密算法 | High |

## 集成建议

1. **CI/CD 集成**: 将安全扫描添加到持续集成流程
2. **Git 钩子**: 在提交前自动扫描变更文件
3. **定期扫描**: 设置定时任务进行全量扫描
4. **告警通知**: 对高危漏洞及时发送告警

## 注意事项

1. 扫描结果可能存在误报，需要人工确认
2. 敏感信息扫描可能涉及隐私数据，请确保合规使用
3. 建议结合其他安全工具进行综合评估
4. 定期更新漏洞数据库以获得最新检测能力

## 更新日志

### v1.0.0
- 初始版本发布
- 支持常见安全漏洞检测
- 支持敏感信息扫描
- 支持依赖安全分析

## 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE 漏洞列表](https://cwe.mitre.org/)
- [NVD 漏洞数据库](https://nvd.nist.gov/)
