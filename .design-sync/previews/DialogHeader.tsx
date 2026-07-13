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
  Input,
  Label,
} from 'movies-tracker'
import { Clock } from 'lucide-react'
import { MOVIE } from './_fixtures'

// DialogHeader only stacks a title + description with the dialog's own spacing, so the
// preview is a whole dialog whose header carries the work: the app's signature action,
// logging when the title card appears.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>
            <Clock />
            Log title card time
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Log the title card
            </DialogTitle>
            <DialogDescription>
              How far into {MOVIE.title} did the title card appear? Enter the time from
              the start of the film, not from the start of the show.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              Current average · {MOVIE.submissionCount} submissions
            </p>
            <p className="text-2xl font-bold tabular-nums">6:24</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header-min">Minutes</Label>
              <Input id="header-min" defaultValue="6" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="header-sec">Seconds</Label>
              <Input id="header-sec" defaultValue="31" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Submit time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// The header centers on mobile and left-aligns from `sm:` up; `text-center` keeps it
// centered at every width, which reads better for a single confirming statement.
export function CenteredHeader() {
  return (
    <div className="h-80">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">View streak</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>7 films logged this month</DialogTitle>
            <DialogDescription>
              Your longest streak yet — two ahead of March.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button>Nice</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
