#!/bin/bash
set -euo pipefail

CORE_URL="https://api.yuanshenjian.cn"
ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"
ORIGIN="https://admin.yuanshenjian.cn"

echo '更新术语: OpenCode'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/db626223-ecdc-4160-89d2-b904b9bd5d4c'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"OpenCode","aliases":[],"definition":"开源的 AI 编程 Agent，支持 75+ 模型提供商和高度自定义配置。","explanation":"OpenCode 是一款开源的 AI Coding Agent，通过终端 TUI 与用户交互，能直接读写文件、执行 shell、搜索代码、抓取网页等。核心定位是隐私可控、模型灵活：支持 75+ 提供商，可用 `/connect` 或 `/models` 配置模型。典型场景：在项目中输入自然语言指令，让 AI 完成代码生成、重构、Bug 修复。示例：`opencode` 进入 TUI 后输入 `将 @src/utils.js 中的回调改为 async/await`。","related_article_slugs":["ai-coding-tools-comparison","opencode-ai-coding-agent-getting-started","opencode-comparison-and-best-practices"],"domains":["ai","article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: Claude Code'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/8255c71b-e957-4027-8958-378b828780f5'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Claude Code","aliases":["Anthropic Claude Code","ClaudeCode"],"definition":"Anthropic 官方推出的跨平台 AI 编码平台，覆盖 CLI/IDE/桌面/移动端。","explanation":"Claude Code 是 Anthropic 推出的 AI 辅助编程环境，提供 Terminal CLI、VS Code 扩展、JetBrains 插件、Desktop App、Web 和 iOS 多种入口。它不仅能读写文件、执行 Shell 命令，还支持 MCP、Skills、Hooks、Sub-agents 等扩展机制，适合从日常编码到 CI/CD 自动化的完整工作流。例如，在终端输入 `claude` 即可启动交互会话，用自然语言指挥 AI 完成代码修改。","related_article_slugs":["2026-04-02-ai-briefing","2026-04-15-ai-briefing","ai-coding-tools-comparison","codex-configuration-guide","anthropic-model-family-notes","2026-06-17-ai-briefing","opencode-to-claude-code-getting-oriented","claude-code-getting-started"],"domains":["ai","article","author"],"scenes":["ai-briefing","article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: Codex'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/6e53b0b7-b9e7-4fda-b48a-7edc1046bea5'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Codex","aliases":["OpenAI Codex"],"definition":"OpenAI 推出的轻量级官方编码 Agent，深度优化 GPT 系列模型。","explanation":"Codex 是 OpenAI 推出的编码 Agent，提供 CLI、IDE 插件、桌面和 Web 端。核心设计是简洁和官方优化：三级沙箱（read-only/workspace-write/danger-full-access）、`model_reasoning_effort` 六级推理强度、`codex exec` 非交互模式。开源（Apache-2.0）但绑定 OpenAI 模型生态。适合 ChatGPT 订阅用户和需要严格沙盒控制的场景。","related_article_slugs":["ai-coding-tools-comparison","codex-configuration-guide","2026-06-04-ai-briefing","2026-06-08-ai-briefing"],"domains":["ai","article","author"],"scenes":["article","ai-briefing","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: MCP'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/9cfe0102-d980-41be-a401-963fd85330d6'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"MCP","aliases":["Model Context Protocol","模型上下文协议"],"definition":"让 AI Agent 标准化连接外部工具、数据源和服务的开放协议。","explanation":"MCP（Model Context Protocol）是 Anthropic 主导的开放标准，让 Claude Code 能即插即用地连接数据库、浏览器、API 网关等外部系统。支持 stdio（本地进程）和 HTTP（远程服务）两种传输方式，配置在 `.mcp.json` 或 `~/.claude.json` 中。例如，可配置 `@modelcontextprotocol/server-postgres` 让 Claude 直接查询 PostgreSQL 数据库。","related_article_slugs":["ai-coding-tools-comparison","codex-configuration-guide","deepseek-tui-first-look","claude-code-extension-model-overview","claude-code-advanced-automation-with-mcp-hooks-and-agents","claude-code-token-saving-tips","opencode-efficiency-config-handbook","opencode-advanced-tips-and-practices"],"domains":["ai","article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: TDD'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/92aa7231-b0ac-4de9-ab8f-293923f6cfb2'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"TDD","aliases":["测试驱动开发","Test Driven Development"],"definition":"先写测试再写实现，通过红绿重构循环驱动开发。","explanation":"测试驱动开发（TDD）是一种先编写测试、再编写刚好使测试通过的实现、最后通过重构优化代码的开发方式。关键要点：1) 基本流程为红（测试失败）、绿（测试通过）、重构；2) TDD不仅是测试技术，也是设计工具，可促进可测试性和API设计。典型场景：在实现新功能或修复缺陷时，先写一个失败的测试明确期望，再逐步实现。例如，袁帅写统计字符函数前，先定义输入'"'"'hello'"'"'时期望返回5的测试，再驱动出实现。","related_article_slugs":["swd/xp/simple-design/three-practices-of-simple-design","swd/xp/tdd/tdd-introduction","swd/xp/tdd/mocks-arent-stubs","swd/xp/testing/unit-test-from-other-sight","swd/xp/testing/unit-test-in-a-programmer"],"domains":["article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: 重构'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/2b73064a-57ba-465b-8788-1de12e5e95a2'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"重构","aliases":["Refactoring","代码重构"],"definition":"在不改变外部行为的前提下，改善代码内部结构以提高可维护性。","explanation":"重构是在不改变软件可观察行为的前提下，修改代码内部结构以提升可读性、可维护性和设计质量的过程。关键要点：1) 重构必须在测试保护下进行，确保行为不变；2) 通过识别代码坏味道并应用重构手法逐步优化。典型场景：当类职责混乱、方法过长或存在重复时，在安全测试覆盖下提取方法、移动方法或拆分类。例如，发现DateFormater中两个方法重复创建DateTimeFormatter，在测试绿保下抽取公共format方法。","related_article_slugs":["agile-growth-assistant","beyond-training","avoid-ineffective-knowledge-management","swd/xp/simple-design/three-practices-of-simple-design"],"domains":["article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: 简单设计'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/5ec63c70-459c-4b8a-8210-878dbd7b44e7'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"简单设计","aliases":["Simple Design"],"definition":"刚好满足需求、易于变更的代码设计。","explanation":"简单设计是极限编程倡导的设计哲学，强调只为当下真实需求做设计，不为未来可能的需求过度设计，同时保持系统对变化的快速响应力。关键要点：1) 简单不等于容易，是历经复杂后的返璞归真；2) 通过TDD、重构和整洁代码等实践落地。典型场景：当开发者为'"'"'万一以后需要'"'"'而引入复杂模式时，应回归当下业务价值，删除不必要的抽象。例如，欢欢用策略模式和状态模式预留扩展点，清扬认为属于过度设计，应遵循刚好够用的原则。","related_article_slugs":["swd/xp/simple-design/simple-design-principles-novel","swd/xp/simple-design/my-simple-design-perspective","swd/xp/simple-design/three-practices-of-simple-design"],"domains":["article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo '更新术语: Scrum'
curl -s   -X PUT 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms/b7e81e7f-f137-4d94-8a55-571d7a8a6c26'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Scrum","aliases":["敏捷框架","橄榄球式开发"],"definition":"一种迭代增量的敏捷开发框架，通过固定周期交付有价值的产品增量。","explanation":"Scrum 将复杂项目拆分为固定时长（通常 2 周）的 Sprint，团队在每个 Sprint 内完成一小批优先级最高的需求并产出可工作的软件。核心要点：1）团队自组织、跨职能，共同对交付负责；2）通过每日站会、迭代评审和回顾持续透明化进展并调整；3）产品负责人用 Product Backlog 管理需求优先级。典型场景：互联网产品团队每两周发布一个可用版本，快速获取用户反馈。例如，电商团队在 Sprint 中完成购物车优化并上线 A/B 测试。","related_article_slugs":["two-basic-element-of-scrum-team","my-agile-practice-in-thoughtworks"],"domains":["article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo "术语库同步完成"
