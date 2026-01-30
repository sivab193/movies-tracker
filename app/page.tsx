"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Film, Clock, TrendingUp } from "lucide-react"
import { Header } from "@/components/header"
import { MovieGrid } from "@/components/movie-grid"
import { AddMovieDialog } from "@/components/add-movie-dialog"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/lib/types"

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

type SortOption = "latest" | "popular"

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [addedMovies, setAddedMovies] = useState<Movie[]>([])
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchMovies = useCallback(async () => {
    const isFirebaseConfigured = checkFirebaseConfig()
    
    // Use demo data if Firebase isn't configured
    if (!isFirebaseConfigured) {
      const allMovies = [...addedMovies, ...DEMO_MOVIES]
      const sorted = allMovies.sort((a, b) => {
        if (sortBy === "latest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return (b.submissionCount || 0) - (a.submissionCount || 0)
      })
      setMovies(sorted)
      setLoading(false)
      return
    }

    // Dynamically import Firebase only when configured
    try {
      const { collection, query, orderBy, onSnapshot, limit } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      
      if (!db) {
        setMovies(DEMO_MOVIES)
        setLoading(false)
        return
      }

      const moviesRef = collection(db, "movies")
      const q = query(
        moviesRef,
        orderBy(sortBy === "latest" ? "createdAt" : "submissionCount", "desc"),
        limit(50)
      )

      // Clean up previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        const movieList: Movie[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Movie[]
        setMovies(movieList)
        setLoading(false)
      }, (error) => {
        console.error("Firebase error:", error)
        setMovies(DEMO_MOVIES)
        setLoading(false)
      })
    } catch (error) {
      console.error("Error loading Firebase:", error)
      setMovies(DEMO_MOVIES)
      setLoading(false)
    }
  }, [sortBy, addedMovies])

  useEffect(() => {
    fetchMovies()
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [fetchMovies])

  const handleMovieAdded = () => {
    // In demo mode, we need to manually refresh
    // In Firebase mode, onSnapshot handles updates automatically
    if (!checkFirebaseConfig()) {
      // For demo mode, just trigger a re-fetch
      fetchMovies()
    }
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
          <div className="mt-8">
            <AddMovieDialog onMovieAdded={handleMovieAdded} />
          </div>
        </section>

        {/* Sort Options */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Movies</h2>
          <div className="flex items-center gap-2">
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
              variant={sortBy === "popular" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("popular")}
              className="gap-1.5"
            >
              <TrendingUp className="h-4 w-4" />
              Popular
            </Button>
          </div>
        </div>

        {/* Movie Grid */}
        <MovieGrid movies={movies} loading={loading} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Made for movie lovers who want to capture that perfect theater moment.</p>
        </div>
      </footer>
    </div>
  )
}
