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
import { Clock } from 'lucide-react'
import { MOVIES } from './_fixtures'

// A page behind the dialog — without something to dim, an overlay preview shows nothing.
function CatalogBehind() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your catalog</h2>
      <div className="grid grid-cols-3 gap-4">
        {MOVIES.slice(0, 3).map((m) => (
          <div key={m.id} className="overflow-hidden rounded-lg border bg-card">
            <img src={m.posterUrl} alt="" className="h-28 w-full object-cover" />
            <div className="p-2">
              <p className="truncate text-sm font-semibold leading-tight">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.year}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// DialogOverlay is the fixed black/50 scrim. DialogContent mounts one for you, so the
// honest render is a real dialog over a real page: the overlay is the dimmed catalog
// behind the "Log the title card" panel.
export function Open() {
  return (
    <div className="h-96">
      <CatalogBehind />
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Clock />
            Log title card time
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log the title card</DialogTitle>
            <DialogDescription>
              Everything behind this panel is inert while the overlay is up — clicking
              the scrim dismisses the dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="overlay-time">Time into the film</Label>
            <Input id="overlay-time" defaultValue="6:31" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Submit time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// The same page with the dialog closed — the undimmed control against which the
// overlay's job is legible.
export function Closed() {
  return (
    <div className="h-96">
      <CatalogBehind />
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Clock />
            Log title card time
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log the title card</DialogTitle>
            <DialogDescription>Time into the film.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
