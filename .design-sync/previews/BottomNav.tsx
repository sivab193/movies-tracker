import { BottomNav, MovieCard } from 'movies-tracker'
import { MOVIES } from './_fixtures'

// The mobile tab bar: fixed to the bottom edge, translucent over the page, one
// tab per top-level surface (Home, Timer, Board, History, Stats). It replaces
// the desktop nav + Footer below the `md` breakpoint, and the active tab is the
// one matching the current route — logged out, "History" drops out.
//
// NOTE (blocked, config-level — see .design-sync/learnings/batch-e.md):
//   1. BottomNav calls usePathname(); outside a Next router that returns null
//      and the component throws on `pathname.startsWith(...)`. The DS provider
//      (.design-sync/ds-providers.tsx) has to supply PathnameContext — it can't
//      be supplied from a preview, because a preview-side import of next's
//      context is a *different module instance* than the one bundled into
//      _ds_bundle.js (verified: the provider has no effect).
//   2. The bar is `md:hidden`, so at the 900x700 capture viewport it is
//      display:none. It needs a phone viewport override in config.json.
// With both in place these two stories render the bar as the app shows it.
export function Default() {
  return (
    <div className="h-40 bg-background">
      <BottomNav />
    </div>
  )
}

// Over a scrolling page — the bar keeps its own 4rem band at the bottom of the
// screen while the movie list runs underneath it.
export function OverAPage() {
  return (
    <div className="h-96 overflow-hidden bg-background">
      <div className="px-4 pt-4">
        <h1 className="mb-3 text-xl font-bold tracking-tight">Now tracking</h1>
        <div className="grid grid-cols-2 gap-4">
          {MOVIES.slice(0, 2).map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
