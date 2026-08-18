"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, Loader2, MapPin, Search, Users, Ticket } from "lucide-react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTheaters } from "@/services/api"
import type { Theater } from "@/lib/types"

export default function TheatersPage() {
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [query, setQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("All")
  const [showVisitedOnly, setShowVisitedOnly] = useState(false)
  const [showWithTicketsOnly, setShowWithTicketsOnly] = useState(false)

  useEffect(() => { getTheaters().then(setTheaters).catch(console.error) }, [])
  
  const uniqueCities = useMemo(() => {
    const cities = new Set(theaters.map((t) => t.location).filter(Boolean))
    return ["All", ...Array.from(cities).sort()]
  }, [theaters])

  const filtered = useMemo(() => {
    return theaters.filter((theater) => {
      const searchStr = `${theater.name} ${theater.location || ""}`.toLowerCase()
      const matchesQuery = searchStr.includes(query.toLowerCase())
      const matchesCity = cityFilter === "All" || theater.location === cityFilter
      const matchesVisited = !showVisitedOnly || (theater.visitCount && theater.visitCount > 0)
      const matchesTickets = !showWithTicketsOnly || (theater.ticketPlatforms && theater.ticketPlatforms.length > 0)
      
      return matchesQuery && matchesCity && matchesVisited && matchesTickets
    })
  }, [theaters, query, cityFilter, showVisitedOnly, showWithTicketsOnly])

  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-6xl px-4 py-8">
    <div className="mb-7"><h1 className="flex items-center gap-2 text-3xl font-bold"><Building2 className="text-primary" /> Theaters</h1><p className="mt-2 text-muted-foreground">Explore cinema screens, formats, amenities, and community activity.</p></div>
    
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[250px] max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search theaters or cities" />
      </div>
      <select 
        value={cityFilter} 
        onChange={(e) => setCityFilter(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {uniqueCities.map(city => (
          <option key={city as string} value={city as string}>{city === "All" ? "All Cities" : city}</option>
        ))}
      </select>
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={showVisitedOnly ? "default" : "outline"} 
          size="sm"
          className="h-10"
          onClick={() => setShowVisitedOnly(!showVisitedOnly)}
        >
          <Users className="mr-2 h-4 w-4" />
          Community Visited
        </Button>
        <Button 
          variant={showWithTicketsOnly ? "default" : "outline"} 
          size="sm"
          className="h-10"
          onClick={() => setShowWithTicketsOnly(!showWithTicketsOnly)}
        >
          <Ticket className="mr-2 h-4 w-4" />
          Has Tickets Link
        </Button>
      </div>
    </div>

    {!theaters.length ? <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((theater) => <Link className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/50" href={`/theaters/${theater.id}`} key={theater.id}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{theater.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{theater.location || "Location unavailable"}</p></div>{theater.verified && <Badge>Verified</Badge>}</div>
      
      {(theater.visitCount ? theater.visitCount > 0 : false) || (theater.ticketPlatforms ? theater.ticketPlatforms.length > 0 : false) ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {theater.visitCount ? theater.visitCount > 0 && <span className="flex items-center gap-1 font-medium"><Users className="h-3.5 w-3.5" /> {theater.visitCount} visits</span> : null}
          {theater.ticketPlatforms && theater.ticketPlatforms.length > 0 && <span className="flex items-center gap-1 font-medium"><Ticket className="h-3.5 w-3.5" /> {theater.ticketPlatforms.length} links</span>}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1">{(theater.screens || []).slice(0, 3).map((screen) => <Badge key={screen.id} variant="secondary">{screen.format}</Badge>)}{(theater.screens || []).length > 3 && <Badge variant="secondary">+{theater.screens!.length - 3} screens</Badge>}</div>
    </Link>)}</div>}
  </main></div>
}
