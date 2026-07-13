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

// AlertDialogAction is the confirm button — it takes `buttonVariants()` (the primary
// look) and no `variant` prop, so a destructive confirm is a className override. It
// closes the alert on click, which is why it only renders inside one.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Delete watch entry">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this watch entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {WATCH_ENTRY.movieTitle} at {WATCH_ENTRY.theaterName} — 14 Mar 2024. The
              confirm below is styled destructive; the default would be the red primary
              button, which reads as "proceed", not "destroy".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              <Trash2 />
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Left alone, the action is the DS's primary button — the right look when the outcome
// is wanted, not feared.
export function DefaultAction() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button size="sm">Publish profile</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Publish your profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Your 214 watches and ₹48,600 of tracked spend become visible at
              /u/sivaganesh. You can make it private again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction>Publish profile</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
