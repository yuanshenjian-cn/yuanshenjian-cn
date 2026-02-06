"use client";

import { Heading } from "@/lib/mdx";
import { useEffect, useState, useCallback } from "react";

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  // 获取当前可见的 heading 元素
  const getVisibleElement = useCallback((id: string): HTMLElement | null => {
    const elements = document.querySelectorAll(`[id="${CSS.escape(id)}"]`);
    
    for (const el of elements) {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      // 检查元素是否可见且在视口内或附近
      if (style.display !== 'none' && 
          style.visibility !== 'hidden' &&
          rect.height > 0) {
        return element;
      }
    }
    
    return null;
  }, []);

  useEffect(() => {
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
  }, [headings, getVisibleElement]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    
    const element = getVisibleElement(id);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">目录</h3>
        <div className="h-px bg-border" />
      </div>
      <nav className="space-y-0.5 -mx-2">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => handleClick(e, heading.id)}
            className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors cursor-pointer ${
              activeId === heading.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{
              paddingLeft: `${(heading.level - 1) * 12}px`,
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
