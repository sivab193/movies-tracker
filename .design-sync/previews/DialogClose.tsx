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
} from 'movies-tracker'
import { Ticket } from 'lucide-react'
import { WATCH_ENTRY } from './_fixtures'

// DialogClose is an unstyled Radix button — it borrows a look from whatever it wraps
// with `asChild`. This ticket-stub viewer shows both of its uses at once: the ✕
// DialogContent renders in the corner, and an explicit "Done" in the footer.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Ticket />
            View ticket stub
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket stub</DialogTitle>
            <DialogDescription>
              {WATCH_ENTRY.movieTitle} · {WATCH_ENTRY.theaterName},{' '}
              {WATCH_ENTRY.theaterLocation}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-dashed bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Screen 3 · Row H
              </span>
              <span className="text-xs text-muted-foreground">14 Mar 2024</span>
            </div>
            <p className="text-lg font-semibold">{WATCH_ENTRY.showTime} show</p>
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Ticket + food</span>
              <span className="font-semibold tabular-nums">
                ₹{WATCH_ENTRY.ticketCost + WATCH_ENTRY.foodCost}
              </span>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Replace stub</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Without `asChild`, DialogClose renders a bare <button> — fine for a text link like
// "Not now", where a full button would over-weight the dismissal.
export function AsTextLink() {
  return (
    <div className="h-80">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Enable reminders</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Get a nudge after each show</DialogTitle>
            <DialogDescription>
              We'll ping you on Telegram the evening you log a watch, so you can add the
              title-card time while it's fresh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:items-center">
            <DialogClose className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Not now
            </DialogClose>
            <Button>Connect Telegram</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
