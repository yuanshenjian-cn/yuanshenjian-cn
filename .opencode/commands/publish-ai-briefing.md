---
agent: build
description: 使用新版 ai-briefing skill 生成并发布今天的 AI 简报
---

立即使用 `ai-briefing` skill 执行明确的普通发布模式。若外层未提供窗口与采集结果，先由 skill 创建被忽略的 runDir，并直接运行 window CLI 与 collector CLI；严格遵守 source registry、证据包、单轮独立 reviewer 和确定性发布门禁。

不要绕过 skill 自行搜索、写稿或执行 Git。若当前请求来自 `scripts/ai-briefing.sh`，进入“外层编排发布候选模式”：只生成本期候选文件和 agent 证据，不调用 reviewer，不 commit，不 push，由外层脚本接管后续步骤。

本 OpenCode 命令不得调用 `scripts/ai-briefing.sh`，避免发布命令递归进入外层编排器。
