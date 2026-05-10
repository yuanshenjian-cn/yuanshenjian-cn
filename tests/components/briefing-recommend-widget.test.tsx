import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BriefingRecommendWidget } from "@/components/briefings/briefing-recommend-widget";

const aiBriefingRecommendStreamMock = vi.fn();

vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();

  return {
    ...actual,
    aiBriefingRecommendStream: (...args: unknown[]) => aiBriefingRecommendStreamMock(...args),
  };
});

describe("BriefingRecommendWidget", () => {
  beforeEach(() => {
    aiBriefingRecommendStreamMock.mockReset();
    let widgetOptions: Record<string, unknown> | null = null;

    window.turnstile = {
      render: (_element, options) => {
        widgetOptions = options as Record<string, unknown>;
        return "widget-id";
      },
      execute: () => {
        const callback = widgetOptions?.callback as ((token: string) => void) | undefined;
        setTimeout(() => callback?.("turnstile-token"), 0);
      },
      reset: () => undefined,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("显示当前推荐范围说明且默认不展示本地简报列表", () => {
    render(
      <BriefingRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
      />,
    );

    expect(screen.getByText("基于“近 30 天”的范围推荐")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "问 AI" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "近 2 周" })).not.toBeInTheDocument();
    expect(screen.queryByText(/内的简报/)).not.toBeInTheDocument();
  });

  it("输入主题后调用简报推荐 scene", async () => {
    aiBriefingRecommendStreamMock.mockImplementationOnce(async ({ onEvent }: { onEvent: (event: unknown) => void }) => {
      onEvent({ type: "answer-delta", delta: "推荐今日简报" });
      onEvent({
        type: "references",
        references: [
          {
            slug: "2026-05-08",
            title: "AI 简报 · 2026-05-08",
            date: "2026-05-08T00:00:00.000Z",
            excerpt: "OpenAI 今日动态",
            tags: ["AI每日简报"],
            url: "/ai/daily-briefings/2026-05-08",
          },
        ],
      });
      onEvent({ type: "done" });
    });

    render(
      <BriefingRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入主题，例如 OpenAI 发布、Agent 动态、多模态"), {
      target: { value: "OpenAI" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await waitFor(() => expect(aiBriefingRecommendStreamMock).toHaveBeenCalledWith(expect.objectContaining({
      scene: "briefing-recommend",
      context: { range: "30d" },
      turnstileToken: "turnstile-token",
    })));
    expect(screen.getByText("推荐今日简报")).toBeInTheDocument();
    expect(screen.getByText("AI 简报 · 2026-05-08")).toBeInTheDocument();
  });
});
