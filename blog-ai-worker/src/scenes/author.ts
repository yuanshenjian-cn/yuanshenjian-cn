import { buildAuthorSystemPrompt } from "../prompts/author";
import type { AuthorPageData, AuthorRequestBody, PageData, PageResponse } from "../types";
import type { Env } from "../types";
import { HttpError } from "../types";
import { handlePageScene, handlePageSceneStream } from "./page";

function isAuthorPageData(pageData: PageData): pageData is AuthorPageData {
  return typeof (pageData as AuthorPageData).summary === "string";
}

export async function handleAuthorScene(body: AuthorRequestBody, env: Env): Promise<PageResponse> {
  return handlePageScene({
    env,
    scene: "author",
    pageDataPath: "author.json",
    sourceType: "author-section",
    message: body.message,
    buildSystemPrompt: (pageData) => {
      if (!isAuthorPageData(pageData)) {
        throw new HttpError(502, "AI 暂时无法整理当前页面内容，请稍后再试。");
      }

      return buildAuthorSystemPrompt(pageData);
    },
  });
}

export async function streamAuthorScene(body: AuthorRequestBody, env: Env, origin?: string): Promise<Response> {
  return handlePageSceneStream({
    env,
    scene: "author",
    pageDataPath: "author.json",
    sourceType: "author-section",
    message: body.message,
    buildSystemPrompt: (pageData) => {
      if (!isAuthorPageData(pageData)) {
        throw new HttpError(502, "AI 暂时无法整理当前页面内容，请稍后再试。");
      }

      return buildAuthorSystemPrompt(pageData);
    },
    origin,
  });
}
