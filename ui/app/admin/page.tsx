"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getAllUsers, getMovies, getTheaters, getWatchLinkReports } from "@/services/api"
import { getAdminRequests } from "@/services/user-service"
import {
    ArrowRight,
    BadgeCheck,
    CreditCard,
    Database,
    Film,
    KeyRound,
    Loader2,
    MapPin,
    MonitorPlay,
    ShieldAlert,
    Sparkles,
    Tv,
    Users,
    AlertTriangle,
} from "lucide-react"

type AdminCard = {
    title: string
    description: string
    href: string
    icon: any
    count?: number | string
    tone: string
    action: string
}

export default function AdminPage() {
    const { user, userProfile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [counts, setCounts] = useState({ movies: "—" as number | string, theaters: "—" as number | string, users: "—" as number | string, requests: "—" as number | string, watchLinkReports: "—" as number | string })

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push("/auth")
            return
        }
        if (!userProfile?.isAdmin) {
            router.push("/")
            return
        }

        async function loadCounts() {
            setLoading(true)
            try {
                const [moviesRes, theatersRes, usersRes, requestsRes, linkReportsRes] = await Promise.allSettled([getMovies(0, 1), getTheaters(), getAllUsers(), getAdminRequests(), getWatchLinkReports()])
                setCounts({
                    movies: moviesRes.status === "fulfilled" ? moviesRes.value?.total ?? moviesRes.value?.movies?.length ?? moviesRes.value?.length ?? "—" : "—",
                    theaters: theatersRes.status === "fulfilled" ? theatersRes.value?.length ?? "—" : "—",
                    users: usersRes.status === "fulfilled" ? usersRes.value?.length ?? "—" : "—",
                    requests: requestsRes.status === "fulfilled" ? requestsRes.value?.length ?? "—" : "—",
                    watchLinkReports: linkReportsRes.status === "fulfilled" ? linkReportsRes.value?.count ?? linkReportsRes.value?.reports?.length ?? "—" : "—",
                })
            } catch (error) {
                console.error("Failed to load admin summary", error)
            } finally {
                setLoading(false)
            }
        }

        loadCounts()
    }, [authLoading, router, user, userProfile])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            </div>
        )
    }

    if (!user || !userProfile?.isAdmin) return null

    const cards: AdminCard[] = [
        { title: "Movies", description: "Manage movie metadata, posters, verification, and title-card timing.", href: "/admin/movies", icon: Film, count: counts.movies, tone: "from-rose-500/20 to-red-500/5 border-rose-500/25", action: "Open movie tools" },
        { title: "Series", description: "Maintain TV series entries and streaming availability.", href: "/admin/series", icon: Tv, tone: "from-red-500/20 to-orange-500/5 border-red-500/25", action: "Open series tools" },
        { title: "Users", description: "Review accounts, roles, leaderboard bans, profiles, and joined dates.", href: "/admin/users", icon: Users, count: counts.users, tone: "from-slate-500/20 to-zinc-500/5 border-slate-500/25", action: "Manage users" },
        { title: "Theaters", description: "Add, import, verify, and clean up approved theater records.", href: "/admin/theaters", icon: MapPin, count: counts.theaters, tone: "from-pink-500/20 to-rose-500/5 border-pink-500/25", action: "Open theater tools" },
        { title: "OTT Catalog", description: "Browse every linked streaming title grouped by provider.", href: "/admin/ott", icon: MonitorPlay, tone: "from-fuchsia-500/20 to-purple-500/5 border-fuchsia-500/25", action: "Open catalog" },
        { title: "Watch-link Reports", description: "Review streaming links viewers flagged as expired or not working.", href: "/admin/tools#watch-link-reports", icon: AlertTriangle, count: counts.watchLinkReports, tone: "from-amber-500/20 to-orange-500/5 border-amber-500/25", action: "Review reports" },
        { title: "Watch Orders", description: "Edit curated watch-order links and published descriptions.", href: "/admin/watch-orders", icon: BadgeCheck, tone: "from-orange-500/20 to-amber-500/5 border-orange-500/25", action: "Manage orders" },
        { title: "Cards & Offers", description: "Manage bank-card and movie-ticket offer listings.", href: "/admin/cards", icon: CreditCard, tone: "from-rose-500/20 to-pink-500/5 border-rose-500/25", action: "Open offers" },
        { title: "OMDb API Keys", description: "Monitor API keys, health, and usage limits.", href: "/admin/omdb", icon: KeyRound, tone: "from-violet-500/20 to-indigo-500/5 border-violet-500/25", action: "Manage keys" },
        { title: "Cleanup", description: "Scan duplicate movies and theaters, then merge them safely.", href: "/admin/cleanup", icon: Database, tone: "from-amber-500/20 to-yellow-500/5 border-amber-500/30", action: "Open cleanup" },
        { title: "Data Quality", description: "Find missing runtime, cover art, and reported title-card time gaps.", href: "/admin/data-quality", icon: ShieldAlert, tone: "from-sky-500/20 to-cyan-500/5 border-sky-500/30", action: "Scan quality" },
    ]

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8 md:py-12">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"><Sparkles className="h-3.5 w-3.5" />Admin workspace</div>
                        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Pick a management area instead of expanding a long list. The full tools workspace remains at /admin/tools while sections are moved out incrementally.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="gap-2"><Link href="/admin/tools">Full Tools <ArrowRight className="h-4 w-4" /></Link></Button>
                        <Button asChild className="gap-2"><Link href="/admin/users">Users <ArrowRight className="h-4 w-4" /></Link></Button>
                    </div>
                </div>

                <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryTile label="Movies" value={counts.movies} />
                    <SummaryTile label="Theaters" value={counts.theaters} />
                    <SummaryTile label="Users" value={counts.users} />
                    <SummaryTile label="Access Requests" value={counts.requests} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => {
                        const Icon = card.icon
                        return (
                            <Link key={card.title} href={card.href} className={`group rounded-2xl border bg-gradient-to-br ${card.tone} p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg`}>
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div className="rounded-xl border border-white/10 bg-background/70 p-2.5"><Icon className="h-5 w-5 text-primary" /></div>
                                    {card.count !== undefined && <span className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs font-bold text-muted-foreground">{card.count}</span>}
                                </div>
                                <h2 className="text-lg font-bold tracking-tight">{card.title}</h2>
                                <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">{card.description}</p>
                                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">{card.action}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></div>
                            </Link>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}

function SummaryTile({ label, value }: { label: string; value: number | string }) {
    return <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
}
