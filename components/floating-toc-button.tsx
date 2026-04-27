"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Heading } from "@/lib/mdx";
import { useActiveHeading } from "@/hooks/use-active-heading";

function renderHeadingText(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={i} className="text-[11px] font-mono bg-muted px-0.5 rounded">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

interface FloatingTocButtonProps {
  headings: Heading[];
}

export function FloatingTocButton({ headings }: FloatingTocButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 仅在抽屉打开时监听 heading，避免背景观察开销
  const { activeId, getVisibleElement } = useActiveHeading(headings, { enabled: isOpen });

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

  // 禁止背景滚动当抽屉打开时
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      panelRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const element = getVisibleElement(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-toc-title"
        tabIndex={-1}
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-card border-r border-border shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 抽屉头部 */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h3 id="mobile-toc-title" className="text-sm font-medium text-foreground">目录</h3>
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
              {renderHeadingText(heading.text)}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
