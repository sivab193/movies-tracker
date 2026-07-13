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
import { Trash2 } from 'lucide-react'
import { WATCH_ENTRY } from './_fixtures'

// `defaultOpen` is the only way to see an AlertDialog — closed, it is just its trigger.
// The h-96 wrapper gives the portaled panel room inside the card.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash2 />
            Delete entry
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this watch entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {WATCH_ENTRY.movieTitle} at {WATCH_ENTRY.theaterName},{' '}
              {WATCH_ENTRY.theaterLocation} — 14 Mar 2024, {WATCH_ENTRY.showTime}. The
              ₹{WATCH_ENTRY.ticketCost + WATCH_ENTRY.foodCost} you logged for this show
              will be removed from your spend totals. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Not every confirmation is destructive — the same component carries the default
// primary action when the choice is merely irreversible-ish.
export function NonDestructive() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Submit time</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit 6:31 as the title-card time?</AlertDialogTitle>
            <AlertDialogDescription>
              Your time joins the 42 submissions that make up Oppenheimer's 6:24
              average. You can only submit once per film.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Let me re-check</AlertDialogCancel>
            <AlertDialogAction>Submit 6:31</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
