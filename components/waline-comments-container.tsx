"use client";

import dynamic from "next/dynamic";

const WalineComments = dynamic(() => import("@/components/waline-comments").then((mod) => ({ default: mod.WalineComments })), {
  ssr: false,
  loading: () => (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-medium mb-6">评论</h3>
      <div className="h-32 bg-muted rounded animate-pulse" />
    </div>
  ),
});

interface WalineCommentsContainerProps {
  path: string;
}

export function WalineCommentsContainer({ path }: WalineCommentsContainerProps) {
  return <WalineComments path={path} />;
}
