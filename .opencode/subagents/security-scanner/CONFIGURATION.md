# Security Scanner 配置指南

## 配置文件位置

```
.opencode/subagents/security-scanner/config.json
```

## 核心配置项

### scanLevel (扫描级别)

控制扫描的深度和范围：

- `quick`: 快速扫描，只检查高危漏洞和敏感信息（最快）
- `standard`: 标准扫描，检查常见漏洞和依赖（推荐）
- `comprehensive`: 全面扫描，深度分析所有文件和依赖（最慢）

```json
{
  "settings": {
    "scanLevel": "standard"
  }
}
```

### severityThreshold (严重程度阈值)

设置报告的最低严重级别：

- `low`: 报告所有级别的问题
- `medium`: 只报告中危及以上问题
- `high`: 只报告高危及以上问题
- `critical`: 只报告严重问题

```json
{
  "settings": {
    "severityThreshold": "medium"
  }
}
```

### checkPatterns (检查模式)

启用或禁用特定的安全检查：

```json
{
  "settings": {
    "checkPatterns": [
      "xss",
      "sql-injection",
      "command-injection",
      "path-traversal",
      "hardcoded-secrets"
    ]
  }
}
```

完整模式列表：

| 模式名 | 描述 | 默认启用 |
|--------|------|----------|
| xss | 跨站脚本攻击 | ✅ |
| csrf | 跨站请求伪造 | ✅ |
| sql-injection | SQL注入 | ✅ |
| command-injection | 命令注入 | ✅ |
| path-traversal | 路径遍历 | ✅ |
| ldap-injection | LDAP注入 | ✅ |
| xml-injection | XML注入 | ✅ |
| ssrf | 服务器端请求伪造 | ✅ |
| open-redirect | 开放重定向 | ✅ |
| insecure-deserialization | 不安全反序列化 | ✅ |
| weak-cryptography | 弱加密算法 | ✅ |
| hardcoded-secrets | 硬编码密钥 | ✅ |
| insecure-cookies | 不安全Cookie | ✅ |
| missing-auth | 缺失身份验证 | ✅ |
| insecure-cors | 不安全CORS配置 | ✅ |
| information-exposure | 信息泄露 | ✅ |

## 文件类型配置

### fileTypes (扫描的文件类型)

定义哪些文件类型会被扫描：

```json
{
  "fileTypes": [
    "*.js", "*.jsx", "*.ts", "*.tsx",
    "*.py", "*.php",
    "*.java",
    "*.go",
    "package.json",
    "requirements.txt"
  ]
}
```

### excludePatterns (排除模式)

定义哪些文件或目录会被跳过：

```json
{
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "**/*.test.js",
    "**/__tests__/**"
  ]
}
```

## 配置示例

### 示例 1: 快速扫描配置

适合 CI/CD 环境，快速检测高危问题：

```json
{
  "name": "security-scanner",
  "settings": {
    "scanLevel": "quick",
    "severityThreshold": "high",
    "checkPatterns": [
      "sql-injection",
      "command-injection",
      "hardcoded-secrets",
      "xss"
    ]
  },
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "**/*.test.js",
    "**/__tests__/**",
    "**/mocks/**"
  ]
}
```

### 示例 2: 全面扫描配置

适合发布前的安全审计：

```json
{
  "name": "security-scanner",
  "settings": {
    "scanLevel": "comprehensive",
    "severityThreshold": "low",
    "checkPatterns": [
      "xss",
      "csrf",
      "sql-injection",
      "command-injection",
      "path-traversal",
      "ldap-injection",
      "xml-injection",
      "ssrf",
      "open-redirect",
      "insecure-deserialization",
      "weak-cryptography",
      "hardcoded-secrets",
      "insecure-cookies",
      "missing-auth",
      "insecure-cors",
      "information-exposure"
    ]
  },
  "fileTypes": [
    "*.js", "*.jsx", "*.ts", "*.tsx",
    "*.py", "*.rb", "*.php",
    "*.java", "*.kt",
    "*.go", "*.rs",
    "*.c", "*.cpp",
    "*.cs",
    "*.swift",
    "*.sql",
    "*.json", "*.yaml", "*.yml", "*.xml",
    "*.env*", "*.config",
    "Dockerfile", "docker-compose*",
    "package*.json", "yarn.lock", "pnpm-lock.yaml",
    "requirements.txt", "Pipfile*", "poetry.lock",
    "Gemfile*", "Cargo.*", "go.mod", "go.sum",
    "pom.xml", "build.gradle*", "composer.*"
  ],
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    ".next/**",
    "coverage/**",
    "*.min.js",
    "*.min.css",
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**",
    "**/__mocks__/**",
    "**/*.d.ts"
  ]
}
```

### 示例 3: 前端项目专用配置

适合 React/Vue/Angular 项目：

```json
{
  "name": "security-scanner",
  "settings": {
    "scanLevel": "standard",
    "severityThreshold": "medium",
    "checkPatterns": [
      "xss",
      "csrf",
      "open-redirect",
      "hardcoded-secrets",
      "insecure-cors",
      "information-exposure"
    ]
  },
  "fileTypes": [
    "*.js", "*.jsx", "*.ts", "*.tsx",
    "*.vue",
    "*.html",
    "*.css", "*.scss", "*.less",
    "*.json", "*.yaml", "*.yml",
    "*.env*",
    "package*.json", "yarn.lock", "pnpm-lock.yaml"
  ],
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    ".next/**",
    "public/**",
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**",
    "**/__mocks__/**",
    "**/*.d.ts",
    "**/*.min.js",
    "**/*.chunk.js"
  ]
}
```

## 环境变量

可以通过环境变量覆盖配置：

```bash
# 扫描级别
export SECURITY_SCANNER_LEVEL=comprehensive

# 严重程度阈值
export SECURITY_SCANNER_THRESHOLD=medium

# 排除模式（逗号分隔）
export SECURITY_SCANNER_EXCLUDE="test/**,docs/**"

# 输出格式
export SECURITY_SCANNER_OUTPUT_FORMAT=json
```

## 性能优化

### 大型代码库优化建议

1. **使用增量扫描**：只扫描变更的文件
2. **并行扫描**：利用多核 CPU 并行处理
3. **缓存结果**：缓存未变更文件的分析结果
4. **分层扫描**：先快速扫描，再深度分析可疑文件
5. **排除第三方代码**：排除 node_modules、vendor 等目录

### 配置示例（大型项目）

```json
{
  "settings": {
    "scanLevel": "quick",
    "severityThreshold": "high",
    "checkPatterns": [
      "sql-injection",
      "command-injection",
      "hardcoded-secrets"
    ]
  },
  "excludePatterns": [
    "node_modules/**",
    "vendor/**",
    "dist/**",
    "build/**",
    ".git/**",
    "**/*.min.js",
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**",
    "**/test/**",
    "**/tests/**",
    "**/docs/**",
    "**/examples/**",
    "**/demo/**",
    "**/samples/**"
  ]
}
```

## 故障排除

### 常见问题

#### 1. 扫描太慢
- 减少 `checkPatterns` 数量
- 增加 `excludePatterns`
- 使用 `scanLevel: quick`

#### 2. 内存不足
- 分批扫描大文件
- 减少并行度
- 增加 Node.js 内存限制：`--max-old-space-size=4096`

#### 3. 误报太多
- 调整 `severityThreshold`
- 添加白名单注释：
  ```javascript
  // security-scanner:ignore sql-injection
  const query = `SELECT * FROM ${table}`; // 已验证 table 是白名单值
  ```

#### 4. 漏报问题
- 检查 `fileTypes` 是否包含目标文件
- 确认 `checkPatterns` 启用了相关规则
- 使用 `scanLevel: comprehensive`

## 贡献指南

欢迎贡献新的检测规则和改进建议：

1. 提交 Issue 描述问题或建议
2. 创建 PR 添加新功能
3. 遵循代码规范和安全最佳实践
4. 添加测试用例验证新规则

## 许可证

MIT License - 详见项目根目录 LICENSE 文件
