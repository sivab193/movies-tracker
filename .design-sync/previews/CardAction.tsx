import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'movies-tracker'
import { Pencil, Star, Trash2 } from 'lucide-react'

// CardAction is positioned by CardHeader's grid (`col-start-2 row-span-2`) and collapses
// to nothing outside one — so every story renders a full Card whose header carries the
// action. The axis is what the action holds: icon buttons, a text button, a badge.

export function WatchHistoryEntry() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Oppenheimer</CardTitle>
        <CardDescription>PVR ICON · 14 Mar 2024 · 7:30 PM</CardDescription>
        <CardAction className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Edit watch">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete watch">
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          <span>
            <span className="text-muted-foreground">Ticket </span>
            <span className="font-medium tabular-nums">₹320</span>
          </span>
          <span>
            <span className="text-muted-foreground">Food </span>
            <span className="font-medium tabular-nums">₹180</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function TextAction() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>4 films you haven't logged yet</CardDescription>
        <CardAction>
          <Button variant="link" size="sm" className="px-0">
            See all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {['Barbie', 'Dune: Part Two', 'Poor Things', 'Maharaja'].map((t) => (
          <div key={t} className="flex items-center justify-between">
            <span>{t}</span>
            <span className="text-muted-foreground">not reported</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RatingAction() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Guardians of the Galaxy Vol. 3</CardTitle>
        <CardDescription>2023 · 150 min · English</CardDescription>
        <CardAction>
          <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
            <Star className="size-4" />
            7.9
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Title card at 4:11, averaged over 8 submissions.
        </p>
      </CardContent>
    </Card>
  )
}
