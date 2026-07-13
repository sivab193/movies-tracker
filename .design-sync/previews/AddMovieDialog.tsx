import { AddMovieDialog } from 'movies-tracker'
import { useEffect, useRef, type ReactNode } from 'react'

// AddMovieDialog owns its `open` state internally (its only prop is
// onMovieAdded), so the only way to preview it open is to press its own trigger
// — which is what a person does. The dialog then portals to <body> and paints
// over the whole card.
function OpenOnMount({ tab, children }: { tab?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector('button')?.click()
    if (!tab) return
    const id = window.setTimeout(() => {
      const t = [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(
        (el) => el.textContent?.trim() === tab,
      )
      // Radix tabs activate on pointer down, not on click.
      t?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    }, 0)
    return () => window.clearTimeout(id)
  }, [tab])
  return (
    <div ref={ref} className="flex h-96 items-start justify-end p-4">
      {children}
    </div>
  )
}

// The "Add Movie" flow: search OMDb by title, or paste an IMDb link. Two tabs,
// one modal — this is how every film enters the tracker. The trigger behind the
// overlay is the page's own "Add Movie" button.
export function Open() {
  return (
    <OpenOnMount>
      <AddMovieDialog onMovieAdded={() => {}} />
    </OpenOnMount>
  )
}

// The second tab — for when you already have the IMDb URL on your clipboard.
export function ImdbTab() {
  return (
    <OpenOnMount tab="IMDb URL/ID">
      <AddMovieDialog onMovieAdded={() => {}} />
    </OpenOnMount>
  )
}
