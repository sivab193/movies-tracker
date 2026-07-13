import { Card, CardContent, CardDescription, CardHeader, CardTitle, SubmissionForm } from 'movies-tracker'
import { Clock } from 'lucide-react'
import { MOVIE } from './_fixtures'

// The product's signature interaction: you watched the film, you noticed the
// title card at 6:24, you log it. `runtimeMinutes` bounds the input — a time
// past the end of the film is rejected before it's ever sent.
export function Default() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Oppenheimer</CardTitle>
        <CardDescription>2023 · 180 min · 42 times logged so far</CardDescription>
      </CardHeader>
      <CardContent>
        <SubmissionForm movieId={MOVIE.id} runtimeMinutes={180} onSubmitted={() => {}} />
      </CardContent>
    </Card>
  )
}

// The bare form, uncarded — the Submit button stays disabled until a time is
// typed, which is the state it opens in.
export function Standalone() {
  return (
    <div className="mx-auto max-w-md">
      <SubmissionForm movieId={MOVIE.id} runtimeMinutes={180} onSubmitted={() => {}} />
    </div>
  )
}

// On the movie detail page: the running average sits beside the form that feeds
// it, so you can see what you're agreeing (or disagreeing) with as you type.
export function OnAMovieDetailPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <img
          src={MOVIE.posterUrl}
          alt=""
          className="w-40 rounded-lg border border-border object-cover"
        />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Oppenheimer</h2>
          <p className="text-sm text-muted-foreground">2023 · 180 min · English</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <span className="text-2xl font-bold tabular-nums">6:24</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            42 logs
          </span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add your time</CardTitle>
          <CardDescription>Within a few seconds is close enough.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionForm movieId={MOVIE.id} runtimeMinutes={180} onSubmitted={() => {}} />
        </CardContent>
      </Card>
    </div>
  )
}
