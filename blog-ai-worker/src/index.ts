import { validateOrigin } from "./middleware/origin";
import { assertAIEnabled, checkDailyAIBudget, checkRateLimit } from "./middleware/rate-limit";
import { verifyTurnstile } from "./middleware/turnstile";
import { streamArticleScene } from "./scenes/article";
import { streamAuthorScene } from "./scenes/author";
import { handleRecommendSceneStream } from "./scenes/recommend";
import type { ChatRequestBody, Env, ExecutionContext } from "./types";
import { HttpError } from "./types";
import { errorResponse, jsonResponse, noContentResponse } from "./utils/response";

const DEFAULT_REQUEST_MAX_BODY_BYTES = 8192;
const DEFAULT_REQUEST_MAX_MESSAGE_CHARS = 500;

function assertConfiguredEnv(env: Env): void {
  if (!env.TURNSTILE_SECRET_KEY?.trim()) {
    throw new HttpError(500, "Worker misconfigured: TURNSTILE_SECRET_KEY is missing");
  }

  if (!env.LLM_ACTIVE_PROFILE?.trim()) {
    throw new HttpError(500, "Worker misconfigured: LLM_ACTIVE_PROFILE is missing");
  }

  if (!env.LLM_PROVIDER_NAME?.trim()) {
    throw new HttpError(500, "Worker misconfigured: LLM_PROVIDER_NAME is missing");
  }

  if (!env.LLM_MODEL_ID?.trim()) {
    throw new HttpError(500, "Worker misconfigured: LLM_MODEL_ID is missing");
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

function getRouteType(pathname: string): "stream" | null {
  if (pathname === "/chat/stream" || pathname === "/api/ai/chat/stream") {
    return "stream";
  }

  return null;
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
    (payload.scene !== "recommend" && payload.scene !== "article" && payload.scene !== "author") ||
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

  if (payload.scene === "recommend") {
    return {
      scene: "recommend",
      message,
      cf_turnstile_response: payload.cf_turnstile_response,
    };
  }

  if (!isRecord(payload.context)) {
    throw new HttpError(400, "Invalid request payload");
  }

  if (payload.scene === "article") {
    if (typeof payload.context.slug !== "string" || !payload.context.slug.trim()) {
      throw new HttpError(400, "Invalid request payload");
    }

    return {
      scene: "article",
      message,
      context: {
        slug: payload.context.slug.trim(),
      },
      cf_turnstile_response: payload.cf_turnstile_response,
    };
  }

  if (payload.context.page !== "author") {
    throw new HttpError(400, "Invalid request payload");
  }

  return {
    scene: "author",
    message,
    context: {
      page: "author",
    },
    cf_turnstile_response: payload.cf_turnstile_response,
  };
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    let origin: string | undefined;

    try {
      const url = new URL(request.url);
      const routeType = getRouteType(url.pathname);

      if (!routeType) {
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

      await verifyTurnstile(body.cf_turnstile_response, request, env, body.scene);
      await checkRateLimit(request, env);
      await checkDailyAIBudget(env);

      if (routeType === "stream") {
        if (body.scene === "recommend") {
          return await handleRecommendSceneStream(body.message, env, origin);
        }

        if (body.scene === "article") {
          return await streamArticleScene(body, env, origin);
        }

        if (body.scene === "author") {
          return await streamAuthorScene(body, env, origin);
        }

        throw new HttpError(400, "Streaming is only supported for recommend, article and author scenes");
      }

      throw new HttpError(404, "Not found");

    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error("Internal server error"), origin);
    }
  },
};
