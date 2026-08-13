import { API_BASE_URL } from "@/services/api"

export interface PersonCredit {
  id: string
  imdbId?: string
  type: "movie" | "series"
  title: string
  year?: number
  endYear?: number | null
  posterUrl?: string | null
  runtime?: string | null
  totalSeasons?: number | null
  roles: Array<"actor" | "director">
}

export interface Person {
  slug: string
  name: string
  credits: PersonCredit[]
  movieCount: number
  seriesCount: number
}

export async function getPerson(slug: string): Promise<Person> {
  const response = await fetch(`${API_BASE_URL}/people/${encodeURIComponent(slug)}`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Person not found")
  return data
}
