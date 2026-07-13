import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from 'movies-tracker'
import { Clock, Trash2 } from 'lucide-react'
import { MOVIE } from './_fixtures'

// AlertDialogPortal is why an alert armed from a cramped, clipped tile still lands
// centered on the viewport. AlertDialogContent wraps its children in one automatically,
// so the true render is an alert opened from exactly such a tile: the movie card below
// is `overflow-hidden` and h-32, yet the panel escapes it entirely.
export function Open() {
  return (
    <div className="h-96">
      <div className="h-32 w-72 overflow-hidden rounded-lg border bg-card">
        <div className="flex items-start gap-3 p-3">
          <img
            src={MOVIE.posterUrl}
            alt=""
            className="h-16 w-11 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {MOVIE.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {MOVIE.year} · {MOVIE.runtime}
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs">
              <Clock className="size-3 text-primary" />
              <span className="font-semibold tabular-nums">6:24</span>
              <span className="text-muted-foreground">· your time 6:31</span>
            </p>
          </div>
          <AlertDialog defaultOpen>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete your submitted time"
              >
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your submitted time?</AlertDialogTitle>
                <AlertDialogDescription>
                  Armed from a clipped tile — the portal lifts this panel to the document
                  body, so no ancestor can crop it. Your 6:31 leaves the
                  {' '}{MOVIE.submissionCount}-person average for {MOVIE.title}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my time</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                  Delete time
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

// The same tile with the alert closed: everything it can show on its own — which is
// what makes the escape above legible.
export function Closed() {
  return (
    <div className="h-32 w-72 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-start gap-3 p-3">
        <img
          src={MOVIE.posterUrl}
          alt=""
          className="h-16 w-11 shrink-0 rounded object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{MOVIE.title}</p>
          <p className="text-xs text-muted-foreground">
            {MOVIE.year} · {MOVIE.runtime}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs">
            <Clock className="size-3 text-primary" />
            <span className="font-semibold tabular-nums">6:24</span>
            <span className="text-muted-foreground">· your time 6:31</span>
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete your submitted time"
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your submitted time?</AlertDialogTitle>
              <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my time</AlertDialogCancel>
              <AlertDialogAction>Delete time</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
