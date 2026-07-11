import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "MediaVerse - Track every film, compete on the global leaderboard & time title cards"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0e0e12",
          padding: "80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow in background */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* Top Badge & Brand Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "#1c1c26",
              border: "2px solid #2e2e3e",
              fontSize: "36px",
            }}
          >
            🎬
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "#1e1e2c",
              border: "1px solid #323246",
              color: "#a78bfa",
              fontSize: "20px",
              fontWeight: "bold",
              letterSpacing: "0.05em",
            }}
          >
            MEDIAVERSE COMMUNITY & AI MCP
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "950px",
          }}
        >
          <div
            style={{
              fontSize: "76px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Your Ultimate MediaVerse Tracker
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#9ca3af",
              lineHeight: 1.4,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Log every film you watch with dates, ratings & technical stats.</span>
            <span style={{ color: "#d8b4fe" }}>Compete on the global leaderboard & time title cards.</span>
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #262636",
            paddingTop: "32px",
          }}
        >
          <div
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              color: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span>mv.siv19.dev</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: "22px",
              color: "#6b7280",
            }}
          >
            <span>✨ Watch History</span>
            <span>🏆 Leaderboard</span>
            <span>🤖 Claude / AI MCP</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
