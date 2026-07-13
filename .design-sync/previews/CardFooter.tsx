import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'movies-tracker'
import { MapPin, Share2 } from 'lucide-react'

// CardFooter is the bottom action row of a Card (`flex items-center px-6`, plus a
// `[.border-t]:pt-6` rule that only fires inside one) — so every story is a full Card.
// The axis is what the footer carries: buttons, a separated total, metadata.

export function WatchEntryActions() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Oppenheimer</CardTitle>
        <CardDescription>Logged 14 Mar 2024 · PVR ICON</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Title card at 6:24 — 3 seconds off the community average.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Edit watch</Button>
        <Button size="sm" variant="outline">
          <Share2 /> Share
        </Button>
      </CardFooter>
    </Card>
  )
}

export function SeparatedTotal() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>RRR</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="size-4" />
          AGS Cinemas, Villivakkam
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Ticket</span>
          <span className="font-medium tabular-nums">₹280</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Food</span>
          <span className="font-medium tabular-nums">₹150</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t">
        <span className="text-sm font-medium">Total spent</span>
        <span className="text-lg font-bold tabular-nums">₹430</span>
      </CardFooter>
    </Card>
  )
}

export function MetaFooter() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Barbie</CardTitle>
        <CardDescription>2023 · 114 min · English</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm italic text-muted-foreground">
          Title card not reported yet.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">Added 1 Mar 2024</span>
        <Button size="sm" variant="outline">
          Log a time
        </Button>
      </CardFooter>
    </Card>
  )
}
