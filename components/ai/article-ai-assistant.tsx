"use client";

import { AiPageAssistant } from "@/components/ai/ai-page-assistant";
import type { AIQuickTopic } from "@/types/ai";

interface ArticleAiAssistantProps {
  variant?: "primary" | "footer";
}

const PRIMARY_QUICK_TOPICS: AIQuickTopic[] = [
  { label: "3 行总结这篇文章", prompt: "3 行总结这篇文章" },
  { label: "这篇文章的核心观点是什么", prompt: "这篇文章的核心观点是什么" },
  { label: "这篇文章适合谁读", prompt: "这篇文章适合谁读" },
  { label: "看完这篇文章我能获得什么", prompt: "看完这篇文章我能获得什么" },
];

export function ArticleAiAssistant({ variant = "primary" }: ArticleAiAssistantProps) {
  if (variant === "footer") {
    return (
      <AiPageAssistant
        variant="footer"
        title="继续问 AI"
        description="读完后还想确认某个细节？继续围绕当前文章内容提问。"
        placeholder="继续围绕这篇文章提问"
        quickTopics={[]}
      />
    );
  }

  return (
    <AiPageAssistant
      title="AI 快速读懂这篇文章"
      description=""
      placeholder="想快速了解这篇文章？直接问我"
      quickTopics={PRIMARY_QUICK_TOPICS}
    />
  );
}
