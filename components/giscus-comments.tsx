"use client";

import { useEffect, useRef, useState } from "react";

interface GiscusCommentsProps {
  path?: string;
}

export function GiscusComments({ path }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Giscus 配置（硬编码，确保线上可用）
    const repo = "yuanshenjian-cn/yuanshenjian-cn";
    const repoId = "R_kgDORINV5g";
    const category = "General";
    const categoryId = "DIC_kwDORINV5s4C19yc";

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
    setIsLoading(true);
    setHasError(false);

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

    // 监听脚本加载完成
    script.onload = () => {
      // 延迟检查 iframe 是否存在
      setTimeout(() => {
        const iframe = document.querySelector("iframe.giscus-frame");
        if (iframe) {
          setIsLoading(false);
        }
      }, 1000);
    };

    // 监听加载错误
    script.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };

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
      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-sm">正在加载评论...</span>
        </div>
      )}

      {/* 错误提示 */}
      {hasError && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm mb-2">评论加载失败，请稍后重试</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            刷新页面
          </button>
        </div>
      )}

      {/* Giscus 容器 */}
      <div 
        ref={containerRef} 
        className="giscus-wrapper" 
        style={{ 
          transform: "scale(0.92)", 
          transformOrigin: "top left",
          width: "108.7%",
          minHeight: isLoading || hasError ? "auto" : "300px"
        }} 
      />
    </div>
  );
}
