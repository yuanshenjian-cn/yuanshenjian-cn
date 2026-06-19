"use client";

import { useEffect, useRef, useState } from "react";

interface TermExplanationBubbleProps {
  term: string;
  definition: string;
  explanation: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

const TYPE_INTERVAL_MS = 18;
const BUBBLE_WIDTH = 336;
const SECTION_LABEL_CLASS = "text-[12px] font-medium text-foreground";

const KEY_POINTS_LEAD = /(?:关键要点|要点|核心要点|主要特点|关键特征|主要能力)\s*[:：]/;
const NUMBERED_ITEM = /^[（(]?[0-9一二三四五六七八九十](?:[)）、]\s*|\.\s+)/;
const BULLET_ITEM = /^[•·\-—]\s*/;
const POINT_SPLITTER = /(?=(?:[（(]?[0-9一二三四五六七八九十][)）、]\s*)|(?:[0-9一二三四五六七八九十]\.\s+)|(?:[•·\-—]\s))/;

interface ParsedExplanation {
  intro: string;
  pointTitle: string;
  points: string[];
}

function parsePoints(text: string): ParsedExplanation {
  const leadMatch = text.match(KEY_POINTS_LEAD);
  if (!leadMatch || leadMatch.index === undefined) {
    return { intro: text, pointTitle: "", points: [] };
  }
  const intro = text.slice(0, leadMatch.index).trim();
  const pointTitle = leadMatch[0].replace(/[:：]\s*$/, "").trim();
  const rest = text.slice(leadMatch.index + leadMatch[0].length).trim();
  if (!rest) return { intro, pointTitle, points: [] };

  const rawPoints = rest
    .split(POINT_SPLITTER)
    .map((item) => item.trim())
    .filter(Boolean);

  const points: string[] = [];
  for (const raw of rawPoints) {
    const cleaned = raw
      .replace(NUMBERED_ITEM, "")
      .replace(BULLET_ITEM, "")
      .replace(/[；;。]\s*$/, "")
      .trim();
    if (cleaned) points.push(cleaned);
  }
  return { intro, pointTitle, points };
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1 py-0.5 text-[12px] font-mono text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function TermExplanationBubble({
  term,
  definition,
  explanation,
  anchorRect,
  onClose,
}: TermExplanationBubbleProps) {
  const [displayedDefinition, setDisplayedDefinition] = useState("");
  const [displayedDetail, setDisplayedDetail] = useState("");
  const [displayedPoints, setDisplayedPoints] = useState("");
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const hasExplanation = explanation.trim().length > 0 && explanation !== definition;
  const parsed = hasExplanation ? parsePoints(explanation) : { intro: "", pointTitle: "", points: [] };
  const hasPoints = parsed.points.length > 0;
  const detailText = hasPoints ? parsed.intro : explanation;
  const pointsText = parsed.points.join("\n");
  const displayedPointItems = displayedPoints.split("\n").filter(Boolean);

  useEffect(() => {
    setDisplayedDefinition("");
    if (!definition) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedDefinition(definition.slice(0, index));
      if (index >= definition.length) {
        setDisplayedDefinition(definition);
        window.clearInterval(timer);
      }
    }, TYPE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [definition]);

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
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - BUBBLE_WIDTH - 12));
  const top = above ? anchorRect.top - 12 : anchorRect.bottom + 12;
  const isDefinitionStreaming = displayedDefinition.length < definition.length;
  const showExplanation = hasExplanation && !isDefinitionStreaming;
  const isDetailStreaming = showExplanation && displayedDetail.length < detailText.length;
  const showPoints = showExplanation && hasPoints && !isDetailStreaming;
  const isPointsStreaming = showPoints && displayedPoints.length < pointsText.length;

  useEffect(() => {
    setDisplayedDetail("");
    if (!showExplanation || !detailText) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedDetail(detailText.slice(0, index));
      if (index >= detailText.length) {
        setDisplayedDetail(detailText);
        window.clearInterval(timer);
      }
    }, TYPE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [detailText, showExplanation]);

  useEffect(() => {
    setDisplayedPoints("");
    if (!showPoints || !pointsText) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedPoints(pointsText.slice(0, index));
      if (index >= pointsText.length) {
        setDisplayedPoints(pointsText);
        window.clearInterval(timer);
      }
    }, TYPE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [pointsText, showPoints]);

  return (
    <div
      ref={bubbleRef}
      className="not-prose fixed z-50 max-h-[70vh] w-80 max-w-[calc(100vw-24px)] origin-top-left animate-in overflow-y-auto rounded-lg border border-border bg-background p-3.5 shadow-lg fade-in zoom-in-95 duration-150"
      style={{
        left,
        top,
        transform: above ? "translateY(-100%)" : "none",
      }}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">{term}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">术语</span>
      </div>

      <div className="mb-2">
        <span className={SECTION_LABEL_CLASS}>定义</span>
        <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
          {renderInlineCode(displayedDefinition)}
          {isDefinitionStreaming ? (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
          ) : null}
        </p>
      </div>

      {showExplanation ? (
        <div>
          <span className={SECTION_LABEL_CLASS}>详解</span>
          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-6 text-muted-foreground">
            {renderInlineCode(displayedDetail)}
            {isDetailStreaming ? (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
            ) : null}
          </p>
          {showPoints ? (
            <div className="mt-3 space-y-1">
              <div className={SECTION_LABEL_CLASS}>{parsed.pointTitle}</div>
              <ul className="m-0 list-none space-y-1 pl-0.5">
                {displayedPointItems.map((point, index) => (
                  <li key={index} className="m-0 flex gap-2 text-[13px] leading-5 text-muted-foreground">
                    <span className="mt-[8px] h-1 w-1 flex-shrink-0 rounded-full bg-primary/70" />
                    <span>
                      {renderInlineCode(point)}
                      {index === displayedPointItems.length - 1 && isPointsStreaming ? (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
