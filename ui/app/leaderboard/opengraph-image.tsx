import { pageImage } from "@/lib/og/static"
import { OG_LEADERBOARD } from "./og-config"

const { alt: a, size: s, contentType: c, Image } = pageImage(OG_LEADERBOARD)

export const alt = a
export const size = s
export const contentType = c
export default Image
