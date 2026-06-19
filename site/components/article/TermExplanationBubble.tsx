"use client";

import { useEffect, useRef, useState } from "react";

interface TermExplanationBubbleProps {
  term: string;
  definition: string;
  explanation: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

const TYPE_INTERVAL_MS = 25;

export function TermExplanationBubble({
  term,
  definition,
  explanation,
  anchorRect,
  onClose,
}: TermExplanationBubbleProps) {
  const [displayed, setDisplayed] = useState("");
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayed("");
    const text = explanation || definition;
    if (!text) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, TYPE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [explanation, definition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const above = anchorRect.top > window.innerHeight * 0.6;
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - 312));
  const top = above ? anchorRect.top - 12 : anchorRect.bottom + 12;
  const fullText = explanation || definition;
  const isStreaming = displayed.length < fullText.length;

  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 w-72 max-w-[calc(100vw-24px)] origin-top-left animate-in zoom-in-95 fade-in duration-150 rounded-lg border border-border bg-background p-3.5 shadow-lg"
      style={{
        left,
        top,
        transform: above ? "translateY(-100%)" : "none",
      }}
    >
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-medium text-foreground">{term}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">术语</span>
      </div>

      <p className="text-[13px] leading-6 text-muted-foreground">
        {displayed}
        {isStreaming ? <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" /> : null}
      </p>
    </div>
  );
}
