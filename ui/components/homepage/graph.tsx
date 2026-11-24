"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/homepage/section-heading"

type NodeKey = "lokesh" | "girish" | "anbariv" | "shorts" | "vikram"

type GraphNode = {
  initials: string
  label: string
  position: string
  tag: string
  meta: string
  title: string
  description: string
  badges: string[]
}

// TODO(homepage): node bios are unverified demo copy from the design mockup.
// Verify each description against real credits before treating it as content.
const NODES: Record<NodeKey, GraphNode> = {
  lokesh: {
    initials: "LK",
    label: "Lokesh K.",
    position: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    tag: "Director Anchor",
    meta: "LCU Expansion",
    title: "Lokesh Kanagaraj",
    description:
      "Pivoted from corporate banking into YouTube pilot shorts (Acham Thavir, Kalam) before helming Maanagaram, Kaithi, and initiating the Lokesh Cinematic Universe.",
    badges: ["Kaithi (2019)", "Vikram (2022)", "Leo (2023)"],
  },
  girish: {
    initials: "GG",
    label: "Girish G.",
    position: "left-[12%] top-[20%]",
    tag: "Cinematographer",
    meta: "Optical Architecture",
    title: "Girish Gangadharan",
    description:
      "National Award-winning master of wide-angle staging and kinetic handheld tracking. Lit the 360-degree prison break in Kaithi and the high-contrast strobe showdowns in Vikram.",
    badges: ["Vikram", "Angamaly Diaries", "Sarkar"],
  },
  anbariv: {
    initials: "AB",
    label: "Anbariv",
    position: "right-[12%] top-[20%]",
    tag: "Stunt Choreography",
    meta: "Practical Action",
    title: "Anbariv (Twins)",
    description:
      "Choreographed raw kinetic stunt sequences for KGF, Kaithi, and Leo. Known for designing brutal single-take brawl staging and weaponized kitchen practical effects.",
    badges: ["National Award", "Leo Cafe Brawl"],
  },
  shorts: {
    initials: "YT",
    label: "Kalam (2012)",
    position: "bottom-[18%] left-[15%]",
    tag: "Origin Node",
    meta: "Independent Archive",
    title: "Kalam (Short Film 2012)",
    description:
      "Unfunded YouTube indie short featuring raw guerrilla filmmaking tactics in Chennai streets, establishing the director-actor core prior to feature financing.",
    badges: ["Canon 5D Mk II", "Zero Budget"],
  },
  vikram: {
    initials: "VK",
    label: "Vikram / Leo",
    position: "bottom-[18%] right-[15%]",
    tag: "Multiverse Node",
    meta: "DCP 4K Theatrical",
    title: "Vikram & Leo Universe",
    description:
      "Connected character arcs linking Kamal Haasan, Karthi, and Vijay across 10 years of Tamil commercial film lore. Highest single-theater gross across south-metro multiplexes.",
    badges: ["LCU Canon", "120+ Mins Pure Scope"],
  },
}

const NODE_ORDER: NodeKey[] = ["lokesh", "girish", "anbariv", "shorts", "vikram"]

/** Act 5, the Tamil Graph. A five-node constellation with a tap-to-inspect card. */
export function TamilGraph() {
  const [selected, setSelected] = useState<NodeKey>("lokesh")
  const node = NODES[selected]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="Tamil cinema graph">
      <SectionHeading
        chip="Graph"
        label="Constellation Matrix"
        title="Every film is a connection."
        description="People are the nodes. Films are the links. Follow a cinematographer from a YouTube short to a blockbuster. The credits standard databases never kept."
      />

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>Cluster: Tamil-Indie-to-DCP</span>
        <span className="text-primary">Example cluster · 5 nodes</span>
      </div>

      <div className="relative mt-4 h-[300px] border border-border bg-card sm:h-[360px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full stroke-border" strokeWidth="1" aria-hidden="true">
          <line opacity="0.6" x1="50%" x2="22%" y1="50%" y2="25%" />
          <line opacity="0.6" x1="50%" x2="78%" y1="50%" y2="25%" />
          <line opacity="0.6" x1="50%" x2="25%" y1="50%" y2="78%" />
          <line opacity="0.6" x1="50%" x2="78%" y1="50%" y2="78%" />
          <line opacity="0.3" strokeDasharray="2 2" x1="22%" x2="78%" y1="25%" y2="25%" />
        </svg>
        {NODE_ORDER.map((key) => {
          const item = NODES[key]
          const active = key === selected
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              aria-pressed={active}
              aria-label={`Inspect ${item.title}`}
              className={cn("absolute z-10 flex flex-col items-center gap-1.5", item.position)}
            >
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center font-mono text-sm font-bold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                )}
              >
                {item.initials}
              </span>
              <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Tap nodes to trace lineage
      </p>

      <div className="mt-4 border border-border bg-card p-5 sm:p-6" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {node.tag}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {node.meta}
          </span>
        </div>
        <h3 className="mt-3 text-2xl font-bold uppercase tracking-tight">{node.title}</h3>
        <p className="mt-2 leading-7 text-muted-foreground text-pretty">{node.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {node.badges.map((badge) => (
            <span
              key={badge}
              className="bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
