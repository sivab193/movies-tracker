import type { Metadata } from "next"
import { getMovie, resolveShortCode, truncate } from "@/lib/og/data"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  const resolved = await resolveShortCode(code)
  const movie = resolved?.movieId ? await getMovie(resolved.movieId) : null

  if (!movie) {
    return {
      title: "Link expired | MediaVerse",
      description: "This short link has expired. Short links are cleared 30 days after creation.",
      robots: { index: false, follow: false },
    }
  }

  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ""} | MediaVerse`
  const description =
    truncate(movie.plot, 160) || "See details and watch history for this movie on MediaVerse."

  return {
    title,
    description,
    openGraph: { title, description, type: "video.movie" },
    twitter: { card: "summary_large_image", title, description },
    // The page itself only redirects; the canonical target is the movie page.
    robots: { index: false, follow: true },
  }
}

export default function ShortLinkLayout({ children }: { children: React.ReactNode }) {
  return children
}
