"use client"

import { useState, useMemo } from "react"
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
    thisYearCount: number
    year: number
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
    mostWatched: boolean;
    favoriteTheater: boolean;
}

function drawWrappedImage(stats: WrappedStats, selection: StatSelection): HTMLCanvasElement {
    const W = 1080
    const H = 1920
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!

    // --- Background gradient (red/black theme) ---
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, "#050505")
    bg.addColorStop(0.5, "#150000")
    bg.addColorStop(1, "#3a0000")
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
    glow(180, 260, 520, "rgba(255, 0, 0, 0.15)")
    glow(920, 1500, 620, "rgba(220, 38, 38, 0.2)")

    // Faint repeated watermark in background
    ctx.save()
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
    ctx.font = "700 80px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 4)
    for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
            ctx.fillText(SITE, i * 400, j * 300)
        }
    }
    ctx.restore()

    ctx.textBaseline = "alphabetic"

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

    // Subtitle - name + year
    ctx.fillStyle = "rgba(255,255,255,0.7)"
    ctx.font = "500 40px system-ui, -apple-system, 'Segoe UI', sans-serif"
    const who = stats.displayName ? `${stats.displayName} · ${stats.year}` : `${stats.year}`
    ctx.fillText(who, W / 2, 445)

    // --- Hero stat: movies watched ---
    const heroY = 520
    ctx.fillStyle = "#ffffff"
    ctx.font = "800 200px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText(String(stats.totalMovies), W / 2, heroY + 170)
    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.font = "600 44px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText("MOVIES WATCHED", W / 2, heroY + 235)

    // --- Stat tiles grid (2 columns) ---
    const tiles: { value: string; label: string }[] = []

    if (selection.totalRuntime) tiles.push({ value: stats.totalRuntimeLabel, label: "Total Runtime" })
    if (selection.totalHours) tiles.push({ value: `${stats.totalHours}h`, label: "Hours in Cinema" })
    if (selection.totalSpent) tiles.push({ value: stats.spentLabel, label: "Total Spent" })
    if (selection.theatersVisited) tiles.push({ value: String(stats.theatersVisited), label: "Theaters Visited" })
    if (selection.citiesExplored) tiles.push({ value: String(stats.citiesExplored), label: "Cities Explored" })
    if (selection.watchedThisYear) tiles.push({ value: String(stats.thisYearCount), label: `Watched in ${stats.year}` })

    const gridTop = 860
    const pad = 70
    const gap = 30

    // Default config when all 6 stats are selected
    let colW = (W - pad * 2 - gap) / 2
    let tileH = 190
    let rowGap = 26

    // Adjust layout for 1-4 tiles to fill the space more nicely, though default grid is fine too.
    let cols = 2;
    if (tiles.length <= 3 && tiles.length > 0) {
        cols = 1;
        colW = W - pad * 2;
        tileH = 220;
        rowGap = 40;
    }

    tiles.forEach((t, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = pad + col * (colW + gap)
        const y = gridTop + row * (tileH + rowGap)

        ctx.fillStyle = "rgba(255,255,255,0.07)"
        roundRect(ctx, x, y, colW, tileH, 28)
        ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,0.12)"
        ctx.lineWidth = 2
        roundRect(ctx, x, y, colW, tileH, 28)
        ctx.stroke()

        ctx.textAlign = "center"
        const cx = x + colW / 2

        // Auto-shrink value font to fit
        let vFont = 68
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
    const rowsUsed = Math.ceil(tiles.length / cols)
    let hy = gridTop + rowsUsed * (tileH + rowGap) + 20
    if (tiles.length === 0) hy = gridTop

    const drawHighlight = (icon: string, label: string, value: string) => {
        const x = pad
        const w = W - pad * 2
        const h = 130
        ctx.fillStyle = "rgba(220, 38, 38, 0.15)"
        roundRect(ctx, x, hy, w, h, 26)
        ctx.fill()
        ctx.strokeStyle = "rgba(220, 38, 38, 0.35)"
        ctx.lineWidth = 2
        roundRect(ctx, x, hy, w, h, 26)
        ctx.stroke()

        ctx.textAlign = "left"
        ctx.font = "600 60px system-ui, -apple-system, 'Segoe UI', sans-serif"
        ctx.fillText(icon, x + 36, hy + 84)

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

        hy += h + 24
    }

    if (selection.mostWatched && stats.topMovie) {
        drawHighlight("🍿", "Most Watched", `${stats.topMovie.title} (${stats.topMovie.count}×)`)
    }
    if (selection.favoriteTheater && stats.topTheater) {
        drawHighlight("📍", "Favorite Theater", `${stats.topTheater.name} (${stats.topTheater.count}×)`)
    }

    // --- Footer / branding ---
    ctx.textAlign = "left"
    const footY = H - 100
    const brandGrad = ctx.createLinearGradient(pad, footY, W, footY)
    brandGrad.addColorStop(0, "#ff4b4b")
    brandGrad.addColorStop(1, "#ff0000")
    ctx.fillStyle = brandGrad
    ctx.font = "800 52px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.fillText(SITE, pad, footY)

    ctx.fillStyle = "rgba(255,255,255,0.7)"
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
        watchedThisYear: true,
        mostWatched: true,
        favoriteTheater: true
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
            mostWatched: checked,
            favoriteTheater: checked
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
                                <Label htmlFor="s-favtheater" className={!stats.topTheater ? "opacity-50" : ""}>Favorite Theater</Label>
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
