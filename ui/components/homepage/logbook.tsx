import { BadgeCheck, Timer } from "lucide-react"
import { SectionHeading } from "@/components/homepage/section-heading"

type Stub = {
  format: string
  price: string
  title: string
  theater: string
  date: string
  seat: string
  stampLabel: string
  stampCode: string
  titleCard?: string
}

// TODO(homepage): demo placeholder stubs. Replace with the signed-in user's real
// watch history (or a curated public sample) before this ships as live content.
const STUBS: Stub[] = [
  {
    format: "IMAX Laser",
    price: "₹480",
    title: "Dune: Part Two",
    theater: "PVR ICON IMAX Laser",
    date: "Mar 1, 2024",
    seat: "Row H · Seat 18",
    stampLabel: "Ticket Reel",
    stampCode: "#0481-992-DX",
  },
  {
    format: "IMAX Laser",
    price: "$16.50",
    title: "Oppenheimer",
    theater: "GQT Eastside 10 IMAX",
    date: "Jul 21, 2023",
    seat: "Auditorium 4 · C12",
    stampLabel: "Optical Stamp",
    stampCode: "#IMAX-00193",
    titleCard: "00:03:42",
  },
  {
    format: "Dolby Atmos",
    price: "₹250",
    title: "Leo",
    theater: "Rohini Silver Screens",
    date: "Oct 19, 2023",
    seat: "Screen 1 · Box 04",
    stampLabel: "DCP Authentic",
    stampCode: "#ROH-2023-99",
  },
]

const BARCODE_WIDTHS = [3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3]

function Barcode() {
  return (
    <div className="flex h-8 items-stretch gap-[2px]" aria-hidden="true">
      {BARCODE_WIDTHS.map((width, index) => (
        <span key={index} className="bg-foreground" style={{ width }} />
      ))}
    </div>
  )
}

/** Act 3, the Logbook. A sideways ticket-stub rail ending on the public profile card. */
export function Logbook() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="Logbook">
      <SectionHeading
        chip="Log"
        label="Archive Stubs"
        title="Your watches are a collection, not a list."
        description="Dates, theaters, formats, stubs, costs. Every cinema memory in one place."
      />

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STUBS.map((stub) => (
          <article
            key={stub.title}
            className="flex w-[275px] shrink-0 snap-start flex-col border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="bg-primary px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                {stub.format}
              </span>
              <span className="text-xl font-bold text-primary">{stub.price}</span>
            </div>
            <h3 className="mt-4 text-2xl font-bold uppercase leading-tight tracking-tight">
              {stub.title}
            </h3>
            <p className="mt-1 text-muted-foreground">{stub.theater}</p>
            {stub.titleCard ? (
              <p className="mt-3 flex items-center gap-2 border border-border px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <Timer className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                TitleCard at {stub.titleCard}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>{stub.date}</span>
              <span className="text-right">{stub.seat}</span>
            </div>
            <div className="relative my-4 border-t border-dashed border-border" aria-hidden="true" />
            <div className="mt-auto flex items-end justify-between gap-2">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <p>{stub.stampLabel}</p>
                <p className="mt-0.5 text-foreground">{stub.stampCode}</p>
              </div>
              <Barcode />
            </div>
          </article>
        ))}

        <article className="flex w-[275px] shrink-0 snap-start flex-col bg-primary p-5 text-primary-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]">
              Public Profile
            </span>
            <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          </div>
          <p className="mt-6 text-3xl font-bold uppercase tracking-tight">u/siv</p>
          <p className="mt-2 text-lg font-medium">46 films, 83 hours logged</p>
          <div className="my-5 border-t border-primary-foreground/30" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
            Format Chaser
          </p>
          <p className="mt-2 text-xl font-bold uppercase leading-snug">
            IMAX ×5 · Dolby · ScreenX · EPIQ
          </p>
        </article>
      </div>
    </section>
  )
}
