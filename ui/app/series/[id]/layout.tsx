import type { Metadata } from "next"
import { formatMinutes, getSeries, truncate } from "@/lib/og/data"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const series = await getSeries(id)

  if (!series) {
    return {
      title: "Series not found | MediaVerse",
      description: "This series is no longer available on MediaVerse.",
    }
  }

  const runtime = formatMinutes(
    (series as any).totalRuntimeMinutes || series.seriesRuntimeMinutes || 0,
  )
  const title = `${series.title}${series.year ? ` (${series.year})` : ""} | MediaVerse`
  const facts = [
    series.totalSeasons && `${series.totalSeasons} seasons`,
    series.totalEpisodes && `${series.totalEpisodes} episodes`,
    runtime,
    series.genre,
  ]
    .filter((part) => part && part !== "N/A")
    .join(" · ")
  const description =
    truncate(series.plot, 160) ||
    `${series.title}${facts ? ` — ${facts}` : ""}. Track your progress season by season on MediaVerse.`

  return {
    title,
    description,
    openGraph: { title, description, type: "video.tv_show" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
