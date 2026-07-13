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

// TableCaption renders below the table (caption-bottom) in muted small text — use it
// for the "what am I looking at" line, not for a heading.
const HISTORY = [
  { movie: 'Oppenheimer', theater: 'PVR ICON, Phoenix Mall', date: '14 Mar 2024', cost: 320 },
  { movie: 'RRR', theater: 'AGS Cinemas, OMR', date: '02 Mar 2024', cost: 250 },
  { movie: 'Spider-Man: Across the Spider-Verse', theater: 'Rohini Silver Screens', date: '18 Feb 2024', cost: 190 },
]

export function WatchHistory() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableCaption>
          Every screening you have logged in 2024. Ticket prices are as entered, in INR.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead>Theater</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Ticket</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {HISTORY.map((row) => (
            <TableRow key={row.movie}>
              <TableCell className="font-medium">{row.movie}</TableCell>
              <TableCell className="text-muted-foreground">{row.theater}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.date}</TableCell>
              <TableCell className="text-right tabular-nums">₹{row.cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// The caption still sits last in the DOM order — under the footer row.
export function WithFooter() {
  return (
    <div className="max-w-md">
      <Table>
        <TableCaption>Averages across 130 verified submissions.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead className="text-right">Submissions</TableHead>
            <TableHead className="text-right">Avg. title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">RRR</TableCell>
            <TableCell className="text-right tabular-nums">63</TableCell>
            <TableCell className="text-right font-mono tabular-nums">8:18</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Oppenheimer</TableCell>
            <TableCell className="text-right tabular-nums">42</TableCell>
            <TableCell className="text-right font-mono tabular-nums">6:24</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Spider-Verse</TableCell>
            <TableCell className="text-right tabular-nums">17</TableCell>
            <TableCell className="text-right font-mono tabular-nums">2:02</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Overall</TableCell>
            <TableCell className="text-right tabular-nums">122</TableCell>
            <TableCell className="text-right font-mono tabular-nums">5:41</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
