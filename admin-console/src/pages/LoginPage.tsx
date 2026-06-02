import { FormEvent, useEffect, useRef, useState } from "react";
import { login } from "../api/client";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface AdminTurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
}

function getTurnstile(): AdminTurnstileApi | undefined {
  return (window as Window & { turnstile?: AdminTurnstileApi }).turnstile;
}

interface LoginPageProps {
  onLoggedIn: () => void;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
    if (!siteKey || !turnstileContainerRef.current) {
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      const turnstile = getTurnstile();
      if (!turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) {
        return;
      }
      turnstileWidgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        action: "admin_login",
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    });
    document.head.appendChild(script);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(password, turnstileToken);
      onLoggedIn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登录失败");
    }
  }

  return (
    <section className="card">
      <h2>管理员登录</h2>
      <form onSubmit={handleSubmit}>
        <label>
          管理员口令
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit">登录</button>
        <div ref={turnstileContainerRef} />
      </form>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
