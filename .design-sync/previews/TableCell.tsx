import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'
import { Clock } from 'lucide-react'
import { MOVIES } from './_fixtures'

// TableCell is the <td>. It takes whatever you put in it — plain text, right-aligned
// numerics, or a poster thumbnail stacked with a subtitle.
const TIMES: Record<string, string> = {
  Oppenheimer: '6:24',
  'Spider-Man: Across the Spider-Verse': '2:02',
  'Guardians of the Galaxy Vol. 3': '4:11',
  Barbie: 'Not reported',
  RRR: '8:18',
}

export function RichCells() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead className="text-right">Submissions</TableHead>
            <TableHead className="text-right">Avg. title card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOVIES.map((movie) => (
            <TableRow key={movie.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={movie.posterUrl}
                    alt=""
                    className="h-12 w-8 rounded-sm object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{movie.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {movie.year} · {movie.runtime}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{movie.submissionCount}</TableCell>
              <TableCell className="text-right">
                {movie.averageTimeSeconds === null ? (
                  <span className="text-muted-foreground italic">Not reported</span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="size-3 text-primary" />
                    {TIMES[movie.title]}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// colSpan: one cell carrying the whole width for an empty / error state.
export function Spanning() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Movie</TableHead>
            <TableHead>Theater</TableHead>
            <TableHead className="text-right">Ticket</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Oppenheimer</TableCell>
            <TableCell className="text-muted-foreground">PVR ICON, Phoenix Mall</TableCell>
            <TableCell className="text-right tabular-nums">₹320</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
              Couldn't load the rest of your history. Retry?
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
