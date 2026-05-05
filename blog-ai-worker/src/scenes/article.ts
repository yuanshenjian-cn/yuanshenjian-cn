import { buildArticleSystemPrompt } from "../prompts/article";
import type { ArticlePageData, ArticleRequestBody, PageData } from "../types";
import type { Env } from "../types";
import { HttpError } from "../types";
import { USER_FACING_AI_ERROR_MESSAGE } from "./errors";
import { handlePageSceneStream } from "./page";

function isArticlePageData(pageData: PageData): pageData is ArticlePageData {
  return Array.isArray((pageData as ArticlePageData).tags) && typeof (pageData as ArticlePageData).date === "string";
}

export async function streamArticleScene(body: ArticleRequestBody, env: Env, origin?: string): Promise<Response> {
  return handlePageSceneStream({
    env,
    pageDataPath: `articles/${body.context.slug}.json`,
    sourceType: "article-section",
    message: body.message,
    buildSystemPrompt: (pageData) => {
      if (!isArticlePageData(pageData)) {
        throw new HttpError(502, USER_FACING_AI_ERROR_MESSAGE);
      }

      return buildArticleSystemPrompt(pageData);
    },
    origin,
  });
}
