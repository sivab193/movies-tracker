"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Armchair, CircleGauge, Film, MonitorPlay, PanelsTopLeft, Projector, Sparkles, Speaker, Volume2, Wind } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type GuideCard = {
  icon: LucideIcon
  title: string
  tagline: string
  whatChanges: string
  lookFor: string[]
}

type FormatOption = {
  id: string
  label: string
  ratio: string
  ratioLabel: string
  suggestedWidth: number
  description: string
}

type AudioOption = {
  id: string
  label: string
  speakers: string[]
  description: string
}

const formats: GuideCard[] = [
  { icon: MonitorPlay, title: "Standard digital", tagline: "The everyday cinema baseline", whatChanges: "Usually a 2K or 4K digital projection with a conventional screen and 5.1 or 7.1 sound. A good presentation is more about maintenance and calibration than a logo.", lookFor: ["2K / 4K", "5.1 or 7.1 sound", "Often 2.39:1 screen"] },
  { icon: PanelsTopLeft, title: "Premium Large Format (PLF)", tagline: "Bigger screen, stronger presentation", whatChanges: "PLF is a broad category, not one fixed standard. It usually combines a larger screen with brighter laser projection and upgraded sound.", lookFor: ["Large screen", "Laser projection", "Format varies by cinema"] },
  { icon: Sparkles, title: "IMAX", tagline: "Built around scale and immersion", whatChanges: "IMAX pairs a purpose-built auditorium with its own projection, audio and quality-control standards. IMAX with Laser can deliver brighter images, richer colours and expanded framing on selected films.", lookFor: ["IMAX Laser or Digital", "Expanded-ratio scenes", "Dedicated auditorium"] },
  { icon: Projector, title: "EPIQ (Qube Cinema)", tagline: "A premium large-format presentation", whatChanges: "EPIQ is a Qube Cinema PLF. Participating locations may combine a large screen, high-contrast RGB laser projection, 4K presentation and an immersive auditorium design. Exact specifications depend on the cinema.", lookFor: ["PLF", "RGB laser at select sites", "Check the individual auditorium"] },
  { icon: Projector, title: "Laser projection", tagline: "Light source, not a format", whatChanges: "A laser replaces the older xenon lamp. It can improve brightness, contrast, colour consistency and perceived sharpness—especially on large screens and in 3D.", lookFor: ["Laser / RGB laser", "4K where available", "Better 3D potential"] },
  { icon: Speaker, title: "Dolby Cinema / Dolby Atmos", tagline: "Object-based, room-filling sound", whatChanges: "Atmos lets sound move around and above the audience rather than being tied to a fixed channel. Dolby Cinema also includes Dolby Vision projection, but many theatres offer Atmos without Dolby Vision.", lookFor: ["Dolby Atmos", "Ceiling speakers", "Do not confuse Atmos with Dolby Cinema"] },
  { icon: Wind, title: "4DX / MX4D", tagline: "The seat becomes part of the show", whatChanges: "Motion seats and in-theatre effects such as wind, water or scent are synchronised to selected films. This adds physical sensation, but it is a different kind of experience from a better image or sound system.", lookFor: ["Motion seats", "Environmental effects", "Availability varies by title"] },
  { icon: PanelsTopLeft, title: "ScreenX", tagline: "A wider field of view", whatChanges: "ScreenX expands selected scenes onto the side walls to create a 270-degree image. Most of the movie still plays on the main screen.", lookFor: ["Side-wall projection", "Selected scenes only", "Not the same as IMAX"] },
  { icon: Armchair, title: "Premium seating", tagline: "Comfort changes the session", whatChanges: "Recliners, extra legroom, paired seats and fewer rows change comfort and viewing angle—not picture or sound quality.", lookFor: ["Recliner / rocker", "Row pitch", "Seat location still matters"] },
]

const formatOptions: FormatOption[] = [
  { id: "scope", label: "Scope", ratio: "2.39 / 1", ratioLabel: "2.39:1", suggestedWidth: 58, description: "The wide frame used by many blockbusters. It fills more of a wide screen than a taller one." },
  { id: "flat", label: "Flat", ratio: "1.85 / 1", ratioLabel: "1.85:1", suggestedWidth: 62, description: "A little taller than Scope, common for animation, comedy, drama and some older films." },
  { id: "imax-digital", label: "IMAX digital", ratio: "1.90 / 1", ratioLabel: "1.90:1", suggestedWidth: 72, description: "A taller canvas. Selected IMAX scenes can reveal more image above and below." },
  { id: "imax-gt", label: "GT IMAX", ratio: "1.43 / 1", ratioLabel: "1.43:1", suggestedWidth: 78, description: "The tallest IMAX canvas. It is rare, and only selected films use this full frame." },
]

const audioOptions: AudioOption[] = [
  { id: "5-1", label: "5.1", speakers: ["L", "C", "R", "SL", "SR", "SUB"], description: "Front, side and low-frequency channels form the familiar surround layout." },
  { id: "7-1", label: "7.1", speakers: ["L", "C", "R", "SL", "SR", "RL", "RR", "SUB"], description: "Adds dedicated rear-surround channels behind the audience." },
  { id: "atmos", label: "Dolby Atmos", speakers: ["L", "C", "R", "SL", "SR", "RL", "RR", "SUB", "TOP", "TOP"], description: "Adds overhead speakers and object-based placement, allowing sounds to move through the room." },
]

const speakerPositions: Record<string, string> = {
  L: "left-2 top-5",
  C: "left-1/2 top-2 -translate-x-1/2",
  R: "right-2 top-5",
  SL: "left-1 top-1/2 -translate-y-1/2",
  SR: "right-1 top-1/2 -translate-y-1/2",
  RL: "bottom-3 left-4",
  RR: "bottom-3 right-4",
  SUB: "bottom-1 left-1/2 -translate-x-1/2",
  TOP: "top-1/3 left-1/2 -translate-x-1/2",
}

export default function ScreensPage() {
  const [formatId, setFormatId] = useState("scope")
  const [screenWidth, setScreenWidth] = useState(58)
  const [audioId, setAudioId] = useState("atmos")

  const selectedFormat = formatOptions.find((format) => format.id === formatId) ?? formatOptions[0]
  const selectedAudio = audioOptions.find((audio) => audio.id === audioId) ?? audioOptions[0]

  function chooseFormat(format: FormatOption) {
    setFormatId(format.id)
    setScreenWidth(format.suggestedWidth)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="gap-2 px-3 py-1"><Film className="h-3.5 w-3.5" /> MediaVerse guide</Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Cinema screens, decoded.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">The names on a ticket can be confusing. Explore what formats, projection, sound and aspect ratios actually change when you watch a movie.</p>
        </section>

        <section className="mt-14 rounded-3xl border bg-card p-6 sm:p-10">
          <div className="flex items-start gap-4"><CircleGauge className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="text-2xl font-bold">Try the screen</h2><p className="mt-2 max-w-3xl text-muted-foreground">Choose a frame and adjust the illustrative screen width. Brands do not guarantee a fixed size—the comparison is about shape and scale.</p></div></div>
          <div className="mt-7 flex flex-wrap gap-2">{formatOptions.map((format) => <Button key={format.id} size="sm" variant={format.id === selectedFormat.id ? "default" : "outline"} onClick={() => chooseFormat(format)} aria-pressed={format.id === selectedFormat.id}>{format.label}</Button>)}</div>
          <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)]">
            <div className="relative h-80 overflow-hidden rounded-2xl border bg-background">
              <div className="absolute inset-x-0 bottom-0 h-12 bg-muted" />
              <div className="absolute inset-x-4 bottom-7 h-px bg-border" />
              <div className="absolute left-1/2 top-1/2 border-4 border-primary bg-primary/15 shadow-sm transition-all duration-500 -translate-x-1/2 -translate-y-1/2" style={{ width: `${screenWidth}%`, aspectRatio: selectedFormat.ratio }} />
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3 text-muted-foreground" aria-hidden="true">{Array.from({ length: 9 }).map((_, index) => <span key={index} className="h-3 w-3 rounded-full bg-current opacity-50" />)}</div>
              <span className="absolute left-4 top-4 text-xs font-medium text-muted-foreground">Illustrative auditorium</span>
              <span className="absolute right-4 top-4 text-xs font-medium text-muted-foreground">{selectedFormat.ratioLabel}</span>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{Math.round(screenWidth)} ft</p>
              <p className="mt-1 text-sm text-muted-foreground">illustrative screen width</p>
              <input className="mt-5 w-full accent-primary" aria-label="Illustrative screen width" type="range" min="35" max="100" value={screenWidth} onChange={(event) => setScreenWidth(Number(event.target.value))} />
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{selectedFormat.description}</p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-6"><h2 className="text-2xl font-bold">Formats & technology</h2><p className="mt-1 text-muted-foreground">A format label can describe the whole auditorium—or only one part of it.</p></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {formats.map((item) => <article key={item.title} className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm font-medium text-primary">{item.tagline}</p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.whatChanges}</p>
              <div className="mt-5 flex flex-wrap gap-2">{item.lookFor.map((fact) => <Badge key={fact} variant="secondary">{fact}</Badge>)}</div>
            </article>)}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            <Volume2 className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Hear the difference</h2>
            <p className="mt-2 text-muted-foreground">Select a mix to see how the speaker field grows around the audience.</p>
            <div className="mt-5 flex flex-wrap gap-2">{audioOptions.map((audio) => <Button key={audio.id} size="sm" variant={audio.id === selectedAudio.id ? "default" : "outline"} onClick={() => setAudioId(audio.id)} aria-pressed={audio.id === selectedAudio.id}>{audio.label}</Button>)}</div>
            <div className="relative mt-7 h-64 rounded-2xl border bg-background">
              <div className="absolute left-1/2 top-10 h-7 w-32 -translate-x-1/2 rounded bg-primary/20 text-center text-xs leading-7 text-primary">SCREEN</div>
              <div className="absolute inset-x-12 bottom-10 top-20 rounded-[50%] border border-border" />
              {selectedAudio.speakers.map((speaker, index) => <span key={`${speaker}-${index}`} className={`absolute flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ${speakerPositions[speaker]}`} style={speaker === "TOP" ? { marginLeft: index % 2 === 0 ? "-36px" : "36px", marginTop: "-22px" } : undefined}>{speaker}</span>)}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground">AUDIENCE</div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{selectedAudio.description}</p>
          </div>
          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            <Projector className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">How to choose a show</h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground"><li><strong className="text-foreground">1.</strong> Pick IMAX or a quality PLF for films made for a larger or taller frame.</li><li><strong className="text-foreground">2.</strong> Choose Atmos when sound design matters to you.</li><li><strong className="text-foreground">3.</strong> For a long film, prioritise your seat and viewing angle over a premium label.</li><li><strong className="text-foreground">4.</strong> Check whether the specific movie is actually presented in that format.</li></ol>
            <div className="mt-8 rounded-2xl bg-muted p-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Worth knowing:</strong> a film can be marketed as “IMAX” or “Atmos” yet only use selected expanded-ratio scenes or a particular sound mix. The auditorium and the movie both matter.</div>
          </div>
        </section>
      </main>
    </div>
  )
}
