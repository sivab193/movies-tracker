"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Clock,
    Film,
    Ticket,
    Search,
    Calendar,
    MapPin,
    ArrowUpDown,
    CreditCard,
    Pencil,
    Trash,
    ExternalLink
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AddWatchDialog } from "@/components/add-watch-dialog"
import { formatTimeDisplay, type WatchHistoryEntry, resolveApiUrl } from "@/lib/types"
import { getMySettings } from "@/services/user-service"
import { deleteWatchHistory } from "@/services/api"
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

export default function WatchHistoryPage() {
    const { user, userProfile: contextProfile } = useAuth()
    const [profile, setProfile] = useState(contextProfile)
    const [searchQuery, setSearchQuery] = useState("")
    const [yearFilter, setYearFilter] = useState("All")
    const [monthFilter, setMonthFilter] = useState("All")
    const [cityFilter, setCityFilter] = useState("All")
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const [loading, setLoading] = useState(false)
    const [editingEntry, setEditingEntry] = useState<WatchHistoryEntry | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Keep local profile in sync with context initially, then manage updates
    useEffect(() => {
        if (contextProfile) setProfile(contextProfile)
    }, [contextProfile])

    const refreshData = async () => {
        if (!user) return
        try {
            const data = await getMySettings()
            setProfile(data)
        } catch (err) {
            console.error("Failed to refresh profile", err)
        }
    }

    const confirmDelete = async () => {
        if (!user || !deletingId) return
        try {
            await deleteWatchHistory(user.uid, deletingId)
            await refreshData()
        } catch (err) {
            console.error("Delete failed", err)
        } finally {
            setDeletingId(null)
        }
    }

    const uniqueYears = useMemo(() => {
        const years = new Set<string>()
        profile?.watchHistory?.forEach(h => {
            const d = new Date(h.timestamp || h.createdAt)
            if (!isNaN(d.getTime())) {
                years.add(d.getFullYear().toString())
            }
        })
        return Array.from(years).sort().reverse()
    }, [profile?.watchHistory])

    const uniqueCities = useMemo(() => {
        const cities = new Set<string>()
        profile?.watchHistory?.forEach(h => {
            const loc = (h.theaterLocation || "").trim()
            if (loc && !loc.startsWith("http")) {
                const city = loc.split(",")[0].replace(/\s+(Indiana|Illinois|IN|IL)$/i, "").trim()
                if (city) cities.add(city)
            }
        })
        return Array.from(cities).sort()
    }, [profile?.watchHistory])

    const monthsList = [
        { value: "All", label: "All Months" },
        { value: "0", label: "Jan" },
        { value: "1", label: "Feb" },
        { value: "2", label: "Mar" },
        { value: "3", label: "Apr" },
        { value: "4", label: "May" },
        { value: "5", label: "Jun" },
        { value: "6", label: "Jul" },
        { value: "7", label: "Aug" },
        { value: "8", label: "Sep" },
        { value: "9", label: "Oct" },
        { value: "10", label: "Nov" },
        { value: "11", label: "Dec" }
    ]

    const history = useMemo(() => {
        let data = profile?.watchHistory || []

        // Filter by Search Query
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            data = data.filter(item =>
                (item.movieTitle || "").toLowerCase().includes(lower) ||
                (item.theaterName || "").toLowerCase().includes(lower) ||
                (item.theaterLocation || "").toLowerCase().includes(lower)
            )
        }

        // Filter by Year
        if (yearFilter !== "All") {
            data = data.filter(item => {
                const d = new Date(item.timestamp || item.createdAt)
                return !isNaN(d.getTime()) && d.getFullYear().toString() === yearFilter
            })
        }

        // Filter by Month
        if (monthFilter !== "All") {
            data = data.filter(item => {
                const d = new Date(item.timestamp || item.createdAt)
                return !isNaN(d.getTime()) && d.getMonth().toString() === monthFilter
            })
        }

        // Filter by City
        if (cityFilter !== "All") {
            data = data.filter(item => {
                const loc = (item.theaterLocation || "").trim()
                if (!loc || loc.startsWith("http")) return false
                const city = loc.split(",")[0].replace(/\s+(Indiana|Illinois|IN|IL)$/i, "").trim()
                return city.toLowerCase() === cityFilter.toLowerCase()
            })
        }

        // Sort by timestamp
        return [...data].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt).getTime()
            const dateB = new Date(b.timestamp || b.createdAt).getTime()
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
        })
    }, [profile?.watchHistory, searchQuery, yearFilter, monthFilter, cityFilter, sortOrder])

    // Stats
    const stats = useMemo(() => {
        const totalRuntime = profile?.totalRuntimeSeconds || 0
        const totalMovies = profile?.totalMoviesWatched || 0

        let costINR = 0
        let costUSD = 0

        profile?.watchHistory?.forEach(h => {
            if (h.currency === 'INR') costINR += h.ticketCost
            else if (h.currency === 'USD') costUSD += h.ticketCost
        })

        return { totalRuntime, totalMovies, costINR, costUSD }
    }, [profile])


    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount)
    }

    const formatDate = (dateStr: string | Date) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background pb-12">
                <Header />
                <main className="container py-16 max-w-lg mx-auto px-4 text-center">
                    <Card className="p-8 border-dashed">
                        <CardHeader className="p-0 mb-4">
                            <Clock className="h-12 w-12 text-primary mx-auto mb-2" />
                            <CardTitle className="text-2xl">Your Personal Movie Log</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 text-muted-foreground space-y-4">
                            <p>
                                Sign in to start logging your watched movies, tracking ticket expenses across currencies (INR / USD), and analyzing your personal cinema stats!
                            </p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <Header />
            <main className="container py-8 max-w-6xl mx-auto px-4">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Clock className="h-8 w-8 text-primary" />
                            Watch History
                        </h1>
                        <p className="text-muted-foreground mt-1">Track your cinematic journey.</p>
                    </div>

                    {user && (
                        <>
                            <AddWatchDialog
                                uid={user.uid}
                                onWatchAdded={refreshData}
                            />

                            {/* Edit Dialog - Hidden Trigger */}
                            <AddWatchDialog
                                uid={user.uid}
                                initialData={editingEntry || undefined}
                                open={!!editingEntry}
                                onOpenChange={(open) => !open && setEditingEntry(null)}
                                onWatchAdded={() => {
                                    refreshData()
                                    setEditingEntry(null)
                                }}
                                hideTrigger={true}
                            />

                            {/* Delete Alert */}
                            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this watch log.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Movies Watched</CardTitle>
                            <Film className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalMovies}</div>
                            <p className="text-xs text-muted-foreground">Lifetime total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Runtime</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatTimeDisplay(stats.totalRuntime)}</div>
                            <p className="text-xs text-muted-foreground">Time spent watching</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.costINR > 0 && <span>{formatCurrency(stats.costINR, 'INR')}</span>}
                                {stats.costINR > 0 && stats.costUSD > 0 && <span className="mx-2">+</span>}
                                {stats.costUSD > 0 && <span>{formatCurrency(stats.costUSD, 'USD')}</span>}
                                {stats.costINR === 0 && stats.costUSD === 0 && "0.00"}
                            </div>
                            <p className="text-xs text-muted-foreground">On movie tickets</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <CardTitle>History Log</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                <div className="relative flex-1 sm:flex-none sm:w-56">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs..."
                                        className="pl-8 h-9 text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                >
                                    <option value="All">All Years</option>
                                    {uniqueYears.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                >
                                    {monthsList.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium max-w-[140px] truncate focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                >
                                    <option value="All">All Cities</option>
                                    {uniqueCities.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Film className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No watch logs match your filters.</p>
                                <p className="text-sm mt-1">Try clearing filters or log a new watch!</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[140px] cursor-pointer hover:text-foreground transition-colors" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                                                <div className="flex items-center gap-1.5 font-semibold">
                                                    Date <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                            </TableHead>
                                            <TableHead>Movie</TableHead>
                                            <TableHead>Theater</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((entry, i) => (
                                            <TableRow key={entry._id || i}>
                                                <TableCell className="font-medium text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                                    {formatDate(entry.timestamp || entry.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{entry.movieTitle}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">{entry.theaterName || "N/A"}</span>
                                                        {(entry.theaterGmapsLink || entry.theaterLocation) && (
                                                            <a
                                                                href={
                                                                    entry.theaterGmapsLink
                                                                        ? entry.theaterGmapsLink
                                                                        : entry.theaterLocation?.startsWith("http")
                                                                        ? entry.theaterLocation
                                                                        : `https://maps.google.com/?q=${encodeURIComponent(
                                                                              `${entry.theaterName || ""} ${entry.theaterLocation || ""}`.trim()
                                                                          )}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <MapPin className="h-3 w-3" />
                                                                <span>{entry.theaterLocation && !entry.theaterLocation.startsWith("http") ? entry.theaterLocation : "View Map"}</span>
                                                                <ExternalLink className="h-2.5 w-2.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono">{formatCurrency(entry.ticketCost, entry.currency)}</span>
                                                        {entry.ticketStubUrl && (
                                                            <a 
                                                                href={resolveApiUrl(entry.ticketStubUrl)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                                                            >
                                                                🎟️ View Ticket
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingEntry(entry)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => {
                                                                console.log("Delete clicked for entry:", entry)
                                                                if (!entry._id) {
                                                                    console.error("Entry missing _id:", entry)
                                                                    alert("Cannot delete: entry has no ID")
                                                                    return
                                                                }
                                                                setDeletingId(entry._id)
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
