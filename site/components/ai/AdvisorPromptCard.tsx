"use client";

import type { AIQuickTopic } from "@/types/ai";

interface AdvisorPromptCardProps {
  title: string;
  description: string;
  quickTopics: AIQuickTopic[];
  onSelect: (topic: AIQuickTopic) => void;
}

export function AdvisorPromptCard({ title, description, quickTopics, onSelect }: AdvisorPromptCardProps) {
  if (quickTopics.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickTopics.map((topic) => (
          <button
            key={topic.label}
            type="button"
            onClick={() => onSelect(topic)}
            className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {topic.label}
          </button>
        ))}
      </div>
    </section>
  );
}
