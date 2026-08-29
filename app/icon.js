import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050B12",
          borderRadius: 14,
          border: "1px solid #0F2430",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#00FFFF",
              boxShadow: "0 0 0 4px rgba(0,255,255,0.25)",
              marginBottom: 2,
            }}
          />
          <div
            style={{
              width: 28,
              height: 18,
              border: "2.5px solid #00FF52",
              borderBottom: "none",
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
            }}
          />
          <div
            style={{
              width: 36,
              height: 8,
              background: "#0F2430",
              borderRadius: 2,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 28, height: 2, background: "#00FF52", borderRadius: 2 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
