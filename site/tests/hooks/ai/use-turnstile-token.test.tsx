import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTurnstileToken } from "@/hooks/ai/use-turnstile-token";
import type { AdvisorScene, TurnstileRenderOptions } from "@/types/ai";

const loadTurnstileScriptMock = vi.fn();
const preloadTurnstileScriptMock = vi.fn();

vi.mock("@/lib/turnstile", () => ({
  loadTurnstileScript: () => loadTurnstileScriptMock(),
  preloadTurnstileScript: (...args: unknown[]) => preloadTurnstileScriptMock(...args),
}));

interface TurnstileHarnessProps {
  onReady: (getToken: () => Promise<string>) => void;
  scene: AdvisorScene;
}

function TurnstileHarness({ onReady, scene }: TurnstileHarnessProps) {
  const { containerRef, getToken } = useTurnstileToken(scene, "test-site-key", 60_000);

  useEffect(() => {
    onReady(getToken);
  }, [getToken, onReady]);

  return <div ref={containerRef} />;
}

describe("useTurnstileToken", () => {
  beforeEach(() => {
    loadTurnstileScriptMock.mockReset();
    preloadTurnstileScriptMock.mockReset();
    loadTurnstileScriptMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete window.turnstile;
    vi.restoreAllMocks();
  });

  it("在需要人工验证时渲染可见的弹性 widget", async () => {
    let getToken: (() => Promise<string>) | null = null;
    let options: TurnstileRenderOptions | null = null;

    window.turnstile = {
      render: (_element, nextOptions) => {
        options = nextOptions;
        return "widget-id";
      },
      execute: () => undefined,
      reset: () => undefined,
    };

    render(<TurnstileHarness scene="author" onReady={(nextGetToken) => (getToken = nextGetToken)} />);

    await waitFor(() => expect(getToken).not.toBeNull());
    if (!getToken) {
      throw new Error("Turnstile token getter was not initialized.");
    }
    const tokenPromise = getToken();

    await waitFor(() => expect(options).not.toBeNull());
    if (!options) {
      throw new Error("Turnstile widget was not rendered.");
    }
    expect(options).toMatchObject({
      action: "author_page_ai",
      appearance: "interaction-only",
      execution: "execute",
      size: "flexible",
    });

    act(() => {
      options?.callback?.("turnstile-token");
    });

    await expect(tokenPromise).resolves.toBe("turnstile-token");
  });
});
