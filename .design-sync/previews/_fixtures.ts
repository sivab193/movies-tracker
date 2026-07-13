// Shared sample data for the preview cards.
//
// Not a component preview — the converter only compiles `<ComponentName>.tsx`, so this
// `.ts` file is just a module the previews import.
//
// The shape mirrors lib/types.ts (Movie, WatchHistoryEntry). Content is realistic on
// purpose: these cards are browsed by humans and imitated by the design agent, so
// `title: "foo"` would teach it to build screens full of placeholder junk.

export type Movie = {
  id: string
  imdbId: string
  title: string
  year: number
  posterUrl: string
  imdbRating: number | null
  runtime: string | null
  createdAt: Date
  submissionCount: number
  averageTimeSeconds: number | null
  language?: string
  released?: string
  releaseDate?: string
}

// Posters are inline SVG data URIs: a preview must never depend on the network, and a
// broken <img> would read as a broken component. Each is a plausible poster-ish gradient.
const poster = (from: string, to: string, label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
      </linearGradient></defs>
      <rect width="400" height="600" fill="url(#g)"/>
      <text x="200" y="310" font-family="Inter,sans-serif" font-size="34" font-weight="700"
        fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text>
    </svg>`.replace(/\s+/g, ' '),
  )

export const MOVIES: Movie[] = [
  {
    id: '1',
    imdbId: 'tt15398776',
    title: 'Oppenheimer',
    year: 2023,
    posterUrl: poster('#1c1917', '#7c2d12', 'OPPENHEIMER'),
    imdbRating: 8.3,
    runtime: '180 min',
    createdAt: new Date('2024-01-12'),
    submissionCount: 42,
    averageTimeSeconds: 384,
    language: 'English',
    released: '21 Jul 2023',
  },
  {
    id: '2',
    imdbId: 'tt9362722',
    title: 'Spider-Man: Across the Spider-Verse',
    year: 2023,
    posterUrl: poster('#4c1d95', '#be185d', 'SPIDER-VERSE'),
    imdbRating: 8.6,
    runtime: '140 min',
    createdAt: new Date('2024-02-02'),
    submissionCount: 17,
    averageTimeSeconds: 122,
    language: 'English',
    released: '02 Jun 2023',
  },
  {
    id: '3',
    imdbId: 'tt6791350',
    title: 'Guardians of the Galaxy Vol. 3',
    year: 2023,
    posterUrl: poster('#065f46', '#0f766e', 'GOTG VOL. 3'),
    imdbRating: 7.9,
    runtime: '150 min',
    createdAt: new Date('2024-02-20'),
    submissionCount: 8,
    averageTimeSeconds: 251,
    language: 'English',
    released: '05 May 2023',
  },
  {
    // The "not reported yet" branch — MovieCard renders a distinctly different
    // (muted, italic) title-card banner when no one has logged a time.
    id: '4',
    imdbId: 'tt1517268',
    title: 'Barbie',
    year: 2023,
    posterUrl: poster('#db2777', '#f472b6', 'BARBIE'),
    imdbRating: 6.8,
    runtime: '114 min',
    createdAt: new Date('2024-03-01'),
    submissionCount: 0,
    averageTimeSeconds: null,
    language: 'English',
    released: '21 Jul 2023',
  },
  {
    id: '5',
    imdbId: 'tt8178634',
    title: 'RRR',
    year: 2022,
    posterUrl: poster('#7f1d1d', '#b45309', 'RRR'),
    imdbRating: 7.8,
    runtime: '187 min',
    createdAt: new Date('2024-03-11'),
    submissionCount: 63,
    averageTimeSeconds: 498,
    language: 'Telugu, Hindi',
    released: '25 Mar 2022',
  },
]

export const MOVIE = MOVIES[0]
export const MOVIE_UNREPORTED = MOVIES[3]

export const WATCH_ENTRY = {
  _id: 'w1',
  uid: 'demo-user',
  movieId: '1',
  movieTitle: 'Oppenheimer',
  moviePosterUrl: MOVIES[0].posterUrl,
  theaterId: 't1',
  theaterName: 'PVR ICON',
  theaterLocation: 'Phoenix Mall, Chennai',
  theaterGmapsLink: null,
  timestamp: '2024-03-14T00:00:00.000Z',
  showTime: '7:30 PM',
  ticketCost: 320,
  foodCost: 180,
  currency: 'INR' as const,
  ticketStubUrl: null,
  createdAt: '2024-03-14T10:00:00.000Z',
}
