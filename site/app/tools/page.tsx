import type { Metadata } from "next";

import { ToolDirectory } from "@/components/tools/ToolDirectory";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";
import { getAllTools } from "@/lib/tools";

export const metadata: Metadata = generateListPageSEO(
  "小工具",
  "随手可用的小工具集：番茄钟等单页小工具，打开即用，设置只保存在本地浏览器。",
  `${config.site.url}/tools`,
);

export default function ToolsPage() {
  const tools = getAllTools();

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <ToolDirectory tools={tools} />
      </div>
    </main>
  );
}
