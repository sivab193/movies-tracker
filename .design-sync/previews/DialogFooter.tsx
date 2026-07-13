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
import { MapPin, Trash2 } from 'lucide-react'

// DialogFooter is the action row: stacked (reversed) on mobile, right-aligned from
// `sm:` up. It only makes sense attached to the dialog it closes — the admin's
// "Add a theater" form.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>
            <MapPin />
            Add theater
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a theater</DialogTitle>
            <DialogDescription>
              Approved theaters are the ones people can pick when logging a watch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="footer-name">Theater name</Label>
            <Input id="footer-name" defaultValue="AGS Cinemas" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer-loc">Location</Label>
            <Input id="footer-loc" defaultValue="OMR, Navalur, Chennai" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Save theater</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// A destructive action pushed to the left with `mr-auto` — the footer is a plain flex
// row, so the confirm pair stays on the right.
export function WithSecondaryAction() {
  return (
    <div className="h-80">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Manage theater</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PVR ICON — Phoenix Mall</DialogTitle>
            <DialogDescription>
              Used in 38 watch logs across 12 members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              className="mr-auto text-destructive hover:bg-destructive/10"
            >
              <Trash2 />
              Delete theater
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
