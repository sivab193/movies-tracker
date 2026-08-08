import { mediaCard } from "@/lib/og/card"
import { OG_SIZE, formatMinutes, getPublicProfile } from "@/lib/og/data"

export const alt = "Profile on MediaVerse"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  // A private profile 403s, so this is null and we fall through to the generic card.
  const profile = await getPublicProfile(username)

  if (!profile) {
    return mediaCard({
      kind: "Profile",
      title: "Private profile",
      subtitle: "This MediaVerse profile is not public.",
      badge: { primary: "🔒" },
    })
  }

  // The API returns -1 for stats the user has chosen not to share.
  const movies = profile.totalMoviesWatched
  const runtimeSeconds = profile.totalRuntimeSeconds
  const facts: string[] = []
  if (typeof runtimeSeconds === "number" && runtimeSeconds >= 0) {
    facts.push(`⏱ ${formatMinutes(Math.round(runtimeSeconds / 60))} watched`)
  }
  if (profile.joinedLeaderboard) facts.push("🏆 On the leaderboard")

  const showMovies = typeof movies === "number" && movies >= 0

  return mediaCard({
    kind: "Profile",
    title: profile.displayName || "MediaVerse member",
    subtitle: profile.customUrl ? `@${profile.customUrl}` : undefined,
    facts,
    avatarUrl: profile.photoURL || null,
    badge: profile.photoURL
      ? undefined
      : { primary: showMovies ? String(movies) : "🎬", secondary: showMovies ? "movies" : undefined },
    detail: showMovies ? `${movies} movies logged on MediaVerse` : undefined,
  })
}
