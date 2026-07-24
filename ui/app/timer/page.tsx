"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Film, Clock, Calendar, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { MovieGrid } from "@/components/movie-grid"
import { AddMovieDialog } from "@/components/add-movie-dialog"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/lib/types"
import { getMovies } from "@/services/api"

// Demo movies for when Firebase isn't configured
const DEMO_MOVIES: Movie[] = [
  {
    id: "demo1",
    imdbId: "tt1375666",
    title: "Inception",
    year: 2010,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    imdbRating: 8.8,
    runtime: "148 min",
    submissionCount: 42,
    averageTimeSeconds: 245,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "demo2",
    imdbId: "tt0468569",
    title: "The Dark Knight",
    year: 2008,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
    imdbRating: 9.0,
    runtime: "152 min",
    submissionCount: 38,
    averageTimeSeconds: 180,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "demo3",
    imdbId: "tt0111161",
    title: "The Shawshank Redemption",
    year: 1994,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg",
    imdbRating: 9.3,
    runtime: "142 min",
    submissionCount: 55,
    averageTimeSeconds: 320,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "demo4",
    imdbId: "tt0137523",
    title: "Fight Club",
    year: 1999,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLWE2YTAtNWFlNzM5OTk3OGJkXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    imdbRating: 8.8,
    runtime: "139 min",
    submissionCount: 31,
    averageTimeSeconds: 127,
    createdAt: new Date("2024-01-02"),
  },
]

// Check if Firebase is configured (client-side check)
function checkFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return Boolean(apiKey && projectId && apiKey !== "undefined" && projectId !== "undefined")
}

const PAGE_SIZE = 20

type SortOption = "latest" | "upcoming"

const LANGUAGES = ["All", "English", "Tamil", "Hindi", "Telugu", "Malayalam", "Kannada", "Spanish", "French", "Korean", "Japanese"]

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [language, setLanguage] = useState<string>("All")
  const [titleCardFilter, setTitleCardFilter] = useState<string>("has")
  const [addedMovies, setAddedMovies] = useState<Movie[]>([])
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchMovies = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const currentSkip = isLoadMore ? skip : 0
      const data = await getMovies(currentSkip, PAGE_SIZE, language === "All" ? "" : language, "", "", false, titleCardFilter, sortBy)
      const movieList = data.movies || []
      const totalCount = data.total || 0

      // Filter and sort in memory chronologically
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

      const filtered = movieList.filter((m: Movie) => {
        if (titleCardFilter === "has" && (!m.submissionCount || m.submissionCount <= 0 || !m.averageTimeSeconds || m.averageTimeSeconds <= 0)) {
          return false
        }
        if (titleCardFilter === "missing" && (m.submissionCount && m.submissionCount > 0 && m.averageTimeSeconds && m.averageTimeSeconds > 0)) {
          return false
        }
        const relDateStr = m.releaseDate || `${m.year || 1970}-01-01`
        const mTime = new Date(relDateStr).getTime()
        if (isNaN(mTime)) return true
        if (sortBy === "latest") {
          return mTime <= now.getTime() || !m.releaseDate
        } else {
          return mTime > todayStart && Boolean(m.releaseDate)
        }
      })

      const sorted = [...filtered].sort((a, b) => {
        const dateB = new Date(b.releaseDate || `${b.year || 1970}-01-01`).getTime()
        const dateA = new Date(a.releaseDate || `${a.year || 1970}-01-01`).getTime()
        if (!isNaN(dateB) && !isNaN(dateA) && dateB !== dateA) {
          return sortBy === "latest" ? dateB - dateA : dateA - dateB
        }
        return (b.year || 0) - (a.year || 0) || new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })

      if (isLoadMore) {
        setMovies(prev => [...prev, ...sorted])
      } else {
        setMovies(sorted)
      }

      setTotal(totalCount)
      const newSkip = currentSkip + movieList.length
      setSkip(newSkip)
      setHasMore(newSkip < totalCount)
    } catch (error) {
      console.error("Error loading movies:", error)
      if (!isLoadMore) {
        setMovies(DEMO_MOVIES)
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [sortBy, skip, language, titleCardFilter])

  // Initial load and sort/language/titleCard change
  useEffect(() => {
    setSkip(0)
    setHasMore(true)
    setMovies([])
    fetchMovies(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, language, titleCardFilter])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMovies(true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, fetchMovies])

  const handleMovieAdded = () => {
    setSkip(0)
    setHasMore(true)
    fetchMovies(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Film className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
            When does the title card appear?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
            Find out exactly when movie title cards show up, so you know the perfect moment
            to snap that theater photo without missing a beat.
          </p>
          <div className="mt-6">
            <AddMovieDialog onMovieAdded={() => fetchMovies(false)} />
          </div>
        </section>

        {/* Sort and Language Options */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Movies</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 border-l pl-3 border-border">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Title Card:</span>
              <div className="inline-flex rounded-md shadow-sm border border-input bg-background p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTitleCardFilter("All")}
                  className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                    titleCardFilter === "All"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTitleCardFilter("has")}
                  className={`px-2.5 py-1 rounded-sm font-medium transition-colors flex items-center gap-1 ${
                    titleCardFilter === "has"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clock className="h-3 w-3 text-amber-500" />
                  Reported
                </button>
                <button
                  type="button"
                  onClick={() => setTitleCardFilter("missing")}
                  className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                    titleCardFilter === "missing"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Missing
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l pl-3 border-border">
              <Button
                variant={sortBy === "latest" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy("latest")}
                className="gap-1.5"
              >
                <Clock className="h-4 w-4" />
                Latest
              </Button>
              <Button
                variant={sortBy === "upcoming" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy("upcoming")}
                className="gap-1.5"
              >
                <Calendar className="h-4 w-4" />
                Upcoming
              </Button>
            </div>
          </div>
        </div>

        {/* Movie Grid */}
        <MovieGrid movies={movies} loading={loading} loadingMore={loadingMore} sentinelRef={sentinelRef} />
      </main>
    </div>
  )
}
