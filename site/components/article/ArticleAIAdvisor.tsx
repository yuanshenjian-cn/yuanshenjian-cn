"use client";

import { ContextualAIAdvisorSurface } from "@/components/ai/ContextualAIAdvisorSurface";
import { useReadingProgress } from "@/hooks/article/use-reading-progress";
import { buildAdvisorContext, defaultAdvisorQuickTopics, resolveAdvisorDomainByPath } from "@/lib/advisor-context";
import { config } from "@/lib/config";
import type { Post } from "@/types/blog";
import type { AIQuickTopic } from "@/types/ai";

interface ArticleAIAdvisorProps {
  post: Post;
  headings: { id: string; text: string; level: number }[];
}

function buildDynamicQuickTopics(activeSection: { id: string; text: string } | null): AIQuickTopic[] {
  if (!activeSection) {
    return [
      { label: "3 行总结这篇文章", prompt: "3 行总结这篇文章" },
      { label: "核心观点是什么", prompt: "这篇文章的核心观点是什么" },
      { label: "适合谁读", prompt: "这篇文章适合谁读" },
    ];
  }
  return [
    { label: `"${activeSection.text}" 讲了什么`, prompt: `请解释一下"${activeSection.text}"这一节的主要内容` },
    { label: "这一节和前文有什么关系", prompt: `文章中的"${activeSection.text}"这一节和前面的内容是什么关系` },
    { label: "这里可以怎么实践", prompt: `针对"${activeSection.text}"这一节的内容，我可以怎么实践` },
  ];
}

export function ArticleAIAdvisor({ post, headings }: ArticleAIAdvisorProps) {
  const activeSection = useReadingProgress(headings);
  const domain = resolveAdvisorDomainByPath(post.relativePath);

  return (
    <ContextualAIAdvisorSurface
      context={buildAdvisorContext({
        scene: "article",
        title: post.title,
        domain,
        pageSlug: post.slug,
        articleSlug: post.slug,
        quickTopics: defaultAdvisorQuickTopics("article"),
      })}
      cardTitle="AI 带你快速读懂文章"
      cardDescription=""
      workerUrl={config.ai.workerUrl}
      turnstileSiteKey={config.ai.turnstileSiteKey}
      turnstileTimeoutMs={config.ai.turnstile.timeoutMs.contextualAdvisor}
      maxInputChars={config.ai.maxInputChars}
      historyRounds={config.ai.contextualAdvisorHistoryRounds}
      dynamicQuickTopics={() => buildDynamicQuickTopics(activeSection ? { id: activeSection.id, text: activeSection.text } : null)}
    />
  );
}
