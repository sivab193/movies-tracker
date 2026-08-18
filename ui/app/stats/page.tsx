"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    BarChart3, Building2, Clock3, Film, MapPin, Sparkles,
    Users, Tv, PlayCircle, Timer, ExternalLink, Instagram,
    TrendingUp, Clapperboard, Globe
} from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStatsSummary } from "@/services/api"
import { ShareCommunityStats, type CommunityStats } from "@/components/share-community-stats"
import { formatRuntimeMinutes } from "@/lib/types"

function formatSeconds(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return "0 mins"
    const totalMinutes = Math.floor(totalSeconds / 60)
    return formatRuntimeMinutes(totalMinutes)
}

function funEquivalence(totalMinutes: number): string | null {
    if (!totalMinutes || totalMinutes <= 0) return null
    const hours = totalMinutes / 60
    const days = hours / 24

    if (days >= 365) {
        const years = (days / 365).toFixed(1)
        return `That's ${years} years of non-stop binging!`
    }
    if (days >= 30) {
        const months = (days / 30).toFixed(1)
        return `That's ${months} months of non-stop entertainment!`
    }
    if (days >= 1) {
        return `That's ${Math.round(days)} days of non-stop watching!`
    }
    return `That's ${Math.round(hours)} hours of pure entertainment!`
}

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getStatsSummary()
                setStats(data)
            } catch (err) {
                console.error(err)
                setError(err instanceof Error ? err.message : "Failed to load stats")
            } finally {
                setLoading(false)
            }
        }

        loadStats()
    }, [])

    const communityStats: CommunityStats | null = stats ? {
        totalUsers: stats.totalUsers ?? 0,
        totalMovies: stats.totalMovies ?? 0,
        totalSeries: stats.totalSeries ?? 0,
        totalEpisodes: stats.totalEpisodes ?? 0,
        totalWatchEntries: stats.totalWatchEntries ?? 0,
        moviesCatalogRuntimeMinutes: stats.moviesCatalogRuntimeMinutes ?? 0,
        seriesCatalogRuntimeMinutes: stats.seriesCatalogRuntimeMinutes ?? 0,
        totalCatalogRuntimeMinutes: stats.totalCatalogRuntimeMinutes ?? 0,
        communityWatchTimeSeconds: stats.communityWatchTimeSeconds ?? 0,
        mostWatchedMovie: stats.mostWatchedMovie?.count > 0 ? stats.mostWatchedMovie : null,
        topGenre: stats.topGenre ?? null,
        totalTheaters: stats.totalTheaters ?? 0,
    } : null

    const catalogEquivalence = stats ? funEquivalence(stats.totalCatalogRuntimeMinutes ?? 0) : null
    const communityEquivalence = stats ? funEquivalence(Math.floor((stats.communityWatchTimeSeconds ?? 0) / 60)) : null

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-6xl px-4 py-12">
                {/* Header with Share */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            <BarChart3 className="h-4 w-4" />
                            Community stats
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">What the community is watching</h1>
                        <p className="max-w-2xl text-lg text-muted-foreground">
                            A quick pulse on adoption, engagement, and the movie habits that keep the tracker lively.
                        </p>
                    </div>
                    {stats && communityStats && (
                        <ShareCommunityStats stats={communityStats} />
                    )}
                </div>

                {loading ? (
                    <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
                        Loading community insights…
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* ═══════════════ HERO: Total Content Catalog ═══════════════ */}
                        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2 text-primary font-medium">
                                    <Clapperboard className="h-4 w-4" />
                                    Total Content Catalog
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl sm:text-6xl font-black tracking-tight">
                                    {formatRuntimeMinutes(stats?.totalCatalogRuntimeMinutes ?? 0)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    of movies and series tracked on MediaVerse
                                </p>
                                {catalogEquivalence && (
                                    <p className="text-sm text-primary font-medium mt-1">
                                        {catalogEquivalence}
                                    </p>
                                )}
                                <div className="flex gap-6 mt-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Movies: </span>
                                        <span className="font-semibold">{formatRuntimeMinutes(stats?.moviesCatalogRuntimeMinutes ?? 0)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Series: </span>
                                        <span className="font-semibold">{formatRuntimeMinutes(stats?.seriesCatalogRuntimeMinutes ?? 0)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ═══════════════ PRIMARY STATS GRID ═══════════════ */}
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Users className="h-4 w-4" /> Total users
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Film className="h-4 w-4" /> Movies
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.totalMovies ?? 0}</div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {stats?.totalMoviesWithLinks ?? 0} with online links
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Tv className="h-4 w-4" /> Series
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.totalSeries ?? 0}</div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {stats?.totalEpisodes ?? 0} episodes
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Building2 className="h-4 w-4" /> Theaters
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.totalTheaters ?? 0}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ═══════════════ COMMUNITY WATCH TIME ═══════════════ */}
                        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-card to-card">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2 text-blue-500 font-medium">
                                    <Timer className="h-4 w-4" />
                                    Community Watch Time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl sm:text-5xl font-black tracking-tight">
                                    {formatSeconds(stats?.communityWatchTimeSeconds ?? 0)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    collectively watched by all users
                                </p>
                                {communityEquivalence && (
                                    <p className="text-sm text-blue-500 font-medium mt-1">
                                        {communityEquivalence}
                                    </p>
                                )}
                                <div className="flex gap-6 mt-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Watch entries: </span>
                                        <span className="font-semibold">{stats?.totalWatchEntries ?? 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Avg per user: </span>
                                        <span className="font-semibold">{stats?.averageWatchesPerUser ?? 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ═══════════════ HIGHLIGHTS ROW ═══════════════ */}
                        <div className="grid gap-4 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" /> Most watched movie
                                    </CardTitle>
                                    <CardDescription>Current crowd favorite based on logged watches.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-semibold">{stats?.mostWatchedMovie?.title || "No watches yet"}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {stats?.mostWatchedMovie?.count ?? 0} watches
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" /> Top location
                                    </CardTitle>
                                    <CardDescription>The place most frequently associated with watch entries.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-semibold">{stats?.topLocation?.name || "No data"}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {stats?.topLocation?.count ?? 0} watch entries
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" /> Top genre
                                    </CardTitle>
                                    <CardDescription>Most popular genre across movies and series.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-semibold">{stats?.topGenre || "No data"}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        across the entire catalog
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ═══════════════ INSIGHTS ═══════════════ */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Insightful takeaways</CardTitle>
                                <CardDescription>Quick signals to help users discover momentum and keep returning.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-foreground">
                                    {stats?.insights?.map((insight: string, index: number) => (
                                        <li key={index} className="flex gap-2">
                                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                    {!stats?.insights?.length && <li>No insights available yet.</li>}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* ═══════════════ INSTAGRAM CTA ═══════════════ */}
                        <Card className="relative overflow-hidden border-pink-500/20 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-orange-500/5">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
                            <CardContent className="py-8">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-orange-400 text-white flex-shrink-0">
                                        <Instagram className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="text-xl font-bold mb-1">Follow us on Instagram</h3>
                                        <p className="text-muted-foreground text-sm mb-3">
                                            Stay updated with movie recommendations, community highlights, and feature announcements.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                                            <a
                                                href="https://www.instagram.com/media.verse.tv/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button size="sm" className="gap-2 bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 hover:from-pink-600 hover:via-red-600 hover:to-orange-500 text-white border-0">
                                                    <Instagram className="h-4 w-4" />
                                                    @media.verse.tv
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </a>
                                            <Badge variant="secondary" className="text-xs">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Growing community
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                )}
            </main>
        </div>
    )
}
