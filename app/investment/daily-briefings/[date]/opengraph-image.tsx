import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { getAllInvestmentBriefings, getInvestmentBriefingBySlug, getLatestInvestmentBriefing } from "@/lib/investment-briefings";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  const params = getAllInvestmentBriefings().map((briefing) => ({
    date: briefing.slug,
  }));

  return params.length > 0 ? [...params, { date: "latest" }] : [{ date: "__empty__" }, { date: "latest" }];
}

interface Props {
  params: Promise<{ date: string }>;
}

export default async function OpengraphImage({ params }: Props) {
  const { date } = await params;
  const briefing = date === "latest" ? getLatestInvestmentBriefing() : getInvestmentBriefingBySlug(date);
  void briefing;

  const logoSvgPath = path.join(process.cwd(), "public/images/branding/ai-icon-sparkles.svg");
  const logoSvg = fs.readFileSync(logoSvgPath, "utf8").replace(/currentColor/g, "#FFFFFF");
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
          background: "linear-gradient(135deg, #07111F 0%, #0B1629 52%, #111C31 100%)",
          color: "#F7F4EA",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 16% 18%, rgba(255,255,255,0.16), transparent 26%), radial-gradient(circle at 82% 22%, rgba(96,165,250,0.10), transparent 22%), radial-gradient(circle at 76% 78%, rgba(255,255,255,0.08), transparent 24%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            opacity: 0.25,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 72,
            height: 250,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {[84, 136, 108, 188, 156, 226, 202, 250].map((height, index) => (
            <div
              key={`${index}-${height}`}
              style={{
                width: 84,
                height,
                borderRadius: 22,
                background: "#FFFFFF",
              }}
            />
          ))}
        </div>

        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d="M60 470 C 170 456, 215 372, 330 356 S 498 404, 612 316 S 770 250, 888 220 S 1036 176, 1140 118"
            fill="none"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <circle cx="1140" cy="118" r="14" fill="#FFFFFF" />
          <circle cx="1140" cy="118" r="36" fill="rgba(255,255,255,0.18)" />
        </svg>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "64px 72px",
            alignItems: "flex-start",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "14px 20px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <img src={logoDataUri} width="42" height="42" alt="Investment briefing" style={{ display: "flex" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
