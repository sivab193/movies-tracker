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
import { MOVIES } from './_fixtures'

// AlertDialogFooter is the answer row: reversed-stacked on mobile so the safe choice
// sits at the bottom, right-aligned from `sm:` up with Cancel before Action. It only
// exists inside the alert it answers — a bulk delete off the history page.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 />
            Delete 3 selected
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete 3 watch entries?</AlertDialogTitle>
            <AlertDialogDescription>
              These visits and the ₹1,240 of spend attached to them will be removed from
              your history. Title-card times you submitted are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="divide-y rounded-lg border">
            {MOVIES.slice(0, 3).map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-2">
                <img
                  src={m.posterUrl}
                  alt=""
                  className="h-10 w-7 shrink-0 rounded object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {m.title}
                </span>
                <span className="text-xs text-muted-foreground">PVR ICON</span>
              </li>
            ))}
          </ul>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Delete all 3
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// The footer is a plain flex row, so an extra escape hatch can be parked on the left
// with `mr-auto` while the two real answers stay paired on the right.
export function WithSecondaryAction() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Delete history
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your entire watch history?</AlertDialogTitle>
            <AlertDialogDescription>
              All 214 entries, going back to Jan 2024. Export a CSV first if you want to
              keep the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" className="mr-auto">
              Export first
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
