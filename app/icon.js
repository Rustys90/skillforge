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
          background: "#010828",
          borderRadius: 16,
          border: "1px solid rgba(239,244,255,0.08)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "1.5px solid rgba(239,244,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#6FFF00",
              boxShadow: "0 0 0 4px rgba(111,255,0,0.22)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
