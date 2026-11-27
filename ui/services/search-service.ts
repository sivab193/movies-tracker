const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export type GlobalSearchMovie = {
  id: string
  title: string
  year?: number | string | null
  posterUrl?: string | null
  imdbId?: string | null
}

export type GlobalSearchSeries = {
  id: string
  title: string
  year?: number | string | null
  posterUrl?: string | null
  imdbId?: string | null
}

export type GlobalSearchTheatre = {
  id: string
  name: string
  location?: string | null
}

export type GlobalSearchPerson = {
  name: string
  slug: string
}

export type GlobalSearchUser = {
  username: string
  displayName: string
  photoURL?: string | null
}

export type GlobalSearchResults = {
  query: string
  movies: GlobalSearchMovie[]
  series: GlobalSearchSeries[]
  theatres: GlobalSearchTheatre[]
  people: GlobalSearchPerson[]
  users: GlobalSearchUser[]
}

export async function searchGlobal(query: string): Promise<GlobalSearchResults> {
  const params = new URLSearchParams({ q: query })
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/search?${params}`)
  } catch {
    throw new Error("Search is unavailable")
  }
  let data: (GlobalSearchResults & { error?: string }) | null = null
  try {
    data = (await response.json()) as GlobalSearchResults & { error?: string }
  } catch {
    data = null
  }
  if (!response.ok) throw new Error(data?.error || "Search is unavailable")
  if (!data) throw new Error("Search is unavailable")
  return data
}
