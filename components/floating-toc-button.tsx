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

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

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
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [isOpen, headings]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      handleClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleTouchStart);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isOpen, handleClose]);

  if (headings.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed bottom-20 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-300 hover:opacity-90 z-40 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="打开目录"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={handleClose}
        />
      )}

      {isOpen && (
        <div
          ref={panelRef}
          className="lg:hidden fixed bottom-32 left-4 right-4 bg-card border rounded-lg shadow-xl z-50 max-h-[60vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">目录</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="p-2 space-y-0.5">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={(e) => handleClick(heading.id, e)}
                className={`block w-full text-left text-sm py-2 px-3 rounded transition-colors text-left ${
                  activeId === heading.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                style={{
                  paddingLeft: `${(heading.level - 1) * 16 + 12}px`,
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
