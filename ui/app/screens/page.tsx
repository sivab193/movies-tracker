import type { LucideIcon } from "lucide-react"
import { Armchair, CircleGauge, Film, MonitorPlay, PanelsTopLeft, Projector, Sparkles, Speaker, Volume2 } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"

type GuideCard = {
  icon: LucideIcon
  title: string
  tagline: string
  whatChanges: string
  lookFor: string[]
}

const formats: GuideCard[] = [
  { icon: MonitorPlay, title: "Standard digital", tagline: "The everyday cinema baseline", whatChanges: "Usually a 2K or 4K digital projection with a conventional screen and 5.1 or 7.1 sound. A good presentation is more about maintenance and calibration than a logo.", lookFor: ["2K / 4K", "5.1 or 7.1 sound", "Often 2.39:1 screen"] },
  { icon: PanelsTopLeft, title: "Premium Large Format (PLF)", tagline: "Bigger screen, stronger presentation", whatChanges: "PLF is a broad category, not one fixed standard. It usually combines a larger screen with brighter laser projection and upgraded sound.", lookFor: ["Large screen", "Laser projection", "Format varies by cinema"] },
  { icon: Sparkles, title: "IMAX", tagline: "Built around scale and immersion", whatChanges: "IMAX pairs a purpose-built auditorium with its own projection, audio and quality-control standards. IMAX with Laser can deliver brighter images, richer colours and expanded framing on selected films.", lookFor: ["IMAX Laser or Digital", "Expanded-ratio scenes", "Dedicated auditorium"] },
  { icon: Projector, title: "Laser projection", tagline: "Light source, not a format", whatChanges: "A laser replaces the older xenon lamp. It can improve brightness, contrast, colour consistency and perceived sharpness—especially on large screens and in 3D.", lookFor: ["Laser / RGB laser", "4K where available", "Better 3D potential"] },
  { icon: Speaker, title: "Dolby Cinema / Dolby Atmos", tagline: "Object-based, room-filling sound", whatChanges: "Atmos lets sound move around and above the audience rather than being tied to a fixed channel. Dolby Cinema also includes Dolby Vision projection, but many theatres offer Atmos without Dolby Vision.", lookFor: ["Dolby Atmos", "Ceiling speakers", "Do not confuse Atmos with Dolby Cinema"] },
  { icon: Armchair, title: "Premium seating", tagline: "Comfort changes the session", whatChanges: "Recliners, extra legroom, paired seats and fewer rows change comfort and viewing angle—not picture or sound quality.", lookFor: ["Recliner / rocker", "Row pitch", "Seat location still matters"] },
]

const ratios = [
  { ratio: "1.43:1", name: "GT IMAX", note: "Very tall frame. Rare; the most vertically expansive IMAX canvas." },
  { ratio: "1.90:1", name: "Digital IMAX", note: "Taller than widescreen. Some films open up vertically in IMAX scenes." },
  { ratio: "1.85:1", name: "Flat", note: "Slightly wider than 16:9; common for many dramas, animation and older releases." },
  { ratio: "2.39:1", name: "Scope", note: "The wide cinematic frame used by many blockbuster and action films." },
]

export default function ScreensPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="gap-2 px-3 py-1"><Film className="h-3.5 w-3.5" /> MediaVerse guide</Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Cinema screens, decoded.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">The names on a ticket can be confusing. Here’s what screen formats, projection, sound and ratios actually change when you watch a movie.</p>
        </section>

        <section className="mt-14">
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

        <section className="mt-16 rounded-3xl border bg-card p-6 sm:p-10">
          <div className="flex items-start gap-4"><CircleGauge className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="text-2xl font-bold">Screen ratios: why the black bars?</h2><p className="mt-2 max-w-3xl text-muted-foreground">Aspect ratio is the width of an image relative to its height. Black bars usually mean the movie is preserving its intended shape; they are not automatically a problem.</p></div></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{ratios.map((ratio) => <div key={ratio.ratio} className="rounded-xl border bg-background p-5"><div className="text-3xl font-bold text-primary">{ratio.ratio}</div><h3 className="mt-2 font-semibold">{ratio.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{ratio.note}</p></div>)}</div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6"><Volume2 className="h-6 w-6 text-primary" /><h2 className="mt-4 text-2xl font-bold">What sound labels mean</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><li><strong className="text-foreground">5.1 / 7.1:</strong> fixed speaker channels around the auditorium.</li><li><strong className="text-foreground">Dolby Atmos:</strong> object-based audio that can use side, rear and overhead speakers.</li><li><strong className="text-foreground">The important bit:</strong> an Atmos mix only shines when the auditorium has been designed and calibrated well.</li></ul></div>
          <div className="rounded-2xl border bg-card p-6"><Projector className="h-6 w-6 text-primary" /><h2 className="mt-4 text-2xl font-bold">How to choose a show</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><li><strong className="text-foreground">1.</strong> Pick IMAX or a quality PLF for films made for a larger/taller frame.</li><li><strong className="text-foreground">2.</strong> Choose Atmos when sound design matters to you.</li><li><strong className="text-foreground">3.</strong> For a long film, prioritise your seat and viewing angle over a premium label.</li><li><strong className="text-foreground">4.</strong> Check whether the specific movie is actually presented in that format.</li></ol></div>
        </section>
      </main>
    </div>
  )
}
