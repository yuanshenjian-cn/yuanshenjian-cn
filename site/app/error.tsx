"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-serif font-bold mb-4">出错了</h1>
      <p className="text-muted-foreground mb-8">
        抱歉，发生了一些错误。请稍后再试。
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        重试
      </button>
    </div>
  );
}
