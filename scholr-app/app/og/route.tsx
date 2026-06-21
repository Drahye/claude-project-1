import { ImageResponse } from "next/og"

export const runtime = "edge"

const CHIPS = ["Attendance", "Homework", "Messaging", "AI reports"]

// Social share card (1200x630). Served at /og and referenced from metadata.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0A0A1A",
          fontFamily: "sans-serif",
        }}
      >
        {/* ── Mesh-gradient orbs (glow via soft radial stops, no blur in Satori) ── */}
        <div style={{ position: "absolute", top: -220, right: -160, width: 720, height: 720, borderRadius: 9999, background: "radial-gradient(circle, rgba(124,109,247,0.55) 0%, rgba(124,109,247,0) 68%)" }} />
        <div style={{ position: "absolute", bottom: -260, left: -180, width: 760, height: 760, borderRadius: 9999, background: "radial-gradient(circle, rgba(139,92,246,0.40) 0%, rgba(139,92,246,0) 70%)" }} />
        <div style={{ position: "absolute", top: 180, left: 420, width: 520, height: 520, borderRadius: 9999, background: "radial-gradient(circle, rgba(56,189,166,0.18) 0%, rgba(56,189,166,0) 70%)" }} />
        {/* bottom depth vignette */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,10,26,0) 45%, rgba(5,5,16,0.55) 100%)" }} />

        {/* ── Content ── */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 76,
          }}
        >
          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 92,
                height: 92,
                borderRadius: 26,
                background: "linear-gradient(155deg, #7C6DF7 0%, #4F46E5 55%, #3A2FB5 100%)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow: "inset 0 2px 1px rgba(255,255,255,0.35), 0 18px 40px rgba(79,70,229,0.55)",
                fontSize: 52,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              S
            </div>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700, letterSpacing: -1, color: "#ffffff" }}>Scholr</div>
          </div>

          {/* Headline block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* eyebrow */}
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "9px 18px",
                marginBottom: 26,
                borderRadius: 9999,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.16)",
                fontSize: 17,
                letterSpacing: 5,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              SCHOOL COMMUNICATION PLATFORM
            </div>
            <div style={{ display: "flex", fontSize: 78, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.03, color: "#ffffff", maxWidth: 900 }}>
              One platform for parents, teachers &amp; admins.
            </div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 31, lineHeight: 1.3, color: "rgba(255,255,255,0.62)", maxWidth: 820 }}>
              Attendance, homework, messaging, and AI weekly reports — beautifully in one place.
            </div>
          </div>

          {/* Feature chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "11px 20px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                  fontSize: 23,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
