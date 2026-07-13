import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Textarea,
} from 'movies-tracker'
import { AlertCircle, Send } from 'lucide-react'

// Textarea is the "optional note" field on the submission form — always a Label, the
// control, and a helper line. It is `field-sizing-content` with a `min-h-16` floor, so
// it grows with the text it holds.

export function SubmissionNote() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Log the title card</CardTitle>
        <CardDescription>Oppenheimer · 6:24</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor="ta-note">Optional note</Label>
        <Textarea
          id="ta-note"
          placeholder="Anything worth flagging? e.g. the IMAX print runs 4s longer."
        />
        <p className="text-xs text-muted-foreground">
          Shown next to your time on the movie page.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm" className="w-full">
          <Send /> Submit time
        </Button>
      </CardFooter>
    </Card>
  )
}

export function Filled() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="ta-filled">Optional note</Label>
      <Textarea
        id="ta-filled"
        defaultValue="Title card lands right after the Trinity countdown. Timed it twice on the 70mm print at PVR ICON — 6:24 both times, so the average looks right."
      />
      <p className="text-xs text-muted-foreground">248 characters remaining.</p>
    </div>
  )
}

export function Invalid() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="ta-invalid">Report a wrong time</Label>
      <Textarea id="ta-invalid" aria-invalid defaultValue="wrong" />
      <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        Tell us what's wrong — at least 20 characters.
      </p>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="ta-disabled">Optional note</Label>
      <Textarea
        id="ta-disabled"
        defaultValue="Sign in to leave a note with your submission."
        disabled
      />
    </div>
  )
}
