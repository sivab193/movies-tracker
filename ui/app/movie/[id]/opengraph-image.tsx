import { mediaCard } from "@/lib/og/card"
import {
  OG_SIZE,
  absoluteAsset,
  formatMinutes,
  getMovie,
  parseRuntimeMinutes,
  truncate,
} from "@/lib/og/data"

export const alt = "Movie on MediaVerse"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const movie = await getMovie(id)

  if (!movie) {
    return mediaCard({ kind: "Movie", title: "Movie not found", subtitle: "MediaVerse" })
  }

  const runtime = formatMinutes(parseRuntimeMinutes(movie.runtime))
  const facts = [
    runtime && `⏱ ${runtime}`,
    movie.imdbRating ? `⭐ ${movie.imdbRating}` : "",
  ].filter(Boolean) as string[]

  return mediaCard({
    kind: "Movie",
    title: movie.title,
    subtitle: [movie.year, movie.genre].filter(Boolean).join(" · "),
    facts,
    detail: movie.director && movie.director !== "N/A" ? `Dir. ${movie.director}` : truncate(movie.plot, 90),
    posterUrl: absoluteAsset(movie.posterUrl),
  })
}
