"use client";

import { useCallback, useEffect, useState } from "react";

import { TermExplanationBubble } from "@/components/article/TermExplanationBubble";
import { fetchGlossary, type GlossaryItem } from "@/lib/ai/glossary";
import { buildGlossaryTermMap, highlightGlossaryTerms } from "@/lib/ai/glossary-highlighter";

interface TermHighlighterProps {
  containerSelector?: string;
}

interface ActiveBubble {
  term: string;
  definition: string;
  explanation: string;
  references: Array<{ label: string; url: string }>;
  rect: DOMRect;
}

export function TermHighlighter({ containerSelector = ".prose" }: TermHighlighterProps) {
  const [terms, setTerms] = useState<GlossaryItem[]>([]);
  const [activeBubble, setActiveBubble] = useState<ActiveBubble | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchGlossary().then((result) => {
      if (!cancelled && result.length > 0) setTerms(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains("term-highlight")) return;
    event.preventDefault();
    event.stopPropagation();
    const term = target.dataset.term || "";
    const definition = target.dataset.definition || "";
    const explanation = target.dataset.explanation || "";
    const references = JSON.parse(target.dataset.references || "[]") as Array<{ label: string; url: string }>;
    const rect = target.getBoundingClientRect();
    setActiveBubble({ term, definition, explanation, references, rect });
  }, []);

  useEffect(() => {
    if (terms.length === 0) return;
    const container = document.querySelector(containerSelector) as HTMLElement | null;
    if (!container) return;

    highlightGlossaryTerms(container, buildGlossaryTermMap(terms));

    container.addEventListener("click", handleClick, true);

    return () => {
      container.removeEventListener("click", handleClick, true);
    };
  }, [terms, containerSelector, handleClick]);

  if (activeBubble === null) return null;

  return (
    <TermExplanationBubble
      term={activeBubble.term}
      definition={activeBubble.definition}
      explanation={activeBubble.explanation}
      references={activeBubble.references}
      anchorRect={activeBubble.rect}
      onClose={() => setActiveBubble(null)}
    />
  );
}
