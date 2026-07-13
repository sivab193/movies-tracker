import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Switch,
  Textarea,
} from 'movies-tracker'
import { Clock, IndianRupee, MapPin } from 'lucide-react'

// Label is a Radix label: it only means something next to the control it names. These
// stories are the real form rows it appears in — the Add Watch dialog, the submission
// form, and the Settings toggles.

export function FormRows() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Add a watch</CardTitle>
        <CardDescription>Spider-Man: Across the Spider-Verse</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lb-theater" className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            Theatre
          </Label>
          <Input id="lb-theater" defaultValue="AGS Cinemas, Villivakkam" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lb-cost" className="flex items-center gap-2">
            <IndianRupee className="size-4 text-primary" />
            Ticket cost
          </Label>
          <Input id="lb-cost" type="number" defaultValue="280" />
          <p className="text-xs text-muted-foreground">Amount you paid, in INR.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function WithTextarea() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="lb-note" className="flex items-center gap-2">
        <Clock className="size-4 text-primary" />
        Optional note
      </Label>
      <Textarea
        id="lb-note"
        defaultValue="Title card lands right after the Trinity countdown — 6:24 on the IMAX print."
      />
      <p className="text-xs text-muted-foreground">Shown next to your submission.</p>
    </div>
  )
}

export function WithControls() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id="lb-public" defaultChecked />
        <Label htmlFor="lb-public">Show my total movie count publicly</Label>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="lb-leaderboard">Join the leaderboard</Label>
        <Switch id="lb-leaderboard" defaultChecked />
      </div>
    </div>
  )
}

// Label carries `peer-disabled:opacity-50`, so a label placed *after* a disabled control
// dims with it. Checkbox and Switch both ship the `peer` class, which is what makes the
// control-then-label row the one to reach for when a setting can be locked.
export function DisabledControls() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id="lb-admin" disabled />
        <Label htmlFor="lb-admin">Admin tools — request pending</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="lb-email" disabled />
        <Label htmlFor="lb-email">Email digests — verify your address first</Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lb-url">Custom profile URL</Label>
        <Input id="lb-url" defaultValue="siv19" disabled />
        <p className="text-xs text-muted-foreground">
          Usernames can only be claimed once every 30 days.
        </p>
      </div>
    </div>
  )
}
