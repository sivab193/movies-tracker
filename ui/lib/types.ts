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
  theaterName: string | null
  theaterLocation: string | null
  timestamp: string | null // ISO Date string
  ticketCost: number
  currency: "INR" | "USD"
  createdAt: string // ISO Date string
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
