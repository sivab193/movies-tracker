"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BadgeCheck, ExternalLink, Film, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WatchProviderEditor, type WatchProviderDraft } from "@/components/watch-provider-editor"
import type { WatchProvider } from "@/lib/types"
import { addMovie, clearMovieSubmissions, deleteMovie, getMovies, refreshMovieFromOmdb, updateMovie, verifyMovie } from "@/services/api"

export function AdminMoviesManager() {
  const [movies, setMovies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [draft, setDraft] = useState<any>({})
  const [providers, setProviders] = useState<WatchProvider[]>([])
  const [providerDraft, setProviderDraft] = useState<WatchProviderDraft>({ provider: { name: "Sun NXT", url: "", regions: ["India"] }, editingIndex: null })
  const [saving, setSaving] = useState(false)
  const [imdbId, setImdbId] = useState("")
  const [adding, setAdding] = useState(false)

  const load = async (nextSkip = skip, query = search) => {
    setLoading(true)
    try { const data = await getMovies(nextSkip, 30, "", query); setMovies(data.movies || data || []); setTotal(data.total || data.movies?.length || 0); setSkip(nextSkip) }
    finally { setLoading(false) }
  }
  useEffect(() => { const query = new URLSearchParams(window.location.search).get("search") || ""; setSearch(query); load(0, query) }, [])

  const openEdit = (movie: any) => {
    setEditing(movie)
    setDraft({ title: movie.title || "", year: movie.year || "", language: movie.language || movie.Language || "", runtime: movie.runtime || "", posterUrl: movie.posterUrl || "" })
    setProviders(movie.watchProviders || [])
    setProviderDraft({ provider: { name: "Sun NXT", url: "", regions: ["India"] }, editingIndex: null })
  }
  const save = async () => {
    if (!editing) return
    const pending = providerDraft.provider
    // The empty editor always has a default provider selected, so a URL is what
    // makes it an actual pending row.
    const hasPendingProvider = Boolean(pending.url.trim())
    let providersToSave = providers
    if (hasPendingProvider) {
      if (!pending.name.trim() || !pending.url.trim()) {
        alert("Complete the provider and URL, or clear the unfinished provider row before saving.")
        return
      }
      try {
        const parsed = new URL(pending.url.trim())
        if (!/^https?:$/.test(parsed.protocol)) throw new Error()
      } catch {
        alert("Enter a valid http(s) provider URL before saving.")
        return
      }
      const preparedProvider = { ...pending, name: pending.name.trim(), url: pending.url.trim(), regions: pending.regions.filter(Boolean) }
      providersToSave = providerDraft.editingIndex === null
        ? [...providers, preparedProvider]
        : providers.map((provider, index) => index === providerDraft.editingIndex ? preparedProvider : provider)
    }
    setSaving(true)
    try { const updated = await updateMovie(editing.id, { ...draft, year: draft.year ? Number(draft.year) : undefined, watchProviders: providersToSave }); setMovies((items) => items.map((item) => item.id === editing.id ? { ...item, ...updated } : item)); setEditing(null) }
    catch (error) { alert(error instanceof Error ? error.message : "Could not update movie") }
    finally { setSaving(false) }
  }
  const add = async () => {
    const match = imdbId.match(/tt\d+/)
    if (!match) return
    setAdding(true)
    try { await addMovie({ imdbId: match[0] }); setImdbId(""); await load(0) }
    catch (error) { alert(error instanceof Error ? error.message : "Could not add movie") }
    finally { setAdding(false) }
  }
  const action = async (movie: any, type: "verify" | "refresh" | "delete") => {
    setBusyId(movie.id)
    try {
      if (type === "verify") { const result = await verifyMovie(movie.id, !movie.verified); setMovies((items) => items.map((item) => item.id === movie.id ? { ...item, verified: result.verified } : item)) }
      if (type === "refresh") { const result = await refreshMovieFromOmdb(movie.id); setMovies((items) => items.map((item) => item.id === movie.id ? { ...item, ...result } : item)) }
      if (type === "delete" && confirm(`Delete ${movie.title}?`)) { await deleteMovie(movie.id); setMovies((items) => items.filter((item) => item.id !== movie.id)); setTotal((value) => Math.max(0, value - 1)) }
    } catch (error) { alert(error instanceof Error ? error.message : "Action failed") }
    finally { setBusyId(null) }
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Add movie</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row"><Input value={imdbId} onChange={(e) => setImdbId(e.target.value)} placeholder="IMDb ID or URL (tt1234567)" onKeyDown={(e) => e.key === "Enter" && add()} /><Button onClick={add} disabled={adding || !/tt\d+/.test(imdbId)}>{adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add from IMDb</Button></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5 text-primary" />Movies ({total})</CardTitle></div><div className="flex w-full max-w-sm gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies" onKeyDown={(e) => e.key === "Enter" && load(0)} /><Button size="icon" variant="outline" onClick={() => load(0)}><Search className="h-4 w-4" /></Button></div></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div> : <div className="divide-y rounded-xl border">
            {movies.map((movie) => <div key={movie.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><Link href={`/movie/${movie.id}`} className="font-semibold hover:text-primary hover:underline">{movie.title}</Link><p className="text-xs text-muted-foreground">{movie.year || "—"} · {movie.language || movie.Language || "Language unknown"} · {movie.runtime || "Runtime unknown"}</p></div>
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="icon" onClick={() => action(movie, "verify")} className={movie.verified ? "text-green-600" : ""} title="Toggle verification"><BadgeCheck className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => action(movie, "refresh")} title="Refresh from OMDb">{busyId === movie.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(movie)} title="Edit movie"><Pencil className="h-4 w-4" /></Button>
                <Button asChild variant="ghost" size="icon"><a href={`https://www.imdb.com/title/${movie.imdbId}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => action(movie, "delete")} title="Delete movie"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>)}
          </div>}
          <div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">{total ? `${skip + 1}–${Math.min(skip + 30, total)} of ${total}` : "No movies"}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={skip === 0 || loading} onClick={() => load(Math.max(0, skip - 30))}>Previous</Button><Button variant="outline" size="sm" disabled={skip + 30 >= total || loading} onClick={() => load(skip + 30)}>Next</Button></div></div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Edit {editing?.title}</DialogTitle><DialogDescription>Update metadata and streaming links from this dedicated movie workspace.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Title"><Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="Year"><Input type="number" value={draft.year || ""} onChange={(e) => setDraft({ ...draft, year: e.target.value })} /></Field><Field label="Language"><Input value={draft.language || ""} onChange={(e) => setDraft({ ...draft, language: e.target.value })} /></Field><Field label="Runtime"><Input value={draft.runtime || ""} onChange={(e) => setDraft({ ...draft, runtime: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Poster URL"><Input value={draft.posterUrl || ""} onChange={(e) => setDraft({ ...draft, posterUrl: e.target.value })} /></Field></div></div>
          <WatchProviderEditor providers={providers} onChange={setProviders} onDraftChange={setProviderDraft} />
          <DialogFooter className="sm:justify-between"><Button variant="destructive" onClick={async () => { if (editing && confirm("Clear every title-card submission for this movie?")) { await clearMovieSubmissions(editing.id); setEditing(null); await load(skip) } }}>Clear title times</Button><div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></div></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
