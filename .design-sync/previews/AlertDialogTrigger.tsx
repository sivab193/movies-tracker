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
import { LogOut, Trash2 } from 'lucide-react'
import { MOVIE_UNREPORTED } from './_fixtures'

// AlertDialogTrigger is meaningless apart from the alert it arms, so the card shows the
// pair: a destructive button on a catalog row, and the confirmation it opened.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 />
            Remove from history
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {MOVIE_UNREPORTED.title} from your history?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You logged one watch of {MOVIE_UNREPORTED.title} ({MOVIE_UNREPORTED.year})
              at AGS Cinemas — OMR. Removing it drops that visit and its ₹420 of spend.
              The film stays in the catalog for everyone else.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// `asChild` lets the trigger be any control — a quiet icon button on a history row, a
// destructive button on a settings page, a ghost item in an account menu.
export function TriggerVariants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 />
            Delete entry
          </Button>
        </AlertDialogTrigger>
      </AlertDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <LogOut />
            Sign out
          </Button>
        </AlertDialogTrigger>
      </AlertDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Delete watch entry">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
      </AlertDialog>
    </div>
  )
}
