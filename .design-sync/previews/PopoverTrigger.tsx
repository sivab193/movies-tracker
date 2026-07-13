import { Button, Popover, PopoverContent, PopoverTrigger } from 'movies-tracker'
import { MapPin, Ticket } from 'lucide-react'
import { WATCH_ENTRY } from './_fixtures'

// The trigger is `asChild`-composed onto whatever the surface needs — here the ticket chip on
// a watch-history row, which opens the spend breakdown for that visit.
export function Open() {
  return (
    <div className="h-96">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Ticket />
            PVR ICON · ₹500
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <span className="text-sm font-medium leading-none">
                {WATCH_ENTRY.movieTitle}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <MapPin className="size-3" />
                {WATCH_ENTRY.theaterLocation} · {WATCH_ENTRY.showTime}
              </span>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ticket</span>
                <span className="tabular-nums">₹{WATCH_ENTRY.ticketCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Food</span>
                <span className="tabular-nums">₹{WATCH_ENTRY.foodCost}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span className="tabular-nums">
                  ₹{WATCH_ENTRY.ticketCost + WATCH_ENTRY.foodCost}
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Trigger without `asChild` renders a bare button — the app always wraps a DS Button instead.
export function IconTrigger() {
  return (
    <div className="h-96">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Theater details">
            <MapPin />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <div className="grid gap-1">
            <span className="text-sm font-medium leading-none">AGS Cinemas — OMR</span>
            <span className="text-muted-foreground text-xs">
              Navalur, Chennai · 9 visits logged
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
