---
agent: build
description: 使用新版 ai-briefing skill 生成并发布今天的 AI 简报
---

立即使用 `ai-briefing` skill 执行明确的普通发布模式。若外层未提供窗口与采集结果，先由 skill 创建被忽略的 runDir，运行 window CLI 与 collector CLI，并记录二者的初始 SHA-256；严格遵守 source registry、日期 coverage、证据包和单轮独立 reviewer。

候选只能写入 `$RUN_DIR/candidate.md`。独立 reviewer 子代理的原始结构化输出必须原样保存到 `$RUN_DIR/reviewer-output.json` 供 finalizer 校验。若 reviewer 未 approved，立即停止且不得写正式目录。Reviewer approved 后，只调用一次共享收尾脚本：

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

正式晋升、内容与证据复核、构建、stage、commit、push 和远端状态验证全部由 finalizer 执行，本命令不得复制这些步骤。

AI 简报发布只有这一条交互路径，由当前会话 agent 驱动确定性脚本完成，不存在独立的外层编排脚本，也不再 fork 单独的 generator/reviewer 子进程。
