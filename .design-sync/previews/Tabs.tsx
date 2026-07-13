import {
  Button,
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
import { Clock, Star, Users } from 'lucide-react'

// The movie detail page: everything about one film, split across three panels.
export function MovieDetail() {
  return (
    <Tabs defaultValue="overview" className="max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
        <TabsTrigger value="history">Watch history</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 text-primary" /> Avg. title card
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">6:24</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4 text-primary" /> Submissions
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">42</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="size-4 text-primary" /> IMDb
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">8.3</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Oppenheimer (2023) · 180 min · English. The title card lands just over six minutes
          in, after the Trinity cold open.
        </p>
      </TabsContent>
      <TabsContent value="submissions" className="pt-4">
        <p className="text-sm text-muted-foreground">42 people have logged this film.</p>
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        <p className="text-sm text-muted-foreground">You watched this once, in March 2024.</p>
      </TabsContent>
    </Tabs>
  )
}

// Same surface, second panel selected — a table of what people reported.
export function SubmissionsSelected() {
  const rows = [
    { user: '@arjun', time: '6:24', when: '14 Mar 2024' },
    { user: '@meera', time: '6:22', when: '11 Mar 2024' },
    { user: '@kavya', time: '6:25', when: '09 Mar 2024' },
  ]
  return (
    <Tabs defaultValue="submissions" className="max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
        <TabsTrigger value="history">Watch history</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4">
        <p className="text-sm text-muted-foreground">Oppenheimer (2023) · 180 min.</p>
      </TabsContent>
      <TabsContent value="submissions" className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Title card</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.user}>
                <TableCell className="font-medium">{row.user}</TableCell>
                <TableCell className="text-muted-foreground">{row.when}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button size="sm" className="mt-4">
          Log your time
        </Button>
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        <p className="text-sm text-muted-foreground">You watched this once, in March 2024.</p>
      </TabsContent>
    </Tabs>
  )
}
