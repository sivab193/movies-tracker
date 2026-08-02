import { auth } from "@/lib/firebase"
import { Series, SeriesLookup, SeriesProgress } from "@/lib/types"

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
export async function getAllSeries(search?: string): Promise<Series[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  const res = await fetch(`${API_BASE_URL}/series${params}`)
  if (!res.ok) throw new Error("Failed to fetch series")
  const data = await res.json()
  return data.map(normalizeSeries)
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

// Admin: Add series from OMDB
export async function addSeriesFromOmdb(imdbId: string): Promise<any> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/series/fetch-omdb`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ imdbId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Failed to add series")
  }
  return await res.json()
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
export async function refreshSeriesFromOmdb(id: string): Promise<any> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/series/${id}/refresh-omdb`, {
    method: "POST",
    headers,
  })
  if (!res.ok) throw new Error("Failed to refresh series")
  return await res.json()
}

// User: Toggle season watched
export async function toggleSeasonWatched(imdbId: string, seasonNumber: number): Promise<any> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/users/series-progress`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ imdbId, seasonNumber }),
  })
  if (!res.ok) throw new Error("Failed to update series progress")
  return await res.json()
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

// User: Get series progress
export async function getSeriesProgress(uid: string): Promise<SeriesProgress[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/users/${uid}/series-progress`, {
    headers,
  })
  if (!res.ok) throw new Error("Failed to fetch series progress")
  const data = await res.json()
  return data.seriesProgress || []
}
