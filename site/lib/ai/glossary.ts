import { config } from "@/lib/config";

export interface GlossaryItem {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  related_article_slugs: string[];
}

function resolveBaseUrl(): string {
  const workerUrl = config.ai.workerUrl;
  if (workerUrl.startsWith("http")) {
    return workerUrl;
  }
  if (typeof window !== "undefined") {
    return "";
  }
  return config.site.url;
}

export async function fetchGlossary(scene?: string, domain?: string): Promise<GlossaryItem[]> {
  const params = new URLSearchParams();
  if (scene) params.set("scene", scene);
  if (domain) params.set("domain", domain);

  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}/api/v1/ai-assistant/glossary?${params.toString()}`;

  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    return [];
  }
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !Array.isArray((data as Record<string, unknown>).items)) {
    return [];
  }
  return (data as { items: GlossaryItem[] }).items;
}
