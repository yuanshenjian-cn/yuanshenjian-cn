"use client";

import { useCallback, useEffect, useRef } from "react";

import type { AdvisorScene } from "@/types/ai";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const TURNSTILE_ACTIONS: Record<AdvisorScene, string> = {
  article: "article_page_ai",
  author: "author_page_ai",
  health: "contextual_ai_advisor",
  "health-column": "contextual_ai_advisor",
  ai: "contextual_ai_advisor",
  "ai-column": "contextual_ai_advisor",
  investment: "contextual_ai_advisor",
  "investment-column": "contextual_ai_advisor",
};

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile 仅能在浏览器环境使用。"));
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }
  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          turnstileScriptPromise = null;
          reject(new Error("Turnstile 脚本加载失败，请稍后刷新重试。"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      turnstileScriptPromise = null;
      reject(new Error("Turnstile 脚本加载失败，请稍后刷新重试。"));
    };
    document.head.appendChild(script);
  });
  return turnstileScriptPromise;
}

export function useTurnstileToken(scene: AdvisorScene, siteKey: string, timeoutMs: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearWaiters = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearWaiters();
    };
  }, [clearWaiters]);

  const getToken = useCallback(async (): Promise<string> => {
    if (!siteKey) {
      throw new Error("Turnstile 站点密钥未配置（NEXT_PUBLIC_TURNSTILE_SITE_KEY 为空）。");
    }
    try {
      await loadTurnstileScript();
    } catch (error) {
      console.error("[Turnstile] script load failed", error);
      throw error;
    }
    if (!window.turnstile || !containerRef.current) {
      console.error("[Turnstile] init failed", {
        hasGlobal: Boolean(window.turnstile),
        hasContainer: Boolean(containerRef.current),
      });
      throw new Error("Turnstile 初始化失败，请稍后重试。");
    }
    if (!widgetIdRef.current) {
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: TURNSTILE_ACTIONS[scene],
          size: "flexible",
          execution: "execute",
          appearance: "interaction-only",
          callback: (token) => {
            const resolve = resolveRef.current;
            clearWaiters();
            resolve?.(token);
          },
          "error-callback": (code?: string) => {
            console.error("[Turnstile] error-callback", { code, scene, siteKey });
            const reject = rejectRef.current;
            clearWaiters();
            reject?.(new Error(`安全验证失败（${code ?? "unknown"}），请稍后重试。`));
          },
          "unsupported-callback": () => {
            console.error("[Turnstile] unsupported-callback: browser/region not supported", { scene });
            const reject = rejectRef.current;
            clearWaiters();
            reject?.(new Error("当前浏览器或网络不支持人机验证，请换浏览器或网络再试。"));
          },
        });
        console.info("[Turnstile] widget rendered", { widgetId: widgetIdRef.current, scene });
      } catch (error) {
        console.error("[Turnstile] render threw", error);
        throw error;
      }
    }
    return new Promise<string>((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      timeoutRef.current = window.setTimeout(() => {
        console.error(
          "[Turnstile] token timeout after",
          timeoutMs,
          "ms; check Cloudflare hostname allowlist (yuanshenjian.cn) and widget status.",
          { scene, siteKey },
        );
        const currentReject = rejectRef.current;
        clearWaiters();
        currentReject?.(new Error("安全验证超时，请稍后再试。"));
      }, timeoutMs);
      const widgetId = widgetIdRef.current;
      if (!widgetId) {
        clearWaiters();
        reject(new Error("Turnstile 初始化失败，请稍后重试。"));
        return;
      }
      try {
        window.turnstile?.execute(widgetId);
      } catch (error) {
        console.error("[Turnstile] execute threw", error);
        clearWaiters();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, [clearWaiters, scene, siteKey, timeoutMs]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { containerRef, getToken, reset };
}
