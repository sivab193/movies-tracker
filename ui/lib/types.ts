// Movie document stored in Firestore
export interface Movie {
  id: string
  imdbId: string
  title: string
  year: number
  posterUrl: string
  imdbRating: number | null
  runtime: string | null
  createdAt: Date
  submissionCount: number
  averageTimeSeconds: number | null
  language?: string
  Language?: string
  released?: string
  releaseDate?: string
}

// Title card submission
export interface TitleCardSubmission {
  id: string
  movieId: string
  timeInSeconds: number
  rawInput: string
  comment: string | null
  createdAt: Date
  deviceId: string // For rate limiting anonymous submissions
}

// User profile
export interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: Date
  isAdmin?: boolean
  watchHistory?: WatchHistoryEntry[]
  totalRuntimeSeconds?: number
  totalMoviesWatched?: number
  isBannedFromLeaderboard?: boolean
}

// Watch history entry
export interface WatchHistoryEntry {
  _id?: string
  uid: string
  movieId: string
  movieTitle: string
  moviePosterUrl: string
  movieLanguage?: string | null
  theaterId?: string | null
  theaterName: string | null
  theaterLocation: string | null
  theaterGmapsLink?: string | null
  timestamp: string | null // ISO Date string
  showTime?: string | null // e.g. "7:30 PM"
  ticketCost: number
  foodCost?: number | null
  currency: "INR" | "USD"
  ticketStubUrl?: string | null
  createdAt: string // ISO Date string
}

export interface Theater {
  id: string
  name: string
  location?: string
  gmapsLink?: string
}

// Card offer details
export interface CardOffer {
  _id: string
  id: string // alias for _id
  platform: "BookMyShow" | "District"
  offerType: "BOGO" | "discount" | "cashback"
  description: string
  maxDiscount: number
  usesPerMonth: number
  minTickets: number
  couponCode: string | null
  perDayLimit: number | null
  notes: string | null
  isActive: boolean
  remainingUses?: number // Computed by backend for user's cards
}

// Bank card with movie ticket offers
export interface CardInfo {
  _id: string
  id: string // alias for _id
  name: string
  bank: string
  bankName: string // alias for bank
  type: "debit" | "credit"
  network: string
  offers: CardOffer[]
  reportCount: number
  lastVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

// Card usage log entry
export interface CardUsageEntry {
  _id: string
  id: string // alias for _id
  date: string
  platform: string
  offerId: string
  movieTitle: string
  ticketsSaved: number
  notes: string
  createdAt: string
}

// User's card with usage data
export interface UserCard {
  cardId: string
  addedAt: string
  usageLog: CardUsageEntry[]
  cardInfo: CardInfo  // Populated from join
}

// Card report
export interface CardReport {
  id: string
  cardId: string
  cardName?: string
  userId: string
  reason: string
  status: "pending" | "resolved" | "dismissed"
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
}

// Watch order item (movie or series)
export interface WatchOrderItem {
  _id: string
  id: string // alias for _id
  type: "movie" | "series"
  itemId: string // IMDB ID or custom ID
  title: string
  year: number
  notes: string | null
  orderIndex: number
}

// Watch order franchise/universe
export interface WatchOrder {
  _id: string
  id: string // alias for _id
  name: string
  slug: string // public short link: /w/<slug>, admin editable
  description: string | null
  items: WatchOrderItem[]
  createdAt: string
  updatedAt: string
}

// Enriched watch order item with resolved data from movies/series collections
export interface EnrichedWatchOrderItem extends WatchOrderItem {
  endYear?: number | null
  posterUrl?: string | null
  totalSeasons?: number
  totalEpisodes?: number
  totalRuntimeMinutes?: number
  runtime?: string | null
  imdbRating?: number | null
  isOngoing?: boolean
}

// Series episode
export interface SeriesEpisode {
  episodeNumber: number
  title: string
  imdbId: string
  runtimeMinutes: number
  airDate: string | null
  imdbRating: number | null
}

// Series season
export interface SeriesSeason {
  seasonNumber: number
  episodeCount: number
  seasonRuntimeMinutes: number
  episodes: SeriesEpisode[]
}

// Full series document
export interface Series {
  id: string
  _id?: string
  imdbId: string
  title: string
  year: number
  endYear: number | null
  posterUrl: string | null
  plot: string | null
  genre: string | null
  actors: string | null
  director: string | null
  language: string | null
  country: string | null
  imdbRating: number | null
  isOngoing: boolean
  totalSeasons: number
  totalEpisodes: number
  totalRuntimeMinutes: number
  seasons: SeriesSeason[]
  createdAt: string
  updatedAt: string
  lastOmdbSync: string | null
}

// Lightweight series info (from lookup endpoint)
export interface SeriesLookup {
  id: string
  imdbId: string
  title: string
  year: number
  endYear: number | null
  posterUrl: string | null
  totalSeasons: number
  totalEpisodes: number
  totalRuntimeMinutes: number
  imdbRating: number | null
  isOngoing: boolean
}

// User's per-season progress on a series
export interface SeriesProgress {
  imdbId: string
  title: string
  watchedSeasons: number[]
  /** Season number (as a string key) -> how many times it has been watched. */
  seasonCounts: Record<string, number>
  totalWatchCount: number
  runtimeWatchedMinutes: number
  startedAt: string
  updatedAt: string
  lastWatchedAt?: string
  completedAt?: string
  isCompleted?: boolean
  // Enriched from the series catalog:
  seriesId?: string
  totalSeasons?: number
  totalEpisodes?: number
  posterUrl?: string | null
  year?: number
  genre?: string
  seriesRuntimeMinutes?: number
}

export interface SeriesProgressSummary {
  seriesTracked: number
  seriesCompleted: number
  seasonsWatched: number
  runtimeWatchedMinutes: number
}

// Helper to format seconds to display string
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) {
    return `${mins} min`
  }
  return `${mins} min ${secs} sec`
}

// Like formatTimeDisplay, but when the total is over 60 minutes it also
// appends an hour/minute breakdown, e.g. "85 min (1hr 25min)".
export function formatTitleCardTime(seconds: number): string {
  const base = formatTimeDisplay(seconds)
  const totalMins = Math.floor(seconds / 60)
  if (totalMins <= 60) {
    return base
  }
  const hrs = Math.floor(totalMins / 60)
  const remMins = totalMins % 60
  const hm = remMins === 0 ? `${hrs}hr` : `${hrs}hr ${remMins}min`
  return `${base} (${hm})`
}

// Helper to parse time input (e.g., "12" or "12:35") to seconds
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim()

  // Format: minutes:seconds (e.g., "12:35")
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":")
    if (parts.length !== 2) return null
    const mins = parseInt(parts[0], 10)
    const secs = parseInt(parts[1], 10)
    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) return null
    return mins * 60 + secs
  }

  // Format: minutes only (e.g., "12")
  const mins = parseInt(trimmed, 10)
  if (isNaN(mins) || mins < 0) return null
  return mins * 60
}

// Leaderboard user type
export interface LeaderboardUser {
  userId: string
  displayName: string | null
  photoURL: string | null
  totalMoviesWatched: number
  isPublic: boolean
}

export function formatCurrency(amount: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  }).format(amount)
}

export function resolveApiUrl(url: string) {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  if (apiBase === "/api") return url
  // Replace the leading "/api" with the full API base domain
  const root = apiBase.replace(/\/api$/, "")
  return url.startsWith("/api") ? `${root}${url}` : `${apiBase}${url}`
}

export function formatRuntimeToHHMM(runtime?: string | null | number): string {
  if (!runtime || runtime === "N/A" || runtime === "null") return "? mins"
  const str = String(runtime).trim()
  const match = str.match(/(\d+)/)
  if (!match) return "? mins"
  const mins = parseInt(match[1], 10)
  if (isNaN(mins) || mins <= 0) return "? mins"
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hrs === 0) {
    return `${remMins}min`
  }
  if (remMins === 0) {
    return `${hrs}h`
  }
  return `${hrs}h ${remMins}min`
}

// Format total minutes to a human-readable runtime string
// < 600 min → "NNN mins"
// >= 600 min → "X days Y hrs Z mins" or "Y hrs Z mins"
export function formatRuntimeMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "? mins"
  if (totalMinutes < 600) return `${totalMinutes} mins`
  const days = Math.floor(totalMinutes / (24 * 60))
  const hrs = Math.floor((totalMinutes % (24 * 60)) / 60)
  const mins = totalMinutes % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hrs > 0) parts.push(`${hrs}h`)
  if (mins > 0) parts.push(`${mins}m`)
  return parts.join(' ') || '0 mins'
}
