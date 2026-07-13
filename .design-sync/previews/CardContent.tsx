import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'movies-tracker'
import { Clock, Film, Plus } from 'lucide-react'
import { MOVIE } from './_fixtures'

// CardContent is the padded body slot (`px-6`) of a Card — on its own it is an unpadded
// div with no border, so every story is a full Card. The axis is the shape of the body:
// a data list, poster + metadata, and an empty state.

export function SubmissionBreakdown() {
  const rows = [
    { label: 'Fastest logged', value: '6:19' },
    { label: 'Average', value: '6:24' },
    { label: 'Slowest logged', value: '6:31' },
  ]
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Title card timing</CardTitle>
        <CardDescription>Oppenheimer · 42 submissions</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium tabular-nums">{r.value}</span>
          </div>
        ))}
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-2 w-3/4 rounded-full bg-primary" />
        </div>
        <p className="text-xs text-muted-foreground">
          75% of submissions land within 5 seconds of the average.
        </p>
      </CardContent>
    </Card>
  )
}

export function PosterAndMeta() {
  return (
    <Card className="max-w-sm">
      <CardContent className="flex gap-4">
        <img
          src={MOVIE.posterUrl}
          alt={MOVIE.title}
          className="h-24 w-16 shrink-0 rounded-md object-cover"
        />
        <div className="flex flex-col gap-1">
          <span className="font-semibold leading-none">{MOVIE.title}</span>
          <span className="text-sm text-muted-foreground">
            {MOVIE.year} · {MOVIE.runtime}
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-sm">
            <Clock className="size-4 text-primary" />
            <span className="font-medium tabular-nums">6:24</span>
            <span className="text-muted-foreground">avg.</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyState() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Your watch history</CardTitle>
        <CardDescription>Films you've seen in a theatre</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <Film className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You haven't logged a watch yet. Add one to start tracking tickets, theatres and
          title card times.
        </p>
        <Button size="sm">
          <Plus /> Add a watch
        </Button>
      </CardContent>
    </Card>
  )
}
