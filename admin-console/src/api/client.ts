const baseUrl = import.meta.env.VITE_CORE_SERVICE_URL ?? "http://localhost:8001";

export interface AdminCommentItem {
  id: string;
  article_slug: string;
  parent_id: string | null;
  display_name: string;
  content_markdown: string;
  status: string;
  ai_moderation_recommended_status: string | null;
  ai_moderation_labels: string[];
  ai_moderation_reason: string | null;
  created_at: string;
}

export interface AdminOverview {
  total_pv: number;
  today_pv: number;
  approved_comments: number;
  pending_comments: number;
}

export interface SystemStatus {
  api: string;
  db: string;
  rag_documents: number;
  rag_chunks: number;
  last_rag_sync: { status: string; commit_sha: string | null; started_at: string } | null;
}

export interface KnowledgeSourceItem {
  id: string;
  name: string;
  source_kind: string;
  domains: string[];
  scenes: string[];
  status: string;
  source_uri: string | null;
  sync_strategy: string;
  content_config: Record<string, unknown>;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeTermItem {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  explanation: string;
  related_article_slugs: string[];
  references: Array<{ label: string; url: string }>;
  domains: string[];
  scenes: string[];
  status: string;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveKnowledgeTermPayload {
  term: string;
  aliases: string[];
  definition: string;
  explanation: string;
  related_article_slugs: string[];
  references: Array<{ label: string; url: string }>;
  domains: string[];
  scenes: string[];
  status: string;
  notes?: string;
  updated_by?: string;
}

export interface SaveKnowledgeSourcePayload {
  name: string;
  source_kind: string;
  domains: string[];
  scenes: string[];
  status: string;
  source_uri?: string;
  sync_strategy: string;
  content_config: Record<string, unknown>;
  notes?: string;
  updated_by?: string;
}

function getCsrfToken(): string {
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("csrf_token="))
    ?.split("=")[1] ?? "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken(),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function login(password: string, turnstileToken = "") {
  return request<{ ok: boolean; csrf_token: string }>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ password, csrf_token: getCsrfToken(), turnstile_token: turnstileToken }),
  });
}

export function fetchMe() {
  return request<{ role: string }>("/api/v1/admin/me");
}

export function logout() {
  return request<{ ok: boolean }>("/api/v1/admin/auth/logout", {
    method: "POST",
    body: JSON.stringify({ csrf_token: getCsrfToken() }),
  });
}

export function fetchComments(status = "pending") {
  return request<{ items: AdminCommentItem[]; next_cursor: string | null }>(`/api/v1/admin/comments?status=${status}`);
}

export function reviewComment(id: string, action: "approve" | "reject" | "mark-spam", reviewNote = "") {
  return request<{ id: string; status: string }>(`/api/v1/admin/comments/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ review_note: reviewNote, csrf_token: getCsrfToken() }),
  });
}

export function fetchOverview() {
  return request<AdminOverview>("/api/v1/admin/analytics/overview");
}

export function fetchAiUsage() {
  return request<{ total_requests: number; items: unknown[] }>("/api/v1/admin/ai-usage/overview");
}

export function fetchSystemStatus() {
  return request<SystemStatus>("/api/v1/admin/system/status");
}

export function fetchKnowledgeSources() {
  return request<{ items: KnowledgeSourceItem[] }>("/api/v1/admin/knowledge-base");
}

export function createKnowledgeSource(payload: SaveKnowledgeSourcePayload) {
  return request<{ id: string; status: string }>("/api/v1/admin/knowledge-base", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateKnowledgeSource(id: string, payload: SaveKnowledgeSourcePayload) {
  return request<{ id: string; status: string }>(`/api/v1/admin/knowledge-base/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function archiveKnowledgeSource(id: string) {
  return request<{ id: string; status: string }>(`/api/v1/admin/knowledge-base/${id}/archive`, {
    method: "POST",
    body: JSON.stringify({ csrf_token: getCsrfToken() }),
  });
}

export function rebuildKnowledgeSource(id: string) {
  return request<{ id: string; status: string }>(`/api/v1/admin/knowledge-base/${id}/rebuild`, {
    method: "POST",
    body: JSON.stringify({ csrf_token: getCsrfToken() }),
  });
}

export interface KnowledgeTermFilters {
  term?: string;
  scene?: string;
  domain?: string;
}

export function fetchKnowledgeTerms(
  page = 1,
  pageSize = 10,
  filters: KnowledgeTermFilters = {},
  includeTotal = true,
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    include_total: String(includeTotal),
  });
  if (filters.term?.trim()) searchParams.set("term", filters.term.trim());
  if (filters.scene?.trim()) searchParams.set("scene", filters.scene.trim());
  if (filters.domain?.trim()) searchParams.set("domain", filters.domain.trim());
  return request<{ items: KnowledgeTermItem[]; total: number | null; page: number; page_size: number }>(
    `/api/v1/admin/knowledge-terms?${searchParams.toString()}`,
  );
}

export function createKnowledgeTerm(payload: SaveKnowledgeTermPayload) {
  return request<{ id: string; status: string }>("/api/v1/admin/knowledge-terms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateKnowledgeTerm(id: string, payload: SaveKnowledgeTermPayload) {
  return request<{ id: string; status: string }>(`/api/v1/admin/knowledge-terms/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function archiveKnowledgeTerm(id: string) {
  return request<{ id: string; status: string }>(`/api/v1/admin/knowledge-terms/${id}/archive`, {
    method: "POST",
    body: JSON.stringify({ csrf_token: getCsrfToken() }),
  });
}

export function deleteKnowledgeTerm(id: string) {
  return request<{ id: string; status: string }>(`/api/v1/admin/knowledge-terms/${id}`, {
    method: "DELETE",
  });
}

export function rebuildKnowledgeTerms() {
  return request<{ id: string; status: string }>("/api/v1/admin/knowledge-terms/rebuild", {
    method: "POST",
    body: JSON.stringify({ csrf_token: getCsrfToken() }),
  });
}
