import { config } from "@/lib/config";

export interface ArticleStats {
  article_slug: string;
  pv: number;
  uv: number;
}

export interface PublicComment {
  id: string;
  article_slug: string;
  parent_id: string | null;
  display_name: string;
  content_html: string;
  status: string;
  created_at: string;
  replies: PublicComment[];
}

function getCoreServiceUrl(): string {
  return config.ai.coreServiceUrl;
}

export async function fetchArticleStats(slug: string): Promise<ArticleStats | null> {
  const baseUrl = getCoreServiceUrl();
  if (!baseUrl) {
    return null;
  }
  const response = await fetch(`${baseUrl}/api/v1/articles/${slug}/stats`, {
    credentials: "include",
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<ArticleStats>;
}

export async function recordArticleView(slug: string): Promise<ArticleStats | null> {
  const baseUrl = getCoreServiceUrl();
  if (!baseUrl || typeof window === "undefined") {
    return null;
  }
  const response = await fetch(`${baseUrl}/api/v1/articles/${slug}/view`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referrer: document.referrer || undefined }),
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<ArticleStats>;
}

export async function fetchComments(slug: string): Promise<PublicComment[]> {
  const baseUrl = getCoreServiceUrl();
  if (!baseUrl) {
    return [];
  }
  const response = await fetch(`${baseUrl}/api/v1/articles/${slug}/comments`, {
    credentials: "include",
  });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { items?: PublicComment[] };
  return payload.items ?? [];
}

export async function submitComment(slug: string, input: { displayName: string; email?: string; content: string; turnstileToken: string; parentId?: string }): Promise<boolean> {
  const baseUrl = getCoreServiceUrl();
  if (!baseUrl) {
    return false;
  }
  const response = await fetch(`${baseUrl}/api/v1/articles/${slug}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parent_id: input.parentId,
      display_name: input.displayName,
      email: input.email,
      content_markdown: input.content,
      turnstile_token: input.turnstileToken,
    }),
  });
  return response.ok;
}
