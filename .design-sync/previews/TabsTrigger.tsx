import { Tabs, TabsContent, TabsList, TabsTrigger } from 'movies-tracker'
import { Clock, ListOrdered, MapPin } from 'lucide-react'

// TabsTrigger: the active one lifts onto the background with a shadow, the rest sit flat
// on the muted rail. Icons are sized automatically.
export function WithIcons() {
  return (
    <Tabs defaultValue="times" className="max-w-2xl">
      <TabsList>
        <TabsTrigger value="times">
          <Clock /> Title card times
        </TabsTrigger>
        <TabsTrigger value="theaters">
          <MapPin /> Theaters
        </TabsTrigger>
        <TabsTrigger value="leaderboard">
          <ListOrdered /> Leaderboard
        </TabsTrigger>
      </TabsList>
      <TabsContent value="times" className="pt-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Average across 42 submissions</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">6:24</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Earliest reported 6:19, latest 6:31 — the crowd agrees on this one.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="theaters" className="pt-4">
        <p className="text-sm text-muted-foreground">PVR ICON, AGS Cinemas, Rohini Silver Screens.</p>
      </TabsContent>
      <TabsContent value="leaderboard" className="pt-4">
        <p className="text-sm text-muted-foreground">@arjun leads with 128 films logged.</p>
      </TabsContent>
    </Tabs>
  )
}

// A trigger with nothing behind it yet: Barbie has no submissions, so the panel is
// disabled rather than empty.
export function DisabledTrigger() {
  return (
    <Tabs defaultValue="overview" className="max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="submissions" disabled>
          Submissions
        </TabsTrigger>
        <TabsTrigger value="history" disabled>
          Watch history
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4">
        <p className="text-sm">
          <span className="font-medium">Barbie</span>{' '}
          <span className="text-muted-foreground">· 2023 · 114 min · English</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground italic">
          Title card not reported yet — be the first to log it.
        </p>
      </TabsContent>
      <TabsContent value="submissions" className="pt-4" />
      <TabsContent value="history" className="pt-4" />
    </Tabs>
  )
}
