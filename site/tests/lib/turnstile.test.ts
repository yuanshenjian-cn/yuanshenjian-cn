import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadTurnstileScript, preloadTurnstileScript, resetTurnstileScriptLoaderForTests } from "@/lib/turnstile";

const TURNSTILE_SCRIPT_SELECTOR = 'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';

function waitForScriptEvent() {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe("turnstile loader", () => {
  beforeEach(() => {
    delete window.turnstile;
    resetTurnstileScriptLoaderForTests();
    document.querySelectorAll(TURNSTILE_SCRIPT_SELECTOR).forEach((script) => script.remove());
  });

  afterEach(() => {
    delete window.turnstile;
    resetTurnstileScriptLoaderForTests();
    document.querySelectorAll(TURNSTILE_SCRIPT_SELECTOR).forEach((script) => script.remove());
    vi.restoreAllMocks();
  });

  it("首次预加载失败后，正式请求会移除坏脚本并成功重试", async () => {
    let appendCount = 0;
    let widgetOptions: Record<string, unknown> | null = null;
    const originalAppendChild = document.head.appendChild.bind(document.head);

    vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      const appendedNode = originalAppendChild(node);

      if (node instanceof HTMLScriptElement && node.src.includes("turnstile/v0/api.js")) {
        appendCount += 1;

        if (appendCount === 1) {
          window.setTimeout(() => {
            node.dispatchEvent(new Event("error"));
          }, 0);
        } else {
          window.setTimeout(() => {
            window.turnstile = {
              render: (_element, options) => {
                widgetOptions = options;
                return "widget-id";
              },
              execute: () => {
                const callback = widgetOptions?.callback as ((token: string) => void) | undefined;
                callback?.("retry-token");
              },
              reset: () => undefined,
            };
            node.dispatchEvent(new Event("load"));
          }, 0);
        }
      }

      return appendedNode;
    });

    preloadTurnstileScript("test-site-key");
    await waitForScriptEvent();

    const failedScript = document.querySelector<HTMLScriptElement>(TURNSTILE_SCRIPT_SELECTOR);
    expect(failedScript?.getAttribute("data-turnstile-status")).toBe("error");

    await expect(loadTurnstileScript()).resolves.toBeUndefined();
    expect(appendCount).toBe(2);
    expect(document.querySelectorAll(TURNSTILE_SCRIPT_SELECTOR)).toHaveLength(1);
  });
});
