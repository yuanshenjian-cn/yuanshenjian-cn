import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "dist/**",
      "dist_bak/**",
      "node_modules/**",
      ".opencode/**",
      "scripts/**",
      "public/**",
      "index.cjs",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
      }],

      "prefer-const": "warn",

      "no-console": ["warn", {
        allow: ["warn", "error"],
      }],
    },
  },
  {
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
