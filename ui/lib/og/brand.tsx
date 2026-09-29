import { BRAND_MARK_DATA_URI } from "@/lib/brand/generated"

/** Embedded artwork keeps crawler rendering independent of asset fetches. */
export function OgBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <img src={BRAND_MARK_DATA_URI} alt="" width={64} height={64} />
      <div style={{ display: "flex", color: "#fff", fontSize: 26, fontWeight: 700 }}>
        MediaVerse
      </div>
    </div>
  )
}
