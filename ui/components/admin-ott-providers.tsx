"use client"

import { ChangeEvent, useState } from "react"
import { Globe2, ImageIcon, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { useOttProviders } from "@/contexts/ott-provider-context"
import { createOttProvider, deleteOttProvider, updateOttProvider, type OttProviderDefinition, type OttProviderDraft } from "@/services/ott-provider-service"
import { OttMark } from "@/components/ott-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const emptyDraft: OttProviderDraft = { name: "", baseUrl: "", iconUrl: "", iconImage: "", iconText: "", backgroundColor: "#7c3aed", textColor: "#ffffff" }

export function AdminOttProviders() {
  const { providers, refresh } = useOttProviders()
  const [editing, setEditing] = useState<OttProviderDefinition | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const startAdd = () => { setEditing(null); setDraft({ ...emptyDraft }); setError(""); setOpen(true) }
  const startEdit = (provider: OttProviderDefinition) => {
    setEditing(provider)
    setDraft({ name: provider.name, baseUrl: provider.baseUrl, iconUrl: provider.iconUrl?.startsWith("http") ? provider.iconUrl : "", iconImage: "", iconText: provider.iconText || "", backgroundColor: provider.backgroundColor || "#7c3aed", textColor: provider.textColor || "#ffffff" })
    setError("")
    setOpen(true)
  }

  const chooseIcon = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return }
    if (file.size > 1024 * 1024) { setError("Logo files must be 1 MB or smaller."); return }
    const reader = new FileReader()
    reader.onload = () => setDraft((current) => ({ ...current, iconImage: typeof reader.result === "string" ? reader.result : "", iconUrl: "" }))
    reader.onerror = () => setError("Could not read that image file.")
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const payload = { ...draft }
      if (!payload.iconImage) delete payload.iconImage
      if (!payload.iconUrl || !/^https?:\/\//i.test(payload.iconUrl)) delete payload.iconUrl
      if (editing) await updateOttProvider(editing.id, payload)
      else await createOttProvider(payload)
      await refresh()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save provider")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (provider: OttProviderDefinition) => {
    if (provider.isDefault || !confirm(`Delete ${provider.name} from the provider registry?`)) return
    try { await deleteOttProvider(provider.id); await refresh() }
    catch (err) { alert(err instanceof Error ? err.message : "Could not delete provider") }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-primary" />Watch-provider registry</CardTitle><p className="mt-1 text-sm text-muted-foreground">One shared name, base URL and icon used across movies, series and the OTT catalog.</p></div>
        <Button onClick={startAdd} className="shrink-0 gap-2"><Plus className="h-4 w-4" />Add provider</Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
              <OttMark name={provider.name} />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{provider.name}</p><p className="truncate text-xs text-muted-foreground">{provider.baseUrl}</p></div>
              <Button variant="ghost" size="icon" onClick={() => startEdit(provider)} aria-label={`Edit ${provider.name}`}><Pencil className="h-4 w-4" /></Button>
              {!provider.isDefault && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(provider)} aria-label={`Delete ${provider.name}`}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit watch provider" : "Add watch provider"}</DialogTitle><DialogDescription>Renaming a provider also updates its existing movie and series links.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider name"><Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Netflix" /></Field>
            <Field label="Base URL"><Input value={draft.baseUrl || ""} onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })} placeholder="https://provider.com" type="url" /></Field>
            <Field label="Logo / icon URL" wide><Input value={draft.iconUrl || ""} onChange={(e) => setDraft({ ...draft, iconUrl: e.target.value, iconImage: "" })} placeholder="https://provider.com/icon.png (stored in database)" type="url" /><p className="text-xs text-muted-foreground">The server downloads this image and stores it in the database.</p></Field>
            <Field label="Or upload a logo" wide><div className="flex items-center gap-2"><Input type="file" accept="image/*" onChange={chooseIcon} className="cursor-pointer" /><Upload className="h-4 w-4 shrink-0 text-muted-foreground" /></div><p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or SVG up to 1 MB.</p></Field>
            <Field label="Fallback icon text"><Input value={draft.iconText || ""} onChange={(e) => setDraft({ ...draft, iconText: e.target.value.slice(0, 4) })} placeholder="N" maxLength={4} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Background"><Input type="color" value={draft.backgroundColor || "#7c3aed"} onChange={(e) => setDraft({ ...draft, backgroundColor: e.target.value })} /></Field><Field label="Text"><Input type="color" value={draft.textColor || "#ffffff"} onChange={(e) => setDraft({ ...draft, textColor: e.target.value })} /></Field></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3"><ProviderPreview {...draft} /><div><p className="text-sm font-medium">Shared icon preview</p><p className="text-xs text-muted-foreground">Shown wherever this provider appears.</p></div></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving || !draft.name?.trim() || !draft.baseUrl?.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save provider</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function ProviderPreview({ name = "", iconUrl = "", iconImage = "", iconText = "", backgroundColor = "#7c3aed", textColor = "#ffffff" }: OttProviderDraft) {
  const letters = (iconText || name.replace(/[^a-z0-9]/gi, "").slice(0, 2) || "?").toUpperCase()
  const imageSource = iconImage || iconUrl
  return <span aria-hidden="true" style={imageSource ? undefined : { backgroundColor, color: textColor }} className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[10px] font-black tracking-tight shadow-sm", imageSource && "bg-white")}>{imageSource ? <img src={imageSource} alt="" className="h-full w-full object-contain p-1" /> : <><ImageIcon className="mr-0.5 h-3 w-3" />{letters}</>}</span>
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>
}
