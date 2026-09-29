import { ImageResponse } from "next/og"
import { BRAND_LOGO_DATA_URI } from "@/lib/brand/generated"
import { OgBrand } from "@/lib/og/brand"
import { OG_SIZE } from "@/lib/og/data"

export const runtime = "edge"
export const alt = "MediaVerse popcorn and clapperboard logo — track every film, compete on the leaderboard and time title cards"
export const size = OG_SIZE
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#171717", padding: 56, fontFamily: "sans-serif" }}>
      <OgBrand />
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <img src={BRAND_LOGO_DATA_URI} alt="" width={314} height={346} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 24 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.02em" }}>Your Ultimate MediaVerse Tracker</div>
          <div style={{ display: "flex", fontSize: 25, color: "#d4d4d4", lineHeight: 1.4 }}>Log every film you watch with dates &amp; technical stats.</div>
          <div style={{ display: "flex", fontSize: 25, color: "#f5b0a9", lineHeight: 1.4 }}>Compete on the leaderboard &amp; time title cards.</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #454545", paddingTop: 22, color: "#d4d4d4", fontSize: 20 }}>
        <span style={{ fontWeight: 700 }}>www.media-verse.in</span>
        <span>Watch History · Leaderboard · AI MCP</span>
      </div>
    </div>,
    { ...size },
  )
}
