import type { Metadata } from "next"
import { getWatchOrder, truncate } from "@/lib/og/data"
import { notFoundMetadata } from "@/lib/og/static"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const order = await getWatchOrder(slug)

  if (!order) {
    return notFoundMetadata(
      "Watch order not found",
      "This watch order is no longer available on MediaVerse.",
    )
  }

  const count = Array.isArray(order.items) ? order.items.length : 0
  const title = `${order.name} | MediaVerse`
  const description =
    truncate(order.description, 160) ||
    `A curated watch order of ${count} titles on MediaVerse.`

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default function WatchOrderLayout({ children }: { children: React.ReactNode }) {
  return children
}
