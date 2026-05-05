"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

import { AIStreamUnsupportedError, aiChat, aiChatStream } from "@/lib/ai-client";
import type { PageReference, PageStreamEvent } from "@/types/ai";

const TURNSTILE_ACTIONS = {
  article: "article_page_ai",
  author: "author_page_ai",
} as const;

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_TIMEOUT_MS = 10000;

let turnstileScriptPromise: Promise<void> | null = null;

interface SubmitMessageOptions {
  scrollToResult?: boolean;
}

interface PageAIAssistantContextValue {
  currentAnswer: string;
  currentError: string | null;
  currentReferences: PageReference[];
  isInterrupted: boolean;
  isStreaming: boolean;
  maxInputChars: number;
  resultContainerRef: MutableRefObject<HTMLDivElement | null>;
  submitMessage: (message: string, options?: SubmitMessageOptions) => Promise<boolean>;
}

interface PageAIAssistantProviderProps {
  children: ReactNode;
  maxInputChars: number;
  streamEnabled: boolean;
  turnstileSiteKey: string;
  workerUrl: string;
}

interface ArticlePageAIAssistantProviderProps extends PageAIAssistantProviderProps {
  scene: "article";
  context: { slug: string };
}

interface AuthorPageAIAssistantProviderProps extends PageAIAssistantProviderProps {
  scene: "author";
  context: { page: "author" };
}

type TypedPageAIAssistantProviderProps =
  | ArticlePageAIAssistantProviderProps
  | AuthorPageAIAssistantProviderProps;

const PageAIAssistantContext = createContext<PageAIAssistantContextValue | null>(null);

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
      existingScript.addEventListener(
        "error",
        () => {
          turnstileScriptPromise = null;
          reject(new Error("Turnstile 加载失败，请稍后重试。"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        turnstileScriptPromise = null;
        reject(new Error("Turnstile 加载失败，请稍后重试。"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function PageAIAssistantProvider({
  children,
  context,
  maxInputChars,
  scene,
  streamEnabled,
  turnstileSiteKey,
  workerUrl,
}: TypedPageAIAssistantProviderProps) {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentReferences, setCurrentReferences] = useState<PageReference[]>([]);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const answerRef = useRef("");
  const requestIdRef = useRef(0);
  const resultContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileResolveRef = useRef<((token: string) => void) | null>(null);
  const turnstileRejectRef = useRef<((error: Error) => void) | null>(null);
  const turnstileRequestIdRef = useRef(0);
  const turnstileTimeoutRef = useRef<number | null>(null);

  function clearTurnstileWaiters() {
    if (turnstileTimeoutRef.current !== null) {
      window.clearTimeout(turnstileTimeoutRef.current);
      turnstileTimeoutRef.current = null;
    }

    turnstileRequestIdRef.current += 1;
    turnstileResolveRef.current = null;
    turnstileRejectRef.current = null;
  }

  function resetTurnstileWidget() {
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  function rejectTurnstileRequest(messageText: string, requestId?: number, shouldReset = true) {
    if (requestId !== undefined && requestId !== turnstileRequestIdRef.current) {
      return;
    }

    const reject = turnstileRejectRef.current;
    clearTurnstileWaiters();

    if (shouldReset) {
      resetTurnstileWidget();
    }

    reject?.(new Error(messageText));
  }

  function resolveTurnstileRequest(token: string, requestId?: number) {
    if (requestId !== undefined && requestId !== turnstileRequestIdRef.current) {
      return;
    }

    const resolve = turnstileResolveRef.current;
    clearTurnstileWaiters();
    resolve?.(token);
  }

  useEffect(
    () => () => {
      clearTurnstileWaiters();
      abortControllerRef.current?.abort();
    },
    [],
  );

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
        action: TURNSTILE_ACTIONS[scene],
        size: "flexible",
        execution: "execute",
        appearance: "interaction-only",
        callback: (token) => resolveTurnstileRequest(token),
        "error-callback": () => rejectTurnstileRequest("Turnstile 校验失败，请稍后重试。"),
        "expired-callback": () => rejectTurnstileRequest("Turnstile 已过期，请重新提交。", undefined, false),
        "timeout-callback": () => rejectTurnstileRequest("Turnstile 响应超时，请稍后重试。"),
      });
    }

    return turnstileWidgetIdRef.current;
  }

  async function getTurnstileToken(): Promise<string> {
    clearTurnstileWaiters();
    const widgetId = await ensureTurnstileWidget();
    const requestId = turnstileRequestIdRef.current;

    return new Promise<string>((resolve, reject) => {
      turnstileResolveRef.current = resolve;
      turnstileRejectRef.current = reject;
      turnstileTimeoutRef.current = window.setTimeout(() => {
        rejectTurnstileRequest("Turnstile 响应超时，请稍后重试。", requestId);
      }, TURNSTILE_TIMEOUT_MS);

      window.turnstile?.execute(widgetId);
    });
  }

  function updateAnswer(nextValue: string | ((previous: string) => string)) {
    setCurrentAnswer((previous) => {
      const resolved = typeof nextValue === "function" ? nextValue(previous) : nextValue;
      answerRef.current = resolved;
      return resolved;
    });
  }

  async function runNonStreamFallback(requestId: number, nextMessage: string, turnstileToken: string): Promise<boolean> {
    const response =
      scene === "article"
        ? await aiChat({
            workerUrl,
            scene: "article",
            message: nextMessage,
            context,
            turnstileToken,
          })
        : await aiChat({
            workerUrl,
            scene: "author",
            message: nextMessage,
            context,
            turnstileToken,
          });

    if (requestIdRef.current !== requestId) {
      return true;
    }

    updateAnswer(response.answer);
    setCurrentReferences(response.references);
    setIsInterrupted(false);
    setIsStreaming(false);
    abortControllerRef.current = null;
    return true;
  }

  async function submitMessage(message: string, options: SubmitMessageOptions = {}): Promise<boolean> {
    const nextMessage = message.trim();

    if (!nextMessage) {
      return false;
    }

    if (nextMessage.length > maxInputChars) {
      setCurrentError(`输入内容不能超过 ${maxInputChars} 个字符，请精简后再试。`);
      return false;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let hasStartedResponse = false;
    let pendingReferences: PageReference[] | null = null;

    setCurrentError(null);
    setIsInterrupted(false);
    setIsStreaming(true);

    if (options.scrollToResult) {
      resultContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    let turnstileToken = "";

    try {
      turnstileToken = await getTurnstileToken();
      if (requestIdRef.current !== requestId) {
        return true;
      }

      if (!streamEnabled) {
        return await runNonStreamFallback(requestId, nextMessage, turnstileToken);
      }

      const onEvent = (event: PageStreamEvent) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        if (event.type === "answer-delta") {
          if (!hasStartedResponse) {
            hasStartedResponse = true;
            updateAnswer(event.delta);
            setCurrentReferences(pendingReferences ?? []);
            return;
          }

          updateAnswer((previous) => previous + event.delta);
          return;
        }

        if (event.type === "references") {
          if (hasStartedResponse) {
            setCurrentReferences(event.references);
          } else {
            pendingReferences = event.references;
          }
          return;
        }

        if (event.type === "done") {
          setIsStreaming(false);
          abortControllerRef.current = null;
          return;
        }

        setCurrentError(event.message);
        setIsInterrupted(hasStartedResponse);
        setIsStreaming(false);
        abortControllerRef.current = null;
      };

      if (scene === "article") {
        await aiChatStream({
          workerUrl,
          scene: "article",
          message: nextMessage,
          context,
          turnstileToken,
          signal: controller.signal,
          onEvent,
        });
      } else {
        await aiChatStream({
          workerUrl,
          scene: "author",
          message: nextMessage,
          context,
          turnstileToken,
          signal: controller.signal,
          onEvent,
        });
      }

      if (requestIdRef.current === requestId) {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }

      return true;
    } catch (error) {
      if (controller.signal.aborted || requestIdRef.current !== requestId) {
        return true;
      }

      if (streamEnabled && error instanceof AIStreamUnsupportedError) {
        return await runNonStreamFallback(requestId, nextMessage, turnstileToken);
      }

      setCurrentError(error instanceof Error ? error.message : "AI 请求失败，请稍后重试。");
      setIsInterrupted(hasStartedResponse);
      setIsStreaming(false);
      abortControllerRef.current = null;
      return false;
    } finally {
      resetTurnstileWidget();
    }
  }

  return (
    <PageAIAssistantContext.Provider
      value={{
        currentAnswer,
        currentError,
        currentReferences,
        isInterrupted,
        isStreaming,
        maxInputChars,
        resultContainerRef,
        submitMessage,
      }}
    >
      {children}
      <div ref={turnstileContainerRef} aria-hidden="true" className="h-0 overflow-hidden" />
    </PageAIAssistantContext.Provider>
  );
}

export function usePageAIAssistant(): PageAIAssistantContextValue {
  const context = useContext(PageAIAssistantContext);

  if (!context) {
    throw new Error("usePageAIAssistant must be used within PageAIAssistantProvider");
  }

  return context;
}
