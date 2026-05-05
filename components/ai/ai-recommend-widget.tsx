"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AnimatedEllipsisText } from "@/components/ai/animated-ellipsis-text";
import { HUMANIZED_TURNSTILE_MESSAGES } from "@/components/ai/user-facing-messages";
import { aiRecommendStream, USER_FACING_AI_ERROR_MESSAGE } from "@/lib/ai-client";
import type { AIQuickTopic, RecommendResponse, RecommendStreamEvent } from "@/types/ai";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_ACTION = "homepage_recommend";

let turnstileScriptPromise: Promise<void> | null = null;

const answerMarkdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-4 break-words text-base font-semibold leading-6 tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-4 break-words text-base font-semibold leading-6 tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-4 break-words text-sm font-semibold leading-6 tracking-tight text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <h4 className="mt-4 break-words text-sm font-semibold leading-6 tracking-tight text-foreground first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }: { children?: ReactNode }) => (
    <h5 className="mt-4 break-words text-sm font-medium leading-6 tracking-tight text-foreground first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }: { children?: ReactNode }) => (
    <h6 className="mt-4 break-words text-sm font-medium leading-6 tracking-tight text-foreground first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }: { children?: ReactNode }) => <p className="my-3 break-words leading-6 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="my-3 list-disc space-y-1.5 pl-5 first:mt-0 last:mb-0">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="break-words pl-1 leading-6">{children}</li>,
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

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.notReady));
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
      existingScript.addEventListener("error", () => {
        turnstileScriptPromise = null;
        reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.loadFailed));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => {
      turnstileScriptPromise = null;
      reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.loadFailed));
    }, { once: true });
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

interface AiRecommendWidgetProps {
  enabled: boolean;
  workerUrl: string;
  turnstileSiteKey: string;
  turnstileTimeoutMs: number;
  maxInputChars: number;
  quickTopics: AIQuickTopic[];
}

export function AiRecommendWidget({
  enabled,
  workerUrl,
  turnstileSiteKey,
  turnstileTimeoutMs,
  maxInputChars,
  quickTopics,
}: AiRecommendWidgetProps) {
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

  async function doSubmit(nextMessage: string) {
    if (!nextMessage) {
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
    let hasStartedResponse = false;
    let nextAnswer = "";
    let pendingReferences: RecommendResponse["references"] | null = null;

    setIsSubmitting(true);
    setError(null);

    try {
      const turnstileToken = await getTurnstileToken();
      if (requestIdRef.current !== requestId) {
        return;
      }


      const onEvent = (event: RecommendStreamEvent) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        if (event.type === "answer-delta") {
          nextAnswer += event.delta;

          if (!hasStartedResponse) {
            hasStartedResponse = true;
            setResponse(() => ({
              answer: nextAnswer,
              references: pendingReferences ?? [],
            }));
          } else {
            setResponse((previous) =>
              previous
                ? {
                    ...previous,
                    answer: nextAnswer,
                  }
                : {
                    answer: nextAnswer,
                    references: pendingReferences ?? [],
                  },
            );
          }
          return;
        }

        if (event.type === "references") {
          if (hasStartedResponse) {
            setResponse((previous) =>
              previous
                ? {
                    ...previous,
                    references: event.references,
                  }
                : {
                    answer: nextAnswer,
                    references: event.references,
                  },
            );
          } else {
            pendingReferences = event.references;
          }
          return;
        }

        if (event.type === "done") {
          setIsSubmitting(false);
          abortControllerRef.current = null;
          setMessage("");
          return;
        }

        setError(event.message);
        setIsSubmitting(false);
        abortControllerRef.current = null;
      };

      await aiRecommendStream({
        workerUrl,
        scene: "recommend",
        message: nextMessage,
        turnstileToken,
        signal: controller.signal,
        onEvent,
      });

      if (requestIdRef.current === requestId) {
        setIsSubmitting(false);
        abortControllerRef.current = null;
      }
    } catch (submitError) {
      if (controller.signal.aborted || requestIdRef.current !== requestId) {
        return;
      }

      setError(submitError instanceof Error ? submitError.message : USER_FACING_AI_ERROR_MESSAGE);
      setIsSubmitting(false);
      abortControllerRef.current = null;
    } finally {
      resetTurnstileWidget();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await doSubmit(message.trim());
  }

  function handleQuickTopic(topic: AIQuickTopic) {
    setMessage(topic.label);
    // 让输入框先更新，再提交
    setTimeout(() => {
      doSubmit(topic.prompt.trim());
    }, 50);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 transition-colors">
            <Sparkles className="h-4 w-4 text-muted-foreground/70 transition-colors group-focus-within:text-primary" />
          </div>
          <input
            type="text"
            id="ai-recommend-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={maxInputChars}
            placeholder="想找什么主题的文章？直接告诉我"
            className="w-full rounded-2xl bg-background/90 backdrop-blur-md border border-border pl-11 pr-24 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-lg shadow-foreground/5 focus:outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={isSubmitting ? "思考中..." : "问 AI"}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-foreground py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 transition-all ${isSubmitting ? "px-3.5" : "px-4"}`}
          >
            {isSubmitting ? <AnimatedEllipsisText text="思考中" /> : "问 AI"}
          </button>
        </div>
      </form>

      {quickTopics.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {quickTopics.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() => handleQuickTopic(topic)}
              disabled={isSubmitting}
              className="px-3 py-1 rounded-full text-xs bg-background/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {topic.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive text-left">
          {error}
        </div>
      ) : null}

      {response ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-background/80 p-5 text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">AI 回答</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={answerMarkdownComponents}>
                {response.answer}
              </ReactMarkdown>
            </div>
          </div>

          {response.references.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">推荐文章</p>
              <div className="space-y-2">
                {response.references.map((reference) => (
                  <Link
                    key={reference.slug}
                    href={`/articles/${reference.slug}`}
                    className="block rounded-xl border border-border/70 px-4 py-3 transition hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium text-foreground">{reference.title}</h3>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={reference.date}>
                        {new Date(reference.date).toLocaleDateString("zh-CN")}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{reference.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div ref={turnstileContainerRef} aria-hidden="true" className="h-0 overflow-hidden" />
    </div>
  );
}
