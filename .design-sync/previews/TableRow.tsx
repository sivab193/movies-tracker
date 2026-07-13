import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'

// TableRow is the <tr>: bottom border, hover tint, and a `data-state="selected"`
// styling hook. Shown in the moderation queue where rows get picked in bulk.
const QUEUE = [
  { user: '@arjun', movie: 'Oppenheimer', time: '6:24', selected: false },
  { user: '@meera', movie: 'RRR', time: '8:18', selected: true },
  { user: '@kavya', movie: 'Spider-Man: Across the Spider-Verse', time: '2:02', selected: false },
  { user: '@dev', movie: 'Guardians of the Galaxy Vol. 3', time: '4:11', selected: false },
]

export function Selectable() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox aria-label="Select all submissions" />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Movie</TableHead>
            <TableHead className="text-right">Title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {QUEUE.map((row) => (
            <TableRow key={row.user} data-state={row.selected ? 'selected' : undefined}>
              <TableCell>
                <Checkbox checked={row.selected} aria-label={`Select ${row.user}`} />
              </TableCell>
              <TableCell className="font-medium">{row.user}</TableCell>
              <TableCell className="text-muted-foreground">{row.movie}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// A single-column layout of label/value rows — the "details" pattern the movie page
// uses under the poster.
export function DetailRows() {
  const details = [
    ['Released', '21 Jul 2023'],
    ['Runtime', '180 min'],
    ['Language', 'English'],
    ['IMDb', '8.3'],
    ['Submissions', '42'],
    ['Avg. title card', '6:24'],
  ]
  return (
    <div className="max-w-md">
      <Table>
        <TableBody>
          {details.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell className="text-muted-foreground">{label}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
