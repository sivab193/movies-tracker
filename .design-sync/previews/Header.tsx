import { Header, MovieCard } from 'movies-tracker'
import { MOVIES } from './_fixtures'

// The app's global bar: brand mark, the primary nav (TitleCard Timer,
// Leaderboard, Stats, Contact), the theme toggle, and the auth slot.
//
// The design-system provider mounts the real AuthProvider in its logged-out
// state, so the auth slot renders the "Sign in" call to action — signed in it
// becomes an avatar dropdown, and a "Watch History" link joins the nav.
export function Default() {
  return <Header />
}

// In context: the header is sticky and translucent (backdrop blur over a
// bottom border), so it sits directly on top of the page it's scrolling over.
export function OnTheBrowsePage() {
  return (
    <div className="min-h-96 bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Now tracking</h1>
            <p className="text-sm text-muted-foreground">
              128 films · 1,204 title-card times logged
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {MOVIES.slice(0, 4).map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </main>
    </div>
  )
}
