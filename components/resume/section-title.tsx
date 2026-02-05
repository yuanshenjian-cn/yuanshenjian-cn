"use client";

import { ScrollAnimation } from "./scroll-animation";

interface SectionTitleProps {
  title: string;
}

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <ScrollAnimation>
      <h2 className="text-2xl font-medium mb-6 text-left pb-3 inline-block border-b-2 border-primary">
        {title}
      </h2>
    </ScrollAnimation>
  );
}
