import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
} from 'movies-tracker'
import { Download } from 'lucide-react'

// DialogDescription is the muted line under the title (and the dialog's accessible
// description). It only reads correctly inside the dialog it explains — here the
// export dialog, where the description carries the actual explanation of the action.
export function Open() {
  return (
    <div className="h-96">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Download />
            Export history
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export your watch history</DialogTitle>
            <DialogDescription>
              We'll build a CSV of every watch you've logged — movie, theater, show
              time, ticket and food spend in ₹, and the title-card time you submitted.
              The file is emailed to you and the link expires after 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Checkbox id="desc-costs" defaultChecked />
              <Label htmlFor="desc-costs">Include ticket & food costs</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="desc-stubs" />
              <Label htmlFor="desc-stubs">Include ticket stub images</Label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Export 214 watches</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// A one-line description is the common case: it sits directly under the title in the
// header's 2-unit gap and stays muted against the title's semibold.
export function ShortDescription() {
  return (
    <div className="h-80">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Make profile public</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Publish your profile</DialogTitle>
            <DialogDescription>
              Anyone with the link will see your watch history at /u/sivaganesh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
