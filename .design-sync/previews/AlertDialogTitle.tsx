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
import { UserX } from 'lucide-react'

// AlertDialogTitle is the alert's accessible name — Radix warns without it — so it is
// never rendered on its own. This is the heaviest question the app asks: account
// deletion, where the title alone has to make the stakes clear.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <UserX />
            Delete account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your 214 watch logs, your ₹48,600 of tracked
              spend, and the 9 title-card times you've contributed. Your submitted times
              stay in the community averages, but they'll no longer be attributed to you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// The title is a plain semibold heading, so a longer question wraps cleanly and the
// description keeps its muted contrast underneath.
export function LongTitle() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Merge duplicates
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Merge the two RRR entries logged on 25 Mar 2022?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Both were logged at Rohini Silver Screens for the 9:15 PM show. The merged
              entry keeps the higher ₹ spend and the earlier timestamp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Merge entries</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
