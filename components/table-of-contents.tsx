"use client";

import { Heading } from "@/lib/mdx";
import { useEffect, useState } from "react";

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

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
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // 更新 URL hash
      window.history.pushState(null, "", `#${id}`);
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
