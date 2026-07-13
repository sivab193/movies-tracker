import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'

// TableFooter is the <tfoot>: a muted, medium-weight band under the rows. It is where
// the totals live — ticket + food spend for the month, or a season summary.
const MARCH = [
  { movie: 'Oppenheimer', theater: 'PVR ICON, Phoenix Mall', ticket: 320, food: 180 },
  { movie: 'RRR', theater: 'AGS Cinemas, OMR', ticket: 250, food: 0 },
  { movie: 'Guardians of the Galaxy Vol. 3', theater: 'INOX, Garuda Mall', ticket: 410, food: 240 },
]

export function SpendTotals() {
  const ticket = MARCH.reduce((sum, row) => sum + row.ticket, 0)
  const food = MARCH.reduce((sum, row) => sum + row.food, 0)
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead>Theater</TableHead>
            <TableHead className="text-right">Ticket</TableHead>
            <TableHead className="text-right">Snacks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MARCH.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-muted-foreground">{row.theater}</TableCell>
              <TableCell className="text-right tabular-nums">₹{row.ticket}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.food === 0 ? <span className="text-muted-foreground">—</span> : `₹${row.food}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>March 2024 · 3 screenings</TableCell>
            <TableCell className="text-right tabular-nums">₹{ticket}</TableCell>
            <TableCell className="text-right tabular-nums">₹{food}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

// A footer can also carry a derived stat rather than a sum.
export function AverageRow() {
  return (
    <div className="max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Logged</TableHead>
            <TableHead className="text-right">Title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">@arjun</TableCell>
            <TableCell className="text-right tabular-nums">128</TableCell>
            <TableCell className="text-right font-mono tabular-nums">4:37</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">@meera</TableCell>
            <TableCell className="text-right tabular-nums">96</TableCell>
            <TableCell className="text-right font-mono tabular-nums">5:02</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">@kavya</TableCell>
            <TableCell className="text-right tabular-nums">71</TableCell>
            <TableCell className="text-right font-mono tabular-nums">3:48</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Community average</TableCell>
            <TableCell className="text-right tabular-nums">98</TableCell>
            <TableCell className="text-right font-mono tabular-nums">4:29</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
