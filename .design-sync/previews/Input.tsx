import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from 'movies-tracker'
import { AlertCircle, Clock, Search, Send } from 'lucide-react'

// Input is always a form row in this app: a Label, the control, and a helper line.
// The canonical one is the title-card time field on a movie page.

export function TitleCardTime() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Log the title card</CardTitle>
        <CardDescription>Oppenheimer · 180 min</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor="time-input" className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          When did the title card appear?
        </Label>
        <Input id="time-input" placeholder="e.g. 6:24 or 384" defaultValue="6:24" />
        <p className="text-xs text-muted-foreground">
          Minutes:seconds from the start of the film, or plain seconds.
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

export function Types() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="in-search" className="flex items-center gap-2">
          <Search className="size-4" />
          Search movies
        </Label>
        <Input id="in-search" type="search" placeholder="Search by title…" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="in-cost">Ticket cost (₹)</Label>
        <Input id="in-cost" type="number" defaultValue="320" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="in-show">Show time</Label>
        <Input id="in-show" type="time" defaultValue="19:30" />
      </div>
    </div>
  )
}

export function Invalid() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="in-invalid">When did the title card appear?</Label>
      <Input id="in-invalid" aria-invalid defaultValue="3:12:40" />
      <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        Time cannot exceed the movie runtime (180 minutes).
      </p>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="in-disabled">Display name</Label>
        <Input id="in-disabled" defaultValue="siv19" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="in-disabled-empty">Custom profile URL</Label>
        <Input id="in-disabled-empty" placeholder="Sign in to claim a URL" disabled />
      </div>
    </div>
  )
}
