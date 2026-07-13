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
import { MapPin, Trash2 } from 'lucide-react'
import { MOVIES } from './_fixtures'

// A page behind the alert — an overlay with nothing to dim shows nothing.
function HistoryBehind() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Watch history</h2>
      <ul className="divide-y rounded-lg border bg-card">
        {MOVIES.slice(0, 3).map((m, i) => (
          <li key={m.id} className="flex items-center gap-3 p-3">
            <img
              src={m.posterUrl}
              alt=""
              className="h-12 w-8 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{m.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {['PVR ICON', 'AGS Cinemas — OMR', 'Rohini Silver Screens'][i]}
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              ₹{[500, 280, 420][i]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// AlertDialogOverlay is the fixed black/50 scrim AlertDialogContent mounts for you. Its
// true render is a real alert over a real page: the dimmed, inert history list behind
// the confirmation is the overlay.
export function Open() {
  return (
    <div className="h-96">
      <HistoryBehind />
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-4 text-destructive">
            <Trash2 />
            Delete entry
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this watch entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Unlike a Dialog's overlay, this one can't be clicked away — an alert has to
              be answered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// The same page with the alert closed — the undimmed control that makes the overlay's
// job legible.
export function Closed() {
  return (
    <div className="h-96">
      <HistoryBehind />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-4 text-destructive">
            <Trash2 />
            Delete entry
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this watch entry?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
