import { auth } from "@/lib/firebase"
import { Series, SeriesLookup, SeriesProgress, SeriesProgressSummary } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("User not authenticated")
  return { "Authorization": `Bearer ${token}` }
}

function normalizeSeries(raw: any): Series {
  return {
    ...raw,
    id: raw._id || raw.id,
  }
}

// Public: List all series
export async function getAllSeries(search?: string, genre?: string, year?: string): Promise<Series[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (genre) params.set('genre', genre)
  if (year) params.set('year', year)
  const qs = params.toString()
  const res = await fetch(`${API_BASE_URL}/series${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error("Failed to fetch series")
  const data = await res.json()
  return data.map(normalizeSeries)
}

export async function getSeriesPage(skip = 0, limit = 20): Promise<{ series: Series[]; total: number }> {
  const params = new URLSearchParams({ paginate: "true", skip: String(skip), limit: String(limit) })
  const res = await fetch(`${API_BASE_URL}/series?${params}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to fetch series")
  return { series: (data.series || []).map(normalizeSeries), total: data.total || 0 }
}

// Public: Get full series detail
export async function getSeries(id: string): Promise<Series> {
  const res = await fetch(`${API_BASE_URL}/series/${id}`)
  if (!res.ok) throw new Error("Failed to fetch series")
  const data = await res.json()
  return normalizeSeries(data)
}

// Public: Lightweight lookup by IMDB ID
export async function lookupSeries(imdbId: string): Promise<SeriesLookup> {
  const res = await fetch(`${API_BASE_URL}/series/lookup?imdbId=${encodeURIComponent(imdbId)}`)
  if (!res.ok) throw new Error("Series not found")
  return await res.json()
}

// Public: Lightweight movie lookup by IMDB ID (for watch order enrichment)
export async function lookupMovie(imdbId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/movies/lookup?imdbId=${encodeURIComponent(imdbId)}`)
  if (!res.ok) throw new Error("Movie not found")
  return await res.json()
}

// Admin: Add series from OMDB (one-shot; prefer the preview + import flow)
export async function addSeriesFromOmdb(imdbId: string, apiKey?: string): Promise<any> {
  return adminPost("/series/fetch-omdb", { imdbId, apiKey })
}

async function adminPost(path: string, body: Record<string, any>): Promise<any> {
  const headers = await getAuthHeader()
  // Drop empty values so the backend falls back to its own defaults
  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined && v !== null && v !== "")
  )
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request to ${path} failed`)
  return data
}

export interface SeriesPreviewSeason {
  seasonNumber: number
  episodeCount: number
  available: boolean
  error?: string
}

export interface SeriesPreview {
  imdbId: string
  title: string
  year: number
  endYear: number | null
  posterUrl: string | null
  imdbRating: number | null
  isOngoing: boolean
  totalSeasons: number
  totalEpisodes: number
  seriesRuntimeMinutes: number
  seasons: SeriesPreviewSeason[]
  previewCallsUsed: number
  cached: boolean
  exists: boolean
  existingSeasons: number[]
}

// Admin: Inspect a series before importing. Costs 1 + totalSeasons OMDb calls
// and caches the payload so the import itself is free in fast mode.
export async function previewSeries(imdbId: string, apiKey?: string): Promise<SeriesPreview> {
  return adminPost("/series/preview", { imdbId, apiKey })
}

// Admin: Create/refresh the series shell document before importing seasons
export async function importSeriesStart(
  imdbId: string,
  opts: { apiKey?: string; replace?: boolean } = {}
): Promise<{ seriesId: string; title: string; callsUsed: number; usedCache: boolean }> {
  return adminPost("/series/import/start", { imdbId, ...opts })
}

// Admin: Import a single season (one request per season keeps each call short)
export async function importSeriesSeason(
  imdbId: string,
  seasonNumber: number,
  opts: { apiKey?: string; precise?: boolean } = {}
): Promise<{
  seasonNumber: number
  episodeCount: number
  seasonRuntimeMinutes: number
  runtimeSource: string
  callsUsed: number
  totalEpisodes: number
  totalRuntimeMinutes: number
}> {
  return adminPost("/series/import/season", { imdbId, seasonNumber, ...opts })
}

// Admin: Mark the import complete and drop the preview cache
export async function importSeriesFinish(imdbId: string): Promise<any> {
  return adminPost("/series/import/finish", { imdbId })
}

// Admin: Update series
export async function updateSeries(id: string, data: Partial<Series>): Promise<any> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/series/${id}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update series")
  return await res.json()
}

// Admin: Delete series
export async function deleteSeries(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/series/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) throw new Error("Failed to delete series")
}

// Admin: Refresh series from OMDB
export async function refreshSeriesFromOmdb(
  id: string,
  opts: { apiKey?: string; precise?: boolean } = {}
): Promise<any> {
  return adminPost(`/series/${id}/refresh-omdb`, opts)
}

// Admin: Toggle verified flag on a series
export async function verifySeries(id: string, verified?: boolean): Promise<{ verified: boolean; id: string }> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/series/${id}/verify`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(verified === undefined ? {} : { verified }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to verify series")
  return data
}

export type SeriesProgressAction =
  | "toggle"
  | "watch"
  | "unwatch"
  | "increment"
  | "decrement"
  | "set"
  | "watchAll"
  | "unwatchAll"
  | "incrementAll"

export interface SeriesProgressResult {
  message: string
  /** null when the last season was unmarked and the entry was dropped. */
  seriesProgress: SeriesProgress | null
  watchedSeasons: number[]
  seasonCounts: Record<string, number>
  totalWatchCount: number
}

async function postSeriesProgress(body: Record<string, unknown>): Promise<SeriesProgressResult> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/users/series-progress`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Failed to update series progress")
  return data
}

// User: Mark a season watched for the first time (no-op if already watched)
export async function watchSeason(imdbId: string, seasonNumber: number) {
  return postSeriesProgress({ imdbId, seasonNumber, action: "watch" })
}

// User: Log another viewing of a season already marked watched
export async function rewatchSeason(imdbId: string, seasonNumber: number) {
  return postSeriesProgress({ imdbId, seasonNumber, action: "increment" })
}

// User: Clear a season entirely
export async function unwatchSeason(imdbId: string, seasonNumber: number) {
  return postSeriesProgress({ imdbId, seasonNumber, action: "unwatch" })
}

// User: Set an exact watch count for a season (0 clears it)
export async function setSeasonWatchCount(imdbId: string, seasonNumber: number, count: number) {
  return postSeriesProgress({ imdbId, seasonNumber, action: "set", count })
}

// User: Mark every season of the series watched
export async function watchEntireSeries(imdbId: string) {
  return postSeriesProgress({ imdbId, action: "watchAll" })
}

// User: Log a full rewatch — bumps every season's count by one
export async function rewatchEntireSeries(imdbId: string) {
  return postSeriesProgress({ imdbId, action: "incrementAll" })
}

// User: Clear all progress for the series
export async function unwatchEntireSeries(imdbId: string) {
  return postSeriesProgress({ imdbId, action: "unwatchAll" })
}

// User: Toggle season watched (legacy helper, kept for older call sites)
export async function toggleSeasonWatched(imdbId: string, seasonNumber: number) {
  return postSeriesProgress({ imdbId, seasonNumber, action: "toggle" })
}

// User: Remove series from progress
export async function removeSeriesProgress(imdbId: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/users/series-progress/${imdbId}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) throw new Error("Failed to remove series progress")
}

// User: Get series progress plus aggregate totals
export async function getSeriesProgressWithSummary(
  uid: string
): Promise<{ seriesProgress: SeriesProgress[]; summary: SeriesProgressSummary }> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/users/${uid}/series-progress`, { headers })
  if (!res.ok) throw new Error("Failed to fetch series progress")
  const data = await res.json()
  return {
    seriesProgress: data.seriesProgress || [],
    summary: data.summary || {
      seriesTracked: 0,
      seriesCompleted: 0,
      seasonsWatched: 0,
      runtimeWatchedMinutes: 0,
    },
  }
}

// User: Get series progress
export async function getSeriesProgress(uid: string): Promise<SeriesProgress[]> {
  return (await getSeriesProgressWithSummary(uid)).seriesProgress
}
