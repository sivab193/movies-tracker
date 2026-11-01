"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BadgeCheck, CheckCircle2, FileJson, Loader2, MapPin, Pencil, Plus, Search, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addTheater, bulkAddTheaters, deleteTheater, getTheaters, importTheatersJson, type TheaterImportEntry, updateTheater, verifyTheater } from "@/services/api"

export function AdminTheatersManager() {
  const [theaters, setTheaters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("")
  const [name, setName] = useState("")
  const [maps, setMaps] = useState("")
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [draft, setDraft] = useState<any>({})
  const [bulkCity, setBulkCity] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [bulkAdding, setBulkAdding] = useState(false)
  const [jsonFileName, setJsonFileName] = useState("")
  const [jsonEntries, setJsonEntries] = useState<TheaterImportEntry[]>([])
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [jsonResult, setJsonResult] = useState<{ created: number; skipped: number } | null>(null)
  const [jsonImporting, setJsonImporting] = useState(false)

  const load = async () => { setLoading(true); try { setTheaters(await getTheaters()) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const cities = useMemo(() => Array.from(new Set(theaters.map((item) => item.location).filter(Boolean))).sort(), [theaters])
  const filtered = theaters.filter((item) => !search.trim() || `${item.name} ${item.location}`.toLowerCase().includes(search.toLowerCase()))
  const add = async () => { if (!name.trim()) return; setAdding(true); try { await addTheater(name.trim(), city.trim(), maps.trim()); setName(""); setMaps(""); await load() } catch (error) { alert(error instanceof Error ? error.message : "Could not add theater") } finally { setAdding(false) } }
  const save = async () => { if (!editing) return; try { await updateTheater(editing.id, draft.name, draft.location, draft.gmapsLink); setEditing(null); await load() } catch (error) { alert(error instanceof Error ? error.message : "Could not update theater") } }
  const remove = async (item: any) => { if (!confirm(`Delete ${item.name}?`)) return; await deleteTheater(item.id); setTheaters((items) => items.filter((theater) => theater.id !== item.id)) }
  const toggleVerify = async (item: any) => { const result = await verifyTheater(item.id, !item.verified); setTheaters((items) => items.map((theater) => theater.id === item.id ? { ...theater, verified: result.verified } : theater)) }
  const parsedBulk = bulkText.split(/\r?\n/).map((line) => { const [entryName, gmapsLink] = line.split("\t"); return { name: entryName?.trim(), gmapsLink: gmapsLink?.trim() } }).filter((item) => item.name)
  const addBulk = async () => { if (!bulkCity.trim() || !parsedBulk.length) return; setBulkAdding(true); try { await bulkAddTheaters(bulkCity.trim(), parsedBulk); setBulkText(""); await load() } catch (error) { alert(error instanceof Error ? error.message : "Could not import theaters") } finally { setBulkAdding(false) } }
  const selectJsonFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setJsonError(null); setJsonResult(null); setJsonEntries([]); setJsonFileName("")
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Choose a JSON array with at least one theater.")
      if (parsed.length > 500) throw new Error("A single upload can contain at most 500 theaters.")
      setJsonEntries(parsed as TheaterImportEntry[])
      setJsonFileName(file.name)
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Could not read this JSON file.")
    } finally {
      event.target.value = ""
    }
  }
  const importJson = async () => {
    if (!jsonEntries.length) return
    setJsonImporting(true); setJsonError(null); setJsonResult(null)
    try {
      const result = await importTheatersJson(jsonEntries)
      setJsonResult({ created: result.created.length, skipped: result.skipped.length })
      setJsonEntries([]); setJsonFileName("")
      await load()
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Could not import theater JSON.")
    } finally { setJsonImporting(false) }
  }

  return <>
    <datalist id="admin-theater-cities">{cities.map((item) => <option value={item} key={item} />)}</datalist>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Add theater</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-[1fr_220px_1fr_auto]"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Theater name" /><Input list="admin-theater-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Select or type city" /><Input value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="Google Maps URL" /><Button onClick={add} disabled={adding || !name.trim()}>{adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Bulk import</CardTitle><p className="text-sm text-muted-foreground">Paste one theater per line as name, or name followed by a tab and Google Maps link.</p></CardHeader><CardContent className="space-y-3"><Input list="admin-theater-cities" value={bulkCity} onChange={(e) => setBulkCity(e.target.value)} placeholder="Select or type city for this batch" /><Textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={5} placeholder={"Theater name\thttps://maps.google.com/..."} />{parsedBulk.length > 0 && <div className="rounded-xl border"><div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">Preview ({parsedBulk.length})</div>{parsedBulk.slice(0, 8).map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between border-b px-3 py-2 text-sm last:border-0"><span>{item.name}</span><span className="truncate text-xs text-muted-foreground">{item.gmapsLink || "No map link"}</span></div>)}</div>}<Button onClick={addBulk} disabled={bulkAdding || !bulkCity.trim() || !parsedBulk.length}>{bulkAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Import {parsedBulk.length || ""} theaters</Button></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" />Import theater JSON</CardTitle><p className="text-sm text-muted-foreground">Upload a JSON array like the San Francisco theater file. MediaVerse keeps each theater’s location, Maps link, website, ticket platforms, notes, and external reference.</p></CardHeader><CardContent className="space-y-4"><div><Input id="theater-json-file" type="file" accept="application/json,.json" onChange={selectJsonFile} className="sr-only" /><Button type="button" variant="outline" onClick={() => document.getElementById("theater-json-file")?.click()}><Upload />Choose JSON file</Button></div>{jsonEntries.length > 0 && <div className="rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{jsonFileName} is ready</p><p className="text-sm text-muted-foreground">{jsonEntries.length} theater{jsonEntries.length === 1 ? "" : "s"} will be validated before anything is saved. Existing name-and-location matches will be skipped.</p></div><Button onClick={importJson} disabled={jsonImporting}>{jsonImporting ? <Loader2 className="animate-spin" /> : <Upload />}Import {jsonEntries.length} theater{jsonEntries.length === 1 ? "" : "s"}</Button></div><div className="mt-3 divide-y rounded-lg border bg-background">{jsonEntries.slice(0, 5).map((item, index) => <div key={`${item.name || "row"}-${index}`} className="flex items-center justify-between gap-4 px-3 py-2 text-sm"><span className="font-medium">{item.name || `Row ${index + 1}`}</span><span className="truncate text-muted-foreground">{item.location || "Location missing"}</span></div>)}{jsonEntries.length > 5 && <p className="px-3 py-2 text-xs text-muted-foreground">Plus {jsonEntries.length - 5} more theaters</p>}</div></div>}{jsonError && <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{jsonError}</div>}{jsonResult && <div role="status" className="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Imported {jsonResult.created} theater{jsonResult.created === 1 ? "" : "s"}{jsonResult.skipped ? `; skipped ${jsonResult.skipped} existing record${jsonResult.skipped === 1 ? "" : "s"}.` : "."}</div>}</CardContent></Card>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Theaters ({theaters.length})</CardTitle><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search theaters or cities" /></div></CardHeader><CardContent>{loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : <div className="divide-y rounded-xl border">{filtered.map((item) => <div key={item.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><Link href={`/admin/theaters/${item.id}`} className="font-semibold hover:text-primary hover:underline">{item.name}</Link><p className="text-xs text-muted-foreground">{item.location || "Location not set"}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" className={item.verified ? "text-green-600" : ""} onClick={() => toggleVerify(item)}><BadgeCheck className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setEditing(item); setDraft({ name: item.name, location: item.location || "", gmapsLink: item.gmapsLink || "" }) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}</CardContent></Card>
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit theater</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Name"><Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="City / location"><Input list="admin-theater-cities" value={draft.location || ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></Field><Field label="Google Maps URL"><Input value={draft.gmapsLink || ""} onChange={(e) => setDraft({ ...draft, gmapsLink: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter></DialogContent></Dialog>
  </>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
