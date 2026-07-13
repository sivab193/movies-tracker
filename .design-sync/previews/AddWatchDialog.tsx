import { AddWatchDialog, Button } from 'movies-tracker'
import { useEffect } from 'react'
import { WATCH_ENTRY } from './_fixtures'

const noop = () => {}

// Radix autofocuses the first field when the dialog opens, and the movie search
// input opens its suggestion list on focus. Dropping focus shows the form the
// way it looks a moment later, once you've moved on from the search box.
function useDropAutoFocus() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      const el = document.activeElement
      if (el instanceof HTMLElement) el.blur()
    }, 50)
    return () => window.clearTimeout(id)
  }, [])
}

// Logging a trip to the cinema: which film, which theatre, the date and show
// time, what the ticket and the popcorn cost. `open` + `hideTrigger` render the
// modal directly.
export function Open() {
  useDropAutoFocus()
  return (
    <div className="h-96">
      <AddWatchDialog uid="demo-user" onWatchAdded={noop} open onOpenChange={noop} hideTrigger />
    </div>
  )
}

// Editing an existing entry: `initialData` locks the film (poster + title, no
// search box) and pre-fills the date and costs — 14 Mar 2024, ₹320 ticket, ₹180
// food. The theatre picker is empty because the approved-theatre list comes from
// the API, which a static preview has no access to.
export function EditExistingWatch() {
  useDropAutoFocus()
  return (
    <div className="h-96">
      <AddWatchDialog
        uid="demo-user"
        onWatchAdded={noop}
        initialData={WATCH_ENTRY}
        open
        onOpenChange={noop}
        hideTrigger
      />
    </div>
  )
}

// Closed — the trigger as it sits at the top of the Watch History page.
export function Trigger() {
  return (
    <div className="flex h-40 items-center justify-between border-b border-border pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watch history</h1>
        <p className="text-sm text-muted-foreground">
          18 films in theatres this year · ₹6,240 on tickets
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Export
        </Button>
        <AddWatchDialog uid="demo-user" onWatchAdded={noop} />
      </div>
    </div>
  )
}
