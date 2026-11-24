import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type HeroProps = {
  isSignedIn: boolean
}

/** Act 1, the Lobby. Full-bleed auditorium image with the leaderboard pitch. */
export function Hero({ isSignedIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden" aria-label="MediaVerse introduction">
      <div className="relative h-[85svh] max-h-[640px] min-h-[540px] w-full">
        <Image
          src="/homepage/hero-auditorium.jpg"
          alt="Dark cinema auditorium, rows of seats facing a glowing blank screen"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/85" />
        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-between px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Archival Reel
            </span>
            <span className="bg-black/60 px-3 py-1 font-mono text-xs uppercase tracking-widest text-white">
              IMAX · Dolby · ScreenX
            </span>
          </div>
          <div className="max-w-2xl animate-fade-in">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-white/70">
              A leaderboard for movie lovers
            </p>
            <h1 className="mt-4 text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl">
              The screen is the movie.
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/85">
              Track every watch. Compare every screen. Climb the leaderboard.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="rounded-none px-8 text-base font-bold uppercase tracking-wide">
                <Link href={isSignedIn ? "/watch-history" : "/auth"}>
                  Log your first watch
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
