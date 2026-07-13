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
import { Pencil, Ticket, UtensilsCrossed } from 'lucide-react'
import { WATCH_ENTRY } from './_fixtures'

// DialogContent is the panel itself: it portals, paints the overlay, centers the box,
// and adds the ✕. The only honest render is a real, filled-in dialog — here the
// "Edit watch entry" form the history page opens from a row.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil />
            Edit entry
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit watch entry</DialogTitle>
            <DialogDescription>
              Update the details of this visit. Your logged title-card time is not
              affected.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-2">
            <img
              src={WATCH_ENTRY.moviePosterUrl}
              alt=""
              className="h-10 w-7 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {WATCH_ENTRY.movieTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {WATCH_ENTRY.theaterName} · {WATCH_ENTRY.theaterLocation}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-date">Date of watch</Label>
              <Input id="content-date" defaultValue="14 Mar 2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-show">Show time</Label>
              <Input id="content-show" defaultValue={WATCH_ENTRY.showTime} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-ticket" className="flex items-center gap-2">
                <Ticket className="size-4" />
                Ticket (₹)
              </Label>
              <Input
                id="content-ticket"
                defaultValue={String(WATCH_ENTRY.ticketCost)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-food" className="flex items-center gap-2">
                <UtensilsCrossed className="size-4" />
                Food (₹)
              </Label>
              <Input
                id="content-food"
                defaultValue={String(WATCH_ENTRY.foodCost)}
              />
            </div>
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
  )
}

// `showCloseButton={false}` drops the corner ✕ — used when the only way out should be
// an explicit footer choice.
export function WithoutCloseButton() {
  return (
    <div className="h-80">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Import from Letterboxd</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Importing 62 watches…</DialogTitle>
            <DialogDescription>
              Matching your Letterboxd diary against the catalog. This takes a few
              seconds — don't close the tab.
            </DialogDescription>
          </DialogHeader>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-2 w-1/2 rounded-full bg-primary" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Run in background</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
