import { ImageResponse } from "next/og"

export const runtime = "edge"

// Apple touch icon (180x180 PNG). iOS rounds the corners, so render full-bleed.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(160deg, #7C6DF7 0%, #5145E0 55%, #3A2FB5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* top sheen */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "62%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0))",
          }}
        />
        {/* radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 28%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%)",
          }}
        />
        <div style={{ display: "flex", fontSize: 116, fontWeight: 800, letterSpacing: -6, color: "#ffffff" }}>S</div>
      </div>
    ),
    { width: 180, height: 180 },
  )
}
