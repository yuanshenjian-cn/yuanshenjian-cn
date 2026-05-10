"use client";

import dynamic from "next/dynamic";

const GiscusComments = dynamic(
  () => import("@/components/giscus-comments").then((mod) => ({ default: mod.GiscusComments })),
  {
    ssr: false,
    loading: () => (
      <div className="mt-12">
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    ),
  }
);

interface GiscusCommentsContainerProps {
  path: string;
}

export function GiscusCommentsContainer({ path }: GiscusCommentsContainerProps) {
  return <GiscusComments path={path} />;
}
