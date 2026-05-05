import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiRecommendWidget } from "@/components/ai/ai-recommend-widget";

const aiRecommendStreamMock = vi.fn();

vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();

  return {
    ...actual,
    aiRecommendStream: (...args: unknown[]) => aiRecommendStreamMock(...args),
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

describe("AiRecommendWidget", () => {
  beforeEach(() => {
    aiRecommendStreamMock.mockReset();
    let widgetOptions: Record<string, unknown> | null = null;

    window.turnstile = {
      render: (_element, options) => {
        widgetOptions = options;
        return "widget-id";
      },
      execute: (_widgetId) => {
        const callback = widgetOptions?.callback as ((token: string) => void) | undefined;
        setTimeout(() => callback?.("turnstile-token"), 0);
      },
      reset: () => undefined,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("提交新搜索时保留旧结果，直到新结果返回前不闪空", async () => {
    let secondOnEvent: ((event: { type: string; delta?: string; references?: unknown[] }) => void) | null = null;

    aiRecommendStreamMock
      .mockImplementationOnce(async ({ onEvent }: { onEvent: (event: { type: string; delta?: string; references?: unknown[] }) => void }) => {
        onEvent({ type: "answer-delta", delta: "先看旧结果" });
        onEvent({
          type: "references",
          references: [
            {
              slug: "old-post",
              title: "旧文章",
              excerpt: "旧摘要",
              tags: ["AI"],
              date: "2026-05-04T00:00:00.000Z",
            },
          ],
        });
        onEvent({ type: "done" });
      })
      .mockImplementationOnce(async ({ onEvent }: { onEvent: (event: { type: string; delta?: string; references?: unknown[] }) => void }) => {
        secondOnEvent = onEvent;
        await new Promise(() => undefined);
      });

    render(
      <AiRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
        quickTopics={[]}
      />,
    );

    const input = screen.getByPlaceholderText("想找什么主题的文章？直接告诉我");
    const submitButton = screen.getByRole("button", { name: "问 AI" });

    fireEvent.change(input, { target: { value: "第一次搜索" } });
    fireEvent.click(submitButton);

    await screen.findByText("先看旧结果");
    expect(screen.getByText("旧文章")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "第二次搜索" } });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await waitFor(() => expect(aiRecommendStreamMock).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "思考中..." })).toBeInTheDocument();
    expect(screen.getByText("先看旧结果")).toBeInTheDocument();
    expect(screen.getByText("旧文章")).toBeInTheDocument();

    act(() => {
      secondOnEvent?.({
        type: "references",
        references: [
          {
            slug: "new-post",
            title: "新文章",
            excerpt: "新摘要",
            tags: ["TDD"],
            date: "2026-05-05T00:00:00.000Z",
          },
        ],
      });
    });

    expect(screen.getByText("先看旧结果")).toBeInTheDocument();
    expect(screen.getByText("旧文章")).toBeInTheDocument();
    expect(screen.queryByText("新文章")).not.toBeInTheDocument();

    act(() => {
      secondOnEvent?.({ type: "answer-delta", delta: "这是新结果" });
    });

    await screen.findByText("这是新结果");
    expect(screen.queryByText("先看旧结果")).not.toBeInTheDocument();
    expect(screen.queryByText("旧文章")).not.toBeInTheDocument();
    expect(screen.getByText("新文章")).toBeInTheDocument();
  });

  it("流式开始后失败时保留已流出的 answer，并展示统一错误文案", async () => {
    aiRecommendStreamMock.mockImplementationOnce(
      async ({ onEvent }: { onEvent: (event: { type: string; delta?: string; message?: string }) => void }) => {
        onEvent({ type: "answer-delta", delta: "先给你一个方向。" });
        onEvent({ type: "error", message: "AI 服务刚刚开小差了，请稍后重试。" });
      },
    );

    render(
      <AiRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
        quickTopics={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("想找什么主题的文章？直接告诉我"), {
      target: { value: "推荐几篇 TDD 文章" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await screen.findByText("先给你一个方向。");
    expect(screen.getByText("AI 服务刚刚开小差了，请稍后重试。")).toBeInTheDocument();
  });

  it("流式在首个 answer 前失败时保留旧结果，并展示统一错误文案", async () => {
    aiRecommendStreamMock
      .mockImplementationOnce(async ({ onEvent }: { onEvent: (event: { type: string; delta?: string; references?: unknown[] }) => void }) => {
        onEvent({ type: "answer-delta", delta: "旧结果" });
        onEvent({
          type: "references",
          references: [
            {
              slug: "old-post",
              title: "旧文章",
              excerpt: "旧摘要",
              tags: ["AI"],
              date: "2026-05-04T00:00:00.000Z",
            },
          ],
        });
        onEvent({ type: "done" });
      })
      .mockRejectedValueOnce(new Error("AI 服务刚刚开小差了，请稍后重试。"));

    render(
      <AiRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
        quickTopics={[]}
      />,
    );

    const input = screen.getByPlaceholderText("想找什么主题的文章？直接告诉我");

    fireEvent.change(input, { target: { value: "第一次搜索" } });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await screen.findByText("旧结果");
    expect(screen.getByText("旧文章")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "第二次搜索" } });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await screen.findByText("AI 服务刚刚开小差了，请稍后重试。");
    expect(screen.getByText("旧结果")).toBeInTheDocument();
    expect(screen.getByText("旧文章")).toBeInTheDocument();
  });

  it("Turnstile 等待超时使用传入值", async () => {
    vi.useFakeTimers();

    window.turnstile = {
      render: () => "widget-id",
      execute: () => undefined,
      reset: () => undefined,
    };

    render(
      <AiRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={3210}
        maxInputChars={200}
        quickTopics={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("想找什么主题的文章？直接告诉我"), {
      target: { value: "TDD" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    expect(screen.getByRole("button", { name: "思考中..." })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3209);
    });
    expect(screen.queryByText("Turnstile 响应超时，请稍后重试。")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByText("Turnstile 响应超时，请稍后重试。")).toBeInTheDocument();
  });
});
