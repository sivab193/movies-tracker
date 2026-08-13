"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, ExternalLink, MapPin, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTheater } from "@/services/api"
import type { Theater } from "@/lib/types"

export default function TheaterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const [theater, setTheater] = useState<Theater | null>(null)
  useEffect(() => { getTheater(id).then(setTheater).catch(console.error) }, [id])
  if (!theater) return <div className="min-h-screen bg-background"><Header /><main className="p-12 text-center text-muted-foreground">Loading theater…</main></div>
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-5xl px-4 py-8">
    <Link href="/theaters" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to theaters</Link>
    <div className="mb-8 rounded-2xl border bg-card p-6"><div className="flex items-start justify-between gap-4"><div><h1 className="flex items-center gap-2 text-3xl font-bold"><Building2 className="text-primary" />{theater.name}</h1><p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{theater.location}</p></div>{theater.verified && <Badge>Verified</Badge>}</div>
    <div className="mt-5 flex flex-wrap gap-2">{theater.gmapsLink && <a href={theater.gmapsLink} target="_blank" rel="noreferrer"><Badge variant="secondary">Open in Maps <ExternalLink className="ml-1 inline h-3 w-3" /></Badge></a>}{theater.website && <a href={theater.website} target="_blank" rel="noreferrer"><Badge variant="secondary">Website <ExternalLink className="ml-1 inline h-3 w-3" /></Badge></a>}{(theater.amenities || []).map((amenity) => <Badge key={amenity} variant="secondary">{amenity}</Badge>)}</div></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Community visits</p><p className="text-2xl font-bold">{theater.stats?.watchCount || 0}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Visitors</p><p className="flex items-center gap-1 text-2xl font-bold"><Users className="h-5 w-5" />{theater.stats?.uniqueVisitors || 0}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Most watched</p><p className="truncate font-semibold">{theater.stats?.topMovie?.title || "—"}</p></CardContent></Card></div>
    <section className="grid gap-4 md:grid-cols-2">{(theater.screens || []).map((screen) => <Card key={screen.id}><CardHeader className="pb-3"><CardTitle className="flex items-center justify-between text-lg">{screen.name}{screen.verified && <Badge>Verified</Badge>}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex flex-wrap gap-1"><Badge variant="secondary">{screen.format}</Badge><Badge variant="secondary">{screen.sound}</Badge><Badge variant="secondary">{screen.seating}</Badge></div>{screen.capacity && <p><strong>Capacity:</strong> {screen.capacity} seats</p>}{screen.screenSize && <p><strong>Screen:</strong> {screen.screenSize}</p>}{screen.notes && <p className="text-muted-foreground">{screen.notes}</p>}</CardContent></Card>)}</section>
    {(theater.ticketPlatforms || []).length > 0 && <section className="mt-7"><h2 className="mb-3 text-xl font-bold">Ticket platforms</h2><div className="flex flex-wrap gap-2">{theater.ticketPlatforms!.map((platform) => platform.url ? <a href={platform.url} target="_blank" rel="noreferrer" key={platform.name}><Badge variant="secondary">{platform.name} <ExternalLink className="ml-1 inline h-3 w-3" /></Badge></a> : <Badge key={platform.name} variant="secondary">{platform.name}</Badge>)}</div></section>}
  </main></div>
}
