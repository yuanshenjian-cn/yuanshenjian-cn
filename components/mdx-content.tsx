"use client";

import { MDXContent as MDXRemoteContent } from "@/lib/mdx";

export function MDXContent({ source }: { source: string }) {
  return <MDXRemoteContent source={source} />;
}
