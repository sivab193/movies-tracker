"use client"

import { useState } from "react"
import { Share2, Loader2, Download } from "lucide-react"
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

const SITE = "www.media-verse.in"
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
    if (!totalMinutes || totalMinutes <= 0) return "0m"
    const days = Math.floor(totalMinutes / (24 * 60))
    const hrs = Math.floor((totalMinutes % (24 * 60)) / 60)
    const mins = totalMinutes % 60
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hrs > 0) parts.push(`${hrs}h`)
    if (mins > 0) parts.push(`${mins}m`)
    return parts.join(' ') || '0m'
}

const FONT = (weight: number, size: number) =>
    `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`

// Three ascending bars, drawn rather than set as an emoji: canvas renders emoji
// with whatever the host OS ships, so 📊 came out flat/greyscale (or missing)
// depending on the device generating the card.
const BADGE_ICON_W = 18
function drawMiniBars(ctx: CanvasRenderingContext2D, x: number, baseY: number, color: string) {
    ctx.fillStyle = color
    const heights = [10, 16, 22]
    for (let i = 0; i < heights.length; i++) {
        ctx.fillRect(x + i * 7, baseY - heights[i], 4, heights[i])
    }
}

// Shrinks `text` until it fits, then truncates with an ellipsis. The ellipsis is
// included in the measurement so the string that gets drawn is the one that was
// checked.
function fitOrTruncate(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    weight: number,
    startSize: number,
    minSize: number
): string {
    let size = startSize
    ctx.font = FONT(weight, size)
    while (ctx.measureText(text).width > maxWidth && size > minSize) {
        size -= 2
        ctx.font = FONT(weight, size)
    }
    if (ctx.measureText(text).width <= maxWidth) return text
    let out = text
    while (out.length > 1 && ctx.measureText(out + "…").width > maxWidth) {
        out = out.slice(0, -1)
    }
    return out.trimEnd() + "…"
}

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
    ctx.textAlign = "start"

    const pad = 70
    const contentW = W - pad * 2

    // ===================== measure =====================
    // Everything is measured first so the leftover vertical space can be shared
    // out between sections instead of piling up above the footer.

    const catalogLabel = formatMinutesHuman(stats.totalCatalogRuntimeMinutes)
    let heroFont = 120
    ctx.font = FONT(900, heroFont)
    while (ctx.measureText(catalogLabel).width > contentW && heroFont > 56) {
        heroFont -= 4
        ctx.font = FONT(900, heroFont)
    }
    const heroCapH = heroFont * 0.74

    const tiles: { value: string; label: string; accent: string }[] = [
        { value: String(stats.totalMovies), label: "MOVIES", accent: "rgba(255, 100, 100, 0.9)" },
        { value: String(stats.totalSeries), label: "SERIES", accent: "rgba(100, 180, 255, 0.9)" },
        { value: formatMinutesHuman(stats.moviesCatalogRuntimeMinutes), label: "MOVIES RUNTIME", accent: "rgba(255, 150, 80, 0.9)" },
        { value: formatMinutesHuman(stats.seriesCatalogRuntimeMinutes), label: "SERIES RUNTIME", accent: "rgba(80, 220, 180, 0.9)" },
        { value: String(stats.totalUsers), label: "USERS", accent: "rgba(200, 140, 255, 0.9)" },
        { value: String(stats.totalWatchEntries), label: "WATCH ENTRIES", accent: "rgba(255, 200, 80, 0.9)" },
        { value: String(stats.totalEpisodes), label: "EPISODES TRACKED", accent: "rgba(100, 200, 255, 0.9)" },
        { value: String(stats.totalTheaters), label: "THEATERS", accent: "rgba(255, 130, 180, 0.9)" },
    ]

    const tileH = 134
    const tileGap = 26
    const tileW = (contentW - tileGap) / 2
    const tileRows = Math.ceil(tiles.length / 2)
    const gridH = tileRows * tileH + (tileRows - 1) * tileGap

    const cards: { label: string; value: string; accent: string; h: number }[] = []
    if (stats.communityWatchTimeSeconds > 0) {
        cards.push({
            label: "COMMUNITY WATCH TIME",
            value: formatMinutesHuman(Math.floor(stats.communityWatchTimeSeconds / 60)),
            accent: "rgba(180, 140, 255, 0.95)",
            h: 132,
        })
    }
    if (stats.mostWatchedMovie && stats.mostWatchedMovie.count > 0) {
        cards.push({
            label: "CROWD FAVORITE",
            value: `${stats.mostWatchedMovie.title} (${stats.mostWatchedMovie.count} watches)`,
            accent: "rgba(255, 200, 80, 0.95)",
            h: 110,
        })
    }
    if (stats.topGenre) {
        cards.push({
            label: "TOP GENRE",
            value: stats.topGenre,
            accent: "rgba(100, 200, 255, 0.95)",
            h: 110,
        })
    }
    const cardGap = 22
    const cardsH = cards.reduce((sum, c) => sum + c.h, 0) + Math.max(0, cards.length - 1) * cardGap

    const badgeH = 46
    const titleLineH = 72
    const titleH = titleLineH * 2
    const subtitleH = 24
    const heroLabelH = 26

    const topMargin = 110
    const footerRuleY = H - 175
    const footerClearance = 60

    const sectionsH = badgeH + titleH + subtitleH + heroCapH + heroLabelH + gridH + cardsH
    // badge→title, title→subtitle, subtitle→hero, hero→heroLabel, heroLabel→grid, grid→cards
    const gapsBase = [36, 26, 62, 30, 56, cards.length > 0 ? 40 : 0]
    const gapsBaseTotal = gapsBase.reduce((a, b) => a + b, 0)
    const availableH = footerRuleY - footerClearance - topMargin
    const slack = availableH - sectionsH - gapsBaseTotal
    // Distribute the slack proportionally so the larger separations absorb more
    // of it and the rhythm stays recognisable. A floor keeps sections from
    // colliding when there is more content than room.
    const gaps = gapsBase.map((g) =>
        gapsBaseTotal > 0 ? Math.max(g * 0.55, g + (slack * g) / gapsBaseTotal) : g
    )

    // ===================== draw =====================
    let y = topMargin

    // --- Badge (width follows its text instead of a fixed 340px box) ---
    ctx.font = FONT(600, 20)
    const badgeText = "Community Stats"
    const badgeW = 22 + BADGE_ICON_W + 12 + ctx.measureText(badgeText).width + 24
    roundRect(ctx, pad, y, badgeW, badgeH, badgeH / 2)
    ctx.fillStyle = "rgba(140, 80, 255, 0.2)"
    ctx.fill()
    ctx.strokeStyle = "rgba(140, 80, 255, 0.4)"
    ctx.lineWidth = 1.5
    ctx.stroke()
    drawMiniBars(ctx, pad + 22, y + badgeH / 2 + 11, "rgba(180, 140, 255, 0.95)")
    ctx.fillStyle = "rgba(200, 170, 255, 0.95)"
    ctx.font = FONT(600, 20)
    ctx.fillText(badgeText, pad + 22 + BADGE_ICON_W + 12, y + badgeH / 2 + 7)
    y += badgeH + gaps[0]

    // --- Title ---
    ctx.fillStyle = "#ffffff"
    ctx.font = FONT(800, 64)
    ctx.fillText("MediaVerse", pad, y + 50)
    ctx.fillText("Community Pulse", pad, y + 50 + titleLineH)
    y += titleH + gaps[1]

    // --- Subtitle ---
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.font = FONT(400, 24)
    ctx.fillText("What our community is watching, together.", pad, y + subtitleH)
    y += subtitleH + gaps[2]

    // --- Hero stat: total catalog runtime ---
    // Left-aligned on the same grid line as everything else; it used to be
    // centred, which fought the rest of the card and could overflow the canvas
    // once the runtime grew a digit.
    ctx.fillStyle = "#ffffff"
    ctx.font = FONT(900, heroFont)
    ctx.fillText(catalogLabel, pad, y + heroCapH)
    y += heroCapH + gaps[3]

    ctx.fillStyle = "rgba(180, 140, 255, 0.9)"
    ctx.font = FONT(600, 26)
    ctx.fillText("TOTAL CONTENT AVAILABLE", pad, y + 20)
    y += heroLabelH + gaps[4]

    // --- Stat tiles (2-column grid) ---
    const gridTop = y
    for (let i = 0; i < tiles.length; i++) {
        const col = i % 2
        const row = Math.floor(i / 2)
        const tx = pad + col * (tileW + tileGap)
        const ty = gridTop + row * (tileH + tileGap)

        roundRect(ctx, tx, ty, tileW, tileH, 18)
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
        ctx.lineWidth = 1
        ctx.stroke()

        let valFont = 40
        ctx.font = FONT(800, valFont)
        while (ctx.measureText(tiles[i].value).width > tileW - 48 && valFont > 20) {
            valFont -= 2
            ctx.font = FONT(800, valFont)
        }
        ctx.fillStyle = tiles[i].accent
        ctx.fillText(tiles[i].value, tx + 24, ty + 56)

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.font = FONT(600, 18)
        ctx.fillText(tiles[i].label, tx + 24, ty + tileH - 26)
    }
    y += gridH + gaps[5]

    // --- Highlight cards (one shared shape: accent rail, label, value) ---
    for (const card of cards) {
        roundRect(ctx, pad, y, contentW, card.h, 18)
        ctx.fillStyle = "rgba(255, 255, 255, 0.035)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
        ctx.lineWidth = 1
        ctx.stroke()

        // Accent rail, clipped so it picks up the card's rounded corners.
        // It carries the colour coding the emoji used to, without the emoji.
        ctx.save()
        roundRect(ctx, pad, y, contentW, card.h, 18)
        ctx.clip()
        ctx.fillStyle = card.accent
        ctx.fillRect(pad, y, 5, card.h)
        ctx.restore()

        const textX = pad + 32
        const textMaxW = contentW - (textX - pad) - 32

        ctx.fillStyle = card.accent
        ctx.font = FONT(600, 18)
        ctx.fillText(card.label, textX, y + 42)

        const valueText = fitOrTruncate(ctx, card.value, textMaxW, 700, 34, 24)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(valueText, textX, y + card.h - 30)

        y += card.h + cardGap
    }

    // --- Footer ---
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)"
    ctx.fillRect(pad, footerRuleY, contentW, 1)

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
    ctx.font = FONT(700, 28)
    ctx.fillText(SITE, pad, footerRuleY + 52)

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
    ctx.font = FONT(500, 22)
    ctx.textAlign = "right"
    ctx.fillText(INSTA, W - pad, footerRuleY + 52)
    ctx.textAlign = "start"

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    ctx.font = FONT(400, 18)
    ctx.fillText("Track your movie journey · Join us!", pad, footerRuleY + 98)

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
