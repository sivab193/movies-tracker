"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getPublicProfile, getAdminUserProfile, toggleLeaderboardBan, deleteWatchHistory } from "@/services/api"
import { AddWatchDialog } from "@/components/add-watch-dialog"
import { Loader2, Film, Shield, Ban, CheckCircle, Pencil, Trash, ArrowLeft, ArrowUpDown, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { type WatchHistoryEntry, formatCurrency, formatTimeDisplay, resolveApiUrl } from "@/lib/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
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

const formatSafeDate = (dateVal: any) => {
    if (!dateVal) return "N/A"
    try {
        const d = new Date(dateVal)
        if (isNaN(d.getTime())) return "N/A"
        return format(d, "MMM d, yyyy")
    } catch {
        return "N/A"
    }
}

export default function AdminUserDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { user, userProfile, loading: authLoading } = useAuth()
    const userId = params.userId as string

    // Redirect non-admins
    useEffect(() => {
        if (!authLoading && (!user || !userProfile?.isAdmin)) {
            router.push("/")
        }
    }, [user, userProfile, authLoading, router])

    const [targetUser, setTargetUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editingEntry, setEditingEntry] = useState<WatchHistoryEntry | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

    const refreshData = async () => {
        if (!user || !userId) return
        try {
            const data = await getAdminUserProfile(userId)
            setTargetUser(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user && userId) refreshData()
    }, [user, userId])

    const confirmDelete = async () => {
        if (!deletingId) return
        try {
            await deleteWatchHistory(userId, deletingId)
            await refreshData()
        } catch (err) {
            alert("Failed to delete")
        } finally {
            setDeletingId(null)
        }
    }

    const history = useMemo(() => {
        let data = targetUser?.watchHistory || []
        return [...data].sort((a: any, b: any) => {
            const dateA = new Date(a.timestamp || a.createdAt).getTime() || 0
            const dateB = new Date(b.timestamp || b.createdAt).getTime() || 0
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
    }, [targetUser, sortOrder])

    if (authLoading || loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
    if (!user || !userProfile?.isAdmin) return null
    if (!targetUser) return <div className="p-8 text-center text-red-500">User not found</div>

    return (
        <div className="mx-auto max-w-7xl w-full px-4 py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon" aria-label="Back to users" title="Back to users"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div className="flex items-center gap-2">
                    {targetUser.photoURL && <img src={targetUser.photoURL} className="h-10 w-10 rounded-full" />}
                    <div>
                        <h1 className="text-2xl font-bold">{targetUser.displayName}</h1>
                        <p className="text-sm text-muted-foreground">{targetUser.email}</p>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    {targetUser.isBannedFromLeaderboard ? (
                        <Button variant="secondary" className="text-destructive font-bold" disabled>
                            <Ban className="mr-2 h-4 w-4" /> Banned from Leaderboard
                        </Button>
                    ) : (
                        <span className="text-green-500 flex items-center text-sm font-medium px-3 bg-green-500/10 rounded-full h-9">
                            <CheckCircle className="mr-1 h-3 w-3" /> Good Standing
                        </span>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Watched</div>
                    <div className="text-2xl font-bold">{targetUser.totalMoviesWatched}</div>
                </div>
                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Watch Time</div>
                    <div className="text-2xl font-bold">{formatTimeDisplay(targetUser.totalRuntimeSeconds || 0)}</div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Film className="h-5 w-5" /> Watch History (Admin View)
                </h2>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">
                                    <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                                        Date <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Movie</TableHead>
                                <TableHead>Theater</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No movies logged yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((entry: WatchHistoryEntry, i: number) => (
                                    <TableRow key={entry._id || i}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {formatSafeDate(entry.timestamp || entry.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {entry.moviePosterUrl && (
                                                    <img src={resolveApiUrl(entry.moviePosterUrl)} alt="" className="h-8 w-6 object-cover rounded hidden sm:block" />
                                                )}
                                                <span>{entry.movieTitle}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {entry.theaterName || <span className="text-muted-foreground italic">N/A</span>}
                                            {entry.theaterLocation && <div className="text-xs text-muted-foreground">{entry.theaterLocation}</div>}
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit this log" title="Edit this log" onClick={() => setEditingEntry(entry)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete this log" title="Delete this log" onClick={() => entry._id && setDeletingId(entry._id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Dialog */}
            <AddWatchDialog
                uid={userId} // Targeting the User ID from params
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
                        <AlertDialogTitle>Delete User Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this watch entry from the user's history.
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
        </div>
    )
}
