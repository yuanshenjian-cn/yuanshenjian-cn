---
description: 查询 AI 每日简报相关动态，默认进入查询模式；仅在用户明确要求发布时才进入自动发布链路
---

请加载并执行 `ai-daily-briefing` skill。

默认进入 **AI 每日简报查询模式**，只有当用户在 `$ARGUMENTS` 中明确表达“发布 / commit / push / 生成并发布”时，才允许进入发布模式。

**用户补充要求：** $ARGUMENTS

---

## 执行指引

1. 加载 skill：`ai-daily-briefing`
2. 若 `$ARGUMENTS` 为空，使用默认查询参数：
   - 时间窗口：按 Asia/Shanghai 取当前执行时刻向前 24 小时
   - 重点厂商：OpenAI、Anthropic、Google/DeepMind/Gemini、xAI、Meta AI、Perplexity、Mistral、月之暗面/Kimi、小米 MiMo、DeepSeek、智谱 AI、MiniMax
   - 输出语言：中文
3. 若 `$ARGUMENTS` 非空，从中解析时间范围、厂商限定、关键词、语言要求，以及是否明确要求“生成简报”或“发布”
4. 严格遵循 `ai-daily-briefing` skill 内的意图分流规则：
   - 歧义查询 → 查询模式
   - 明确写/起草/生成简报 → 成稿模式
   - 明确发布/commit/push/生成并发布 → 发布模式
5. 不允许绕过 `ai-daily-briefing` 的意图分流直接进入发布链路

## 示例用法

```
/ai-radar                               # 默认：查询最近 24 小时重点厂商动态
/ai-radar 本周 OpenAI Anthropic         # 查询本周 OpenAI 和 Anthropic 动态
/ai-radar GPT-5.5 Gemini API            # 查询关键词相关动态
/ai-radar 帮我起草今天的 AI 每日简报     # 进入成稿模式，只返回草稿
/ai-radar 生成并发布今天的 AI 每日简报   # 进入发布模式，审核通过后发布
```
