import { mediaCard } from "@/lib/og/card"
import { OG_SIZE, absoluteAsset, formatMinutes, getSeries } from "@/lib/og/data"

export const alt = "Series on MediaVerse"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const series = await getSeries(id)

  if (!series) {
    return mediaCard({ kind: "Series", title: "Series not found", subtitle: "MediaVerse" })
  }

  const runtime = formatMinutes(
    (series as any).totalRuntimeMinutes || series.seriesRuntimeMinutes || 0,
  )
  const facts = [
    series.totalSeasons ? `${series.totalSeasons} season${series.totalSeasons === 1 ? "" : "s"}` : "",
    series.totalEpisodes ? `${series.totalEpisodes} episodes` : "",
    runtime && `⏱ ${runtime}`,
    series.imdbRating ? `⭐ ${series.imdbRating}` : "",
  ].filter(Boolean) as string[]

  const years = series.endYear
    ? `${series.year}–${series.endYear}`
    : series.isOngoing
      ? `${series.year}–`
      : `${series.year}`

  return mediaCard({
    kind: "Series",
    title: series.title,
    subtitle: [series.year ? years : "", series.genre].filter(Boolean).join(" · "),
    facts,
    posterUrl: absoluteAsset(series.posterUrl),
  })
}
