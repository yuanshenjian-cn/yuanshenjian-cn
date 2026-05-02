import { HttpError } from "../types";

function createCorsHeaders(origin: string): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

export function jsonResponse(
  payload: unknown,
  options: { status?: number; origin?: string; headers?: HeadersInit } = {},
): Response {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");

  if (options.origin) {
    const corsHeaders = createCorsHeaders(options.origin);
    corsHeaders.forEach((value, key) => headers.set(key, value));
  }

  return new Response(JSON.stringify(payload), {
    status: options.status ?? 200,
    headers,
  });
}

export function noContentResponse(origin?: string): Response {
  return new Response(null, {
    status: 204,
    headers: origin ? createCorsHeaders(origin) : undefined,
  });
}

export function errorResponse(error: Error, origin?: string): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: error.message },
      {
        status: error.status,
        origin,
        headers: error.headers,
      },
    );
  }

  return jsonResponse(
    { error: "Internal server error" },
    {
      status: 500,
      origin,
    },
  );
}
