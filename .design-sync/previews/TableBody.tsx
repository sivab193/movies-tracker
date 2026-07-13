import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'movies-tracker'

// TableBody is the <tbody>: it holds the data rows and drops the border on the
// last one. Every state below is the same table with a different body.
const SUBMISSIONS = [
  { user: '@arjun', time: '6:24', theater: 'PVR ICON, Phoenix Mall', when: '14 Mar 2024' },
  { user: '@meera', time: '6:22', theater: 'AGS Cinemas, OMR', when: '11 Mar 2024' },
  { user: '@kavya', time: '6:25', theater: 'Rohini Silver Screens', when: '09 Mar 2024' },
  { user: '@nithya', time: '6:24', theater: 'INOX, Garuda Mall', when: '02 Mar 2024' },
  { user: '@dev', time: '6:31', theater: 'PVR, Forum Mall', when: '28 Feb 2024' },
]

function Head() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>User</TableHead>
        <TableHead>Theater</TableHead>
        <TableHead>Submitted</TableHead>
        <TableHead className="text-right">Title card</TableHead>
      </TableRow>
    </TableHeader>
  )
}

export function Submissions() {
  return (
    <div className="max-w-2xl">
      <Table>
        <Head />
        <TableBody>
          {SUBMISSIONS.map((row) => (
            <TableRow key={row.user}>
              <TableCell className="font-medium">{row.user}</TableCell>
              <TableCell className="text-muted-foreground">{row.theater}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.when}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Loading() {
  return (
    <div className="max-w-2xl">
      <Table>
        <Head />
        <TableBody>
          {[0, 1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Skeleton className="h-4 w-10" />
                </div>
              </TableCell>
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
        <Head />
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              Nobody has logged a title card for Barbie yet. Be the first.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
