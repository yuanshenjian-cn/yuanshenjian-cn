import type { Env } from "../types";
import { HttpError } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRemoteIp(request: Request): string | null {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (!forwardedFor) {
    return null;
  }

  return forwardedFor.split(",")[0]?.trim() || null;
}

export async function verifyTurnstile(token: string, request: Request, env: Env): Promise<void> {
  if (!token.trim()) {
    throw new HttpError(403, "Turnstile token is required");
  }

  const formData = new URLSearchParams();
  formData.set("secret", env.TURNSTILE_SECRET_KEY);
  formData.set("response", token);

  const remoteIp = getRemoteIp(request);
  if (remoteIp) {
    formData.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new HttpError(503, "Turnstile verification unavailable");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload) || payload.success !== true) {
    throw new HttpError(403, "Turnstile verification failed");
  }
}
