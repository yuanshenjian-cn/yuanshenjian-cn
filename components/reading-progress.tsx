"use client";

import { useState, useEffect } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      // 查找文章主内容区域
      const article = document.querySelector('article');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // 计算可滚动范围
      const scrollableHeight = articleHeight - windowHeight + 100; // 添加一些缓冲
      const scrolled = Math.max(0, window.scrollY - articleTop + 100);
      
      // 计算百分比
      const percent = Math.min(100, Math.max(0, (scrolled / scrollableHeight) * 100));
      
      setProgress(percent);
    };

    // 使用 requestAnimationFrame 优化性能
    let rafId: number;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    calculateProgress(); // 初始计算

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-transparent"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="阅读进度"
    >
      <div
        className="h-full bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
