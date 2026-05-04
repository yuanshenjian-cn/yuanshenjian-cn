import type { ChatScene, Env } from "../types";
import { HttpError } from "../types";

export const TURNSTILE_ACTIONS: Record<ChatScene, string> = {
  recommend: "homepage_recommend",
  article: "article_page_ai",
  author: "author_page_ai",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCsvList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readStringField(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

export function getExpectedTurnstileAction(scene: ChatScene): string {
  return TURNSTILE_ACTIONS[scene];
}

export async function verifyTurnstile(token: string, request: Request, env: Env, scene: ChatScene): Promise<void> {
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

  const allowedHostnames = parseCsvList(env.TURNSTILE_ALLOWED_HOSTNAMES);
  const hostname = readStringField(payload, "hostname");
  if (allowedHostnames.length === 0 || !hostname || !allowedHostnames.includes(hostname)) {
    throw new HttpError(403, "Turnstile verification failed");
  }

  const expectedAction = getExpectedTurnstileAction(scene);
  if (expectedAction) {
    const action = readStringField(payload, "action");
    if (action !== expectedAction) {
      throw new HttpError(403, "Turnstile verification failed");
    }
  }
}
