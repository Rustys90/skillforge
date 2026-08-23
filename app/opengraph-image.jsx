import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SkillForge — the agent skill registry";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#010828",
          padding: "64px 72px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#6FFF00",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          SkillForge
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              color: "#EFF4FF",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1,
              textTransform: "uppercase",
              maxWidth: 900,
            }}
          >
            Find the right skill for your agent
          </div>
          <div
            style={{
              color: "rgba(239,244,255,0.7)",
              fontSize: 28,
              maxWidth: 800,
            }}
          >
            Safety-scanned agent skills from public GitHub · one-command install
          </div>
        </div>
        <div
          style={{
            display: "flex",
            color: "rgba(239,244,255,0.45)",
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          skillforge · agent skill registry
        </div>
      </div>
    ),
    { ...size }
  );
}
