"use client";

import { useEffect, useRef, useState } from "react";

import { emitAskAdvisor } from "@/lib/ai/advisor-events";

const DEFAULT_MAX_INPUT_CHARS = 200;

const QUICK_ACTIONS = [
  { label: "解释", question: "解释这段话的含义" },
  { label: "上下文", question: "这段话和上下文有什么关系" },
  { label: "相关文章", question: "找和这段话相关的文章" },
];

interface TextSelectionAIActionsProps {
  containerSelector?: string;
  maxInputChars?: number;
}

function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() || "";
}

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return range.getBoundingClientRect();
}

function buildAskPrompt(selectedText: string, question: string, maxInputChars: number): string {
  const fixed = `""\n\n${question}`;
  const maxQuoteLength = Math.max(0, maxInputChars - fixed.length);
  const quote = selectedText.length <= maxQuoteLength ? selectedText : `${selectedText.slice(0, maxQuoteLength)}...`;
  return `"${quote}"\n\n${question}`;
}

export function TextSelectionAIActions({ containerSelector = ".prose", maxInputChars = DEFAULT_MAX_INPUT_CHARS }: TextSelectionAIActionsProps) {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number; placement: "above" | "below" } | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function isInsideActions(target: EventTarget | null): boolean {
      return target instanceof Node && !!actionsRef.current?.contains(target);
    }

    function handleMouseUp(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const container = document.querySelector(containerSelector);
      if (isInsideActions(target)) {
        return;
      }
      if (!container || !container.contains(target)) {
        setSelectedText("");
        setPosition(null);
        return;
      }

      const text = getSelectedText();
      if (!text) {
        setSelectedText("");
        setPosition(null);
        return;
      }

      const rect = getSelectionRect();
      if (!rect) return;

      const estimatedMenuHeight = 40;
      const gap = 8;
      const showAbove = rect.top >= estimatedMenuHeight + gap * 2;
      const placement: "above" | "below" = showAbove ? "above" : "below";

      setSelectedText(text);
      setPosition({
        x: rect.left + rect.width / 2,
        y: placement === "above" ? rect.top - gap : rect.bottom + gap,
        placement,
      });
    }

    function handleSelectionChange() {
      if (isInsideActions(document.activeElement)) {
        return;
      }
      const text = getSelectedText();
      if (!text) {
        setSelectedText("");
        setPosition(null);
      }
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerSelector]);

  function ask(question: string) {
    emitAskAdvisor(buildAskPrompt(selectedText, question, maxInputChars));
    setSelectedText("");
    setPosition(null);
  }

  if (!selectedText || !position) return null;

  return (
    <div
      ref={actionsRef}
      className="fixed z-50 flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: position.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => ask(action.question)}
          className="rounded-full px-2.5 py-1 text-xs text-foreground transition hover:bg-muted"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
