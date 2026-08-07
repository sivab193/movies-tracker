"use client"

import { useState } from "react"
import { Share2, Loader2, Download, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"

export interface CommunityStats {
    totalUsers: number
    totalMovies: number
    totalSeries: number
    totalEpisodes: number
    totalWatchEntries: number
    moviesCatalogRuntimeMinutes: number
    seriesCatalogRuntimeMinutes: number
    totalCatalogRuntimeMinutes: number
    communityWatchTimeSeconds: number
    mostWatchedMovie: { title: string; count: number } | null
    topGenre: string | null
    totalTheaters: number
}

const SITE = "mv.siv19.dev"
const INSTA = "@media.verse.tv"

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
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

function formatMinutesHuman(totalMinutes: number): string {
    if (!totalMinutes || totalMinutes <= 0) return "0 mins"
    const days = Math.floor(totalMinutes / (24 * 60))
    const hrs = Math.floor((totalMinutes % (24 * 60)) / 60)
    const mins = totalMinutes % 60
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hrs > 0) parts.push(`${hrs}h`)
    if (mins > 0) parts.push(`${mins}m`)
    return parts.join(' ') || '0 mins'
}

const FONT = (weight: number, size: number) =>
    `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`

function drawCommunityCard(stats: CommunityStats): HTMLCanvasElement {
    const W = 1080
    const H = 1920
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!

    // --- Background gradient (deep blue/purple community theme) ---
    const bg = ctx.createLinearGradient(0, 0, W * 0.3, H)
    bg.addColorStop(0, "#050510")
    bg.addColorStop(0.3, "#0a0520")
    bg.addColorStop(0.6, "#120828")
    bg.addColorStop(1, "#1a0a35")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Glow blobs
    const glow = (cx: number, cy: number, rad: number, color: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        g.addColorStop(0, color)
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
    }
    glow(120, 300, 500, "rgba(100, 50, 200, 0.15)")
    glow(960, 1500, 600, "rgba(200, 50, 100, 0.12)")
    glow(W / 2, H / 2, 700, "rgba(80, 30, 150, 0.08)")

    // Subtle dot grid
    ctx.fillStyle = "rgba(255, 255, 255, 0.012)"
    for (let dx = 0; dx < W; dx += 60) {
        for (let dy = 0; dy < H; dy += 60) {
            ctx.beginPath()
            ctx.arc(dx, dy, 2, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    ctx.textBaseline = "alphabetic"

    // --- Header ---
    const pad = 70
    let y = 120

    // Badge
    ctx.save()
    roundRect(ctx, pad, y, 340, 48, 24)
    ctx.fillStyle = "rgba(140, 80, 255, 0.2)"
    ctx.fill()
    ctx.strokeStyle = "rgba(140, 80, 255, 0.4)"
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = "rgba(180, 140, 255, 0.9)"
    ctx.font = FONT(600, 20)
    ctx.fillText("📊  Community Stats", pad + 28, y + 32)
    ctx.restore()

    y += 90

    // Title
    ctx.fillStyle = "#ffffff"
    ctx.font = FONT(800, 64)
    ctx.fillText("MediaVerse", pad, y)
    y += 70
    ctx.font = FONT(800, 64)
    ctx.fillText("Community Pulse", pad, y)
    y += 36

    // Subtitle
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.font = FONT(400, 24)
    ctx.fillText("What our community is watching, together.", pad, y)
    y += 80

    // --- Hero stat: total catalog runtime ---
    const catalogLabel = formatMinutesHuman(stats.totalCatalogRuntimeMinutes)
    ctx.fillStyle = "#ffffff"
    ctx.font = FONT(900, 120)
    const heroMetrics = ctx.measureText(catalogLabel)
    // Center it
    const heroX = (W - heroMetrics.width) / 2
    ctx.fillText(catalogLabel, heroX, y + 100)

    y += 130
    ctx.fillStyle = "rgba(180, 140, 255, 0.9)"
    ctx.font = FONT(600, 28)
    ctx.textAlign = "center"
    ctx.fillText("TOTAL CONTENT AVAILABLE", W / 2, y)
    ctx.textAlign = "start"

    y += 70

    // --- Stat tiles (2-column grid) ---
    const tileW = (W - pad * 2 - 30) / 2
    const tileH = 140
    const tileGap = 24

    const tiles: { value: string; label: string; accent?: string }[] = [
        { value: String(stats.totalMovies), label: "MOVIES", accent: "rgba(255, 100, 100, 0.9)" },
        { value: String(stats.totalSeries), label: "SERIES", accent: "rgba(100, 180, 255, 0.9)" },
        { value: formatMinutesHuman(stats.moviesCatalogRuntimeMinutes), label: "MOVIES RUNTIME", accent: "rgba(255, 150, 80, 0.9)" },
        { value: formatMinutesHuman(stats.seriesCatalogRuntimeMinutes), label: "SERIES RUNTIME", accent: "rgba(80, 220, 180, 0.9)" },
        { value: String(stats.totalUsers), label: "USERS", accent: "rgba(200, 140, 255, 0.9)" },
        { value: String(stats.totalWatchEntries), label: "WATCH ENTRIES", accent: "rgba(255, 200, 80, 0.9)" },
        { value: String(stats.totalEpisodes), label: "EPISODES TRACKED", accent: "rgba(100, 200, 255, 0.9)" },
        { value: String(stats.totalTheaters), label: "THEATERS", accent: "rgba(255, 130, 180, 0.9)" },
    ]

    for (let i = 0; i < tiles.length; i++) {
        const col = i % 2
        const row = Math.floor(i / 2)
        const tx = pad + col * (tileW + tileGap + 6)
        const ty = y + row * (tileH + tileGap)

        // Tile background
        roundRect(ctx, tx, ty, tileW, tileH, 16)
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
        ctx.lineWidth = 1
        ctx.stroke()

        // Value
        ctx.fillStyle = tiles[i].accent || "#ffffff"
        ctx.font = FONT(800, 40)
        // Shrink if needed
        let valFont = 40
        while (ctx.measureText(tiles[i].value).width > tileW - 40 && valFont > 20) {
            valFont -= 2
            ctx.font = FONT(800, valFont)
        }
        ctx.fillText(tiles[i].value, tx + 20, ty + 55)

        // Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.font = FONT(600, 18)
        ctx.fillText(tiles[i].label, tx + 20, ty + tileH - 25)
    }

    y += Math.ceil(tiles.length / 2) * (tileH + tileGap) + 20

    // --- Community watch time ---
    if (stats.communityWatchTimeSeconds > 0) {
        const communityMins = Math.floor(stats.communityWatchTimeSeconds / 60)
        const communityLabel = formatMinutesHuman(communityMins)

        roundRect(ctx, pad, y, W - pad * 2, 130, 16)
        ctx.fillStyle = "rgba(140, 80, 255, 0.08)"
        ctx.fill()
        ctx.strokeStyle = "rgba(140, 80, 255, 0.2)"
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = "rgba(180, 140, 255, 0.9)"
        ctx.font = FONT(600, 18)
        ctx.fillText("COMMUNITY WATCH TIME", pad + 24, y + 40)

        ctx.fillStyle = "#ffffff"
        ctx.font = FONT(800, 48)
        ctx.fillText(communityLabel, pad + 24, y + 100)

        y += 160
    }

    // --- Highlights ---
    if (stats.mostWatchedMovie && stats.mostWatchedMovie.count > 0) {
        roundRect(ctx, pad, y, W - pad * 2, 100, 16)
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = "rgba(255, 200, 80, 0.9)"
        ctx.font = FONT(600, 18)
        ctx.fillText("🏆  CROWD FAVORITE", pad + 24, y + 35)

        ctx.fillStyle = "#ffffff"
        ctx.font = FONT(700, 28)
        // Truncate title if needed
        let movieTitle = stats.mostWatchedMovie.title
        while (ctx.measureText(movieTitle).width > (W - pad * 2 - 60) && movieTitle.length > 3) {
            movieTitle = movieTitle.slice(0, -4) + "…"
        }
        ctx.fillText(`${movieTitle} (${stats.mostWatchedMovie.count} watches)`, pad + 24, y + 75)

        y += 125
    }

    if (stats.topGenre) {
        roundRect(ctx, pad, y, W - pad * 2, 80, 16)
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
        ctx.fill()

        ctx.fillStyle = "rgba(100, 200, 255, 0.9)"
        ctx.font = FONT(600, 18)
        ctx.fillText("🎭  TOP GENRE", pad + 24, y + 32)

        ctx.fillStyle = "#ffffff"
        ctx.font = FONT(700, 26)
        ctx.fillText(stats.topGenre, pad + 24, y + 65)

        y += 105
    }

    // --- Footer ---
    const footerY = H - 120
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)"
    ctx.fillRect(pad, footerY - 30, W - pad * 2, 1)

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.font = FONT(700, 28)
    ctx.fillText(SITE, pad, footerY + 20)

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
    ctx.font = FONT(500, 22)
    ctx.textAlign = "right"
    ctx.fillText(INSTA, W - pad, footerY + 20)
    ctx.textAlign = "start"

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    ctx.font = FONT(400, 18)
    ctx.textAlign = "center"
    ctx.fillText("Track your movie journey · Join us!", W / 2, footerY + 60)
    ctx.textAlign = "start"

    return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Canvas blob failed"))),
            "image/png",
            1
        )
    })
}

interface ShareCommunityStatsProps {
    stats: CommunityStats
}

export function ShareCommunityStats({ stats }: ShareCommunityStatsProps) {
    const [busy, setBusy] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [blob, setBlob] = useState<Blob | null>(null)

    const generate = async () => {
        setBusy(true)
        try {
            const canvas = drawCommunityCard(stats)
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
        const file = new File([blob], "mediaverse-community-stats.png", { type: "image/png" })
        const shareData: ShareData = {
            files: [file],
            title: "MediaVerse Community Stats",
            text: `Check out our community stats on ${SITE} 🎬 Follow ${INSTA}`,
        }
        try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share(shareData)
                return
            }
        } catch {
            // fallback to download
        }
        downloadImage()
    }

    const downloadImage = () => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "mediaverse-community-stats.png"
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={busy}
                className="gap-2"
            >
                {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Share2 className="h-4 w-4" />
                )}
                Share Stats
            </Button>

            <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Community Stats Card</DialogTitle>
                        <DialogDescription>
                            Share this card on your story to promote MediaVerse!
                        </DialogDescription>
                    </DialogHeader>

                    {preview && (
                        <div className="relative rounded-lg overflow-hidden border">
                            <img
                                src={preview}
                                alt="Community stats card"
                                className="w-full h-auto"
                            />
                        </div>
                    )}

                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadImage}
                            className="gap-2 flex-1"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                        <Button
                            size="sm"
                            onClick={shareImage}
                            className="gap-2 flex-1"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
