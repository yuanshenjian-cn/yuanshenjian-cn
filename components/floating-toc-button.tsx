"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Heading } from "@/lib/mdx";

interface FloatingTocButtonProps {
  headings: Heading[];
}

export function FloatingTocButton({ headings }: FloatingTocButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 获取可见的 heading 元素（修复重复ID问题）
  const getVisibleElement = useCallback((id: string): HTMLElement | null => {
    const elements = document.querySelectorAll(`[id="${CSS.escape(id)}"]`);
    
    for (const el of elements) {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      if (style.display !== 'none' && 
          style.visibility !== 'hidden' &&
          rect.height > 0) {
        return element;
      }
    }
    
    return null;
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 监听滚动显示按钮
  useEffect(() => {
    const toggleVisibility = () => {
      // 比返回顶部按钮(300px)稍晚出现
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // 监听当前活动的 heading
  useEffect(() => {
    if (!isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -80% 0%" }
    );

    headings.forEach((heading) => {
      const element = getVisibleElement(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [isOpen, headings, getVisibleElement]);

  // 禁止背景滚动当抽屉打开时
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const element = getVisibleElement(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, '', `#${id}`);
      // 点击后自动关闭抽屉
      handleClose();
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={handleClose}
      />

      {/* 左侧触发按钮 - 垂直居中 */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`lg:hidden fixed left-0 top-1/2 -translate-y-1/2 px-[3px] py-6 bg-card dark:bg-muted border border-l-0 border-border dark:border-muted-foreground/20 rounded-r-lg transition-all duration-300 hover:bg-muted dark:hover:bg-muted/80 z-50 ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
        } ${isOpen ? "translate-x-64" : ""}`}
        aria-label={isOpen ? "关闭目录" : "打开目录"}
      >
        {isOpen ? (
          <ChevronLeft className="w-3 h-6 text-muted-foreground dark:text-foreground" />
        ) : (
          <ChevronRight className="w-3 h-6 text-muted-foreground dark:text-foreground" />
        )}
      </button>

      {/* 左侧抽屉目录 */}
      <div
        ref={panelRef}
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-card border-r border-border shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 抽屉头部 */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">目录</h3>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            aria-label="关闭"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 目录内容 */}
        <nav className="py-3 px-2 space-y-0.5 overflow-y-auto h-[calc(100%-3.5rem)]">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={(e) => handleClick(heading.id, e)}
              className={`block w-full text-left text-sm py-2 px-3 rounded-md transition-colors ${
                activeId === heading.id
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={{
                paddingLeft: `${(heading.level - 2) * 12 + 12}px`,
              }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
