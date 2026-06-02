const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_DIR = path.join(REPO_ROOT, "site");
const hasSiteDir = fs.existsSync(SITE_DIR);

function resolveSitePath(...segments) {
  if (hasSiteDir) {
    return path.join(SITE_DIR, ...segments);
  }

  return path.join(REPO_ROOT, ...segments);
}

module.exports = {
  repoRoot: REPO_ROOT,
  siteDir: SITE_DIR,
  hasSiteDir,
  contentDir: path.join(REPO_ROOT, "content"),
  blogContentDir: path.join(REPO_ROOT, "content", "blog"),
  aiBriefingsDir: path.join(REPO_ROOT, "content", "ai-briefings"),
  investmentBriefingsDir: path.join(REPO_ROOT, "content", "investment-briefings"),
  scriptsDir: path.join(REPO_ROOT, "scripts"),
  skillsDir: path.join(REPO_ROOT, "skills"),
  oldBlogsDir: path.join(REPO_ROOT, "old-blogs"),
  sitePublicDir: resolveSitePath("public"),
  siteImagesDir: resolveSitePath("public", "images"),
  siteIconsDir: resolveSitePath("public", "icons"),
  siteScreenshotsDir: resolveSitePath("public", "screenshots"),
  siteDocsDir: resolveSitePath("public", "docs"),
  siteAiDataDir: resolveSitePath("public", "ai-data"),
  siteInvestmentDataDir: resolveSitePath("public", "investment-data"),
  siteFaviconPath: resolveSitePath("public", "favicon.ico"),
  siteBrandingAiIconPath: resolveSitePath("public", "images", "branding", "ai-icon-sparkles.svg"),
  siteOgDefaultImagePath: resolveSitePath("public", "images", "og-default.webp"),
  siteLogoGeneratorPath: resolveSitePath("scripts", "logo-generator.html"),
};
