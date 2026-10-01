import { revalidateTag } from "next/cache"
import { timingSafeEqual } from "crypto"

// Called by the backend after a movie changes so tab titles and link previews
// (cached via the "movie" tag in lib/og/data.ts) refresh immediately.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const provided = request.headers.get("x-revalidate-secret") || ""
  const a = Buffer.from(provided)
  const b = Buffer.from(secret || "")
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  revalidateTag("movie", { expire: 0 })
  return Response.json({ revalidated: true })
}
