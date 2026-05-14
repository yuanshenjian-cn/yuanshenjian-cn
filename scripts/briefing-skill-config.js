const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const AI_BRIEFING_SKILL_CONFIG_ROOT = path.join(ROOT, "skills", "ai-briefing", "config");
const INVESTMENT_BRIEFING_SKILL_CONFIG_ROOT = path.join(ROOT, "skills", "investment-briefing", "config");

function readJsonConfig(configRoot, fileName) {
  return JSON.parse(fs.readFileSync(path.join(configRoot, fileName), "utf8"));
}

function loadAiBriefingSkillConfig() {
  return {
    briefing: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "briefing.json"),
    focusCompanies: readJsonConfig(AI_BRIEFING_SKILL_CONFIG_ROOT, "focus-companies.json"),
  };
}

function loadInvestmentBriefingSkillConfig() {
  return {
    briefing: readJsonConfig(INVESTMENT_BRIEFING_SKILL_CONFIG_ROOT, "briefing.json"),
    blockedCompanies: readJsonConfig(INVESTMENT_BRIEFING_SKILL_CONFIG_ROOT, "blocked-companies.json"),
  };
}

module.exports = {
  AI_BRIEFING_SKILL_CONFIG_ROOT,
  INVESTMENT_BRIEFING_SKILL_CONFIG_ROOT,
  loadAiBriefingSkillConfig,
  loadInvestmentBriefingSkillConfig,
  readJsonConfig,
};
