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

// AlertDialogDescription is the muted paragraph that spells out the consequence — the
// part that turns a scary title into an informed choice. It only reads correctly inside
// the alert it explains: here, deleting a film that other people have logged times for.
export function Open() {
  return (
    <div className="h-96">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 />
            Delete movie
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RRR from the catalog?</AlertDialogTitle>
            <AlertDialogDescription>
              63 people have submitted a title-card time for RRR (2022), and the 8:18
              community average is cited on 4 shared links. Deleting the film removes
              every submission, breaks those links, and detaches it from 17 members'
              watch histories. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
              Delete movie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// A one-line description is the common case — enough to name what's about to change,
// and nothing more.
export function ShortDescription() {
  return (
    <div className="h-80">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Make profile private
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hide your profile?</AlertDialogTitle>
            <AlertDialogDescription>
              /u/sivaganesh will stop resolving for anyone but you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Make private</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
