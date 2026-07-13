import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'

// A watch-history table: what the app shows on /profile — one row per screening,
// with the ticket spend and the title-card time that was logged for it.
const HISTORY = [
  { movie: 'Oppenheimer', theater: 'PVR ICON, Phoenix Mall', date: '14 Mar 2024', cost: 320, titleCard: '6:24' },
  { movie: 'RRR', theater: 'AGS Cinemas, OMR', date: '02 Mar 2024', cost: 250, titleCard: '8:18' },
  { movie: 'Spider-Man: Across the Spider-Verse', theater: 'Rohini Silver Screens', date: '18 Feb 2024', cost: 190, titleCard: '2:02' },
  { movie: 'Guardians of the Galaxy Vol. 3', theater: 'INOX, Garuda Mall', date: '27 Jan 2024', cost: 410, titleCard: '4:11' },
]

export function WatchHistory() {
  const total = HISTORY.reduce((sum, row) => sum + row.cost, 0)
  return (
    <div className="max-w-2xl">
      <Table>
        <TableCaption>Your last 4 screenings, most recent first.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead>Theater</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Ticket</TableHead>
            <TableHead className="text-right">Title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {HISTORY.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-muted-foreground">{row.theater}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.date}</TableCell>
              <TableCell className="text-right tabular-nums">₹{row.cost}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.titleCard}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total spend</TableCell>
            <TableCell className="text-right tabular-nums">₹{total}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export function Leaderboard() {
  const rows = [
    { rank: 1, user: '@arjun', logged: 128, avg: '4:37' },
    { rank: 2, user: '@meera', logged: 96, avg: '5:02' },
    { rank: 3, user: '@kavya', logged: 71, avg: '3:48' },
    { rank: 4, user: '@nithya', logged: 54, avg: '6:10' },
  ]
  return (
    <div className="max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Movies logged</TableHead>
            <TableHead className="text-right">Avg. title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.user}>
              <TableCell className="tabular-nums text-muted-foreground">{row.rank}</TableCell>
              <TableCell className="font-medium">{row.user}</TableCell>
              <TableCell className="text-right tabular-nums">{row.logged}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.avg}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Empty() {
  return (
    <div className="max-w-2xl">
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
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              No screenings logged yet — add one to start tracking title cards.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
