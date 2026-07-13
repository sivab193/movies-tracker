import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'movies-tracker'
import { Clock, Star, Users } from 'lucide-react'

// CardHeader renders nothing on its own — it is the top grid row of a Card, and it
// only reveals its `has-data-[slot=card-action]` two-column behaviour and its
// `[.border-b]:pb-6` rule inside one. So each story is a whole, real Card.

export function MovieSummary() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Oppenheimer</CardTitle>
        <CardDescription>2023 · 180 min · English</CardDescription>
        <CardAction>
          <span className="flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 text-primary" />
            8.3
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <Clock className="size-4 text-primary" />
          <span className="text-2xl font-bold tabular-nums">6:24</span>
          <span className="text-sm text-muted-foreground">title card appears</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function WithSeparatedHeader() {
  return (
    <Card className="max-w-sm">
      <CardHeader className="border-b">
        <CardTitle>Recent submissions</CardTitle>
        <CardDescription>Guardians of the Galaxy Vol. 3</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {[
          { user: 'arjun_r', time: '4:11' },
          { user: 'meera.k', time: '4:09' },
          { user: 'nikhil', time: '4:14' },
        ].map((s) => (
          <div key={s.user} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{s.user}</span>
            <span className="font-medium tabular-nums">{s.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function HeaderOnlyStats() {
  const stats = [
    { label: 'Submissions', value: '42', icon: Users },
    { label: 'Avg. title card', value: '6:24', icon: Clock },
    { label: 'IMDb rating', value: '8.3', icon: Star },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <s.icon className="size-4" />
              {s.label}
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function HeaderWithFooter() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Barbie</CardTitle>
        <CardDescription>No title card time logged yet</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm" className="w-full">
          Be the first to log it
        </Button>
      </CardFooter>
    </Card>
  )
}
