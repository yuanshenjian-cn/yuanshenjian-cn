const path = require("node:path");
const { createRequire } = require("node:module");

const sitePackageJsonPath = path.resolve(__dirname, "..", "site", "package.json");

module.exports = {
  siteRequire: createRequire(sitePackageJsonPath),
};
