"use client"

import Link from "next/link"
import { Clock, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatTimeDisplay, type Movie } from "@/lib/types"

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movie/${movie.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl || "/placeholder.svg"}
              alt={`${movie.title} poster`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl text-muted-foreground">🎬</span>
            </div>
          )}
          
          {/* Overlay with title card time */}
          {movie.averageTimeSeconds !== null && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
              <div className="flex items-center gap-1.5 text-white">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {formatTimeDisplay(movie.averageTimeSeconds)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold leading-tight text-balance line-clamp-2 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="truncate">{movie.released || movie.releaseDate || movie.year}</span>
              {movie.imdbRating && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span>{movie.imdbRating}</span>
                </div>
              )}
            </div>
            {((movie.language || movie.Language) && (movie.language || movie.Language) !== "N/A") && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground shrink-0 max-w-[70px] truncate">
                {(movie.language || movie.Language || "").split(",")[0].trim()}
              </span>
            )}
          </div>
          {movie.submissionCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {movie.submissionCount} submission{movie.submissionCount !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
