import { Tabs, TabsContent, TabsList, TabsTrigger } from 'movies-tracker'
import { Clock, Film, Wallet } from 'lucide-react'

// TabsList is the muted pill rail that holds the triggers. By default it is `w-fit`
// and hugs its triggers.
export function Fit() {
  return (
    <Tabs defaultValue="overview" className="max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
        <TabsTrigger value="history">Watch history</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4">
        <p className="text-sm text-muted-foreground">
          Oppenheimer · 42 submissions · average title card at 6:24.
        </p>
      </TabsContent>
      <TabsContent value="submissions" className="pt-4">
        <p className="text-sm text-muted-foreground">42 logged times, from 2:02 to 8:18.</p>
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        <p className="text-sm text-muted-foreground">One screening, PVR ICON, March 2024.</p>
      </TabsContent>
    </Tabs>
  )
}

// Stretch the rail with `w-full` when it is the primary navigation of a mobile screen —
// the triggers are already `flex-1`, so they split the width evenly.
export function FullWidth() {
  return (
    <Tabs defaultValue="spend" className="max-w-md">
      <TabsList className="w-full">
        <TabsTrigger value="movies">
          <Film /> Movies
        </TabsTrigger>
        <TabsTrigger value="spend">
          <Wallet /> Spend
        </TabsTrigger>
        <TabsTrigger value="timing">
          <Clock /> Timing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="movies" className="pt-4">
        <p className="text-sm text-muted-foreground">128 films watched in theaters.</p>
      </TabsContent>
      <TabsContent value="spend" className="pt-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Spent on tickets in 2024</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">₹14,280</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Across 38 screenings — ₹376 a visit, snacks not counted.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="timing" className="pt-4">
        <p className="text-sm text-muted-foreground">Your average title card lands at 4:37.</p>
      </TabsContent>
    </Tabs>
  )
}
