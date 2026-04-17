"use client";

import { Heading } from "@/lib/mdx";
import { useActiveHeading } from "@/hooks/use-active-heading";

function renderHeadingText(text: string): string {
  return text.replace(/`([^`]+)`/g, "$1");
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const { activeId, getVisibleElement } = useActiveHeading(headings);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = getVisibleElement(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <nav className="space-y-0.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => handleClick(e, heading.id)}
            className={`block w-full text-left text-sm py-1 rounded transition-colors cursor-pointer ${
              activeId === heading.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{
              paddingLeft: `${(heading.level - 2) * 12}px`,
              paddingRight: "8px",
            }}
          >
            {renderHeadingText(heading.text)}
          </a>
        ))}
      </nav>
    </div>
  );
}
