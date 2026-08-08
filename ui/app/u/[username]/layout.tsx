import type { Metadata } from "next"
import { formatMinutes, getPublicProfile } from "@/lib/og/data"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getPublicProfile(username)

  if (!profile) {
    return {
      title: "Private profile | MediaVerse",
      description: "This MediaVerse profile is not public.",
      robots: { index: false, follow: false },
    }
  }

  const name = profile.displayName || "A MediaVerse member"
  const movies = profile.totalMoviesWatched
  const runtimeSeconds = profile.totalRuntimeSeconds

  const parts: string[] = []
  if (typeof movies === "number" && movies >= 0) parts.push(`${movies} movies logged`)
  if (typeof runtimeSeconds === "number" && runtimeSeconds >= 0) {
    parts.push(`${formatMinutes(Math.round(runtimeSeconds / 60))} of runtime`)
  }

  const title = `${name} | MediaVerse`
  const description = parts.length
    ? `${name} has ${parts.join(" and ")} on MediaVerse.`
    : `See ${name}'s watch history on MediaVerse.`

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
