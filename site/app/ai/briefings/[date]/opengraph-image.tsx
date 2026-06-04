import { ImageResponse } from "next/og";
import fs from "node:fs";
import { getAllBriefings, getBriefingBySlug, getLatestBriefing } from "@/lib/briefings";
import { siteBrandingAiIconPath } from "@/lib/workspace-paths";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const dynamic = "force-static";

const INCREMENTAL_BUILD_LIMIT = 30;

export async function generateStaticParams() {
  const allBriefings = getAllBriefings();
  const briefings = process.env.INCREMENTAL_BUILD === "true"
    ? allBriefings.slice(0, INCREMENTAL_BUILD_LIMIT)
    : allBriefings;
  const params = briefings.map((briefing) => ({
    date: briefing.slug,
  }));

  return params.length > 0 ? [...params, { date: "latest" }] : [{ date: "__empty__" }, { date: "latest" }];
}

interface Props {
  params: Promise<{ date: string }>;
}

export default async function OpengraphImage({ params }: Props) {
  const { date } = await params;
  const briefing = date === "latest" ? getLatestBriefing() : getBriefingBySlug(date);
  void briefing;
  const logoSvg = fs.readFileSync(siteBrandingAiIconPath, "utf8").replace(/currentColor/g, "#FFFFFF");
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #040816 0%, #0b1220 52%, #0e172a 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 22%, rgba(56,189,248,0.12), transparent 28%), radial-gradient(circle at 80% 24%, rgba(16,185,129,0.1), transparent 20%), radial-gradient(circle at 78% 74%, rgba(96,165,250,0.1), transparent 24%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 360,
            height: 360,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            width: 120,
            height: 120,
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 500,
              height: 500,
              borderRadius: 104,
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 36px 96px rgba(0,0,0,0.30)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 36,
                borderRadius: 76,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: 324,
                height: 324,
                borderRadius: 72,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                display: "flex",
                width: 352,
                height: 352,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logoDataUri}
                width="352"
                height="352"
                alt="AI sparkles"
                style={{ display: "flex" }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
