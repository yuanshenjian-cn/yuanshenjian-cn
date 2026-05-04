import { buildArticleSystemPrompt } from "../prompts/article";
import type { ArticlePageData, ArticleRequestBody, PageData, PageResponse } from "../types";
import type { Env } from "../types";
import { HttpError } from "../types";
import { handlePageScene, handlePageSceneStream } from "./page";

function isArticlePageData(pageData: PageData): pageData is ArticlePageData {
  return Array.isArray((pageData as ArticlePageData).tags) && typeof (pageData as ArticlePageData).date === "string";
}

export async function handleArticleScene(body: ArticleRequestBody, env: Env): Promise<PageResponse> {
  return handlePageScene({
    env,
    scene: "article",
    pageDataPath: `articles/${body.context.slug}.json`,
    sourceType: "article-section",
    message: body.message,
    buildSystemPrompt: (pageData) => {
      if (!isArticlePageData(pageData)) {
        throw new HttpError(502, "AI 暂时无法整理当前页面内容，请稍后再试。");
      }

      return buildArticleSystemPrompt(pageData);
    },
  });
}

export async function streamArticleScene(body: ArticleRequestBody, env: Env, origin?: string): Promise<Response> {
  return handlePageSceneStream({
    env,
    scene: "article",
    pageDataPath: `articles/${body.context.slug}.json`,
    sourceType: "article-section",
    message: body.message,
    buildSystemPrompt: (pageData) => {
      if (!isArticlePageData(pageData)) {
        throw new HttpError(502, "AI 暂时无法整理当前页面内容，请稍后再试。");
      }

      return buildArticleSystemPrompt(pageData);
    },
    origin,
  });
}
