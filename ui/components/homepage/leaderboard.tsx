"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/homepage/section-heading"

type LeaderRow = {
  rank: number
  handle: string
  watches: number
  seconds: number
  hours: string
  ticks: boolean
}

// TODO(homepage): rows other than @siv are demo placeholders. Wire this section to
// the real /leaderboard data. @siv's numbers are real: 299,580s, 46 watches, 83h 13m.
const ROWS: LeaderRow[] = [
  { rank: 1, handle: "@cinemaphile_in", watches: 182, seconds: 1284920, hours: "~356h 55m", ticks: true },
  { rank: 2, handle: "@siv", watches: 46, seconds: 299580, hours: "83h 13m", ticks: true },
  { rank: 3, handle: "@karthik_cuts", watches: 39, seconds: 245160, hours: "~68h 06m", ticks: false },
  { rank: 4, handle: "@format_chaser", watches: 28, seconds: 192440, hours: "~53h 27m", ticks: false },
]

/** Act 4, the Leaderboard. Seconds tick live, one per second. */
export function Leaderboard() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="Leaderboard">
      <SectionHeading
        chip="Rank"
        label="Chrono-Standings"
        title="Ranked by seconds, not vibes."
        description="Real-time rankings calculated from exact runtime seconds. An hour of Oppenheimer outranks an hour of anything shorter. Because it is."
      />

      <ol className="flex flex-col gap-3">
        {ROWS.map((row) => (
          <li
            key={row.handle}
            className="flex items-center gap-4 border border-border bg-card p-4 sm:p-5"
          >
            <span
              className={cn(
                "w-10 shrink-0 text-2xl font-bold sm:text-3xl",
                row.rank === 1 ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={`Rank ${row.rank}`}
            >
              #{row.rank}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-bold sm:text-xl">{row.handle}</span>
              <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {row.watches} watches logged
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-base font-bold tabular-nums sm:text-lg">
                {(row.seconds + (row.ticks ? elapsed : 0)).toLocaleString()}s
              </span>
              <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {row.hours}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          View the full leaderboard
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
