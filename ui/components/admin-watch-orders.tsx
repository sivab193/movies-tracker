"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CollapsibleSection } from "@/components/collapsible-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllWatchOrders, updateWatchOrder } from "@/services/watch-order-service"
import type { WatchOrder } from "@/lib/types"
import { Check, Copy, ExternalLink, ListOrdered, Loader2, Pencil, X } from "lucide-react"

const SLUG_HINT = "Lowercase letters, numbers and dashes only"

export function AdminWatchOrders({ standalone = false }: { standalone?: boolean } = {}) {
  const [orders, setOrders] = useState<WatchOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [draftSlug, setDraftSlug] = useState("")
  const [draftDescription, setDraftDescription] = useState("")
  const [draftPosterItemIds, setDraftPosterItemIds] = useState<string[]>([])
  const [draftCoverImage, setDraftCoverImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    getAllWatchOrders()
      .then(setOrders)
      .catch((err) => {
        console.error("Failed to load watch orders", err)
        setError("Failed to load watch orders")
      })
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (order: WatchOrder) => {
    setEditingId(order.id)
    setDraftName(order.name || "")
    setDraftSlug(order.slug || "")
    setDraftDescription(order.description || "")
    setDraftPosterItemIds(order.posterItemIds || [])
    setDraftCoverImage(null)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const setCoverFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Cover image must be a JPEG, PNG, or WebP no larger than 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setDraftCoverImage(String(reader.result))
      setDraftPosterItemIds([])
    }
    reader.readAsDataURL(file)
  }

  const save = async (order: WatchOrder) => {
    const slug = draftSlug.trim().toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError(`Invalid short link. ${SLUG_HINT}.`)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await updateWatchOrder(order.id, {
        name: draftName.trim(),
        slug,
        description: draftDescription.trim(),
        posterItemIds: draftPosterItemIds,
        clearCoverImage: draftPosterItemIds.length > 0,
        ...(draftCoverImage ? { coverImage: draftCoverImage } : {}),
      })
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save watch order")
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async (order: WatchOrder) => {
    const url = `${window.location.origin}/w/${order.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(order.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      window.prompt("Copy this link", url)
    }
  }

  return (
    <CollapsibleSection
      defaultOpen={standalone}
      title={
        <>
          <ListOrdered className="h-5 w-5 text-primary" />
          Watch Orders ({orders.length})
        </>
      }
      description="Edit the name, description and public short link (/w/…) of each curated watch order. Items are managed by the import scripts."
    >
        {error && !editingId && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            No watch orders yet. Create them with the import scripts.
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isEditing = editingId === order.id

              if (isEditing) {
                return (
                  <div key={order.id} className="space-y-3 rounded-lg border border-primary/40 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`name-${order.id}`}>Name</Label>
                        <Input
                          id={`name-${order.id}`}
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`slug-${order.id}`}>Short link</Label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-muted-foreground">/w/</span>
                          <Input
                            id={`slug-${order.id}`}
                            value={draftSlug}
                            onChange={(e) => setDraftSlug(e.target.value)}
                            placeholder="mcu-timeline"
                            className="h-9"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{SLUG_HINT}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`desc-${order.id}`}>Description</Label>
                      <Input
                        id={`desc-${order.id}`}
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2 rounded-md border border-dashed p-3">
                      <Label>Card cover</Label>
                      <p className="text-xs text-muted-foreground">
                        Upload one custom image, or choose up to five title posters for the saved poster strip.
                      </p>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setCoverFile(event.target.files?.[0])}
                        className="h-9"
                      />
                      <select
                        multiple
                        value={draftPosterItemIds}
                        onChange={(event) => {
                          const values = Array.from(event.currentTarget.selectedOptions).map((option) => option.value).slice(0, 5)
                          setDraftPosterItemIds(values)
                          if (values.length) setDraftCoverImage(null)
                        }}
                        className="h-28 w-full rounded-md border bg-background p-2 text-sm"
                      >
                        {(order.items || []).map((item) => (
                          <option key={item.id || item.itemId} value={item.itemId}>
                            {item.title || item.itemId} ({item.year || 'Unknown year'})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">Hold ⌘/Ctrl to select multiple posters.</p>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving} className="gap-1.5">
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => save(order)} disabled={saving} className="gap-1.5">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Save
                      </Button>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.name}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {order.items?.length || 0} items
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <code className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">/w/{order.slug}</code>
                      <Link
                        href={`/w/${order.slug}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground"
                        title="Open public page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {order.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{order.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => copyLink(order)}
                      title="Copy short link"
                    >
                      {copiedId === order.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedId === order.id ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      onClick={() => startEdit(order)}
                      title="Edit watch order"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </CollapsibleSection>
  )
}
