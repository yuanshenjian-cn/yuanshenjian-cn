"use client";

import { AiPageAssistant } from "@/components/ai/ai-page-assistant";
import type { AIQuickTopic } from "@/types/ai";

const QUICK_TOPICS: AIQuickTopic[] = [
  { label: "作者有哪些核心工作经历", prompt: "作者有哪些核心工作经历" },
  { label: "作者擅长什么方向", prompt: "作者擅长什么方向" },
  { label: "作者有哪些证书或资质", prompt: "作者有哪些证书或资质" },
  { label: "作者更适合什么岗位", prompt: "作者更适合什么岗位" },
  { label: "作者有哪些值得关注的优势", prompt: "作者有哪些值得关注的优势" },
];

export function AuthorAiAssistant() {
  return (
    <AiPageAssistant
      title="问 AI：快速了解作者"
      description=""
      placeholder="想快速了解作者？直接问我"
      quickTopics={QUICK_TOPICS}
    />
  );
}
