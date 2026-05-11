import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvestmentBriefingRecommendWidget } from "@/components/investment/investment-briefing-recommend-widget";

const aiInvestmentBriefingRecommendStreamMock = vi.fn();

vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();

  return {
    ...actual,
    aiInvestmentBriefingRecommendStream: (...args: unknown[]) => aiInvestmentBriefingRecommendStreamMock(...args),
  };
});

describe("InvestmentBriefingRecommendWidget", () => {
  beforeEach(() => {
    aiInvestmentBriefingRecommendStreamMock.mockReset();
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

  it("显示投资推荐说明且默认不展示结果列表", () => {
    render(
      <InvestmentBriefingRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
      />,
    );

    expect(screen.getByRole("heading", { name: "投资简报推荐" })).toBeInTheDocument();
    expect(screen.getByText("基于“近 30 天”的投资简报范围推荐，不构成投资建议。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "问 AI" })).toBeInTheDocument();
    expect(screen.queryByText(/投资简报推荐结果/)).not.toBeInTheDocument();
  });

  it("输入主题后调用 investment-briefing-recommend scene", async () => {
    aiInvestmentBriefingRecommendStreamMock.mockImplementationOnce(async ({ onEvent }: { onEvent: (event: unknown) => void }) => {
      onEvent({ type: "answer-delta", delta: "建议先看英伟达相关两期。" });
      onEvent({
        type: "references",
        references: [
          {
            slug: "2026-05-08",
            title: "投资简报 · 2026-05-08",
            date: "2026-05-08T00:00:00.000Z",
            excerpt: "英伟达与算力链动态",
            tags: ["投资简报"],
            url: "/investment/briefings/2026-05-08",
          },
        ],
      });
      onEvent({ type: "done" });
    });

    render(
      <InvestmentBriefingRecommendWidget
        enabled
        workerUrl="/api/ai"
        turnstileSiteKey="test-site-key"
        turnstileTimeoutMs={20000}
        maxInputChars={200}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入主题，例如 英伟达财报、港股回购、半导体设备"), {
      target: { value: "英伟达" },
    });
    fireEvent.click(screen.getByRole("button", { name: "问 AI" }));

    await waitFor(() => expect(aiInvestmentBriefingRecommendStreamMock).toHaveBeenCalledWith(expect.objectContaining({
      scene: "investment-briefing-recommend",
      context: { range: "30d" },
      turnstileToken: "turnstile-token",
    })));
    expect(screen.getByText("建议先看英伟达相关两期。")).toBeInTheDocument();
    expect(screen.getByText("投资简报 · 2026-05-08")).toBeInTheDocument();
  });
});
