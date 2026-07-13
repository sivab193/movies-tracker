import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'movies-tracker'
import { Clock, Film } from 'lucide-react'

// CardTitle is the semantic heading slot of a Card (`leading-none font-semibold`), so it
// is only meaningful inside one. Each story is a real Card, varied by what the title
// carries: a film name, a big numeric stat, a long wrapping title.

export function FilmTitle() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>RRR</CardTitle>
        <CardDescription>2022 · 187 min · Telugu, Hindi</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          63 people have logged this film's title card — the most of any title in the
          Telugu catalogue.
        </p>
      </CardContent>
    </Card>
  )
}

export function StatTitle() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Clock className="size-4" />
          Average title card time
        </CardDescription>
        <CardTitle className="text-4xl font-bold tabular-nums">8:18</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Across 63 submissions · ±11s spread
        </p>
      </CardContent>
    </Card>
  )
}

export function LongTitle() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg leading-snug">
          Spider-Man: Across the Spider-Verse
        </CardTitle>
        <CardDescription>2023 · 140 min · Animation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">2:02</span>
          <span className="text-sm text-muted-foreground">
            the fastest title card in the top 20
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" className="w-full">
          <Film /> View submissions
        </Button>
      </CardFooter>
    </Card>
  )
}
