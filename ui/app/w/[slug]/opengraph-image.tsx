import { mediaCard } from "@/lib/og/card"
import { OG_SIZE, getWatchOrder, truncate } from "@/lib/og/data"

export const alt = "Watch order on MediaVerse"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const order = await getWatchOrder(slug)

  if (!order) {
    return mediaCard({
      kind: "Watch order",
      title: "Watch order not found",
      subtitle: "MediaVerse",
      badge: { primary: "🔢" },
    })
  }

  const count = Array.isArray(order.items) ? order.items.length : 0
  return mediaCard({
    kind: "Watch order",
    title: order.name,
    subtitle: truncate(order.description, 110),
    badge: { primary: String(count || "🔢"), secondary: count ? "titles" : undefined },
  })
}
