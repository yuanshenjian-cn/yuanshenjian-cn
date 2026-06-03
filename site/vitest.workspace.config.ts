import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: path.resolve(__dirname, "node_modules/.vite-workspace"),
  test: {
    environment: "node",
    globals: true,
    include: [
      path.resolve(__dirname, "../scripts/tests/**/*.{test,spec}.{ts,tsx}"),
      path.resolve(__dirname, "../skills/tests/**/*.{test,spec}.{ts,tsx}"),
    ],
  },
});
