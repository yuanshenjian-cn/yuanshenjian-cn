import fs from "node:fs";
import path from "node:path";

type BriefingRouteKind = "aiBriefings" | "investmentBriefings";

interface SiteBuildPlan {
  mode: "full" | "incremental";
  routes: {
    articles?: string[];
    aiBriefings?: string[];
    investmentBriefings?: string[];
  };
}

let cachedPlan: SiteBuildPlan | null | undefined;

function resolvePlanFilePath(): string | null {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, ".cache", "site-build", "plan.json"),
    path.join(cwd, "site", ".cache", "site-build", "plan.json"),
    path.join(cwd, "..", "site", ".cache", "site-build", "plan.json"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSiteBuildPlan(value: unknown): value is SiteBuildPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as { mode?: unknown; routes?: unknown };
  if (plan.mode !== "full" && plan.mode !== "incremental") {
    return false;
  }

  if (typeof plan.routes !== "object" || plan.routes === null) {
    return false;
  }

  const routes = plan.routes as Record<string, unknown>;
  return (routes.articles === undefined || isStringArray(routes.articles))
    && (routes.aiBriefings === undefined || isStringArray(routes.aiBriefings))
    && (routes.investmentBriefings === undefined || isStringArray(routes.investmentBriefings));
}

function readSiteBuildPlan(): SiteBuildPlan | null {
  if (cachedPlan !== undefined) {
    return cachedPlan;
  }

  const planFilePath = resolvePlanFilePath();
  if (process.env.SITE_INCREMENTAL_BUILD !== "true" || !planFilePath) {
    cachedPlan = null;
    return cachedPlan;
  }

  try {
    const rawPlan: unknown = JSON.parse(fs.readFileSync(planFilePath, "utf8"));
    cachedPlan = isSiteBuildPlan(rawPlan) ? rawPlan : null;
  } catch (error) {
    console.warn("[SiteBuildPlan] Failed to read incremental build plan:", error);
    cachedPlan = null;
  }

  return cachedPlan;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function filterCurrentRoutes(routes: string[], currentSlugs: string[]): string[] {
  const currentSet = new Set(currentSlugs);
  return unique(routes.filter((route) => route === "latest" || currentSet.has(route)));
}

export function getArticleStaticParamSlugs(currentSlugs: string[]): string[] {
  const plan = readSiteBuildPlan();
  if (!plan || plan.mode !== "incremental") {
    return unique([...currentSlugs, "latest"]);
  }

  const routes = filterCurrentRoutes(plan.routes.articles ?? [], currentSlugs);
  return routes.length > 0 ? routes : ["latest"];
}

export function getBriefingStaticParamDates(kind: BriefingRouteKind, currentDates: string[]): string[] {
  const plan = readSiteBuildPlan();
  if (currentDates.length === 0) {
    return ["__empty__", "latest"];
  }

  if (!plan || plan.mode !== "incremental") {
    return unique([...currentDates, "latest"]);
  }

  const routes = filterCurrentRoutes(plan.routes[kind] ?? [], currentDates);
  return routes.length > 0 ? routes : ["latest"];
}
