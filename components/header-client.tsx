"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
};
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { SearchPost } from "@/types/blog";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface HeaderClientProps {
  navItems: NavItem[];
  posts: SearchPost[];
}

export function HeaderClient({ navItems, posts }: HeaderClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="h-4 w-px bg-border" />
        <GlobalSearch posts={posts} />
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <GlobalSearch posts={posts} />
        <ThemeToggle />
        <button
          className="p-2 hover:bg-muted rounded-md transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 border-b bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon ? iconMap[item.icon] : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-sm py-2 px-3 rounded-md transition-colors ${
                    isActive(item.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
