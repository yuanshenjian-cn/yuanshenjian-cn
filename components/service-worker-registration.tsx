"use client";

import { useEffect } from "react";

/**
 * Service Worker 注册组件
 * 在客户端挂载时注册 SW
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // 只在生产环境和浏览器环境注册
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        console.log("[SW] Registered successfully:", registration.scope);
        
        // 监听更新
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[SW] New version available");
                // 可以在这里提示用户刷新页面
              }
            });
          }
        });
      } catch (error) {
        console.error("[SW] Registration failed:", error);
      }
    };

    // 延迟注册，避免影响首屏加载
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
