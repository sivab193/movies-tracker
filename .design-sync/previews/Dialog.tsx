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
} from 'movies-tracker'
import { Film, Plus, Search } from 'lucide-react'
import { MOVIES } from './_fixtures'

// `defaultOpen` is what makes this card worth looking at — a closed Dialog renders
// nothing but its trigger. The h-96 wrapper gives the portaled content room.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Add movie
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="size-5" />
              Add a movie
            </DialogTitle>
            <DialogDescription>
              Search by title, then pick the film you want to start tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input placeholder="Search movie title… (e.g. Oppenheimer)" />
            <Button size="icon" aria-label="Search">
              <Search />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recently added
            </p>
            {MOVIES.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-2"
              >
                <img
                  src={m.posterUrl}
                  alt=""
                  className="h-12 w-8 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.year} · {m.runtime}
                  </p>
                </div>
                <Button size="sm" className="shrink-0">
                  Add
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function Closed() {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Your catalog</p>
        <p className="text-xs text-muted-foreground">128 movies tracked</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Add movie
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a movie</DialogTitle>
            <DialogDescription>Search by title.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
