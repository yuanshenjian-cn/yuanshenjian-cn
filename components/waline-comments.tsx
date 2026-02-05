"use client";

import { useEffect, useRef } from "react";
import { init } from "@waline/client";
import "@waline/client/waline.css";

interface WalineCommentsProps {
  path?: string;
}

export function WalineComments({ path }: WalineCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const walineInstanceRef = useRef<ReturnType<typeof init> | null>(null);

  useEffect(() => {
    const serverURL = process.env.NEXT_PUBLIC_WALINE_SERVER_URL;

    if (!serverURL) {
      console.warn("Waline: NEXT_PUBLIC_WALINE_SERVER_URL is not set");
      return;
    }

    if (containerRef.current) {
      walineInstanceRef.current = init({
        el: containerRef.current,
        serverURL,
        path: path || window.location.pathname,
        lang: "zh-CN",
        dark: "html.dark",
        requiredMeta: ["nick", "mail"],
        emoji: [
          "https://unpkg.com/@waline/emojis@1.1.0/weibo",
          "https://unpkg.com/@waline/emojis@1.1.0/bilibili",
          "https://unpkg.com/@waline/emojis@1.1.0/qq",
        ],
        locale: {
          placeholder: "欢迎留言交流~",
        },
        wordLimit: 1000,
        pageSize: 10,
        noCopyright: true,
        reaction: true,
      });
    }

    return () => {
      if (walineInstanceRef.current) {
        walineInstanceRef.current.destroy();
      }
    };
  }, [path]);

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-medium mb-6">评论</h3>
      <div ref={containerRef} className="waline-wrapper" />
    </div>
  );
}
