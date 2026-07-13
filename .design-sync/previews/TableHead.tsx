import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'
import { ChevronDown } from 'lucide-react'

// TableHead is the <th>: muted, medium-weight, left-aligned by default. Right-align it
// for numeric columns so the digits line up with the cells below.
const HISTORY = [
  { movie: 'Oppenheimer', theater: 'PVR ICON, Phoenix Mall', cost: 320, titleCard: '6:24' },
  { movie: 'RRR', theater: 'AGS Cinemas, OMR', cost: 250, titleCard: '8:18' },
  { movie: 'Guardians of the Galaxy Vol. 3', theater: 'INOX, Garuda Mall', cost: 410, titleCard: '4:11' },
]

export function Alignment() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-64">Movie</TableHead>
            <TableHead>Theater</TableHead>
            <TableHead className="text-right">Ticket</TableHead>
            <TableHead className="text-right">Title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {HISTORY.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-muted-foreground">{row.theater}</TableCell>
              <TableCell className="text-right tabular-nums">₹{row.cost}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.titleCard}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// The active sort column reads at full contrast; the rest stay muted.
export function SortedColumn() {
  const rows = [
    { movie: 'RRR', submissions: 63 },
    { movie: 'Oppenheimer', submissions: 42 },
    { movie: 'Spider-Man: Across the Spider-Verse', submissions: 17 },
    { movie: 'Guardians of the Galaxy Vol. 3', submissions: 8 },
  ]
  return (
    <div className="max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead className="text-right text-foreground">
              <span className="inline-flex items-center gap-1">
                Submissions <ChevronDown className="size-3" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-right tabular-nums">{row.submissions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
