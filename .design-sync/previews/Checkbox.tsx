import { Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Label } from 'movies-tracker'
import { MOVIES } from './_fixtures'

// A bare Checkbox is a 16px square, so every story pairs it with a Label in the layout
// the app actually uses it in: the Settings page's "what's public" and "hide movies"
// lists.

export function PublicFields() {
  const fields = [
    { id: 'movieCount', label: 'Total movies count', checked: true },
    { id: 'totalRuntime', label: 'Total runtime watched', checked: true },
    { id: 'moviesList', label: 'Detailed movie list', checked: false },
  ]
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Public profile</CardTitle>
        <CardDescription>Choose what visitors can see on /u/siv19</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center gap-3">
            <Checkbox id={f.id} defaultChecked={f.checked} />
            <Label htmlFor={f.id}>{f.label}</Label>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function HiddenMovies() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Hide from profile</CardTitle>
        <CardDescription>Checked films stay off your public watch history</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {MOVIES.slice(0, 4).map((m, i) => (
          <div key={m.id} className="flex items-center gap-3">
            <Checkbox id={`hide-${m.id}`} defaultChecked={i === 1 || i === 3} />
            <Label htmlFor={`hide-${m.id}`} className="flex-1 justify-between">
              <span className="truncate">{m.title}</span>
              <span className="text-xs font-normal text-muted-foreground">{m.year}</span>
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function States() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id="st-unchecked" />
        <Label htmlFor="st-unchecked">Unchecked — show ticket costs</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="st-checked" defaultChecked />
        <Label htmlFor="st-checked">Checked — join the leaderboard</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="st-disabled" disabled />
        <Label htmlFor="st-disabled">Disabled — admin tools (request pending)</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="st-disabled-checked" defaultChecked disabled />
        <Label htmlFor="st-disabled-checked">Disabled &amp; checked — email verified</Label>
      </div>
    </div>
  )
}
