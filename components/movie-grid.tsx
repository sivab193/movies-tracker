"use client"

import { MovieCard } from "@/components/movie-card"
import { MovieCardSkeleton } from "@/components/movie-card-skeleton"
import type { Movie } from "@/lib/types"

interface MovieGridProps {
  movies: Movie[]
  loading?: boolean
}

export function MovieGrid({ movies, loading }: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-lg font-medium">No movies yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to add a movie!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
