import { MovieCardSkeleton } from 'movies-tracker'

// The skeleton mirrors MovieCard's geometry exactly — a 2:3 poster block over a
// title line and a row of two meta chips — so the grid doesn't reflow when the
// real cards land.
export function Default() {
  return (
    <div className="w-64">
      <MovieCardSkeleton />
    </div>
  )
}

// How the app actually uses it: the browse grid while the first page of movies
// is still in flight.
export function LoadingGrid() {
  return (
    <div className="grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}
