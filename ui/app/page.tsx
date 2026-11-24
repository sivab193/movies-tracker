"use client"

import { Header } from "@/components/header"
import { Close } from "@/components/homepage/close"
import { FormatLab } from "@/components/homepage/format-lab"
import { Hero } from "@/components/homepage/hero"
import { Leaderboard } from "@/components/homepage/leaderboard"
import { Logbook } from "@/components/homepage/logbook"
import { Montage } from "@/components/homepage/montage"
import { TamilGraph } from "@/components/homepage/graph"
import { useAuth } from "@/contexts/auth-context"

// Subtle SVG-noise film grain, ported from the homepage design mockup.
const FILM_GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.025]"
        style={{ mixBlendMode: "overlay", backgroundImage: `url("${FILM_GRAIN}")` }}
      />

      <main>
        <Hero isSignedIn={Boolean(user)} />
        <FormatLab />
        <Logbook />
        <Leaderboard />
        <TamilGraph />
        <Montage />
        <Close />
      </main>
    </div>
  )
}
