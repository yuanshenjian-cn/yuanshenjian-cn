import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleAiAssistant } from "@/components/ai/article-ai-assistant";
import { AuthorAiAssistant } from "@/components/ai/author-ai-assistant";
import { PageAIAssistantProvider } from "@/components/ai/page-ai-assistant-provider";
import { AIStreamUnsupportedError } from "@/lib/ai-client";

const aiChatMock = vi.fn();
const aiChatStreamMock = vi.fn();

vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();

  return {
    ...actual,
    aiChat: (...args: unknown[]) => aiChatMock(...args),
    aiChatStream: (...args: unknown[]) => aiChatStreamMock(...args),
  };
});

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

describe("PageAIAssistantProvider", () => {
  beforeEach(() => {
    aiChatMock.mockReset();
    aiChatStreamMock.mockReset();
    Element.prototype.scrollIntoView = vi.fn();

    let widgetOptions: Record<string, unknown> | null = null;
    window.turnstile = {
      render: (_element, options) => {
        widgetOptions = options;
        return "widget-id";
      },
      execute: () => {
        const callback = widgetOptions?.callback as ((token: string) => void) | undefined;
        callback?.("turnstile-token");
      },
      reset: () => undefined,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("流式回答会逐步追加，并在 references 事件后展示依据", async () => {
    aiChatStreamMock.mockImplementation(async ({ onEvent }: { onEvent: (event: unknown) => void }) => {
      onEvent({ type: "answer-delta", delta: "第一段" });
      onEvent({ type: "answer-delta", delta: " 第二段" });
      onEvent({
        type: "references",
        references: [
          {
            id: "intro",
            title: "前言",
            excerpt: "前言摘录",
            sourceType: "article-section",
            anchorId: "intro",
          },
        ],
      });
      onEvent({ type: "done" });
    });

    render(
      <PageAIAssistantProvider
        scene="article"
        context={{ slug: "tdd-introduction" }}
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        streamEnabled
        maxInputChars={200}
      >
        <ArticleAiAssistant />
      </PageAIAssistantProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("想快速了解这篇文章？直接问我"), {
      target: { value: "3 行总结这篇文章" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await screen.findByText("第一段 第二段");
    expect(screen.getByText("回答依据")).toBeInTheDocument();
    expect(screen.getByText("前言")).toBeInTheDocument();
  });

  it("第二次请求会中断第一次流式请求，并忽略旧流写入", async () => {
    let firstOnEvent: ((event: { type: string; delta?: string }) => void) | null = null;

    aiChatStreamMock
      .mockImplementationOnce(async ({ onEvent }: { onEvent: (event: { type: string; delta?: string }) => void }) => {
        firstOnEvent = onEvent;
      })
      .mockImplementationOnce(async ({ onEvent }: { onEvent: (event: { type: string; delta?: string }) => void }) => {
        onEvent({ type: "answer-delta", delta: "新请求结果" });
        onEvent({ type: "done" });
      });

    render(
      <PageAIAssistantProvider
        scene="article"
        context={{ slug: "tdd-introduction" }}
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        streamEnabled
        maxInputChars={200}
      >
        <>
          <ArticleAiAssistant />
          <ArticleAiAssistant variant="footer" />
        </>
      </PageAIAssistantProvider>,
    );

    const inputs = screen.getAllByRole("textbox");

    fireEvent.change(inputs[0], { target: { value: "第一次问题" } });
    fireEvent.click(screen.getAllByRole("button", { name: "问 AI" })[0]);

    await waitFor(() => expect(aiChatStreamMock).toHaveBeenCalledTimes(1));

    fireEvent.change(inputs[1], { target: { value: "第二次问题" } });
    fireEvent.click(screen.getAllByRole("button", { name: "问 AI" })[1]);

    await screen.findByText("新请求结果");
    firstOnEvent?.({ type: "answer-delta", delta: "旧流结果" });

    expect(screen.queryByText("旧流结果")).not.toBeInTheDocument();
  });

  it("关闭 stream 时会走非流式 fallback", async () => {
    aiChatMock.mockResolvedValue({
      answer: "非流式结果",
      references: [
        {
          id: "hero",
          title: "个人简介",
          excerpt: "个人简介摘录",
          sourceType: "author-section",
          anchorId: "hero",
        },
      ],
    });

    render(
      <PageAIAssistantProvider
        scene="author"
        context={{ page: "author" }}
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        streamEnabled={false}
        maxInputChars={200}
      >
        <ArticleAiAssistant />
      </PageAIAssistantProvider>,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "作者擅长什么方向" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await screen.findByText("非流式结果");
    expect(aiChatMock).toHaveBeenCalledTimes(1);
    expect(aiChatStreamMock).not.toHaveBeenCalled();
  });

  it("流式不受支持时会自动回退到非流式结果", async () => {
    aiChatStreamMock.mockRejectedValue(
      new AIStreamUnsupportedError("Current AI provider does not support streaming"),
    );
    aiChatMock.mockResolvedValue({
      answer: "回退后的非流式结果",
      references: [
        {
          id: "hero",
          title: "个人简介",
          excerpt: "个人简介摘录",
          sourceType: "author-section",
          anchorId: "hero",
        },
      ],
    });

    render(
      <PageAIAssistantProvider
        scene="author"
        context={{ page: "author" }}
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        streamEnabled
        maxInputChars={200}
      >
        <AuthorAiAssistant />
      </PageAIAssistantProvider>,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "作者擅长什么方向" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await screen.findByText("回退后的非流式结果");
    expect(aiChatStreamMock).toHaveBeenCalledTimes(1);
    expect(aiChatMock).toHaveBeenCalledTimes(1);
  });

  it("第二次提交会清理第一次 Turnstile 等待态，避免旧请求污染新请求", async () => {
    let widgetOptions: Record<string, unknown> | null = null;
    window.turnstile = {
      render: (_element, options) => {
        widgetOptions = options;
        return "widget-id";
      },
      execute: () => undefined,
      reset: () => undefined,
    };

    aiChatStreamMock.mockImplementation(async ({ onEvent }: { onEvent: (event: { type: string; delta?: string }) => void }) => {
      onEvent({ type: "answer-delta", delta: "最终结果" });
      onEvent({ type: "done" });
    });

    render(
      <PageAIAssistantProvider
        scene="article"
        context={{ slug: "tdd-introduction" }}
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        streamEnabled
        maxInputChars={200}
      >
        <>
          <ArticleAiAssistant />
          <ArticleAiAssistant variant="footer" />
        </>
      </PageAIAssistantProvider>,
    );

    const inputs = screen.getAllByRole("textbox");
    const buttons = screen.getAllByRole("button", { name: "问 AI" });

    fireEvent.change(inputs[0], { target: { value: "第一次问题" } });
    fireEvent.click(buttons[0]);

    fireEvent.change(inputs[1], { target: { value: "第二次问题" } });
    fireEvent.click(buttons[1]);

    await waitFor(() => expect(widgetOptions?.callback).toEqual(expect.any(Function)));
    const latestCallback = widgetOptions?.callback as ((token: string) => void) | undefined;
    latestCallback?.("turnstile-token");

    await screen.findByText("最终结果");
    expect(aiChatStreamMock).toHaveBeenCalledTimes(1);
  });
});
