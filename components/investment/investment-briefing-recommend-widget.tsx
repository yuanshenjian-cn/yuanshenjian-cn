"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatedEllipsisText } from "@/components/ai/animated-ellipsis-text";
import { HUMANIZED_TURNSTILE_MESSAGES } from "@/components/ai/user-facing-messages";
import { aiInvestmentBriefingRecommendStream, USER_FACING_AI_ERROR_MESSAGE } from "@/lib/ai-client";
import type { RecommendResponse, RecommendStreamEvent } from "@/types/ai";

const TURNSTILE_ACTION = "investment_briefing_recommend";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const answerMarkdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-4 break-words text-sm font-semibold leading-5 tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-4 break-words text-sm font-semibold leading-5 tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-4 break-words text-[13px] font-semibold leading-5 tracking-tight text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => <p className="my-2.5 break-words text-[13px] leading-5 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="my-2.5 list-disc space-y-1 pl-4.5 text-[13px] first:mt-0 last:mb-0">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="my-2.5 list-decimal space-y-1 pl-4.5 text-[13px] first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="break-words pl-0.5 leading-5">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} className="break-all text-primary hover:underline">
      {children}
    </a>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">{children}</code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="my-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm text-foreground first:mt-0 last:mb-0">{children}</pre>
  ),
} as const;

interface InvestmentBriefingRecommendWidgetProps {
  enabled: boolean;
  maxInputChars: number;
  turnstileSiteKey: string;
  turnstileTimeoutMs: number;
  workerUrl: string;
}

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.loadFailed)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.loadFailed));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function InvestmentBriefingRecommendWidget({
  enabled,
  maxInputChars,
  turnstileSiteKey,
  turnstileTimeoutMs,
  workerUrl,
}: InvestmentBriefingRecommendWidgetProps) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileResolveRef = useRef<((token: string) => void) | null>(null);
  const turnstileRejectRef = useRef<((error: Error) => void) | null>(null);
  const turnstileTimeoutRef = useRef<number | null>(null);

  const isConfigured = enabled && turnstileSiteKey.trim().length > 0;
  const displayedBriefings = response?.references ?? [];
  const canSubmit = isConfigured && message.trim().length > 0 && !isSubmitting;

  function clearTurnstileWaiters() {
    if (turnstileTimeoutRef.current !== null) {
      window.clearTimeout(turnstileTimeoutRef.current);
      turnstileTimeoutRef.current = null;
    }

    turnstileResolveRef.current = null;
    turnstileRejectRef.current = null;
  }

  function resetTurnstileWidget() {
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  function rejectTurnstileRequest(messageText: string, shouldReset = true) {
    const reject = turnstileRejectRef.current;
    clearTurnstileWaiters();

    if (shouldReset) {
      resetTurnstileWidget();
    }

    reject?.(new Error(messageText));
  }

  function resolveTurnstileRequest(token: string) {
    const resolve = turnstileResolveRef.current;
    clearTurnstileWaiters();
    resolve?.(token);
  }

  useEffect(() => () => {
    clearTurnstileWaiters();
    abortControllerRef.current?.abort();
  }, []);

  async function ensureTurnstileWidget(): Promise<string> {
    await loadTurnstileScript();

    if (!window.turnstile) {
      throw new Error(HUMANIZED_TURNSTILE_MESSAGES.notReady);
    }

    if (!turnstileContainerRef.current) {
      throw new Error(HUMANIZED_TURNSTILE_MESSAGES.initFailed);
    }

    if (!turnstileWidgetIdRef.current) {
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        action: TURNSTILE_ACTION,
        size: "flexible",
        execution: "execute",
        appearance: "interaction-only",
        callback: (token) => resolveTurnstileRequest(token),
        "error-callback": () => rejectTurnstileRequest(HUMANIZED_TURNSTILE_MESSAGES.validationFailed),
        "expired-callback": () => rejectTurnstileRequest(HUMANIZED_TURNSTILE_MESSAGES.expired, false),
        "timeout-callback": () => rejectTurnstileRequest(HUMANIZED_TURNSTILE_MESSAGES.timeout),
      });
    }

    return turnstileWidgetIdRef.current;
  }

  async function getTurnstileToken(): Promise<string> {
    const widgetId = await ensureTurnstileWidget();

    return new Promise<string>((resolve, reject) => {
      turnstileResolveRef.current = resolve;
      turnstileRejectRef.current = reject;
      turnstileTimeoutRef.current = window.setTimeout(() => {
        rejectTurnstileRequest(HUMANIZED_TURNSTILE_MESSAGES.timeout);
      }, turnstileTimeoutMs);

      window.turnstile?.execute(widgetId);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = message.trim();

    if (!nextMessage) {
      setResponse(null);
      setError(null);
      return;
    }

    if (nextMessage.length > maxInputChars) {
      setError(`输入内容不能超过 ${maxInputChars} 个字符，请精简后再试。`);
      return;
    }

    if (!isConfigured) {
      setError(HUMANIZED_TURNSTILE_MESSAGES.recommendNotConfigured);
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let nextAnswer = "";
    let pendingReferences: RecommendResponse["references"] = [];

    setIsSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const turnstileToken = await getTurnstileToken();
      if (requestIdRef.current !== requestId) return;

      const onEvent = (streamEvent: RecommendStreamEvent) => {
        if (requestIdRef.current !== requestId) return;

        if (streamEvent.type === "answer-delta") {
          nextAnswer += streamEvent.delta;
          setResponse({ answer: nextAnswer, references: pendingReferences });
          return;
        }

        if (streamEvent.type === "references") {
          pendingReferences = streamEvent.references;
          setResponse({ answer: nextAnswer, references: streamEvent.references });
          return;
        }

        if (streamEvent.type === "done") {
          setIsSubmitting(false);
          abortControllerRef.current = null;
          return;
        }

        setError(streamEvent.message);
        setIsSubmitting(false);
        abortControllerRef.current = null;
      };

      await aiInvestmentBriefingRecommendStream({
        workerUrl,
        scene: "investment-briefing-recommend",
        message: nextMessage,
        context: { range: "30d" },
        turnstileToken,
        signal: controller.signal,
        onEvent,
      });
    } catch (submitError) {
      if (controller.signal.aborted || requestIdRef.current !== requestId) return;
      setError(submitError instanceof Error ? submitError.message : USER_FACING_AI_ERROR_MESSAGE);
      setIsSubmitting(false);
      abortControllerRef.current = null;
    } finally {
      resetTurnstileWidget();
    }
  }

  return (
    <section className="mb-10 rounded-2xl border bg-card/70 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-medium tracking-tight">投资简报推荐</h2>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">基于“近 30 天”的投资简报范围推荐，不构成投资建议。</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={maxInputChars}
            placeholder="输入主题，例如 英伟达财报、港股回购、半导体设备"
            className="w-full rounded-2xl border bg-background py-3 pl-11 pr-24 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? <AnimatedEllipsisText text="查找中" /> : "问 AI"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {response?.answer ? (
        <div className="mt-4 rounded-xl border bg-background/70 px-4 py-3 text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={answerMarkdownComponents}>
            {response.answer}
          </ReactMarkdown>
        </div>
      ) : null}

      {response ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">近 30 天内的投资简报推荐结果</p>
          {displayedBriefings.length > 0 ? (
            displayedBriefings.map((briefing) => (
              <Link
                key={briefing.slug}
                href={("url" in briefing && briefing.url) || `/investment/briefings/${briefing.slug}`}
                className="block rounded-xl border px-4 py-3 transition hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground">{briefing.title}</h3>
                  <time className="text-xs text-muted-foreground" dateTime={briefing.date}>
                    {new Date(briefing.date).toLocaleDateString("zh-CN")}
                  </time>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{briefing.excerpt}</p>
                {briefing.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {briefing.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
              这个时间范围内还没有投资简报。
            </p>
          )}
        </div>
      ) : null}

      <div ref={turnstileContainerRef} aria-hidden="true" className="h-0 overflow-hidden" />
    </section>
  );
}
