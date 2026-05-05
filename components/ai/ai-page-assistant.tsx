"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AnimatedEllipsisText } from "@/components/ai/animated-ellipsis-text";
import { usePageAIAssistant } from "@/components/ai/page-ai-assistant-provider";
import type { AIQuickTopic } from "@/types/ai";

interface AiPageAssistantProps {
  description: string;
  placeholder: string;
  quickTopics: AIQuickTopic[];
  title: string;
  variant?: "primary" | "footer";
}

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
  p: ({ children }: { children?: ReactNode }) => <p className="my-3 break-words leading-6">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="my-3 list-disc space-y-1.5 pl-5">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="my-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
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
    <pre className="my-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm text-foreground">{children}</pre>
  ),
} as const;

export function AiPageAssistant({
  description,
  placeholder,
  quickTopics,
  title,
  variant = "primary",
}: AiPageAssistantProps) {
  const [message, setMessage] = useState("");
  const {
    currentAnswer,
    currentError,
    currentReferences,
    isInterrupted,
    isStreaming,
    maxInputChars,
    resultContainerRef,
    submitMessage,
  } = usePageAIAssistant();

  const canSubmit = message.trim().length > 0 && !isStreaming;
  const shouldShowResult = variant === "primary" && (isStreaming || currentAnswer || currentError || currentReferences.length > 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const started = await submitMessage(message, { scrollToResult: variant === "footer" });
    if (started) {
      setMessage("");
    }
  }

  async function handleQuickTopic(topic: AIQuickTopic) {
    setMessage(topic.label);
    const started = await submitMessage(topic.prompt, { scrollToResult: variant === "footer" });
    if (started) {
      setMessage("");
    }
  }

  return (
    <div
      ref={variant === "primary" ? resultContainerRef : undefined}
      className={
        variant === "primary"
          ? "my-8 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm"
          : "mt-10 rounded-2xl border border-border/70 bg-muted/30 p-5"
      }
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>

      {quickTopics.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {quickTopics.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() => void handleQuickTopic(topic)}
              disabled={isStreaming}
              className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {topic.label}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative group">
          <Sparkles className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50 transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={maxInputChars}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-border bg-background pl-11 pr-24 py-3 text-sm text-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={isStreaming ? "思考中..." : "问 AI"}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-foreground py-2 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:hover:bg-muted ${isStreaming ? "px-3.5" : "px-4"}`}
          >
            {isStreaming ? <AnimatedEllipsisText text="思考中" /> : "问 AI"}
          </button>
        </div>
      </form>

      {shouldShowResult ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-border/70 bg-background/80 p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">AI 回答</p>
            </div>
            {currentAnswer ? (
              <div className="text-sm text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={answerMarkdownComponents}>
                  {currentAnswer}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              <p className="text-sm text-muted-foreground">
                <AnimatedEllipsisText text="AI 正在思考你的问题" />
              </p>
            ) : null}
          </div>

          {currentError && !isInterrupted ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {currentError}
            </div>
          ) : null}

          {isInterrupted && currentError ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              回答已中断：{currentError}
            </div>
          ) : null}

          {currentReferences.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">回答依据</p>
              <div className="space-y-2">
                {currentReferences.map((reference) => {
                  const content = (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium text-foreground">{reference.title}</h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {reference.sourceType === "article-section" ? "文章小节" : "作者模块"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{reference.excerpt}</p>
                    </>
                  );

                  return reference.anchorId ? (
                    <Link
                      key={reference.id}
                      href={`#${reference.anchorId}`}
                      className="block rounded-xl border border-border/70 px-4 py-3 transition hover:border-primary/40 hover:bg-muted/30"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={reference.id} className="rounded-xl border border-border/70 px-4 py-3">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
