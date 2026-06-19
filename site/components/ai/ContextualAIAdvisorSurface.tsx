"use client";

import { useState } from "react";

import { AdvisorPromptCard } from "@/components/ai/AdvisorPromptCard";
import { ContextualAIAdvisor } from "@/components/ai/ContextualAIAdvisor";
import type { AdvisorContextValue, AIQuickTopic } from "@/types/ai";

interface ContextualAIAdvisorSurfaceProps {
  context: AdvisorContextValue;
  cardDescription: string;
  cardTitle: string;
  maxInputChars: number;
  historyRounds: number;
  turnstileSiteKey: string;
  turnstileTimeoutMs: number;
  workerUrl: string;
  dynamicQuickTopics?: () => AIQuickTopic[];
}

export function ContextualAIAdvisorSurface({
  context,
  cardDescription,
  cardTitle,
  maxInputChars,
  historyRounds,
  turnstileSiteKey,
  turnstileTimeoutMs,
  workerUrl,
  dynamicQuickTopics,
}: ContextualAIAdvisorSurfaceProps) {
  const [promptState, setPromptState] = useState({ prompt: "", version: 0 });

  function handleSelect(topic: AIQuickTopic) {
    setPromptState((current) => ({ prompt: topic.prompt, version: current.version + 1 }));
  }

  return (
    <>
      <AdvisorPromptCard title={cardTitle} description={cardDescription} quickTopics={context.quickTopics} onSelect={handleSelect} />
      <ContextualAIAdvisor
        context={context}
        historyRounds={historyRounds}
        maxInputChars={maxInputChars}
        turnstileSiteKey={turnstileSiteKey}
        turnstileTimeoutMs={turnstileTimeoutMs}
        workerUrl={workerUrl}
        initialPrompt={promptState.prompt || undefined}
        promptVersion={promptState.version}
        dynamicQuickTopics={dynamicQuickTopics}
      />
    </>
  );
}
