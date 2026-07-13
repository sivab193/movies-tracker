import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'movies-tracker'
import { MapPin, Ticket } from 'lucide-react'

// CardDescription is the muted sub-line of a CardHeader — it has no standalone render,
// so every story is a full Card. The axis here is what the description is used *for*:
// a subtitle, an eyebrow label above a stat, and a two-line supporting paragraph.

export function TheaterCard() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>PVR ICON</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="size-4" />
          Phoenix Mall, Chennai
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm">
          <Ticket className="size-4 text-primary" />
          <span className="font-medium tabular-nums">₹320</span>
          <span className="text-muted-foreground">average ticket · 9 visits</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" className="w-full">
          View watch history
        </Button>
      </CardFooter>
    </Card>
  )
}

export function AsStatLabel() {
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

export function SupportingParagraph() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Join the leaderboard</CardTitle>
        <CardDescription>
          Your display name and total movie count become public. Your watch history and
          ticket costs stay private unless you share them.
        </CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <Button size="sm">Join</Button>
        <Button size="sm" variant="ghost">
          Not now
        </Button>
      </CardFooter>
    </Card>
  )
}
