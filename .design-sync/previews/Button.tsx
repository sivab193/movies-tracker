import { Button } from 'movies-tracker'
import { Clock, Plus, Send, Trash2 } from 'lucide-react'

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Log a title card</Button>
      <Button variant="secondary">Add to watchlist</Button>
      <Button variant="outline">Edit entry</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">View all movies</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add movie">
        <Plus />
      </Button>
      <Button size="icon-sm" variant="outline" aria-label="Delete">
        <Trash2 />
      </Button>
    </div>
  )
}

export function WithIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus /> Add movie
      </Button>
      <Button variant="secondary">
        <Clock /> Start timer
      </Button>
      <Button variant="outline">
        <Send /> Submit time
      </Button>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Submitting…</Button>
      <Button variant="secondary" disabled>
        Unavailable
      </Button>
      <Button variant="outline" disabled>
        Edit entry
      </Button>
    </div>
  )
}
