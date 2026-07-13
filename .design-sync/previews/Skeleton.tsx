import { Card, CardContent, CardHeader, Skeleton } from 'movies-tracker'

// Skeleton is a pulsing grey block — meaningless alone, so each story is a real loading
// state: the movie grid while it fetches, the stats row on the dashboard, and the watch
// history list.

export function MovieGridLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="overflow-hidden py-0">
          <Skeleton className="aspect-[2/3] w-full rounded-none" />
          <CardContent className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatsRowLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function WatchHistoryLoading() {
  return (
    <Card className="max-w-sm">
      <CardHeader className="gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-16 w-11 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-10 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function TextBlockLoading() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-2 h-9 w-32 rounded-md" />
    </div>
  )
}
