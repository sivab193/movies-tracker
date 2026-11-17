const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export type AMCTicketPrice = {
  type?: string
  priceCents: number
  taxCents?: number | null
  currency: "USD"
}

export type AMCShowtime = {
  id: string
  movieId?: number | string
  movieName?: string
  showDateTimeLocal?: string
  showDateTimeUtc?: string
  lastUpdatedDateUtc?: string
  premiumFormat?: string | null
  attributes: Array<{ code?: string; name?: string }>
  languages: { spoken?: string | null; dubbedOver?: string | null; subtitle?: string | null }
  ticketPrices: AMCTicketPrice[]
  estimatedFees: AMCTicketPrice[]
  isSoldOut: boolean
  isAlmostSoldOut: boolean
  isCanceled: boolean
  isDiscountMatineePriced: boolean
  discountMatineeMessage?: string
  purchaseUrl?: string
}

export type AMCTheatre = {
  id: number | string
  name?: string
  slug?: string
  location?: { address?: string; city?: string; state?: string; postalCode?: string; lat?: number; lon?: number }
  websiteUrl?: string
}

export type AMCShowtimeGroup = {
  theatre: AMCTheatre
  distanceMiles: number | null
  showtimes: AMCShowtime[]
}

export type AMCShowtimesResponse = {
  groups: AMCShowtimeGroup[]
  matched?: boolean
  fetchedAtUtc?: string
  stale?: boolean
  attribution: string
}

export type ShowtimeQuery = { lat: number; lon: number; date: string; movieId?: string }

export async function getAMCShowtimes(query: ShowtimeQuery): Promise<AMCShowtimesResponse> {
  const params = new URLSearchParams({ lat: String(query.lat), lon: String(query.lon), date: query.date })
  const path = query.movieId
    ? `/movies/${encodeURIComponent(query.movieId)}/showtimes`
    : "/amc/showtimes/near"
  const response = await fetch(`${API_BASE_URL}${path}?${params}`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "AMC showtimes are unavailable")
  return data
}
