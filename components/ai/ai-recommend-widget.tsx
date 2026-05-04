"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { aiChat } from "@/lib/ai-client";
import type { AIChatResponse } from "@/types/ai";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_TIMEOUT_MS = 15000;
const TURNSTILE_ACTION = "homepage_recommend";

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile 只能在浏览器中使用。"));
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
        reject(new Error("Turnstile 加载失败，请稍后重试。"));
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
      reject(new Error("Turnstile 加载失败，请稍后重试。"));
    }, { once: true });
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

const QUICK_TOPICS = ["Claude Code", "AI 编程", "简单设计", "敏捷方法"];

interface AiRecommendWidgetProps {
  enabled: boolean;
  workerUrl: string;
  turnstileSiteKey: string;
}

export function AiRecommendWidget({ enabled, workerUrl, turnstileSiteKey }: AiRecommendWidgetProps) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AIChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, []);

  async function ensureTurnstileWidget(): Promise<string> {
    await loadTurnstileScript();

    if (!window.turnstile) {
      throw new Error("Turnstile 尚未就绪，请稍后再试。");
    }

    if (!turnstileContainerRef.current) {
      throw new Error("Turnstile 容器初始化失败，请刷新页面后重试。");
    }

    if (!turnstileWidgetIdRef.current) {
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        action: TURNSTILE_ACTION,
        size: "flexible",
        execution: "execute",
        appearance: "interaction-only",
        callback: (token) => resolveTurnstileRequest(token),
        "error-callback": () => rejectTurnstileRequest("Turnstile 校验失败，请稍后重试。"),
        "expired-callback": () => rejectTurnstileRequest("Turnstile 已过期，请重新提交。", false),
        "timeout-callback": () => rejectTurnstileRequest("Turnstile 响应超时，请稍后重试。"),
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
        rejectTurnstileRequest("Turnstile 响应超时，请稍后重试。");
      }, TURNSTILE_TIMEOUT_MS);

      window.turnstile?.execute(widgetId);
    });
  }

  async function doSubmit(nextMessage: string) {
    if (!nextMessage) {
      return;
    }

    if (!isConfigured) {
      setError("AI 推荐功能尚未配置完成，暂时无法发起请求。");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const turnstileToken = await getTurnstileToken();
      const nextResponse = await aiChat({
        workerUrl,
        scene: "recommend",
        message: nextMessage,
        turnstileToken,
      });

      setResponse(nextResponse);
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "AI 请求失败，请稍后重试。");
    } finally {
      resetTurnstileWidget();
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await doSubmit(message.trim());
  }

  function handleQuickTopic(topic: string) {
    setMessage(topic);
    // 让输入框先更新，再提交
    setTimeout(() => {
      doSubmit(topic.trim());
    }, 50);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            id="ai-recommend-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="想找什么主题的文章？直接告诉我"
            className="w-full rounded-2xl bg-background/90 backdrop-blur-md border border-border pl-11 pr-24 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-lg shadow-foreground/5 focus:outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            {isSubmitting ? "思考中..." : "问 AI"}
          </button>
        </div>
      </form>

      {/* 快捷主题 + 专栏链接 */}
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        <Link
          href="/ai/ai-frontier"
          className="px-3 py-1 rounded-full text-xs bg-background/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background hover:border-border transition-all"
        >
          AI前沿
        </Link>
        <Link
          href="/ai/ai-frontier"
          className="px-3 py-1 rounded-full text-xs bg-background/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background hover:border-border transition-all"
        >
          OpenAI
        </Link>
        <Link
          href="/ai/deepseek"
          className="px-3 py-1 rounded-full text-xs bg-background/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background hover:border-border transition-all"
        >
          DeepSeek
        </Link>
        {QUICK_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => handleQuickTopic(topic)}
            disabled={isSubmitting}
            className="px-3 py-1 rounded-full text-xs bg-background/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {topic}
          </button>
        ))}
      </div>

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
            <p className="text-sm leading-7 text-muted-foreground">{response.answer}</p>
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
