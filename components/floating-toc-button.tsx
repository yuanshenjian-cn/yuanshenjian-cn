"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Menu, X } from "lucide-react";
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

  const handleClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const element = getVisibleElement(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, '', `#${id}`);
      handleClose();
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* 背景遮罩 - z-50 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={handleClose}
        />
      )}

      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`lg:hidden fixed bottom-20 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-300 hover:opacity-90 z-50 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label={isOpen ? "关闭目录" : "打开目录"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 目录面板 - 在屏幕中央居中显示 */}
      {isOpen && (
        <div
          ref={panelRef}
          className="lg:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full sm:max-w-md bg-card border rounded-lg shadow-2xl z-50 max-h-[70vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-card border-b px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">目录</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="py-3 space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={(e) => handleClick(heading.id, e)}
                className={`block w-full text-left text-sm py-2 rounded transition-colors text-left ${
                  activeId === heading.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                style={{
                  paddingLeft: `${(heading.level - 2) * 12 + 16}px`,
                  paddingRight: '16px',
                }}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
