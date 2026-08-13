import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const name = slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ")
  return { title: `${name} | MediaVerse`, description: `Movies and series featuring ${name} on MediaVerse.` }
}

export default function PersonLayout({ children }: { children: React.ReactNode }) { return children }
