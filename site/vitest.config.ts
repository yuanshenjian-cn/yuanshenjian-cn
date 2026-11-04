import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // 数据层用例（blog/briefings/columns）需解析 300+ 篇 Markdown 源文件，
    // 慢速磁盘或并行 I/O 下默认 5s 会误报超时，放宽到 30s 不影响断言本身。
    testTimeout: 30_000,
    // 高并行时主进程 RPC 易超时（worker "onTaskUpdate" unhandled error），
    // 限制 fork 数以稳定退出码。
    poolOptions: {
      forks: { maxForks: 2, minForks: 1 },
    },
    setupFiles: [path.resolve(__dirname, "tests/setup.ts")],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
