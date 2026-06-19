"use client";

import { useEffect, useState } from "react";

export interface ReadingSection {
  id: string;
  text: string;
  level: number;
}

export function useReadingProgress(headings: ReadingSection[], containerSelector = ".prose") {
  const [activeSection, setActiveSection] = useState<ReadingSection | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    function updateActiveSection() {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const scrollTop = window.scrollY;
      const offset = 200;
      let current: ReadingSection | null = null;

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + scrollTop;
        if (top <= scrollTop + offset) {
          current = heading;
        }
      }

      setActiveSection(current);
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [headings, containerSelector]);

  return activeSection;
}
