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
