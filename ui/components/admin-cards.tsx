"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CollapsibleSection } from "@/components/collapsible-section"
import { CreditCard, Flag, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import {
    getAllCards,
    createCard,
    updateCard,
    deleteCard,
    getCardReports,
    resolveCardReport,
} from "@/services/card-service"
import type { CardInfo, CardOffer, CardReport } from "@/lib/types"

type DraftOffer = Partial<CardOffer> & { platform: string; offerType: string; description: string }

const emptyOffer = (): DraftOffer => ({
    platform: "BookMyShow",
    offerType: "discount",
    description: "",
    maxDiscount: 0,
    usesPerMonth: 1,
    minTickets: 1,
    couponCode: null,
    perDayLimit: null,
    notes: "",
    isActive: true,
})

const emptyCard = () => ({
    name: "",
    bank: "",
    type: "debit" as "debit" | "credit",
    network: "",
    offers: [emptyOffer()] as DraftOffer[],
})

export function AdminCards({ standalone = false }: { standalone?: boolean } = {}) {
    const [cards, setCards] = useState<CardInfo[]>([])
    const [reports, setReports] = useState<CardReport[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCardId, setEditingCardId] = useState<string | null>(null)
    const [draft, setDraft] = useState(emptyCard())
    const [saving, setSaving] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<CardInfo | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [resolvingReportId, setResolvingReportId] = useState<string | null>(null)

    const loadData = async () => {
        try {
            const [cardsData, reportsData] = await Promise.all([
                getAllCards(),
                getCardReports().catch(() => []),
            ])
            setCards(cardsData)
            setReports(reportsData)
        } catch (err) {
            console.error("Failed to load cards", err)
            setError(err instanceof Error ? err.message : "Failed to load cards")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const openAddModal = () => {
        setEditingCardId(null)
        setDraft(emptyCard())
        setIsModalOpen(true)
    }

    const openEditModal = (card: CardInfo) => {
        setEditingCardId(card.id)
        setDraft({
            name: card.name,
            bank: card.bank,
            type: card.type,
            network: card.network,
            offers: card.offers.map((o) => ({ ...o })),
        })
        setIsModalOpen(true)
    }

    const addOfferRow = () => {
        setDraft((d) => ({ ...d, offers: [...d.offers, emptyOffer()] }))
    }

    const removeOfferRow = (idx: number) => {
        setDraft((d) => ({ ...d, offers: d.offers.filter((_, i) => i !== idx) }))
    }

    const updateOfferRow = (idx: number, patch: Partial<DraftOffer>) => {
        setDraft((d) => ({
            ...d,
            offers: d.offers.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
        }))
    }

    const handleSave = async () => {
        if (!draft.name.trim() || !draft.bank.trim()) {
            setError("Card name and bank are required")
            return
        }
        setSaving(true)
        setError(null)
        try {
            const payload = {
                name: draft.name.trim(),
                bank: draft.bank.trim(),
                type: draft.type,
                network: draft.network.trim(),
                offers: draft.offers.map((o) => ({
                    ...o,
                    maxDiscount: Number(o.maxDiscount) || 0,
                    usesPerMonth: Number(o.usesPerMonth) || 0,
                    minTickets: Number(o.minTickets) || 0,
                    perDayLimit: o.perDayLimit ? Number(o.perDayLimit) : null,
                    couponCode: o.couponCode || null,
                })),
            }

            if (editingCardId) {
                await updateCard(editingCardId, payload as any)
            } else {
                await createCard(payload as any)
            }
            setIsModalOpen(false)
            await loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save card")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteCard(deleteTarget.id)
            setCards((prev) => prev.filter((c) => c.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete card")
        } finally {
            setDeleting(false)
        }
    }

    const handleResolveReport = async (report: CardReport, status: "resolved" | "dismissed") => {
        setResolvingReportId(report.id)
        try {
            await resolveCardReport(report.id, status)
            setReports((prev) => prev.filter((r) => r.id !== report.id))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resolve report")
        } finally {
            setResolvingReportId(null)
        }
    }

    return (
        <>
            <CollapsibleSection
                defaultOpen={standalone}
                title={
                    <>
                        <CreditCard className="h-5 w-5 text-primary" />
                        Cards & Offers ({cards.length})
                    </>
                }
                description="Manage bank cards and their movie ticket offers"
                headerActions={
                    <Button onClick={openAddModal} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Card
                    </Button>
                }
                contentClassName="space-y-6"
            >
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {reports.length > 0 && (
                            <div className="p-4 border rounded-lg bg-amber-500/5 border-amber-500/30 space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-amber-500" />
                                    Pending Reports ({reports.length})
                                </h4>
                                <div className="space-y-2">
                                    {reports.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-background rounded-md border text-sm">
                                            <div>
                                                <div className="font-medium">{r.cardName || "Unknown card"}</div>
                                                <div className="text-muted-foreground text-xs mt-0.5">{r.reason}</div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={resolvingReportId === r.id}
                                                    onClick={() => handleResolveReport(r, "dismissed")}
                                                >
                                                    Dismiss
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={resolvingReportId === r.id}
                                                    onClick={() => handleResolveReport(r, "resolved")}
                                                >
                                                    {resolvingReportId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resolve"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-3">
                            {cards.map((card) => (
                                <div key={card.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                                    <div className="min-w-0">
                                        <div className="font-semibold flex items-center gap-2">
                                            {card.name}
                                            <span className="text-[10px] uppercase bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                                                {card.type}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {card.bank} • {card.network} • {card.offers.length} offer{card.offers.length === 1 ? "" : "s"}
                                        </div>
                                        {card.reportCount > 0 && (
                                            <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                <Flag className="h-3 w-3" />
                                                {card.reportCount} report{card.reportCount === 1 ? "" : "s"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(card)} title="Edit Card">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeleteTarget(card)}
                                            title="Delete Card"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {cards.length === 0 && (
                                <p className="text-center py-8 text-muted-foreground text-sm">No cards yet. Add one to get started.</p>
                            )}
                        </div>
                    </>
                )}
            </CollapsibleSection>

            {/* Add/Edit Card Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCardId ? "Edit Card" : "Add Card"}</DialogTitle>
                        <DialogDescription>
                            Enter card details and its movie ticket offers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Card Name</Label>
                                <Input
                                    value={draft.name}
                                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                                    placeholder="e.g. Axis Burgundy Debit"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bank</Label>
                                <Input
                                    value={draft.bank}
                                    onChange={(e) => setDraft((d) => ({ ...d, bank: e.target.value }))}
                                    placeholder="e.g. Axis Bank"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v as "debit" | "credit" }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="debit">Debit</SelectItem>
                                        <SelectItem value="credit">Credit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Network</Label>
                                <Input
                                    value={draft.network}
                                    onChange={(e) => setDraft((d) => ({ ...d, network: e.target.value }))}
                                    placeholder="e.g. Visa, RuPay Select"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Offers</Label>
                                <Button type="button" size="sm" variant="outline" onClick={addOfferRow} className="gap-1">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Offer
                                </Button>
                            </div>

                            {draft.offers.map((offer, idx) => (
                                <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-3 relative">
                                    {draft.offers.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeOfferRow(idx)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 pr-6">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Platform</Label>
                                            <Select value={offer.platform} onValueChange={(v) => updateOfferRow(idx, { platform: v as DraftOffer["platform"] })}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BookMyShow">BookMyShow</SelectItem>
                                                    <SelectItem value="District">District</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Offer Type</Label>
                                            <Select value={offer.offerType} onValueChange={(v) => updateOfferRow(idx, { offerType: v as DraftOffer["offerType"] })}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BOGO">BOGO</SelectItem>
                                                    <SelectItem value="discount">Discount</SelectItem>
                                                    <SelectItem value="cashback">Cashback</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Description</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={offer.description}
                                            onChange={(e) => updateOfferRow(idx, { description: e.target.value })}
                                            placeholder="e.g. Buy 1 Get 1 Free on movie tickets"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Max Discount (₹)</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                type="number"
                                                value={offer.maxDiscount ?? ""}
                                                onChange={(e) => updateOfferRow(idx, { maxDiscount: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Uses / Month</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                type="number"
                                                value={offer.usesPerMonth ?? ""}
                                                onChange={(e) => updateOfferRow(idx, { usesPerMonth: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Min Tickets</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                type="number"
                                                value={offer.minTickets ?? ""}
                                                onChange={(e) => updateOfferRow(idx, { minTickets: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Per Day Limit</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                type="number"
                                                value={offer.perDayLimit ?? ""}
                                                onChange={(e) => updateOfferRow(idx, { perDayLimit: e.target.value ? Number(e.target.value) : null })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Coupon Code (optional)</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={offer.couponCode ?? ""}
                                            onChange={(e) => updateOfferRow(idx, { couponCode: e.target.value || null })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Notes</Label>
                                        <Textarea
                                            className="text-xs min-h-16"
                                            value={offer.notes ?? ""}
                                            onChange={(e) => updateOfferRow(idx, { notes: e.target.value })}
                                            placeholder="Terms, eligibility, how to redeem..."
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={offer.isActive ?? true}
                                            onCheckedChange={(checked) => updateOfferRow(idx, { isActive: checked })}
                                        />
                                        <Label className="text-xs">Offer is active</Label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !draft.name.trim() || !draft.bank.trim()}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingCardId ? "Save Changes" : "Add Card"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Card</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Users who have added this card will lose access to its offers. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
