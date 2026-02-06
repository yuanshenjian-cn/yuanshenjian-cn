"use client";

import { useEffect, useRef } from "react";

interface GiscusCommentsProps {
  path?: string;
}

export function GiscusComments({ path }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
    const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
    const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

    if (!repo || !repoId || !category || !categoryId) {
      console.warn("Giscus: Environment variables are not set");
      return;
    }

    // 检测当前主题
    const getTheme = () => {
      if (typeof window === "undefined") return "light";
      const html = document.documentElement;
      return html.classList.contains("dark") ? "dark" : "light";
    };

    const container = containerRef.current;
    if (!container) return;

    // 清理现有内容
    container.innerHTML = "";

    // 创建 script 元素
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    // 配置 Giscus
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "0");
    script.setAttribute("data-emit-metadata", "1");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", getTheme());
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");

    container.appendChild(script);

    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const html = mutation.target as HTMLElement;
          const isDark = html.classList.contains("dark");
          const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
          if (iframe) {
            iframe.contentWindow?.postMessage(
              { giscus: { setConfig: { theme: isDark ? "dark" : "light" } } },
              "https://giscus.app"
            );
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
      container.innerHTML = "";
    };
  }, [path]);

  return (
    <div className="mt-8 mb-0">
      <div 
        ref={containerRef} 
        className="giscus-wrapper" 
        style={{ 
          transform: "scale(0.92)", 
          transformOrigin: "top left",
          width: "108.7%",
          minHeight: "300px"
        }} 
      />
    </div>
  );
}
