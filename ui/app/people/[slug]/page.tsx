"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clapperboard, Film, Loader2, Tv } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getPerson, type Person } from "@/services/people-service"
import { resolveApiUrl } from "@/lib/types"

export default function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPerson(slug).then(setPerson).catch((err) => setError(err.message || "Person not found"))
  }, [slug])

  const credits = useMemo(() => person?.credits || [], [person])

  if (!person && !error) {
    return <div className="min-h-screen bg-background"><Header /><div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Person not found</h1><p className="mt-2 text-muted-foreground">This person has no matching titles in the MediaVerse catalog.</p>
        <Link href="/" className="mt-6 inline-flex text-primary hover:underline">Back to movies</Link>
      </main></div>
    )
  }

  return (
    <div className="min-h-screen bg-background"><Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to movies</Link>
        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Clapperboard className="h-7 w-7" /></div>
            <div><h1 className="text-3xl font-bold">{person.name}</h1><p className="mt-1 text-sm text-muted-foreground">{person.movieCount} movie{person.movieCount === 1 ? "" : "s"} · {person.seriesCount} series</p></div>
          </div>
        </section>
        <h2 className="mb-4 text-xl font-bold">Filmography</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {credits.map((credit) => {
            const href = credit.type === "movie" ? `/movie/${credit.id}` : `/series/${credit.id}`
            const year = credit.type === "series" && credit.endYear ? `${credit.year}–${credit.endYear}` : credit.year
            return <Link href={href} key={`${credit.type}-${credit.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:border-primary/50"><CardContent className="flex gap-3 p-3">
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-muted">{credit.posterUrl ? <img src={resolveApiUrl(credit.posterUrl)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center">{credit.type === "movie" ? <Film className="h-5 w-5" /> : <Tv className="h-5 w-5" />}</div>}</div>
                <div className="min-w-0"><div className="flex items-center gap-1 text-xs text-muted-foreground">{credit.type === "movie" ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}{year || "—"}</div><h3 className="mt-1 line-clamp-2 font-semibold">{credit.title}</h3><div className="mt-2 flex flex-wrap gap-1">{credit.roles.map((role) => <Badge variant="secondary" className="text-[10px] capitalize" key={role}>{role}</Badge>)}</div></div>
              </CardContent></Card>
            </Link>
          })}
        </div>
      </main>
    </div>
  )
}
