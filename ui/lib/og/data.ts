// Server-side data fetching for OG image + metadata generation.
// These run on the server (or edge), so every URL has to be absolute.

export const OG_SIZE = { width: 1200, height: 630 }

/** Absolute origin of the deployment, usable from a server render. */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return explicit.replace(/\/$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

/**
 * Absolute API base. NEXT_PUBLIC_API_URL is often a same-origin path like
 * "/api", which a server-side fetch cannot use on its own.
 */
export function apiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || "/api"
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/$/, "")
  }
  return `${siteOrigin()}${configured.startsWith("/") ? "" : "/"}${configured}`.replace(/\/$/, "")
}

/** Turn a stored relative poster path into something a crawler can load. */
export function absoluteAsset(url?: string | null): string | null {
  if (!url || url === "N/A") return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const base = apiBase().replace(/\/api$/, "")
  return url.startsWith("/api") ? `${base}${url}` : `${apiBase()}${url}`
}

/** Fetch JSON without ever throwing — a preview must degrade, never 500. */
export async function fetchJson<T>(path: string, revalidate = 3600): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, { next: { revalidate } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export type OgMovie = {
  id: string
  title: string
  year?: number
  genre?: string
  runtime?: string
  director?: string
  imdbRating?: number | null
  posterUrl?: string | null
  plot?: string
}

export type OgSeries = {
  id?: string
  _id?: string
  title: string
  year?: number
  endYear?: number | null
  genre?: string
  totalSeasons?: number
  totalEpisodes?: number
  seriesRuntimeMinutes?: number
  imdbRating?: number | null
  posterUrl?: string | null
  plot?: string
  isOngoing?: boolean
}

export function getMovie(id: string) {
  return fetchJson<OgMovie>(`/movies/${encodeURIComponent(id)}`)
}

export function getSeries(id: string) {
  return fetchJson<OgSeries>(`/series/${encodeURIComponent(id)}`)
}

export function getWatchOrder(slug: string) {
  return fetchJson<any>(`/watch-orders/slug/${encodeURIComponent(slug)}`)
}

export function getPublicProfile(idOrUsername: string) {
  return fetchJson<any>(`/users/${encodeURIComponent(idOrUsername)}`)
}

/** Resolve a /m/<code> or /s/<code> short link to its target id. */
export function resolveShortCode(code: string) {
  return fetchJson<{ movieId?: string; seriesId?: string }>(
    `/movies/m/${encodeURIComponent(code)}`,
    60,
  )
}

/** "182 min" -> 182 */
export function parseRuntimeMinutes(runtime?: string | number | null): number {
  if (typeof runtime === "number") return runtime
  if (!runtime) return 0
  const match = String(runtime).match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : 0
}

export function formatMinutes(total: number): string {
  if (!total || total <= 0) return ""
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours === 0) return `${mins}m`
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

/** Keep OG descriptions inside the ~200 chars most platforms display. */
export function truncate(text: string | undefined | null, max = 180): string {
  if (!text || text === "N/A") return ""
  const clean = text.trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}
