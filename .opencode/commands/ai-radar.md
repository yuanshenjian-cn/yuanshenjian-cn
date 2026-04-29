---
description: 进入 AI 前沿早知道模式，搜索并汇总默认重点跟踪厂商的最新确定性动态，标注来源置信度
---

请加载并执行 `ai-frontier-radar` skill，进入 **AI 前沿早知道模式**。

**用户补充要求：** $ARGUMENTS

---

## 执行指引

1. 加载 skill：`ai-frontier-radar`
2. 若 `$ARGUMENTS` 为空，使用默认参数：
   - 时间窗口：昨天 + 今天（Asia/Shanghai）
   - 重点厂商：OpenAI、Anthropic、Google/DeepMind、月之暗面/Kimi、小米 Mimo、DeepSeek、智谱 AI、MiniMax
   - 输出语言：中文
3. 若 `$ARGUMENTS` 非空，从中解析时间范围、厂商限定、语言要求等，覆盖默认值
4. 按 skill 中定义的流程执行：候选发现 → 官方确认 → 筛选去重 → 验证时间证据 → 标注置信度 → 输出结构化摘要

## 示例用法

```
/ai-radar                          # 默认：今天+昨天，全部默认厂商，中文
/ai-radar 本周                     # 本周 AI 前沿动态
/ai-radar OpenAI Anthropic 今天    # 只看 OpenAI 和 Anthropic 今天的动态
/ai-radar 2025-04-20 英文          # 指定日期，英文输出
/ai-radar DeepSeek 最近三天        # DeepSeek 最近三天动态
```
