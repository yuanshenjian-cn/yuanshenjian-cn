import { validateOrigin } from "./middleware/origin";
import { assertAIEnabled, checkDailyAIBudget, checkRateLimit } from "./middleware/rate-limit";
import { verifyTurnstile } from "./middleware/turnstile";
import { handleRecommendScene } from "./scenes/recommend";
import type { ChatRequestBody, Env, ExecutionContext } from "./types";
import { HttpError } from "./types";
import { errorResponse, jsonResponse, noContentResponse } from "./utils/response";

const DEFAULT_REQUEST_MAX_BODY_BYTES = 8192;
const DEFAULT_REQUEST_MAX_MESSAGE_CHARS = 500;

function assertConfiguredEnv(env: Env): void {
  if (!env.TURNSTILE_SECRET_KEY?.trim()) {
    throw new HttpError(500, "Worker misconfigured: TURNSTILE_SECRET_KEY is missing");
  }

  if (!env.LLM_PROVIDER_API_KEY?.trim()) {
    throw new HttpError(500, "Worker misconfigured: LLM_PROVIDER_API_KEY is missing");
  }

  if (!env.LLM_PROVIDER_BASE_URL?.trim()) {
    throw new HttpError(500, "Worker misconfigured: LLM_PROVIDER_BASE_URL is missing");
  }

  if (!env.AI_DATA_BASE_URL?.trim()) {
    throw new HttpError(500, "Worker misconfigured: AI_DATA_BASE_URL is missing");
  }

  if (!env.TURNSTILE_ALLOWED_HOSTNAMES?.trim()) {
    throw new HttpError(500, "Worker misconfigured: TURNSTILE_ALLOWED_HOSTNAMES is missing");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatPath(pathname: string): boolean {
  return pathname === "/chat" || pathname === "/api/ai/chat";
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function parseBody(request: Request, env: Env): Promise<ChatRequestBody> {
  const maxBodyBytes = parsePositiveInteger(env.AI_REQUEST_MAX_BODY_BYTES, DEFAULT_REQUEST_MAX_BODY_BYTES);
  const maxMessageChars = parsePositiveInteger(
    env.AI_REQUEST_MAX_MESSAGE_CHARS,
    DEFAULT_REQUEST_MAX_MESSAGE_CHARS,
  );
  const declaredContentLength = Number.parseInt(request.headers.get("Content-Length") ?? "", 10);

  if (Number.isFinite(declaredContentLength) && declaredContentLength > maxBodyBytes) {
    throw new HttpError(413, "Request payload too large");
  }

  const rawBody = await request.arrayBuffer().catch(() => null);
  if (rawBody === null) {
    throw new HttpError(400, "Invalid request payload");
  }

  if (rawBody.byteLength > maxBodyBytes) {
    throw new HttpError(413, "Request payload too large");
  }

  const payload: unknown = await Promise.resolve()
    .then(() => JSON.parse(new TextDecoder().decode(rawBody)))
    .catch(() => null);

  if (
    !isRecord(payload) ||
    payload.scene !== "recommend" ||
    typeof payload.message !== "string" ||
    typeof payload.cf_turnstile_response !== "string"
  ) {
    throw new HttpError(400, "Invalid request payload");
  }

  const message = payload.message.trim();
  if (!message) {
    throw new HttpError(400, "Message is required");
  }

  if (message.length > maxMessageChars) {
    throw new HttpError(413, "Message is too long. Please shorten it and try again.");
  }

  return {
    scene: "recommend",
    message,
    context: isRecord(payload.context) ? payload.context : undefined,
    cf_turnstile_response: payload.cf_turnstile_response,
  };
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    let origin: string | undefined;

    try {
      const url = new URL(request.url);
      if (!isChatPath(url.pathname)) {
        return jsonResponse({ error: "Not found" }, { status: 404 });
      }

      origin = validateOrigin(request, env);

      if (request.method === "OPTIONS") {
        return noContentResponse(origin);
      }

      if (request.method !== "POST") {
        return jsonResponse(
          { error: "Method not allowed" },
          {
            status: 405,
            origin,
            headers: {
              Allow: "POST, OPTIONS",
            },
          },
        );
      }

      assertConfiguredEnv(env);
      assertAIEnabled(env);
      const body = await parseBody(request, env);

      await verifyTurnstile(body.cf_turnstile_response, request, env);
      await checkRateLimit(request, env);
      await checkDailyAIBudget(env);

      const result = await handleRecommendScene(body.message, env);
      return jsonResponse(result, { origin });
    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error("Internal server error"), origin);
    }
  },
};
