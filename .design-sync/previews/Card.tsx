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
import { Clock, Star } from 'lucide-react'

export function Basic() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Oppenheimer</CardTitle>
        <CardDescription>2023 · 180 min · English</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          42 people have logged when the title card appears in this film.
        </p>
      </CardContent>
    </Card>
  )
}

export function WithFooter() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Title card timing</CardTitle>
        <CardDescription>Average across 42 submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <Clock className="size-5 text-primary" />
          <span className="text-3xl font-bold tabular-nums">6:24</span>
          <span className="text-sm text-muted-foreground">into the film</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Log your time</Button>
        <Button size="sm" variant="outline">
          View submissions
        </Button>
      </CardFooter>
    </Card>
  )
}

export function WithAction() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>RRR</CardTitle>
        <CardDescription>Telugu · 187 min</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Rate">
            <Star />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The longest wait for a title card in the top 100 — 8:18.
        </p>
      </CardContent>
    </Card>
  )
}

export function StatGrid() {
  const stats = [
    { label: 'Movies tracked', value: '128' },
    { label: 'Times logged', value: '1,204' },
    { label: 'Avg. title card', value: '4:37' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader>
            <CardDescription>{s.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
