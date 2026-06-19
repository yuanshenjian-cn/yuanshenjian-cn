"use client";

import { useEffect, useRef, useState } from "react";

import type { GlossaryItem } from "@/lib/ai/glossary";

interface TermHighlighterProps {
  terms: GlossaryItem[];
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
      mark.className = "term-highlight cursor-help rounded bg-primary/10 px-0.5 text-foreground";
      mark.dataset.term = item.term;
      mark.title = item.definition;
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
      if (parent.closest("pre, code, a, .term-highlight")) return NodeFilter.FILTER_REJECT;
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

export function TermHighlighter({ terms, containerSelector = ".prose" }: TermHighlighterProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (terms.length === 0) return;
    const container = document.querySelector(containerSelector) as HTMLElement | null;
    if (!container) return;
    containerRef.current = container;

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

    function handleMouseEnter(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("term-highlight")) return;
      const term = target.dataset.term;
      const item = termMap.get(term || "");
      if (!item) return;
      const rect = target.getBoundingClientRect();
      setTooltip({
        text: item.definition,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }

    function handleMouseLeave() {
      setTooltip(null);
    }

    container.addEventListener("mouseenter", handleMouseEnter, true);
    container.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter, true);
      container.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, [terms, containerSelector]);

  if (tooltip === null) return null;

  return (
    <div
      className="fixed z-50 max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground shadow-lg"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      {tooltip.text}
    </div>
  );
}
