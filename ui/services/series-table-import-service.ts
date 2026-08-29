import { auth } from "@/lib/firebase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface SeriesTableRow {
  season: number
  episode: number
  title: string
  duration?: string | number
  watchUrl?: string
  provider?: string
  airDate?: string
  rating?: string | number
  episodeImdbId?: string
}

async function post(path: string, body: Record<string, unknown>) {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("User not authenticated")
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const details = Array.isArray(data.details)
      ? data.details.map((item: any) => `Row ${item.row}: ${item.error}`).join("\n")
      : data.details
    throw new Error(details || data.error || "Series table import failed")
  }
  return data
}

export function previewSeriesTableImport(input: {
  imdbId: string
  provider?: string
  apiKey?: string
  rows: SeriesTableRow[]
}) {
  return post("/series-table-import/preview", input)
}

export function importSeriesTable(input: {
  imdbId: string
  provider?: string
  apiKey?: string
  rows: SeriesTableRow[]
}) {
  return post("/series-table-import/import", input)
}
