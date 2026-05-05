import { buildAuthorSystemPrompt } from "../prompts/author";
import type { AuthorChunk, AuthorPageData, AuthorRequestBody, PageData, PageSection } from "../types";
import type { Env } from "../types";
import { HttpError } from "../types";
import { USER_FACING_AI_ERROR_MESSAGE } from "./errors";
import { handlePageSceneStream, isPageData } from "./page";

function isAuthorPageData(pageData: PageData): pageData is AuthorPageData {
  return typeof (pageData as AuthorPageData).summary === "string";
}

function isAuthorChunk(value: unknown): value is AuthorChunk {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AuthorChunk).id === "string" &&
    typeof (value as AuthorChunk).heading === "string" &&
    typeof (value as AuthorChunk).content === "string" &&
    typeof (value as AuthorChunk).excerpt === "string" &&
    ((value as AuthorChunk).anchorId === undefined || typeof (value as AuthorChunk).anchorId === "string")
  );
}

function isAuthorPagePayload(value: unknown): value is AuthorPageData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AuthorPageData).slug === "string" &&
    typeof (value as AuthorPageData).title === "string" &&
    typeof (value as AuthorPageData).summary === "string" &&
    typeof (value as AuthorPageData).entities === "object" &&
    (value as AuthorPageData).entities !== null &&
    Array.isArray((value as AuthorPageData).chunks) &&
    (value as AuthorPageData).chunks.every(isAuthorChunk) &&
    (((value as AuthorPageData).sections === undefined) ||
      (Array.isArray((value as AuthorPageData).sections) && isPageData({ ...(value as AuthorPageData), sections: (value as AuthorPageData).sections })))
  );
}

function resolveAuthorReferenceSections(pageData: AuthorPageData): PageSection[] {
  if (Array.isArray(pageData.chunks) && pageData.chunks.length > 0) {
    return pageData.chunks;
  }

  return pageData.sections ?? [];
}

export async function streamAuthorScene(body: AuthorRequestBody, env: Env, origin?: string): Promise<Response> {
  return handlePageSceneStream({
    env,
    pageDataPath: "author.json",
    sourceType: "author-section",
    message: body.message,
    validatePageData: isAuthorPagePayload,
    getReferenceSections: (pageData) => resolveAuthorReferenceSections(pageData as AuthorPageData),
    buildSystemPrompt: (pageData) => {
      if (!isAuthorPageData(pageData)) {
        throw new HttpError(502, USER_FACING_AI_ERROR_MESSAGE);
      }

      return buildAuthorSystemPrompt(pageData);
    },
    origin,
  });
}
