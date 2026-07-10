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

    const history = useMemo(() => {
        let data = profile?.watchHistory || []

        // Filter
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            data = data.filter(item =>
                (item.movieTitle || "").toLowerCase().includes(lower) ||
                (item.theaterName || "").toLowerCase().includes(lower)
            )
        }

        // Sort by timestamp
        return [...data].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt).getTime()
            const dateB = new Date(b.timestamp || b.createdAt).getTime()
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
        })
    }, [profile?.watchHistory, searchQuery, sortOrder])

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
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <CardTitle>History Log</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search movies or theaters..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Film className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No movies logged yet.</p>
                                <p className="text-sm">Click "Add Watch" to log your first movie!</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {/* <TableHead className="w-[180px] cursor-pointer" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                                                <div className="flex items-center gap-2">
                                                    Date <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead> */}
                                            <TableHead>Movie</TableHead>
                                            <TableHead>Theater</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((entry, i) => (
                                            <TableRow key={entry._id || i}>
                                                {/* <TableCell className="font-medium text-muted-foreground">
                                                    {formatDate(entry.timestamp || entry.createdAt)}
                                                </TableCell> */}
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
