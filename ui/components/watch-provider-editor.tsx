"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OTT_OPTIONS, OttMark } from "@/components/ott-provider"
import type { WatchProvider } from "@/lib/types"

export function WatchProviderEditor({ providers, onChange }: { providers: WatchProvider[]; onChange: (providers: WatchProvider[]) => void }) {
  const [selectedName, setSelectedName] = useState("Sun NXT")
  const [customName, setCustomName] = useState("")
  const [url, setUrl] = useState("")
  const [regions, setRegions] = useState("India")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const name = selectedName === "Other" ? customName.trim() : selectedName

  const saveProvider = () => {
    if (!name || !url.trim()) return
    const next = { name, url: url.trim(), regions: regions.split(",").map((region) => region.trim()).filter(Boolean) }
    onChange(editingIndex === null ? [...providers, next] : providers.map((provider, index) => index === editingIndex ? next : provider))
    setUrl("")
    setRegions("India")
    setSelectedName("Sun NXT")
    setCustomName("")
    setEditingIndex(null)
  }

  const edit = (provider: WatchProvider, index: number) => {
    const known = OTT_OPTIONS.includes(provider.name)
    setSelectedName(known ? provider.name : "Other")
    setCustomName(known ? "" : provider.name)
    setUrl(provider.url)
    setRegions(provider.regions.join(", "))
    setEditingIndex(index)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-base font-semibold">Watch online</Label>
        <p className="text-xs text-muted-foreground">Add the OTT, its direct title link, and the regions where it can be watched.</p>
      </div>
      {providers.length > 0 && <div className="space-y-2">
        {providers.map((provider, index) => <div key={`${provider.name}-${provider.url}-${index}`} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2.5">
          <OttMark name={provider.name} />
          <div className="min-w-0 flex-1 text-sm"><p className="font-medium">{provider.name}</p><p className="truncate text-xs text-muted-foreground">{provider.regions.join(", ") || "No region set"} · {provider.url}</p></div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => edit(provider, index)} aria-label={`Edit ${provider.name}`}><Pencil className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => { onChange(providers.filter((_, itemIndex) => itemIndex !== index)); if (editingIndex === index) setEditingIndex(null) }} aria-label={`Remove ${provider.name}`}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </div>}
      <div className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-2">
        <Select value={selectedName} onValueChange={setSelectedName}><SelectTrigger className="w-full"><SelectValue placeholder="Choose OTT" /></SelectTrigger><SelectContent>{OTT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
        {selectedName === "Other" && <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="OTT name" />}
        <Input value={url} onChange={(e) => setUrl(e.target.value)} className={selectedName === "Other" ? "sm:col-span-2" : "sm:col-span-2"} placeholder="https://provider.com/title/..." type="url" />
        <Input value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="India, United States" />
        <Button type="button" variant="secondary" onClick={saveProvider} disabled={!name || !url.trim()} className="gap-2">{editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}{editingIndex === null ? "Add provider" : "Update provider"}</Button>
      </div>
    </div>
  )
}
