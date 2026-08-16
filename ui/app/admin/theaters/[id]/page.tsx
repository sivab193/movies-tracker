"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { getTheater, updateTheater } from "@/services/api"
import { Theater, TheaterScreen } from "@/lib/types"

const formats = ["Standard", "IMAX", "Dolby Cinema", "4DX", "ScreenX", "Laser"]
const sounds = ["Standard", "Dolby Atmos", "Dolby 7.1", "Dolby 5.1", "Auro 3D"]
const seating = ["Standard", "Recliner", "Premium", "Sofa", "Wheelchair accessible"]
const emptyScreen = (): TheaterScreen => ({ id: crypto.randomUUID(), name: "", format: "Standard", sound: "Standard", seating: "Standard", capacity: null, screenSize: "", notes: "", verified: false })

export default function AdminTheaterPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { userProfile, loading: authLoading } = useAuth()
  const [theater, setTheater] = useState<Theater | null>(null)
  const [amenities, setAmenities] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !userProfile?.isAdmin) router.replace("/dashboard")
  }, [authLoading, userProfile, router])

  useEffect(() => {
    if (!id || !userProfile?.isAdmin) return
    getTheater(id).then((data) => {
      setTheater(data)
      setAmenities((data.amenities || []).join(", "))
    }).catch((err) => setError(err instanceof Error ? err.message : "Could not load theater"))
  }, [id, userProfile?.isAdmin])

  const change = (field: keyof Theater, value: unknown) => setTheater((current) => current ? { ...current, [field]: value } : current)
  const updateScreen = (index: number, field: keyof TheaterScreen, value: unknown) => change("screens", (theater?.screens || []).map((screen, i) => i === index ? { ...screen, [field]: value } : screen))
  const updatePlatform = (index: number, field: "name" | "url", value: string) => change("ticketPlatforms", (theater?.ticketPlatforms || []).map((platform, i) => i === index ? { ...platform, [field]: value } : platform))

  const save = async () => {
    if (!theater) return
    setSaving(true); setError("")
    try {
      const details = {
        openedYear: theater.openedYear || undefined,
        renovatedYear: theater.renovatedYear || undefined,
        website: theater.website || "",
        notes: theater.notes || "",
        amenities: amenities.split(",").map((item) => item.trim()).filter(Boolean),
        ticketPlatforms: (theater.ticketPlatforms || []).filter((platform) => platform.name.trim()),
        screens: (theater.screens || []).filter((screen) => screen.name.trim()),
      }
      const updated = await updateTheater(theater.id, theater.name, theater.location, theater.gmapsLink, details)
      setTheater(updated)
      setAmenities((updated.amenities || []).join(", "))
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save theater") }
    finally { setSaving(false) }
  }

  if (authLoading || !theater) return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-5xl px-4 py-12 text-muted-foreground">{error || "Loading theater…"}</main></div>

  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <div className="flex items-center justify-between gap-4"><div><Button asChild variant="ghost" size="sm"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Admin dashboard</Link></Button><h1 className="mt-2 text-2xl font-bold">Manage {theater.name}</h1><p className="text-sm text-muted-foreground">Screen specs, amenities, booking links, and venue details shown on the public theater page.</p></div><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button></div>
    {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Card><CardHeader><CardTitle>Venue details</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Name" value={theater.name} onChange={(value) => change("name", value)} /><Field label="Location" value={theater.location || ""} onChange={(value) => change("location", value)} /><Field label="Google Maps URL" value={theater.gmapsLink || ""} onChange={(value) => change("gmapsLink", value)} /><Field label="Website" value={theater.website || ""} onChange={(value) => change("website", value)} /><Field label="Year opened" type="number" value={theater.openedYear?.toString() || ""} onChange={(value) => change("openedYear", value ? Number(value) : undefined)} /><Field label="Year renovated" type="number" value={theater.renovatedYear?.toString() || ""} onChange={(value) => change("renovatedYear", value ? Number(value) : undefined)} /><div className="space-y-2 md:col-span-2"><Label>Amenities (comma-separated)</Label><Input value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="Parking, Food court, Wheelchair access" /></div><div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={theater.notes || ""} onChange={(e) => change("notes", e.target.value)} placeholder="Useful visitor information, policies, or renovation notes" /></div></CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Screens</CardTitle><Button variant="outline" size="sm" onClick={() => change("screens", [...(theater.screens || []), emptyScreen()])}><Plus className="mr-1 h-4 w-4" />Add screen</Button></CardHeader><CardContent className="space-y-4">{(theater.screens || []).map((screen, index) => <div key={screen.id} className="rounded-lg border p-4"><div className="mb-3 flex items-center justify-between"><strong>Screen {index + 1}</strong><Button variant="ghost" size="icon" onClick={() => change("screens", (theater.screens || []).filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div><div className="grid gap-3 md:grid-cols-3"><Field label="Screen name" value={screen.name} onChange={(value) => updateScreen(index, "name", value)} /><Choice label="Format" value={screen.format} options={formats} onChange={(value) => updateScreen(index, "format", value)} /><Choice label="Sound" value={screen.sound} options={sounds} onChange={(value) => updateScreen(index, "sound", value)} /><Choice label="Seating" value={screen.seating} options={seating} onChange={(value) => updateScreen(index, "seating", value)} /><Field label="Capacity" type="number" value={screen.capacity?.toString() || ""} onChange={(value) => updateScreen(index, "capacity", value ? Number(value) : null)} /><Field label="Screen size" value={screen.screenSize} onChange={(value) => updateScreen(index, "screenSize", value)} /></div><div className="mt-3 space-y-2"><Label>Screen notes</Label><Textarea value={screen.notes} onChange={(e) => updateScreen(index, "notes", e.target.value)} /></div></div>)}{!theater.screens?.length && <p className="text-sm text-muted-foreground">No screen details yet.</p>}</CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Ticket platforms</CardTitle><Button variant="outline" size="sm" onClick={() => change("ticketPlatforms", [...(theater.ticketPlatforms || []), { name: "", url: "" }])}><Plus className="mr-1 h-4 w-4" />Add platform</Button></CardHeader><CardContent className="space-y-3"><datalist id="ticket-platforms"><option value="District" /><option value="BookMyShow" /><option value="Fandango" /></datalist>{(theater.ticketPlatforms || []).map((platform, index) => <div className="flex gap-2" key={index}><Input value={platform.name} list="ticket-platforms" placeholder="BookMyShow" onChange={(e) => updatePlatform(index, "name", e.target.value)} /><Input value={platform.url} placeholder="https://…" onChange={(e) => updatePlatform(index, "url", e.target.value)} /><Button variant="ghost" size="icon" onClick={() => change("ticketPlatforms", (theater.ticketPlatforms || []).filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>
  </main></div>
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div> }
function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <div className="space-y-2"><Label>{label}</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></div> }
