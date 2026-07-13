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
import { X } from 'lucide-react'

// AlertDialogCancel is the safe way out — it's `buttonVariants({ variant: 'outline' })`,
// and Radix focuses it first when the alert opens, so the highlighted ring on "Keep
// editing" below is the component doing its job. Only renders inside an alert.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <X />
            Close editor
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this watch log?</AlertDialogTitle>
            <AlertDialogDescription>
              You've filled in Spider-Man: Across the Spider-Verse at AGS Cinemas — OMR,
              the 9:15 PM show, and ₹280 of tickets, but haven't saved yet. Closing the
              editor throws the draft away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Discard draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// The cancel label should name what staying does, not just say "Cancel" — and it can
// carry the whole width when the alert is a single-choice dead end.
export function FullWidthCancel() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Submit time
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>You've already logged this film</AlertDialogTitle>
            <AlertDialogDescription>
              Your 6:31 for Oppenheimer is already part of the 42-submission average.
              Reset it from the film page if you want to log a different time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full">Got it</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
