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
import { LogOut } from 'lucide-react'

// AlertDialogContent is the panel: it portals, paints the scrim, and centers the box.
// Unlike DialogContent it has no ✕ — an alert must be answered, so it renders only
// what you put in it. Here: the sign-out confirmation from the account menu.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <LogOut />
            Sign out
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of movies-tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unsaved watch log for Guardians of the Galaxy Vol. 3 at PVR —
              Forum Mall. Signing out now discards it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// The panel is `sm:max-w-lg` by default; a narrower box suits a short, one-line
// question and keeps the two answers close together.
export function Compact() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Clear filters
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all filters?</AlertDialogTitle>
            <AlertDialogDescription>
              Chennai, 2023, and "logged by me" will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
