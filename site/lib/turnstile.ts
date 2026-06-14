import { HUMANIZED_TURNSTILE_MESSAGES } from "@/lib/ai/user-facing-messages";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_SCRIPT_SELECTOR = 'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';
const TURNSTILE_SCRIPT_STATUS_ATTRIBUTE = "data-turnstile-status";

let turnstileScriptPromise: Promise<void> | null = null;

function setTurnstileScriptStatus(script: HTMLScriptElement, status: "loading" | "loaded" | "error") {
  script.setAttribute(TURNSTILE_SCRIPT_STATUS_ATTRIBUTE, status);
}

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.notReady));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(TURNSTILE_SCRIPT_SELECTOR);

    const handleLoad = (script: HTMLScriptElement) => {
      setTurnstileScriptStatus(script, "loaded");
      window.setTimeout(() => {
        if (window.turnstile) {
          resolve();
          return;
        }

        setTurnstileScriptStatus(script, "error");
        turnstileScriptPromise = null;
        reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.loadFailed));
      }, 0);
    };

    const handleError = (script: HTMLScriptElement) => {
      setTurnstileScriptStatus(script, "error");
      turnstileScriptPromise = null;
      reject(new Error(HUMANIZED_TURNSTILE_MESSAGES.loadFailed));
    };

    if (existingScript) {
      const existingStatus = existingScript.getAttribute(TURNSTILE_SCRIPT_STATUS_ATTRIBUTE);

      if (existingStatus === "error" || existingStatus === "loaded") {
        existingScript.remove();
      } else {
        existingScript.addEventListener("load", () => handleLoad(existingScript), { once: true });
        existingScript.addEventListener("error", () => handleError(existingScript), { once: true });
        return;
      }
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    setTurnstileScriptStatus(script, "loading");
    script.addEventListener("load", () => handleLoad(script), { once: true });
    script.addEventListener("error", () => handleError(script), { once: true });
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function preloadTurnstileScript(siteKey: string) {
  if (!siteKey.trim()) {
    return;
  }

  void loadTurnstileScript().catch(() => {
    // 预加载失败时不直接打断用户，真正提交时会再尝试一次。
  });
}

export function resetTurnstileScriptLoaderForTests() {
  turnstileScriptPromise = null;
}
