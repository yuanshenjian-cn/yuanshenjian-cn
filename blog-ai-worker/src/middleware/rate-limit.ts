import type { Env } from "../types";
import { HttpError } from "../types";

const WINDOW_TTL_BUFFER_SECONDS = 60;
const DAILY_BUDGET_TTL_BUFFER_SECONDS = 86400;

function parsePositiveInteger(value: string, fallback: number): number {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function getUtcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function checkRateLimit(request: Request, env: Env): Promise<void> {
  const windowSeconds = parsePositiveInteger(env.RATE_LIMIT_WINDOW_SECONDS, 3600);
  const maxRequests = parsePositiveInteger(env.RATE_LIMIT_MAX_REQUESTS, 10);
  const now = Math.floor(Date.now() / 1000);
  const windowBucket = Math.floor(now / windowSeconds);
  const retryAfter = Math.max((windowBucket + 1) * windowSeconds - now, 1);
  const key = `ratelimit:${getClientIp(request)}:${windowBucket}`;
  const storedValue = await env.RATE_LIMIT_KV.get(key);
  const currentCount = Number.parseInt(storedValue ?? "0", 10);

  if (!Number.isNaN(currentCount) && currentCount >= maxRequests) {
    throw new HttpError(429, "Rate limit exceeded", {
      "Retry-After": String(retryAfter),
    });
  }

  const nextCount = Number.isNaN(currentCount) ? 1 : currentCount + 1;
  await env.RATE_LIMIT_KV.put(key, String(nextCount), {
    expirationTtl: windowSeconds + WINDOW_TTL_BUFFER_SECONDS,
  });
}

export function assertAIEnabled(env: Env): void {
  if (isEnabled(env.AI_EMERGENCY_DISABLE)) {
    throw new HttpError(503, "AI 功能当前暂时不可用，请稍后再试。");
  }
}

export async function checkDailyAIBudget(env: Env): Promise<void> {
  const dailyLimit = parsePositiveInteger(env.AI_DAILY_REQUEST_LIMIT ?? "", 100);
  const dayKey = getUtcDayKey();
  const key = `ai-daily-budget:${dayKey}`;
  const storedValue = await env.RATE_LIMIT_KV.get(key);
  const currentCount = Number.parseInt(storedValue ?? "0", 10);

  if (!Number.isNaN(currentCount) && currentCount >= dailyLimit) {
    throw new HttpError(429, "今日 AI 请求额度已用完，请明天再试。");
  }

  const nextCount = Number.isNaN(currentCount) ? 1 : currentCount + 1;
  await env.RATE_LIMIT_KV.put(key, String(nextCount), {
    expirationTtl: 172800 + DAILY_BUDGET_TTL_BUFFER_SECONDS,
  });
}
