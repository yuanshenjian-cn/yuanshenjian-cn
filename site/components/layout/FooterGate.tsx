"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface FooterGateProps {
  children: ReactNode;
}

/**
 * 小工具详情页（/tools/<slug>）按整屏应用展示，
 * 隐藏站点页脚，避免 iframe 之外出现多余滚动。
 */
export function FooterGate({ children }: FooterGateProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/tools/")) {
    return null;
  }

  return <>{children}</>;
}
