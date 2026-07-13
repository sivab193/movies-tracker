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
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { MOVIE } from './_fixtures'

// AlertDialogHeader just stacks the title + description at the alert's spacing, so the
// preview is the whole alert its header introduces — resetting a submitted title-card
// time, where the header has to carry the weight of the warning.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RotateCcw />
            Reset my time
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Reset your title-card time?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You logged 6:31 for {MOVIE.title}. Resetting pulls your submission out of
              the {MOVIE.submissionCount}-person average, which will be recomputed for
              everyone. You can log a new time afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my time</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Reset time
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// The header is centered below `sm:` and left-aligned above it; forcing `text-center`
// at all widths suits a single, stark question.
export function CenteredHeader() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Delete 3 entries
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle>Delete 3 watch entries?</AlertDialogTitle>
            <AlertDialogDescription>
              RRR, Barbie and Oppenheimer will be removed from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
