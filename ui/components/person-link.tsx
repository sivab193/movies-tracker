import Link from "next/link"
import { personSlug } from "@/lib/people"

export function PersonLink({ name }: { name: string }) {
  const slug = personSlug(name)
  if (!slug) return <>{name}</>
  return (
    <Link href={`/people/${slug}`} className="text-primary hover:underline underline-offset-4">
      {name}
    </Link>
  )
}
