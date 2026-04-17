"use client";

import { useCallback, useEffect, useState } from "react";
import type { Heading } from "@/lib/mdx";

/**
 * 在文档中查找与 id 对应的、真实可见的 heading 元素。
 * 解决了当页面中存在重复 id（如桌面/移动双视图渲染）时返回正确元素的问题。
 */
export function getVisibleHeadingElement(id: string): HTMLElement | null {
  const elements = document.querySelectorAll(`[id="${CSS.escape(id)}"]`);

  for (const el of elements) {
    const element = el as HTMLElement;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    if (style.display !== "none" && style.visibility !== "hidden" && rect.height > 0) {
      return element;
    }
  }

  return null;
}

interface UseActiveHeadingOptions {
  /** 是否启用观察（false 时不创建 observer，用于抽屉未打开场景） */
  enabled?: boolean;
  /** IntersectionObserver 的 rootMargin，默认 "-20% 0% -80% 0%" */
  rootMargin?: string;
}

/**
 * 监听文档中的 heading 并返回当前活动的 id。
 * 提供 getVisibleElement 用于根据 id 查找真实可见的 DOM 元素（跳转用）。
 */
export function useActiveHeading(
  headings: Heading[],
  { enabled = true, rootMargin = "-20% 0% -80% 0%" }: UseActiveHeadingOptions = {},
): { activeId: string; getVisibleElement: (id: string) => HTMLElement | null } {
  const [activeId, setActiveId] = useState<string>("");

  const getVisibleElement = useCallback(getVisibleHeadingElement, []);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin },
    );

    headings.forEach((heading) => {
      const element = getVisibleElement(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [enabled, headings, rootMargin, getVisibleElement]);

  return { activeId, getVisibleElement };
}
