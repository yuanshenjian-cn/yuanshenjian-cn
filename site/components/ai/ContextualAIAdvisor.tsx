"use client";

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, MessageCircle, Minimize2, SendHorizontal, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useTurnstileToken } from "@/hooks/ai/use-turnstile-token";
import { type AdvisorSessionMessage, useAdvisorSession } from "@/hooks/ai/use-advisor-session";
import { aiContextualAdvisorStream } from "@/lib/ai-client";
import type { AdvisorContextValue, AdvisorStreamEvent } from "@/types/ai";

interface ContextualAIAdvisorProps {
  context: AdvisorContextValue;
  maxInputChars: number;
  turnstileSiteKey: string;
  turnstileTimeoutMs: number;
  workerUrl: string;
  initialPrompt?: string;
  historyRounds: number;
  promptVersion?: number;
}

type ChatRole = "user" | "assistant";

type ChatMessage = AdvisorSessionMessage;

function hasBookTitleMarks(children: ReactNode): boolean {
  if (typeof children === "string") {
    return children.includes("《") || children.includes("》");
  }
  if (Array.isArray(children)) {
    return children.some(hasBookTitleMarks);
  }
  return false;
}

const advisorMarkdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className="my-2 break-words text-sm leading-6 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="my-2 list-disc space-y-1.5 pl-5 text-sm first:mt-0 last:mb-0">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="my-2 list-decimal space-y-1.5 pl-5 text-sm first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="break-words pl-1 text-sm leading-6">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => {
    const isArticleLink = typeof href === "string" && href.startsWith("/articles/");
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`break-all text-primary hover:underline ${isArticleLink ? "italic" : ""}`}>
        {isArticleLink && !hasBookTitleMarks(children) ? <>《{children}》</> : children}
      </a>
    );
  },
  code: ({ children }: { children?: ReactNode }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8rem] text-foreground">{children}</code>,
  pre: ({ children }: { children?: ReactNode }) => <pre className="my-3 overflow-x-auto rounded-xl bg-muted p-3 text-[0.8rem] text-foreground">{children}</pre>,
} as const;

export function ContextualAIAdvisor({
  context,
  maxInputChars,
  turnstileSiteKey,
  turnstileTimeoutMs,
  workerUrl,
  initialPrompt,
  historyRounds,
  promptVersion,
}: ContextualAIAdvisorProps) {
  const [isOpen, setIsOpen] = useState(Boolean(initialPrompt));
  const [isMaximized, setIsMaximized] = useState(false);
  const [message, setMessage] = useState(initialPrompt ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const submittedInitialPromptKeyRef = useRef("");
  const submitMessageRef = useRef<(value: string) => void>(() => undefined);
  const messageIdRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { appendHistory, loadHistory, loadMessages, saveMessages } = useAdvisorSession(context.scene, context.pageSlug, historyRounds);
  const { containerRef, getToken, reset } = useTurnstileToken(context.scene, turnstileSiteKey, turnstileTimeoutMs);

  const placeholder = useMemo(() => {
    if (context.scene === "author") {
      return "想快速了解作者？直接问我";
    }
    if (context.scene === "article") {
      return "想快速了解这篇文章？直接问我";
    }
    return "想快速了解这一页？直接问我";
  }, [context.scene]);

  const hasMessages = messages.length > 0;
  const thinkingText = "容我思考片刻...";
  submitMessageRef.current = (value: string) => {
    void submitMessage(value);
  };

  useEffect(() => {
    const restoredMessages = loadMessages();
    setMessages(restoredMessages);
    messageIdRef.current = restoredMessages.length;
  }, [loadMessages]);

  useEffect(() => {
    if (isStreaming || messages.length === 0) {
      return;
    }
    saveMessages(messages);
  }, [isStreaming, messages, saveMessages]);

  useEffect(() => {
    if (!initialPrompt) {
      return;
    }
    const promptKey = `${promptVersion ?? 0}:${initialPrompt}`;
    if (submittedInitialPromptKeyRef.current === promptKey) {
      return;
    }
    submittedInitialPromptKeyRef.current = promptKey;
    setIsOpen(true);
    setPendingPrompt(initialPrompt);
  }, [initialPrompt, promptVersion]);

  useEffect(() => {
    if (!isOpen || !pendingPrompt) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      submitMessageRef.current(pendingPrompt);
      setPendingPrompt(null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, pendingPrompt]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    textareaRef.current?.focus();
  }, [isOpen, promptVersion]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, isStreaming, messages]);

  function createMessageId(role: ChatRole) {
    messageIdRef.current += 1;
    return `${role}-${messageIdRef.current}`;
  }

  function updateAssistantMessage(messageId: string, updater: (current: ChatMessage) => ChatMessage) {
    setMessages((current) => current.map((item) => (item.id === messageId ? updater(item) : item)));
  }

  async function submitMessage(value: string) {
    const nextMessage = value.trim();
    if (!nextMessage || nextMessage.length > maxInputChars || isStreaming) {
      return;
    }
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsOpen(true);
    setIsStreaming(true);
    const assistantMessageId = createMessageId("assistant");
    const userMessageId = createMessageId("user");
    setMessages((current) => [
      ...current,
      { content: nextMessage, id: userMessageId, role: "user" },
      { content: "", id: assistantMessageId, role: "assistant" },
    ]);
    setMessage("");
    try {
      const turnstileToken = await getToken();
      const history = loadHistory();
      await aiContextualAdvisorStream({
        workerUrl,
        message: nextMessage,
        turnstileToken,
        signal: controller.signal,
        context: {
          scene: context.scene,
          domain: context.domain,
          pageTitle: context.pageTitle,
          pageSlug: context.pageSlug,
          articleSlug: context.articleSlug,
          history,
        },
        onEvent: (streamEvent: AdvisorStreamEvent) => {
          if (streamEvent.type === "answer-delta") {
            updateAssistantMessage(assistantMessageId, (current) => ({
              ...current,
              content: current.content + streamEvent.delta,
              error: undefined,
            }));
            return;
          }
          if (streamEvent.type === "references") {
            return;
          }
          if (streamEvent.type === "error") {
            updateAssistantMessage(assistantMessageId, (current) => ({
              ...current,
              error: streamEvent.message,
            }));
            if (abortControllerRef.current === controller) {
              setIsStreaming(false);
            }
            return;
          }
          if (abortControllerRef.current === controller) {
            setIsStreaming(false);
          }
        },
      });
      appendHistory(nextMessage);
    } catch (caught) {
      if (!controller.signal.aborted) {
        updateAssistantMessage(assistantMessageId, (current) => ({
          ...current,
          error: caught instanceof Error ? caught.message : "刚才没连上，你稍后再试一次。",
        }));
      }
      if (abortControllerRef.current === controller) {
        setIsStreaming(false);
      }
    } finally {
      reset();
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    }
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await submitMessage(message);
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void submitMessage(message);
  }

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded="false"
          className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 text-left shadow-xl backdrop-blur transition hover:border-primary/40 hover:bg-background md:bottom-28 md:right-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-medium text-foreground">问 AI</span>
          </span>
        </button>
      ) : null}

      {isOpen ? (
        <div className={isMaximized ? "fixed inset-0 z-[60] flex justify-center bg-background" : "contents"}>
          <section
            className={
              isMaximized
                ? "flex h-full w-full max-w-2xl flex-col overflow-hidden border-x border-border/70 bg-background shadow-2xl"
                : "fixed bottom-4 left-3 right-3 top-14 z-[60] flex flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background/95 shadow-2xl backdrop-blur md:bottom-4 md:left-auto md:right-6 md:top-16 md:w-[min(94vw,28rem)]"
            }
          >
            <div className="border-b border-border/70 bg-muted/20 px-4 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  YSJ • AI
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsMaximized((prev) => !prev)}
                    aria-label={isMaximized ? "缩小对话窗" : "放大对话窗"}
                    aria-pressed={isMaximized}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="关闭对话窗"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {!hasMessages ? (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <div className="w-full max-w-sm space-y-3">
                  {context.quickTopics.map((topic) => (
                    <button
                      key={topic.label}
                      type="button"
                      onClick={() => void submitMessage(topic.prompt)}
                      disabled={isStreaming}
                      className="block w-full rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-left text-sm text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((item) => {
                const isUser = item.role === "user";
                return (
                  <div key={item.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                        isUser
                          ? "rounded-br-md bg-foreground text-background"
                          : "rounded-bl-md border border-border/70 bg-card/80 text-foreground"
                      }`}
                    >
                      <p className={`text-[11px] tracking-[0.18em] ${isUser ? "text-background/70" : "text-muted-foreground"}`}>
                        {isUser ? "你" : "袁慎建"}
                      </p>
                      {item.content && isUser ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.content}</p> : null}
                      {item.content && !isUser ? (
                        <div className="mt-2 text-sm leading-6 text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={advisorMarkdownComponents}>
                            {item.content}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                      {!item.content && isStreaming && !item.error && !isUser ? (
                        <span className="mt-2 inline-flex items-center text-sm text-muted-foreground" aria-label={thinkingText}>
                          {Array.from(thinkingText).map((char, index) => (
                            <span
                              key={`${char}-${index}`}
                              aria-hidden="true"
                              className="inline-block animate-bounce motion-reduce:animate-none"
                              style={{ animationDelay: `${index * 70}ms`, animationDuration: "1.4s" }}
                            >
                              {char}
                            </span>
                          ))}
                        </span>
                      ) : null}
                      {item.error ? <p className="mt-2 text-sm leading-6 text-destructive">{item.error}</p> : null}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

            <div className="border-t border-border/70 bg-background/90 px-4 py-2.5">
              <form className="space-y-2" onSubmit={(event) => void handleSubmit(event)}>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  maxLength={maxInputChars}
                  placeholder={placeholder}
                  className="min-h-16 w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Enter 发送 · Shift+Enter 换行 · {message.length}/{maxInputChars}</span>
                  <button
                    type="submit"
                    disabled={!message.trim() || isStreaming}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-3.5 py-1.5 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    {isStreaming ? "思考中" : "发送"}
                  </button>
                </div>
              </form>
            </div>
            <div ref={containerRef} aria-hidden="true" className="h-0 overflow-hidden" />
          </section>
        </div>
      ) : null}
    </>
  );
}
