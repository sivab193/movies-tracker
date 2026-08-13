"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, Loader2, MapPin, Search } from "lucide-react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getTheaters } from "@/services/api"
import type { Theater } from "@/lib/types"

export default function TheatersPage() {
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [query, setQuery] = useState("")
  useEffect(() => { getTheaters().then(setTheaters).catch(console.error) }, [])
  const filtered = useMemo(() => theaters.filter((theater) => `${theater.name} ${theater.location || ""}`.toLowerCase().includes(query.toLowerCase())), [theaters, query])
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-6xl px-4 py-8">
    <div className="mb-7"><h1 className="flex items-center gap-2 text-3xl font-bold"><Building2 className="text-primary" /> Theaters</h1><p className="mt-2 text-muted-foreground">Explore cinema screens, formats, amenities, and community activity.</p></div>
    <div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search theaters or cities" /></div>
    {!theaters.length ? <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((theater) => <Link className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/50" href={`/theaters/${theater.id}`} key={theater.id}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{theater.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{theater.location || "Location unavailable"}</p></div>{theater.verified && <Badge>Verified</Badge>}</div>
      <div className="mt-4 flex flex-wrap gap-1">{(theater.screens || []).slice(0, 3).map((screen) => <Badge key={screen.id} variant="secondary">{screen.format}</Badge>)}{(theater.screens || []).length > 3 && <Badge variant="secondary">+{theater.screens!.length - 3} screens</Badge>}</div>
    </Link>)}</div>}
  </main></div>
}
