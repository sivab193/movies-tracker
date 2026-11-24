import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/homepage/section-heading"

type Cut = {
  title: string
  tag: string
  tagClassName?: string
  description: string
  href: string
}

const CUTS: Cut[] = [
  {
    title: "AMC Showtimes",
    tag: "Live API",
    tagClassName: "text-primary",
    description:
      "Real AMC screenings, live from the AMC API. Search by distance, format, and language, then pick your screen.",
    href: "/showtimes",
  },
  {
    title: "TitleCard Timer",
    tag: "00:03:42",
    // TODO(homepage): the 00:03:42 tag is a demo placeholder, not a real timing.
    description: "Know the exact second the title card lands. Community-timed, frame-precise.",
    href: "/timer",
  },
  {
    title: "Theater Pages",
    tag: "Every format",
    description: "Every screen, every format, every seat, compared per theater, with booking links.",
    href: "/theaters",
  },
  {
    title: "Curated Watch Orders",
    tag: "Community run",
    description:
      "Community-built sequences that mix movies and series into one perfect viewing order.",
    href: "/watch-orders",
  },
  {
    title: "Series Tracking",
    tag: "Multi-platform",
    description: "Seasons, episodes, and total time, across every streaming platform.",
    href: "/series",
  },
  {
    title: "Cards & Offers Hub",
    tag: "BOGO / Cashback",
    description: "Log which card you paid with; see what the movies actually cost you.",
    href: "/cards",
  },
  {
    title: "MediaVerse Wrapped",
    tag: "Dec 2026",
    description: "Every December, your year in cinema, as a shareable card. (Coming Dec 2026)",
    href: "/roadmap",
  },
  {
    title: "Hosted AI MCP Server",
    tag: "Dev Alpha",
    description:
      "Ask ChatGPT, Claude, or Gemini about your own watch history, in plain language. (In development)",
    href: "/roadmap",
  },
  {
    title: "Movie Marathon Planner",
    tag: "Roadmap",
    description:
      "Back-to-back sessions planned on real showtimes, runtimes, and the drive between cinemas. (Planned)",
    href: "/roadmap",
  },
]

/** Act 6, the montage cutlist. One row per feature, AMC Showtimes first. */
export function Montage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="More features">
      <SectionHeading
        chip="Cutlist"
        label="Projector Matrix"
        title="The rest of the house."
        description="Precision tools calibrated for people who notice screen gain, title card beats, and sound mix decibels."
      />

      <div>
        {CUTS.map((cut) => (
          <Link
            key={cut.title}
            href={cut.href}
            className="group grid grid-cols-[1fr_auto] items-center gap-4 border-t border-border py-6 transition-colors last:border-b hover:bg-muted/30"
          >
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-xl font-bold uppercase tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                  {cut.title}
                </h3>
                <span
                  className={cn(
                    "font-mono text-xs uppercase tracking-widest text-muted-foreground",
                    cut.tagClassName
                  )}
                >
                  {cut.tag}
                </span>
              </div>
              <p className="mt-2 leading-7 text-muted-foreground text-pretty">{cut.description}</p>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
