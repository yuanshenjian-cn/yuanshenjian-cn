"use client";

import { useCallback, useEffect, useState } from "react";

import { TermExplanationBubble } from "@/components/article/TermExplanationBubble";
import { fetchGlossary, type GlossaryItem } from "@/lib/ai/glossary";

interface TermHighlighterProps {
  scene?: string;
  domain?: string;
  containerSelector?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wrapTextNode(node: Text, termMap: Map<string, GlossaryItem>) {
  const text = node.textContent || "";
  const terms = Array.from(termMap.keys());
  const pattern = terms.map(escapeRegExp).join("|");
  if (!pattern) return;
  const regex = new RegExp(`(${pattern})`, "g");
  const parts = text.split(regex);
  if (parts.length <= 1) return;

  const fragment = document.createDocumentFragment();
  for (const part of parts) {
    if (!part) continue;
    const item = termMap.get(part);
    if (item) {
      const mark = document.createElement("mark");
      mark.className = "term-highlight cursor-pointer bg-transparent border-b border-dashed border-foreground/25 text-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:border-foreground/60 hover:border-solid";
      mark.dataset.term = item.term;
      mark.dataset.definition = item.definition;
      mark.dataset.explanation = item.explanation;
      mark.dataset.references = JSON.stringify(item.references || []);
      mark.textContent = part;
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
  }
  node.parentNode?.replaceChild(fragment, node);
}

function walkTextNodes(root: HTMLElement, termMap: Map<string, GlossaryItem>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("pre, code, a, .term-highlight, .term-highlight-ignore")) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let current: Node | null = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of nodes) {
    wrapTextNode(node, termMap);
  }
}

interface ActiveBubble {
  term: string;
  definition: string;
  explanation: string;
  references: Array<{ label: string; url: string }>;
  rect: DOMRect;
}

export function TermHighlighter({ scene, domain, containerSelector = ".prose" }: TermHighlighterProps) {
  const [terms, setTerms] = useState<GlossaryItem[]>([]);
  const [activeBubble, setActiveBubble] = useState<ActiveBubble | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchGlossary(scene, domain).then((result) => {
      if (!cancelled && result.length > 0) setTerms(result);
    });
    return () => {
      cancelled = true;
    };
  }, [scene, domain]);

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

    const termMap = new Map<string, GlossaryItem>();
    for (const item of terms) {
      termMap.set(item.term, item);
      for (const alias of item.aliases) {
        if (alias.trim()) {
          termMap.set(alias.trim(), item);
        }
      }
    }

    walkTextNodes(container, termMap);

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
