import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from 'movies-tracker'
import { MapPin, Pencil } from 'lucide-react'
import { WATCH_ENTRY } from './_fixtures'

// DialogPortal is why a dialog opened from a cramped, clipped row still lands centered
// on the viewport instead of inside its parent. DialogContent wraps its children in one
// automatically, so the true render is a dialog triggered from exactly such a row: the
// history card below is `overflow-hidden` and only h-32, yet the panel escapes it.
export function Open() {
  return (
    <div className="h-96">
      <div className="h-32 w-72 overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-3">
          <img
            src={WATCH_ENTRY.moviePosterUrl}
            alt=""
            className="h-14 w-10 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{WATCH_ENTRY.movieTitle}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {WATCH_ENTRY.theaterName}
            </p>
          </div>
          <Dialog defaultOpen>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Edit watch entry">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit watch entry</DialogTitle>
                <DialogDescription>
                  Opened from a clipped history row — the portal lifts this panel to the
                  document body, so no ancestor can crop it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="portal-theater">Theater</Label>
                <Input id="portal-theater" defaultValue="PVR ICON — Phoenix Mall" />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button>Update watch</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="p-3 text-xs text-muted-foreground">
          14 Mar 2024 · {WATCH_ENTRY.showTime} · ₹
          {WATCH_ENTRY.ticketCost + WATCH_ENTRY.foodCost}
        </p>
      </div>
    </div>
  )
}

// The same row with the dialog closed: everything the card can show on its own, which
// is what makes the escape above legible.
export function Closed() {
  return (
    <div className="h-32 w-72 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b p-3">
        <img
          src={WATCH_ENTRY.moviePosterUrl}
          alt=""
          className="h-14 w-10 rounded object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{WATCH_ENTRY.movieTitle}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {WATCH_ENTRY.theaterName}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Edit watch entry">
              <Pencil />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit watch entry</DialogTitle>
              <DialogDescription>Update this visit.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <p className="p-3 text-xs text-muted-foreground">
        14 Mar 2024 · {WATCH_ENTRY.showTime} · ₹
        {WATCH_ENTRY.ticketCost + WATCH_ENTRY.foodCost}
      </p>
    </div>
  )
}
