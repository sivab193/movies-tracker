import { MovieCard } from 'movies-tracker'
import { MOVIE, MOVIES, MOVIE_UNREPORTED } from './_fixtures'

export function Default() {
  return (
    <div className="w-64">
      <MovieCard movie={MOVIE} />
    </div>
  )
}

// The card has two visually distinct states, driven by whether anyone has logged a
// title-card time: a warm amber/rose gradient banner when there's an average to show,
// and a muted "Not reported yet" banner when there isn't.
export function NotReportedYet() {
  return (
    <div className="w-64">
      <MovieCard movie={MOVIE_UNREPORTED} />
    </div>
  )
}

export function InAGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {MOVIES.map((m) => (
        <MovieCard key={m.id} movie={m} />
      ))}
    </div>
  )
}
