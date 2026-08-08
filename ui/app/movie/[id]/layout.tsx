import type { Metadata } from "next"
import { formatMinutes, getMovie, parseRuntimeMinutes, truncate } from "@/lib/og/data"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const movie = await getMovie(id)

  if (!movie) {
    return {
      title: "Movie not found | MediaVerse",
      description: "This movie is no longer available on MediaVerse.",
    }
  }

  const runtime = formatMinutes(parseRuntimeMinutes(movie.runtime))
  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ""} | MediaVerse`
  // Sparse catalog entries can have no plot and no genre, so the fallback has
  // to read as a sentence rather than a bare "2h 25m".
  const facts = [movie.genre, runtime, movie.director && `directed by ${movie.director}`]
    .filter((part) => part && part !== "N/A")
    .join(" · ")
  const description =
    truncate(movie.plot, 160) ||
    `${movie.title}${facts ? ` — ${facts}` : ""}. See ratings, runtime and community title-card times on MediaVerse.`

  return {
    title,
    description,
    openGraph: { title, description, type: "video.movie" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default function MovieLayout({ children }: { children: React.ReactNode }) {
  return children
}
