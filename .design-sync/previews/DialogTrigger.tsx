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
import { Clock, MapPin, Pencil, Plus } from 'lucide-react'
import { MOVIE } from './_fixtures'

// DialogTrigger is only meaningful attached to a Dialog, so the card shows the whole
// thing open: the trigger (behind the overlay) is what opened this "Log a watch" form.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Log movie watch
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log movie watch</DialogTitle>
            <DialogDescription>
              Record a film you watched in theaters.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-2">
            <img
              src={MOVIE.posterUrl}
              alt=""
              className="h-10 w-7 rounded object-cover"
            />
            <span className="text-sm font-medium">
              {MOVIE.title} ({MOVIE.year})
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-theater" className="flex items-center gap-2">
              <MapPin className="size-4" />
              Theater
            </Label>
            <Input id="trigger-theater" defaultValue="PVR ICON — Phoenix Mall" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-show" className="flex items-center gap-2">
              <Clock className="size-4" />
              Show time
            </Label>
            <Input id="trigger-show" defaultValue="7:30 PM" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Add watch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// The trigger accepts any child via `asChild` — the app uses a primary button on the
// catalog page and a quiet icon button on each watch-history row.
export function TriggerVariants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Log movie watch
          </Button>
        </DialogTrigger>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil />
            Edit entry
          </Button>
        </DialogTrigger>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Edit watch entry">
            <Pencil />
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  )
}
