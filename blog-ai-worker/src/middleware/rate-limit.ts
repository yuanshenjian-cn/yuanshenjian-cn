import type { Env } from "../types";
import { HttpError } from "../types";

const WINDOW_TTL_BUFFER_SECONDS = 60;

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
