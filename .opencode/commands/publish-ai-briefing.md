---
agent: build
description: 使用新版 ai-briefing skill 生成并发布今天的 AI 简报
---

立即使用 `ai-briefing` skill 执行明确的普通发布模式。若外层未提供窗口与采集结果，先由 skill 创建被忽略的 runDir，运行 window CLI 与 collector CLI，并记录二者的初始 SHA-256；严格遵守 source registry、日期 coverage、证据包和单轮独立 reviewer。

候选只能写入 `$RUN_DIR/candidate.md`。若 reviewer 未 approved，立即停止且不得写正式目录。Reviewer approved 后，只调用一次共享收尾脚本：

```text
scripts/finalize-ai-briefing-run.sh \
  --run-dir <runDir> \
  --candidate <runDir>/candidate.md \
  --briefing-file content/ai-briefings/YYYY/MM/YYYY-MM-DD-ai-briefing.md \
  --index-file site/public/ai-data/briefings/index.json \
  --issue-date YYYY-MM-DD \
  --expected-window-hash <sha256:...> \
  --expected-collection-hash <sha256:...>
```

正式晋升、内容与证据复核、构建、stage、commit、push 和远端状态验证全部由 finalizer 执行，本命令不得复制这些步骤。若当前请求来自 `scripts/ai-briefing.sh`，进入“外层编排发布候选模式”：只生成 candidate 和 agent 证据，不调用 reviewer 或 finalizer，由外层脚本接管。

本 OpenCode 命令不得调用 `scripts/ai-briefing.sh`，避免发布命令递归进入外层编排器。
