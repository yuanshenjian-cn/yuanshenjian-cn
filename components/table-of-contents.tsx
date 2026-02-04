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

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-0.5">
      {headings.map((heading) => (
        <button
          key={heading.id}
          onClick={() => handleClick(heading.id)}
          className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
            activeId === heading.id
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={{
            paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
          }}
        >
          {heading.text}
        </button>
      ))}
    </nav>
  );
}
