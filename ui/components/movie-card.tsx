"use client"

import Link from "next/link"
import { Clock, Star, Timer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatTitleCardTime, formatRuntimeToHHMM, type Movie } from "@/lib/types"

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movie/${movie.id}`} className="h-full block">
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full flex flex-col justify-between border-border/60">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted shrink-0">
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
          
          {/* Top Right Badge: Total Runtime in h/m or ? mins */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/10 shadow-md">
            <Timer className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>{formatRuntimeToHHMM(movie.runtime)}</span>
          </div>
        </div>
        
        <CardContent className="p-3.5 flex flex-col flex-1 justify-between gap-3">
          {/* Hero Banner: Title Card Time (The Main Feature!) */}
          <div>
            {movie.submissionCount > 0 && movie.averageTimeSeconds && movie.averageTimeSeconds > 0 ? (
              <div className="w-full flex items-center justify-between gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-rose-500/20 px-3 py-2 border border-amber-500/30 dark:border-amber-500/40 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse text-amber-500" />
                  <span>Title at:</span>
                </div>
                <span className="font-extrabold text-sm bg-gradient-to-r from-amber-600 to-rose-600 dark:from-amber-400 dark:to-rose-400 bg-clip-text text-transparent">
                  {formatTitleCardTime(movie.averageTimeSeconds)}
                </span>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-1.5 rounded-lg bg-muted/60 px-3 py-2 border border-border/50 text-muted-foreground text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span>Title at:</span>
                </div>
                <span className="italic opacity-80 font-medium">Not reported yet</span>
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col flex-1 justify-between gap-2">
            <h3 className="font-bold text-base leading-tight text-balance line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
              {movie.title}
            </h3>

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 truncate">
                <span className="font-medium truncate">
                  {movie.released || movie.releaseDate || movie.year || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {((movie.language || movie.Language) && (movie.language || movie.Language) !== "N/A") && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground max-w-[65px] truncate">
                    {(movie.language || movie.Language || "").split(",")[0].trim()}
                  </span>
                )}
                {movie.submissionCount > 0 ? (
                  <span className="rounded bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[11px] font-semibold">
                    {movie.submissionCount} {movie.submissionCount === 1 ? "log" : "logs"}
                  </span>
                ) : (
                  <span className="rounded bg-muted text-muted-foreground px-1.5 py-0.5 text-[11px] font-medium opacity-60">
                    0 logs
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
