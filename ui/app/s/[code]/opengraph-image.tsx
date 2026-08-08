import { mediaCard } from "@/lib/og/card"
import {
  OG_SIZE,
  absoluteAsset,
  formatMinutes,
  getMovie,
  parseRuntimeMinutes,
  resolveShortCode,
} from "@/lib/og/data"

export const alt = "Shared on MediaVerse"
export const size = OG_SIZE
export const contentType = "image/png"

// Short links redirect on the client, so a crawler never runs the redirect.
// Resolving the code here is what makes a shared link preview at all.
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const resolved = await resolveShortCode(code)
  const movie = resolved?.movieId ? await getMovie(resolved.movieId) : null

  if (!movie) {
    return mediaCard({
      kind: "MediaVerse",
      title: "Link expired",
      subtitle: "Short links expire 30 days after they are created.",
      badge: { primary: "🔗" },
    })
  }

  const runtime = formatMinutes(parseRuntimeMinutes(movie.runtime))
  return mediaCard({
    kind: "Movie",
    title: movie.title,
    subtitle: [movie.year, movie.genre].filter(Boolean).join(" · "),
    facts: [runtime && `⏱ ${runtime}`, movie.imdbRating ? `⭐ ${movie.imdbRating}` : ""].filter(
      Boolean,
    ) as string[],
    detail: movie.director && movie.director !== "N/A" ? `Dir. ${movie.director}` : undefined,
    posterUrl: absoluteAsset(movie.posterUrl),
  })
}
