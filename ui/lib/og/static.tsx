import type { Metadata } from "next"
import { mediaCard } from "./card"
import { OG_SIZE, siteOrigin } from "./data"

export type PageOg = {
  /** Uppercase label on the card. */
  kind: string
  title: string
  subtitle?: string
  facts?: string[]
  detail?: string
  /** Emoji shown in the badge slot. */
  emoji: string
  /** Metadata title; falls back to `${title} | MediaVerse`. */
  metaTitle?: string
  description: string
  /** Auth-gated pages should not be indexed. */
  private?: boolean
}

/** Builds the three exports an opengraph-image.tsx file needs. */
export function pageImage(config: PageOg) {
  return {
    alt: `${config.title} on MediaVerse`,
    size: OG_SIZE,
    contentType: "image/png" as const,
    Image: async function Image() {
      return mediaCard({
        kind: config.kind,
        title: config.title,
        subtitle: config.subtitle,
        facts: config.facts,
        detail: config.detail,
        badge: { primary: config.emoji },
      })
    },
  }
}

export function pageMetadata(config: PageOg): Metadata {
  const title = config.metaTitle || `${config.title} | MediaVerse`
  return {
    title,
    description: config.description,
    openGraph: {
      title,
      description: config.description,
      type: "website",
      siteName: "MediaVerse",
      url: siteOrigin(),
    },
    twitter: { card: "summary_large_image", title, description: config.description },
    ...(config.private ? { robots: { index: false, follow: false } } : {}),
  }
}
