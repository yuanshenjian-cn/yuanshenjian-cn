import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AiRecommendWidget } from "@/components/ai/ai-recommend-widget";

const aiChatMock = vi.fn();

vi.mock("@/lib/ai-client", () => ({
  aiChat: (...args: unknown[]) => aiChatMock(...args),
}));

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
    aiChatMock.mockReset();
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

  it("提交新搜索时保留旧结果，直到新结果返回前不闪空", async () => {
    aiChatMock
      .mockResolvedValueOnce({
        answer: "先看旧结果",
        references: [
          {
            slug: "old-post",
            title: "旧文章",
            excerpt: "旧摘要",
            tags: ["AI"],
            date: "2026-05-04T00:00:00.000Z",
          },
        ],
      })
      .mockImplementationOnce(() => new Promise(() => undefined));

    render(
      <AiRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
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

    expect(screen.getByRole("button", { name: "思考中..." })).toBeInTheDocument();
    expect(screen.getByText("先看旧结果")).toBeInTheDocument();
    expect(screen.getByText("旧文章")).toBeInTheDocument();

    expect(screen.getByText("先看旧结果")).toBeInTheDocument();
    expect(screen.getByText("旧文章")).toBeInTheDocument();
  });
});
