import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'
import { ArrowDown, ArrowUpDown } from 'lucide-react'

// TableHeader is the <thead>: it carries the column labels and the bottom border
// that separates them from the rows. Shown inside a complete watch-history table.
const HISTORY = [
  { movie: 'Oppenheimer', theater: 'PVR ICON, Phoenix Mall', date: '14 Mar 2024', titleCard: '6:24' },
  { movie: 'RRR', theater: 'AGS Cinemas, OMR', date: '02 Mar 2024', titleCard: '8:18' },
  { movie: 'Spider-Man: Across the Spider-Verse', theater: 'Rohini Silver Screens', date: '18 Feb 2024', titleCard: '2:02' },
]

export function WatchHistory() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead>Theater</TableHead>
            <TableHead>Watched</TableHead>
            <TableHead className="text-right">Title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {HISTORY.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-muted-foreground">{row.theater}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.date}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.titleCard}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Sortable columns: the header cells own the sort affordance, so the sort icon
// belongs in TableHeader rather than in the body.
export function Sortable() {
  const rows = [
    { movie: 'RRR', submissions: 63, avg: '8:18' },
    { movie: 'Oppenheimer', submissions: 42, avg: '6:24' },
    { movie: 'Spider-Man: Across the Spider-Verse', submissions: 17, avg: '2:02' },
    { movie: 'Guardians of the Galaxy Vol. 3', submissions: 8, avg: '4:11' },
  ]
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Movie <ArrowUpDown className="size-3 opacity-50" />
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1 text-foreground">
                Submissions <ArrowDown className="size-3" />
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1">
                Avg. title card <ArrowUpDown className="size-3 opacity-50" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-right tabular-nums">{row.submissions}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.avg}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
