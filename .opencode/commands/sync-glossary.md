---
agent: build
description: 使用 Agent Skill：blog-glossary-sync
---

立即使用 `blog-glossary-sync` 这个 skill 从博客内容（文章、AI 简报、投资简报等）中提取候选术语，与现有术语库去重后生成 curl 脚本，等待 review 后写入术语库。

本地默认写入 http://localhost:8001；如需更新生产环境术语库，请提前设置：

```bash
export CORE_SERVICE_URL="https://api.yuanshenjian.cn"
export ADMIN_API_KEY="<production-api-key>"
```

使用 `ADMIN_API_KEY` 可直接通过 `Authorization: Bearer` 调用 admin 术语接口，无需登录、CSRF 或 Turnstile。
