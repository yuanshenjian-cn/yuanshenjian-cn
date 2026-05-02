import type { Env } from "../types";
import { HttpError } from "../types";

function parseAllowedOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function validateOrigin(request: Request, env: Env): string {
  const origin = request.headers.get("Origin");

  if (!origin) {
    throw new HttpError(403, "Origin header is required");
  }

  if (!parseAllowedOrigins(env.ALLOWED_ORIGINS).includes(origin)) {
    throw new HttpError(403, "Origin not allowed");
  }

  return origin;
}
