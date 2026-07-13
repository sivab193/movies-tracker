import { MovieGrid } from 'movies-tracker'
import { MOVIES } from './_fixtures'

// The browse surface: a responsive poster grid (2 → 3 → 4 → 5 columns) of every
// movie whose title-card time the community is tracking.
export function Populated() {
  return <MovieGrid movies={MOVIES} />
}

// First paint, before the movies resolve — ten MovieCardSkeletons in the same
// grid, so nothing reflows when the posters arrive.
export function Loading() {
  return <MovieGrid movies={[]} loading />
}

// Infinite scroll: the next page is being fetched below the fold.
export function LoadingMore() {
  return <MovieGrid movies={MOVIES.slice(0, 4)} loadingMore />
}

// Nothing tracked yet — the 🎬 empty state that invites the first submission.
export function Empty() {
  return <MovieGrid movies={[]} />
}
