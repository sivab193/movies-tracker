import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'movies-tracker'

const TABS = (
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="history">Watch history</TabsTrigger>
    <TabsTrigger value="stats">Stats</TabsTrigger>
  </TabsList>
)

// Only the panel matching the selected value is mounted — the other two render nothing.
// Here the third panel is selected, so its content is what you see.
export function StatsPanel() {
  const stats = [
    { label: 'Movies tracked', value: '128' },
    { label: 'Times logged', value: '1,204' },
    { label: 'Avg. title card', value: '4:37' },
  ]
  return (
    <Tabs defaultValue="stats" className="max-w-2xl">
      {TABS}
      <TabsContent value="overview" className="pt-4">
        <p className="text-sm text-muted-foreground">Overview panel.</p>
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        <p className="text-sm text-muted-foreground">Watch-history panel.</p>
      </TabsContent>
      <TabsContent value="stats" className="pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

// A panel can hold a whole table. The content region is `flex-1`, so it fills whatever
// height the tab surface is given.
export function HistoryPanel() {
  const rows = [
    { movie: 'Oppenheimer', theater: 'PVR ICON, Phoenix Mall', cost: 320, titleCard: '6:24' },
    { movie: 'RRR', theater: 'AGS Cinemas, OMR', cost: 250, titleCard: '8:18' },
    { movie: 'Guardians of the Galaxy Vol. 3', theater: 'INOX, Garuda Mall', cost: 410, titleCard: '4:11' },
  ]
  return (
    <Tabs defaultValue="history" className="max-w-2xl">
      {TABS}
      <TabsContent value="overview" className="pt-4">
        <p className="text-sm text-muted-foreground">Overview panel.</p>
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Movie</TableHead>
              <TableHead>Theater</TableHead>
              <TableHead className="text-right">Ticket</TableHead>
              <TableHead className="text-right">Title card</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.movie}>
                <TableCell className="font-medium">{row.movie}</TableCell>
                <TableCell className="text-muted-foreground">{row.theater}</TableCell>
                <TableCell className="text-right tabular-nums">₹{row.cost}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{row.titleCard}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="stats" className="pt-4">
        <p className="text-sm text-muted-foreground">Stats panel.</p>
      </TabsContent>
    </Tabs>
  )
}
