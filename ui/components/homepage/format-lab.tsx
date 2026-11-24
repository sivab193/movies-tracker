"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/homepage/section-heading"

type FormatKey = "imax" | "dolby" | "screenx"

type FormatSpec = {
  label: string
  ratio: string
  sub: string
  aspectRatio: string
  matte: number
  badge: string
  readout: string
  wings: boolean
}

const FORMATS: Record<FormatKey, FormatSpec> = {
  imax: {
    label: "IMAX",
    ratio: "1.43:1",
    sub: "Laser",
    aspectRatio: "1.43 / 1",
    matte: 0,
    badge: "1.43:1 Dual Laser",
    readout: "IMAX · 1.43:1 · Laser · 12-channel sound",
    wings: false,
  },
  dolby: {
    label: "Dolby",
    ratio: "2.39:1",
    sub: "Atmos",
    aspectRatio: "2.39 / 1",
    matte: 32,
    badge: "2.39:1 Dolby Vision",
    readout: "Dolby Cinema · 2.39:1 · Dolby Vision · Atmos",
    wings: false,
  },
  screenx: {
    label: "ScreenX",
    ratio: "270°",
    sub: "3-Wing",
    aspectRatio: "1.85 / 1",
    matte: 16,
    badge: "270° Multi-Projection",
    readout: "ScreenX · 270° · Three screens, one film",
    wings: true,
  },
}

const FORMAT_ORDER: FormatKey[] = ["imax", "dolby", "screenx"]

/** Act 2, the Format Lab. The peak of the page: one frame, three formats. */
export function FormatLab() {
  const [format, setFormat] = useState<FormatKey>("imax")
  const spec = FORMATS[format]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="Format Lab">
      <SectionHeading
        chip="Lab"
        label="Aperture Spec"
        title="Same film. Three different movies."
        description="Formats compared per theater on every Theater Page."
      />

      <div role="tablist" aria-label="Projection format" className="grid grid-cols-3 border border-border">
        {FORMAT_ORDER.map((key) => {
          const option = FORMATS[key]
          const selected = key === format
          return (
            <button
              key={key}
              role="tab"
              aria-selected={selected}
              onClick={() => setFormat(key)}
              className={cn(
                "flex min-h-[44px] flex-col items-center justify-center px-2 py-3 transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/70"
              )}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider sm:text-sm">
                {option.label} {option.ratio}
              </span>
              <span className={cn("font-mono text-[10px] uppercase tracking-widest", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {option.sub}
              </span>
            </button>
          )
        })}
      </div>

      {/* Projection chamber: black surround so the mattes and wings read as a screen. */}
      <div
        className="relative mt-4 flex items-center justify-center overflow-hidden bg-black transition-all"
        style={{ paddingTop: spec.matte, paddingBottom: spec.matte }}
      >
        {spec.wings ? (
          <>
            <div className="absolute inset-y-0 left-0 w-[14%] overflow-hidden opacity-60" aria-hidden="true">
              <Image src="/homepage/frame-lighthouse.jpg" alt="" fill className="object-cover" />
              <span className="absolute bottom-2 left-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-widest text-white">Wing L</span>
            </div>
            <div className="absolute inset-y-0 right-0 w-[14%] overflow-hidden opacity-60" aria-hidden="true">
              <Image src="/homepage/frame-lighthouse.jpg" alt="" fill className="object-cover" />
              <span className="absolute bottom-2 right-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-widest text-white">Wing R</span>
            </div>
          </>
        ) : null}
        <div
          className="relative z-10 w-full max-w-2xl transition-all"
          style={{ paddingLeft: spec.wings ? "15%" : 0, paddingRight: spec.wings ? "15%" : 0 }}
        >
          <div className="relative w-full transition-all" style={{ aspectRatio: spec.aspectRatio }}>
            <Image
              src="/homepage/frame-lighthouse.jpg"
              alt="A film frame: a lighthouse on a moody coastline at dusk"
              fill
              className="object-cover"
            />
            <span className="absolute left-3 top-3 flex items-center gap-2 bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
              <span className="inline-block h-2 w-2 bg-primary" aria-hidden="true" />
              {spec.badge}
            </span>
            <span className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
              Frame 24.000 FPS
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Acoustic &amp; Lumen Spec
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            [ Reel Calibrated ]
          </span>
        </div>
        <p className="mt-3 text-xl font-bold uppercase tracking-tight sm:text-2xl">
          {spec.readout}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
          <div>
            <dt className="sr-only">Vertical scope</dt>
            <dd>Vertical Scope: 100%</dd>
          </div>
          <div>
            <dt className="sr-only">Color space</dt>
            <dd>Color Space: DCI-P3</dd>
          </div>
          <div>
            <dt className="sr-only">Peak brightness</dt>
            <dd>Peak: 22 fL</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
