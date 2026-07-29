"use client"

import { useState } from "react"
import { Share2, Loader2, Download, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"

export interface WrappedStats {
    displayName: string
    totalMovies: number
    totalHours: number
    totalRuntimeLabel: string
    spentLabel: string
    theatersVisited: number
    citiesExplored: number
    topMovie: { title: string; count: number } | null
    topTheater: { name: string; count: number } | null
    lastWatched: { title: string; date: string } | null
    thisYearCount: number
    totalRewatches: number
    year: number
    languagesCount: number
    maxWatchesInMonth: number
    maxWatchesInDay: number
}

const SITE = "mv.siv19.dev"
const INSTA = "@media.verse.tv"

// Rounded rectangle path helper
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
}

export type StatSelection = {
    totalRuntime: boolean;
    totalHours: boolean;
    totalSpent: boolean;
    theatersVisited: boolean;
    citiesExplored: boolean;
    watchedThisYear: boolean;
    rewatches: boolean;
    mostWatched: boolean;
    favoriteTheater: boolean;
    lastWatched: boolean;
    languagesCount: boolean;
    maxWatchesInMonth: boolean;
    maxWatchesInDay: boolean;
}

// Draw a location pin icon (replaces emoji for better visibility)
function drawLocationPin(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.save()
    const s = size / 24 // scale factor from 24px base
    ctx.translate(cx - 12 * s, cy - 24 * s)
    ctx.scale(s, s)

    // Pin body
    ctx.beginPath()
    ctx.arc(12, 10, 8, Math.PI, 0, false)
    ctx.quadraticCurveTo(20, 18, 12, 28)
    ctx.quadraticCurveTo(4, 18, 4, 10)
    ctx.closePath()
    ctx.fillStyle = "#ff4b4b"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.5)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Inner dot
    ctx.beginPath()
    ctx.arc(12, 10, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()

    ctx.restore()
}

// Draw a popcorn icon (replaces emoji for consistency)
function drawPopcornIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.save()
    const s = size / 24
    ctx.translate(cx - 12 * s, cy - 12 * s)
    ctx.scale(s, s)

    // Bucket
    ctx.beginPath()
    ctx.moveTo(5, 10)
    ctx.lineTo(7, 22)
    ctx.lineTo(17, 22)
    ctx.lineTo(19, 10)
    ctx.closePath()
    ctx.fillStyle = "#ff4b4b"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.4)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Popcorn kernels (circles on top)
    ctx.fillStyle = "#ffe066"
    const kernels = [[8, 7], [12, 5], [16, 7], [10, 4], [14, 4]]
    for (const [kx, ky] of kernels) {
        ctx.beginPath()
        ctx.arc(kx, ky, 3, 0, Math.PI * 2)
        ctx.fill()
    }

    // Stripe on bucket
    ctx.strokeStyle = "rgba(255,255,255,0.3)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(6, 14)
    ctx.lineTo(18, 14)
    ctx.stroke()

    ctx.restore()
}

function drawWrappedImage(stats: WrappedStats, selection: StatSelection): HTMLCanvasElement {
    const W = 1080
    const H = 1920
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!

    // --- Background gradient (deep red/black theme) ---
    const bg = ctx.createLinearGradient(0, 0, W * 0.3, H)
    bg.addColorStop(0, "#0a0a0a")
    bg.addColorStop(0.4, "#0d0000")
    bg.addColorStop(0.7, "#1a0000")
    bg.addColorStop(1, "#2a0000")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Soft glow blobs (red tones)
    const glow = (cx: number, cy: number, rad: number, color: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        g.addColorStop(0, color)
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
    }
    glow(120, 200, 500, "rgba(200, 0, 0, 0.12)")
    glow(960, 1600, 600, "rgba(180, 20, 20, 0.18)")
    glow(W / 2, H / 2, 800, "rgba(100, 0, 0, 0.06)")

    // Subtle dot-grid watermark pattern (replaces ugly diagonal text)
    ctx.save()
    ctx.fillStyle = "rgba(255, 255, 255, 0.015)"
    const dotSpacing = 60
    const dotRadius = 2
    for (let dx = 0; dx < W; dx += dotSpacing) {
        for (let dy = 0; dy < H; dy += dotSpacing) {
            ctx.beginPath()
            ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2)
            ctx.fill()
        }
    }
    ctx.restore()

    // Thin subtle horizontal scan-lines for texture
    ctx.save()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.008)"
    ctx.lineWidth = 1
    for (let sy = 0; sy < H; sy += 4) {
        ctx.beginPath()
        ctx.moveTo(0, sy)
        ctx.lineTo(W, sy)
        ctx.stroke()
    }
    ctx.restore()

    ctx.textBaseline = "alphabetic"

    // --- Determine content sections to calculate dynamic vertical positions ---


    const activeTiles: { value: string; label: string }[] = []
    if (selection.totalRuntime) activeTiles.push({ value: stats.totalRuntimeLabel, label: "Total Runtime" })
    if (selection.totalHours) activeTiles.push({ value: String(stats.totalHours), label: "Hours in Cinema" })
    if (selection.totalSpent) activeTiles.push({ value: stats.spentLabel, label: "Total Spent" })
    if (selection.theatersVisited) activeTiles.push({ value: String(stats.theatersVisited), label: "Theaters Visited" })
    if (selection.citiesExplored) activeTiles.push({ value: String(stats.citiesExplored), label: "Cities Explored" })
    if (selection.watchedThisYear) activeTiles.push({ value: String(stats.thisYearCount), label: `Watched in ${stats.year}` })
    if (selection.rewatches) activeTiles.push({ value: String(stats.totalRewatches), label: "Rewatches" })
    if (selection.languagesCount) activeTiles.push({ value: String(stats.languagesCount), label: "Languages" })
    if (selection.maxWatchesInMonth) activeTiles.push({ value: String(stats.maxWatchesInMonth), label: "Most Watches / Month" })
    if (selection.maxWatchesInDay) activeTiles.push({ value: String(stats.maxWatchesInDay), label: "Most Watches / Day" })

    // Calculate how many highlight cards we have
    let highlightCount = 0
    if (selection.mostWatched && stats.topMovie) highlightCount++
    if (selection.favoriteTheater && stats.topTheater) highlightCount++
    if (selection.lastWatched && stats.lastWatched) highlightCount++

    // --- Dynamic vertical layout calculation ---
    // Fixed zones: header (0-460), footer (H-180 to H), hero stat area
    const headerEnd = 460
    const footerStart = H - 180
    const pad = 70
    const gap = 30

    // Hero stat sizing (can shrink if needed)
    const heroFontSize = 200
    const heroBlockH = 280 // space for number + label
    const heroTop = headerEnd + 20
    const heroBottom = heroTop + heroBlockH

    // Remaining vertical space for tiles + highlights
    const contentTop = heroBottom + 40
    const contentBottom = footerStart - 30
    const contentH = contentBottom - contentTop

    // Calculate tile grid dimensions
    let cols = 2
    if (activeTiles.length <= 3 && activeTiles.length > 0) {
        cols = 1
    }
    const tileRows = Math.ceil(activeTiles.length / cols)

    // Highlight card height
    const highlightCardH = 130
    const highlightGap = 24
    const totalHighlightH = highlightCount > 0 ? highlightCount * highlightCardH + (highlightCount - 1) * highlightGap + 40 : 0

    // Calculate tile height to fill available space
    const tileAreaH = contentH - totalHighlightH
    const rowGap = 26
    let tileH = tileRows > 0 ? Math.min(220, Math.max(140, (tileAreaH - (tileRows - 1) * rowGap) / tileRows)) : 0
    let colW = cols === 1 ? (W - pad * 2) : (W - pad * 2 - gap) / 2

    // --- Header brand ---
    ctx.textAlign = "center"
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.font = "600 34px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText("🎬  MEDIA VERSE", W / 2, 120)

    // --- Title ---
    const titleGrad = ctx.createLinearGradient(0, 150, W, 150)
    titleGrad.addColorStop(0, "#ff4b4b")
    titleGrad.addColorStop(1, "#ff0000")
    ctx.fillStyle = titleGrad
    ctx.font = "800 96px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText("My Cinema", W / 2, 270)
    ctx.fillText("Wrapped", W / 2, 375)

    // Subtitle — name + year
    ctx.fillStyle = "rgba(255,255,255,0.7)"
    ctx.font = "500 40px system-ui, -apple-system, 'Segoe UI', sans-serif"
    const who = stats.displayName ? `${stats.displayName} · ${stats.year}` : `${stats.year}`
    ctx.fillText(who, W / 2, 445)

    // --- Hero stat: movies watched ---
    ctx.fillStyle = "#ffffff"
    ctx.font = `800 ${heroFontSize}px system-ui, -apple-system, 'Segoe UI', sans-serif`
    ctx.fillText(String(stats.totalMovies), W / 2, heroTop + 180)
    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.font = "600 44px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText("MOVIES WATCHED", W / 2, heroTop + 245)

    // --- Stat tiles grid ---
    const gridTop = contentTop

    activeTiles.forEach((t, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = pad + col * (colW + gap)
        const y = gridTop + row * (tileH + rowGap)

        // Tile background with subtle red tint
        ctx.fillStyle = "rgba(255, 30, 30, 0.06)"
        roundRect(ctx, x, y, colW, tileH, 28)
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 60, 60, 0.15)"
        ctx.lineWidth = 2
        roundRect(ctx, x, y, colW, tileH, 28)
        ctx.stroke()

        ctx.textAlign = "center"
        const cx = x + colW / 2

        // Auto-shrink value font to fit
        let vFont = Math.min(68, tileH * 0.35)
        ctx.font = `800 ${vFont}px system-ui, -apple-system, 'Segoe UI', sans-serif`
        while (ctx.measureText(t.value).width > colW - 50 && vFont > 34) {
            vFont -= 4
            ctx.font = `800 ${vFont}px system-ui, -apple-system, 'Segoe UI', sans-serif`
        }
        ctx.fillStyle = "#ff4b4b"
        ctx.fillText(t.value, cx, y + tileH / 2 + 8)

        ctx.fillStyle = "rgba(255,255,255,0.65)"
        ctx.font = "600 30px system-ui, -apple-system, 'Segoe UI', sans-serif"
        ctx.fillText(t.label.toUpperCase(), cx, y + tileH - 32)
    })

    // --- Highlights (top movie / theater) ---
    const tilesBottomEdge = tileRows > 0 ? gridTop + tileRows * (tileH + rowGap) : gridTop
    let hy = tilesBottomEdge + 20
    if (activeTiles.length === 0 && highlightCount > 0) hy = contentTop

    const drawHighlight = (iconType: "popcorn" | "pin", label: string, value: string) => {
        const x = pad
        const w = W - pad * 2
        const h = highlightCardH

        // Red-tinted card background
        ctx.fillStyle = "rgba(220, 38, 38, 0.12)"
        roundRect(ctx, x, hy, w, h, 26)
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 60, 60, 0.3)"
        ctx.lineWidth = 2
        roundRect(ctx, x, hy, w, h, 26)
        ctx.stroke()

        // Draw icon instead of emoji
        if (iconType === "pin") {
            drawLocationPin(ctx, x + 66, hy + h / 2 + 6, 48)
        } else {
            drawPopcornIcon(ctx, x + 66, hy + h / 2, 48)
        }

        ctx.textAlign = "left"

        ctx.fillStyle = "rgba(255,255,255,0.6)"
        ctx.font = "600 26px system-ui, -apple-system, 'Segoe UI', sans-serif"
        ctx.fillText(label.toUpperCase(), x + 130, hy + 52)

        ctx.fillStyle = "#ffffff"
        let vFont = 44
        ctx.font = `700 ${vFont}px system-ui, -apple-system, 'Segoe UI', sans-serif`
        const maxW = w - 170
        let text = value
        while (ctx.measureText(text).width > maxW && text.length > 4) {
            text = text.slice(0, -2)
        }
        if (text !== value) text = text.trimEnd() + "…"
        ctx.fillText(text, x + 130, hy + 98)

        hy += h + highlightGap
    }

    if (selection.mostWatched && stats.topMovie) {
        drawHighlight("popcorn", "Most Watched", `${stats.topMovie.title} (${stats.topMovie.count}×)`)
    }
    if (selection.favoriteTheater && stats.topTheater) {
        drawHighlight("pin", "Favorite Theater", `${stats.topTheater.name} (${stats.topTheater.count}×)`)
    }
    if (selection.lastWatched && stats.lastWatched) {
        drawHighlight("popcorn", "Last Watched", `${stats.lastWatched.title} · ${stats.lastWatched.date}`)
    }

    // --- Footer / branding ---
    // Subtle separator line
    ctx.strokeStyle = "rgba(255, 75, 75, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, footerStart)
    ctx.lineTo(W - pad, footerStart)
    ctx.stroke()

    ctx.textAlign = "left"
    const footY = footerStart + 50
    const brandGrad = ctx.createLinearGradient(pad, footY, W * 0.6, footY)
    brandGrad.addColorStop(0, "#ff4b4b")
    brandGrad.addColorStop(1, "#ff0000")
    ctx.fillStyle = brandGrad
    ctx.font = "800 52px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText(SITE, pad, footY)

    ctx.fillStyle = "rgba(255,255,255,0.8)"
    ctx.font = "600 36px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText(`Track yours · ${INSTA}`, pad, footY + 56)

    return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create image"))
        }, "image/png")
    })
}

interface ShareStatsProps {
    stats: WrappedStats
}

export function ShareStats({ stats }: ShareStatsProps) {
    const [busy, setBusy] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [blob, setBlob] = useState<Blob | null>(null)
    const [customizeOpen, setCustomizeOpen] = useState(false)

    // Stat selection state
    const [selection, setSelection] = useState<StatSelection>({
        totalRuntime: true,
        totalHours: true,
        totalSpent: true,
        theatersVisited: true,
        citiesExplored: true,
        watchedThisYear: false,
        rewatches: true,
        mostWatched: true,
        favoriteTheater: true,
        lastWatched: true,
        languagesCount: true,
        maxWatchesInMonth: true,
        maxWatchesInDay: true
    })

    const allSelected = Object.values(selection).every(Boolean)

    const toggleAll = (checked: boolean) => {
        setSelection({
            totalRuntime: checked,
            totalHours: checked,
            totalSpent: checked,
            theatersVisited: checked,
            citiesExplored: checked,
            watchedThisYear: checked,
            rewatches: checked,
            mostWatched: checked,
            favoriteTheater: checked,
            lastWatched: checked,
            languagesCount: checked,
            maxWatchesInMonth: checked,
            maxWatchesInDay: checked
        })
    }

    const generate = async () => {
        setBusy(true)
        try {
            const canvas = drawWrappedImage(stats, selection)
            const b = await canvasToBlob(canvas)
            setBlob(b)
            setPreview(URL.createObjectURL(b))
        } catch (err) {
            console.error("Failed to generate share image", err)
        } finally {
            setBusy(false)
        }
    }

    const shareImage = async () => {
        if (!blob) return
        const file = new File([blob], "cinema-wrapped.png", { type: "image/png" })
        const shareData: ShareData = {
            files: [file],
            title: "My Cinema Wrapped",
            text: `My movie stats from ${SITE} 🎬 Track yours ${INSTA}`,
        }
        try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share(shareData)
                return
            }
        } catch (err) {
            // User cancelled or share failed — fall through to download
            if ((err as Error).name === "AbortError") return
            console.error("Share failed, falling back to download", err)
        }
        downloadImage()
    }

    const downloadImage = () => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "cinema-wrapped.png"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const close = () => {
        if (preview) URL.revokeObjectURL(preview)
        setPreview(null)
        setBlob(null)
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setCustomizeOpen(true)}
                disabled={busy || stats.totalMovies === 0}
                title="Customize & Share Wrapped"
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share Wrapped
            </Button>

            <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Customize Your Wrapped</DialogTitle>
                        <DialogDescription>
                            Select the stats you want to include in your generated image.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 flex flex-col gap-4">
                        <div className="flex items-center space-x-2 pb-2 border-b">
                            <Checkbox
                                id="select-all"
                                checked={allSelected}
                                onCheckedChange={(c) => toggleAll(c as boolean)}
                            />
                            <Label htmlFor="select-all" className="font-semibold">Select All</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-runtime"
                                    checked={selection.totalRuntime}
                                    onCheckedChange={(c) => setSelection(s => ({...s, totalRuntime: c as boolean}))}
                                />
                                <Label htmlFor="s-runtime">Total Runtime</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-hours"
                                    checked={selection.totalHours}
                                    onCheckedChange={(c) => setSelection(s => ({...s, totalHours: c as boolean}))}
                                />
                                <Label htmlFor="s-hours">Hours in Cinema</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-spent"
                                    checked={selection.totalSpent}
                                    onCheckedChange={(c) => setSelection(s => ({...s, totalSpent: c as boolean}))}
                                />
                                <Label htmlFor="s-spent">Total Spent</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-theaters"
                                    checked={selection.theatersVisited}
                                    onCheckedChange={(c) => setSelection(s => ({...s, theatersVisited: c as boolean}))}
                                />
                                <Label htmlFor="s-theaters">Theaters Visited</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-cities"
                                    checked={selection.citiesExplored}
                                    onCheckedChange={(c) => setSelection(s => ({...s, citiesExplored: c as boolean}))}
                                />
                                <Label htmlFor="s-cities">Cities Explored</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-year"
                                    checked={selection.watchedThisYear}
                                    onCheckedChange={(c) => setSelection(s => ({...s, watchedThisYear: c as boolean}))}
                                />
                                <Label htmlFor="s-year">Watched this Year</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-rewatches"
                                    checked={selection.rewatches}
                                    onCheckedChange={(c) => setSelection(s => ({...s, rewatches: c as boolean}))}
                                />
                                <Label htmlFor="s-rewatches">Rewatches</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-mostwatched"
                                    checked={selection.mostWatched}
                                    onCheckedChange={(c) => setSelection(s => ({...s, mostWatched: c as boolean}))}
                                    disabled={!stats.topMovie}
                                />
                                <Label htmlFor="s-mostwatched" className={!stats.topMovie ? "opacity-50" : ""}>Most Watched</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-favtheater"
                                    checked={selection.favoriteTheater}
                                    onCheckedChange={(c) => setSelection(s => ({...s, favoriteTheater: c as boolean}))}
                                    disabled={!stats.topTheater}
                                />
                                <Label htmlFor="s-favtheater" className={!stats.topTheater ? "opacity-50" : ""}>
                                    Favorite Theater</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-lastwatched"
                                    checked={selection.lastWatched}
                                    onCheckedChange={(c) => setSelection(s => ({...s, lastWatched: c as boolean}))}
                                    disabled={!stats.lastWatched}
                                />
                                <Label htmlFor="s-lastwatched" className={!stats.lastWatched ? "opacity-50" : ""}>
                                    Last Watched</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-languages"
                                    checked={selection.languagesCount}
                                    onCheckedChange={(c) => setSelection(s => ({...s, languagesCount: c as boolean}))}
                                />
                                <Label htmlFor="s-languages">Languages</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-maxmonth"
                                    checked={selection.maxWatchesInMonth}
                                    onCheckedChange={(c) => setSelection(s => ({...s, maxWatchesInMonth: c as boolean}))}
                                />
                                <Label htmlFor="s-maxmonth">Max Watches / Month</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="s-maxday"
                                    checked={selection.maxWatchesInDay}
                                    onCheckedChange={(c) => setSelection(s => ({...s, maxWatchesInDay: c as boolean}))}
                                />
                                <Label htmlFor="s-maxday">Max Watches / Day</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button variant="ghost" onClick={() => setCustomizeOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                setCustomizeOpen(false)
                                generate()
                            }}
                            disabled={busy || !Object.values(selection).some(Boolean)}
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Generate Image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={close}
                >
                    <div
                        className="bg-background rounded-2xl border shadow-2xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-4 flex flex-col items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold">Your Cinema Wrapped</h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Cinema Wrapped stats"
                            className="w-full rounded-lg border shadow-md"
                        />
                        <div className="flex w-full gap-2">
                            <Button className="flex-1 gap-1.5" onClick={shareImage}>
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                            <Button variant="outline" className="flex-1 gap-1.5" onClick={downloadImage}>
                                <Download className="h-4 w-4" />
                                Save
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Share to your story and tag {INSTA} · {SITE}
                        </p>
                        <Button variant="ghost" size="sm" onClick={close}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}
