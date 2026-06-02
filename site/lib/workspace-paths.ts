import path from "node:path";

export const siteDir = process.cwd();
export const repoRoot = path.resolve(siteDir, "..");

export const contentDir = path.join(repoRoot, "content");
export const blogContentDir = path.join(contentDir, "blog");
export const aiBriefingsDir = path.join(contentDir, "ai-briefings");
export const investmentBriefingsDir = path.join(contentDir, "investment-briefings");

export const skillsDir = path.join(repoRoot, "skills");
export const sitePublicDir = path.join(siteDir, "public");
export const siteImagesDir = path.join(sitePublicDir, "images");
export const siteAiDataDir = path.join(sitePublicDir, "ai-data");
export const siteInvestmentDataDir = path.join(sitePublicDir, "investment-data");
export const siteBrandingAiIconPath = path.join(siteImagesDir, "branding", "ai-icon-sparkles.svg");
