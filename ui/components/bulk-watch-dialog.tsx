"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Check, FileSpreadsheet, Film, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addWatchHistory, getMovies, getTheaters } from "@/services/api"

type CatalogMovie = { id: string; imdbId?: string; title: string; year?: number; posterUrl?: string }
type Theater = { id: string; name: string; location?: string; gmapsLink?: string }
type BulkItem = { key: string; movie: CatalogMovie; date: string; theaterId?: string; theaterName?: string; theaterLocation?: string; theaterGmapsLink?: string; ticketCost: string; foodCost: string; currency: "INR" | "USD"; showTime: string }
type CsvRow = Record<string, string>

const today = () => new Date().toISOString().slice(0, 10)

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = [], value = "", quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++ } else quoted = !quoted
    } else if (char === "," && !quoted) {
      row.push(value.trim()); value = ""
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(value.trim()); value = ""
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else value += char
  }
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  if (rows.length < 2) return []
  const headers = rows[0].map(header => header.toLowerCase().replace(/\s+/g, "_"))
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

function buildItem(movie: CatalogMovie, defaults: Omit<BulkItem, "key" | "movie">): BulkItem {
  return { key: crypto.randomUUID(), movie, ...defaults }
}

export function BulkWatchDialog({ onWatchAdded }: { onWatchAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"select" | "csv">("select")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CatalogMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [items, setItems] = useState<BulkItem[]>([])
  const [watchDate, setWatchDate] = useState(today())
  const [theaterId, setTheaterId] = useState("")
  const [ticketCost, setTicketCost] = useState("")
  const [foodCost, setFoodCost] = useState("")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [showTime, setShowTime] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [saving, setSaving] = useState(false)

  const defaults = useMemo(() => {
    const theater = theaters.find(item => item.id === theaterId)
    return { date: watchDate, theaterId: theater?.id, theaterName: theater?.name, theaterLocation: theater?.location, theaterGmapsLink: theater?.gmapsLink, ticketCost, foodCost, currency, showTime }
  }, [watchDate, theaterId, theaters, ticketCost, foodCost, currency, showTime])

  useEffect(() => {
    if (!open) return
    getTheaters().then(setTheaters).catch(() => setTheaters([]))
  }, [open])

  useEffect(() => {
    if (!open || query.trim().length < 2) { setResults([]); return }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const data = await getMovies(0, 12, "", query.trim())
        if (!cancelled) setResults(data?.movies || [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [open, query])

  const addMovie = (movie: CatalogMovie) => {
    if (items.some(item => item.movie.id === movie.id)) return
    setItems(current => [...current, buildItem(movie, defaults)])
    setQuery("")
    setResults([])
  }

  const applyDefaults = () => setItems(current => current.map(item => ({ ...item, ...defaults })))

  const updateItem = (key: string, patch: Partial<BulkItem>) =>
    setItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item))

  const importCsv = async (file: File) => {
    setError(""); setNotice("")
    const rows = parseCsv(await file.text())
    if (!rows.length) { setError("We could not find data rows. Include a header row and at least one movie."); return }

    setSearching(true)
    const next: BulkItem[] = []
    const skipped: string[] = []
    for (const row of rows) {
      const lookup = (row.imdb_id || row.imdbid || row.title || row.movie || "").trim()
      if (!lookup) { skipped.push("a row without a title or IMDb ID"); continue }
      try {
        const response = await getMovies(0, 12, "", lookup)
        const candidates: CatalogMovie[] = response?.movies || []
        const normalized = lookup.toLowerCase()
        const movie = candidates.find(candidate => candidate.imdbId?.toLowerCase() === normalized || candidate.title?.toLowerCase() === normalized) || candidates[0]
        if (!movie) { skipped.push(lookup); continue }
        const rowTheater = theaters.find(theater => theater.name.toLowerCase() === (row.theater || row.theater_name || "").trim().toLowerCase())
        next.push(buildItem(movie, {
          date: row.date || row.watched_date || watchDate,
          theaterId: rowTheater?.id,
          theaterName: rowTheater?.name || row.theater || row.theater_name || "",
          theaterLocation: rowTheater?.location || "",
          theaterGmapsLink: rowTheater?.gmapsLink || "",
          ticketCost: row.ticket_cost || row.cost || "",
          foodCost: row.food_cost || "",
          currency: row.currency?.toUpperCase() === "USD" ? "USD" : currency,
          showTime: row.show_time || ""
        }))
      } catch { skipped.push(lookup) }
    }
    setSearching(false)
    setItems(current => {
      const known = new Set(current.map(item => item.movie.id))
      return [...current, ...next.filter(item => !known.has(item.movie.id))]
    })
    setNotice(`Added ${next.length} movie${next.length === 1 ? "" : "s"} from the file${skipped.length ? `; skipped ${skipped.length} unmatched row${skipped.length === 1 ? "" : "s"}` : ""}.`)
  }

  const downloadTemplate = () => {
    const csv = "title,date,theater,ticket_cost,food_cost,currency,show_time\nExample Movie,2026-08-25,Example Cinema,250,100,INR,19:30\n"
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const link = document.createElement("a"); link.href = url; link.download = "mediaverse-watch-history-template.csv"; link.click()
    URL.revokeObjectURL(url)
  }

  const save = async () => {
    if (!items.length) { setError("Add at least one movie before saving."); return }
    setError(""); setSaving(true)
    const failures: string[] = []
    for (const item of items) {
      try {
        await addWatchHistory({
          movieId: item.movie.id,
          theaterId: item.theaterId || undefined,
          theaterName: item.theaterName || undefined,
          theaterLocation: item.theaterLocation || undefined,
          theaterGmapsLink: item.theaterGmapsLink || undefined,
          timestamp: new Date(item.date || today()).toISOString(),
          ticketCost: item.ticketCost ? Number(item.ticketCost) : 0,
          foodCost: item.foodCost ? Number(item.foodCost) : 0,
          currency: item.currency,
          showTime: item.showTime || null,
        })
      } catch { failures.push(item.movie.title) }
    }
    setSaving(false)
    if (failures.length) {
      setError(`Could not save: ${failures.join(", ")}. The other entries were added.`)
      onWatchAdded()
      return
    }
    setItems([]); setOpen(false); onWatchAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Bulk log</Button></DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Film className="h-5 w-5" />Bulk log movies</DialogTitle>
          <DialogDescription>Build a reviewed queue, apply shared details, then save every watch at once.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 border-b">
          <Button type="button" variant={tab === "select" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("select")}>Select movies</Button>
          <Button type="button" variant={tab === "csv" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("csv")}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Import CSV</Button>
        </div>
        {tab === "select" ? (
          <div className="space-y-2">
            <Label htmlFor="bulk-search">Find movies</Label>
            <Input id="bulk-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title or IMDb ID…" />
            {query.trim().length > 0 && query.trim().length < 2 && <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>}
            {searching && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Searching…</p>}
            {results.length > 0 && <div className="rounded-md border divide-y max-h-44 overflow-y-auto">{results.map(movie => <button key={movie.id} type="button" onClick={() => addMovie(movie)} className="w-full flex items-center gap-3 p-2 text-left hover:bg-muted disabled:opacity-50" disabled={items.some(item => item.movie.id === movie.id)}>{movie.posterUrl ? <img src={movie.posterUrl} alt="" className="h-9 w-7 rounded object-cover" /> : <Film className="h-5 w-5 text-muted-foreground" />}<span className="flex-1 font-medium">{movie.title} {movie.year ? <span className="text-muted-foreground font-normal">({movie.year})</span> : null}</span>{items.some(item => item.movie.id === movie.id) ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4" />}</button>)}</div>}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-5 space-y-3">
            <div><p className="font-medium">Import a watch-history CSV</p><p className="text-sm text-muted-foreground">Supported columns: title or imdb_id, date, theater, ticket_cost, food_cost, currency, show_time.</p></div>
            <div className="flex flex-wrap gap-2"><Input className="max-w-sm" type="file" accept=".csv,text/csv" onChange={event => event.target.files?.[0] && importCsv(event.target.files[0])} /><Button type="button" variant="outline" onClick={downloadTemplate}><Upload className="mr-2 h-4 w-4" />Download template</Button></div>
          </div>
        )}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between"><p className="font-medium">Shared details</p><Button type="button" variant="outline" size="sm" onClick={applyDefaults} disabled={!items.length}>Apply to all</Button></div>
          <div className="grid sm:grid-cols-4 gap-3">
            <div><Label>Date</Label><Input type="date" max={today()} value={watchDate} onChange={event => setWatchDate(event.target.value)} /></div>
            <div><Label>Theater</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={theaterId} onChange={event => setTheaterId(event.target.value)}><option value="">No theater</option>{theaters.map(theater => <option key={theater.id} value={theater.id}>{theater.name}</option>)}</select></div>
            <div><Label>Ticket cost</Label><Input type="number" min="0" value={ticketCost} onChange={event => setTicketCost(event.target.value)} placeholder="0" /></div>
            <div><Label>Currency</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={currency} onChange={event => setCurrency(event.target.value as "INR" | "USD")}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></div>
          </div>
        </div>
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {items.length > 0 && <div className="space-y-2"><div className="flex justify-between"><p className="font-medium">{items.length} movie{items.length === 1 ? "" : "s"} ready</p><Button type="button" variant="ghost" size="sm" onClick={() => setItems([])}>Clear all</Button></div><div className="max-h-60 overflow-y-auto rounded-md border divide-y">{items.map(item => <div key={item.key} className="flex gap-2 p-2 items-center">{item.movie.posterUrl ? <img src={item.movie.posterUrl} alt="" className="h-10 w-7 rounded object-cover" /> : <Film className="h-5 w-5" />}<span className="flex-1 text-sm font-medium truncate">{item.movie.title}</span><Input className="w-36" type="date" max={today()} value={item.date} onChange={event => updateItem(item.key, { date: event.target.value })} aria-label={`Watch date for ${item.movie.title}`} /><Button type="button" variant="ghost" size="icon" onClick={() => setItems(current => current.filter(entry => entry.key !== item.key))} aria-label={`Remove ${item.movie.title}`}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div>}
        <Button type="button" className="w-full" disabled={saving || !items.length} onClick={save}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving {items.length} watches…</> : `Save ${items.length || ""} watch log${items.length === 1 ? "" : "s"}`}</Button>
      </DialogContent>
    </Dialog>
  )
}
