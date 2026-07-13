import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Textarea,
} from 'movies-tracker'
import { Flag } from 'lucide-react'
import { MOVIE } from './_fixtures'

// DialogTitle is the dialog's accessible name (Radix warns if it's missing), so it is
// never rendered alone — this is the "Report a wrong time" dialog it names.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Flag />
            Report time
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an incorrect title-card time</DialogTitle>
            <DialogDescription>
              The community average for {MOVIE.title} is 6:24 across{' '}
              {MOVIE.submissionCount} submissions. Tell us what you saw instead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="title-reason">What's wrong?</Label>
            <Textarea
              id="title-reason"
              className="h-20"
              defaultValue="The 6:24 average looks like it counts the studio idents. The card itself lands at 7:05 on the IMAX print."
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Send report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// The title is a plain heading, so it takes an icon or a size override without
// ceremony — the catalog's "Add a theater" dialog leads with a longer, wrapping title.
export function LongTitle() {
  return (
    <div className="h-80">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Suggest a theater</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Suggest a theater that isn't in the approved list yet
            </DialogTitle>
            <DialogDescription>
              An admin reviews every suggestion before it can be picked in a watch log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Send suggestion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
