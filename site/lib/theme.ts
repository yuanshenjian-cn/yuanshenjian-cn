export type Theme = "light" | "dark";

// 使用新 key，避免旧版自动写入的 theme 值把主题永久固定在某个模式上
export const THEME_STORAGE_KEY = "theme-preference";

export function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * 在首屏渲染前同步主题，避免深色模式用户看到浅色闪烁。
 * 必须以同步内联脚本执行，不能改成 useEffect。
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    var isDark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#000000" : "#ffffff");
  } catch (error) {}
})();
`;
