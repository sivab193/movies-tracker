"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addTheater, bulkAddTheaters, deleteTheater, getTheaters, updateTheater, verifyTheater } from "@/services/api"

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

  return <>
    <datalist id="admin-theater-cities">{cities.map((item) => <option value={item} key={item} />)}</datalist>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Add theater</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-[1fr_220px_1fr_auto]"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Theater name" /><Input list="admin-theater-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Select or type city" /><Input value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="Google Maps URL" /><Button onClick={add} disabled={adding || !name.trim()}>{adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Bulk import</CardTitle><p className="text-sm text-muted-foreground">Paste one theater per line as name, or name followed by a tab and Google Maps link.</p></CardHeader><CardContent className="space-y-3"><Input list="admin-theater-cities" value={bulkCity} onChange={(e) => setBulkCity(e.target.value)} placeholder="Select or type city for this batch" /><Textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={5} placeholder={"Theater name\thttps://maps.google.com/..."} />{parsedBulk.length > 0 && <div className="rounded-xl border"><div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">Preview ({parsedBulk.length})</div>{parsedBulk.slice(0, 8).map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between border-b px-3 py-2 text-sm last:border-0"><span>{item.name}</span><span className="truncate text-xs text-muted-foreground">{item.gmapsLink || "No map link"}</span></div>)}</div>}<Button onClick={addBulk} disabled={bulkAdding || !bulkCity.trim() || !parsedBulk.length}>{bulkAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Import {parsedBulk.length || ""} theaters</Button></CardContent></Card>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Theaters ({theaters.length})</CardTitle><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search theaters or cities" /></div></CardHeader><CardContent>{loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : <div className="divide-y rounded-xl border">{filtered.map((item) => <div key={item.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><Link href={`/admin/theaters/${item.id}`} className="font-semibold hover:text-primary hover:underline">{item.name}</Link><p className="text-xs text-muted-foreground">{item.location || "Location not set"}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" className={item.verified ? "text-green-600" : ""} onClick={() => toggleVerify(item)}><BadgeCheck className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setEditing(item); setDraft({ name: item.name, location: item.location || "", gmapsLink: item.gmapsLink || "" }) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}</CardContent></Card>
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit theater</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Name"><Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="City / location"><Input list="admin-theater-cities" value={draft.location || ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></Field><Field label="Google Maps URL"><Input value={draft.gmapsLink || ""} onChange={(e) => setDraft({ ...draft, gmapsLink: e.target.value })} /></Field></div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter></DialogContent></Dialog>
  </>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
