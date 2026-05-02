import { validateOrigin } from "./middleware/origin";
import { checkRateLimit } from "./middleware/rate-limit";
import { verifyTurnstile } from "./middleware/turnstile";
import { handleRecommendScene } from "./scenes/recommend";
import type { ChatRequestBody, Env, ExecutionContext } from "./types";
import { HttpError } from "./types";
import { errorResponse, jsonResponse, noContentResponse } from "./utils/response";

function assertConfiguredEnv(env: Env): void {
  if (!env.TURNSTILE_SECRET_KEY?.trim()) {
    throw new HttpError(500, "Worker misconfigured: TURNSTILE_SECRET_KEY is missing");
  }

  if (!env.TOKENHUB_API_KEY?.trim()) {
    throw new HttpError(500, "Worker misconfigured: TOKENHUB_API_KEY is missing");
  }

  if (!env.TOKENHUB_BASE_URL?.trim()) {
    throw new HttpError(500, "Worker misconfigured: TOKENHUB_BASE_URL is missing");
  }

  if (!env.AI_DATA_BASE_URL?.trim()) {
    throw new HttpError(500, "Worker misconfigured: AI_DATA_BASE_URL is missing");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatPath(pathname: string): boolean {
  return pathname === "/chat" || pathname === "/api/ai/chat";
}

async function parseBody(request: Request): Promise<ChatRequestBody> {
  const payload: unknown = await request.json().catch(() => null);

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
      const body = await parseBody(request);

      await verifyTurnstile(body.cf_turnstile_response, request, env);
      await checkRateLimit(request, env);

      const result = await handleRecommendScene(body.message, env);
      return jsonResponse(result, { origin });
    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error("Internal server error"), origin);
    }
  },
};
