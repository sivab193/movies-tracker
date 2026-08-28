"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getAllUsers, toggleLeaderboardBan } from "@/services/api"
import { Loader2, Shield, Eye, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Header } from "@/components/header"

function formatJoinedDate(user: any) {
    const rawDate = user.createdAt || user.joinedAt || user.created_at || user.dateJoined || user.metadata?.creationTime
    if (!rawDate) return "N/A"

    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) return "N/A"

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export default function AdminUsersPage() {
    const { user, userProfile, loading: authLoading } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [sortOrder, setSortOrder] = useState<string>("default")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [adminFilter, setAdminFilter] = useState<string>("all")

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const data = await getAllUsers()
            setUsers(data)
            setError("")
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && user && userProfile?.isAdmin) {
            fetchUsers()
        } else if (!authLoading) {
            setLoading(false)
        }
    }, [user, userProfile, authLoading])

    const handleBanToggle = async (uid: string) => {
        try {
            await toggleLeaderboardBan(uid)
            setUsers(users.map(u =>
                u.firebaseUid === uid ? { ...u, isBannedFromLeaderboard: !u.isBannedFromLeaderboard } : u
            ))
        } catch (err) {
            alert("Failed to update ban status")
        }
    }

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...users]
        
        if (statusFilter === "active") {
            result = result.filter(u => !u.isBannedFromLeaderboard)
        } else if (statusFilter === "banned") {
            result = result.filter(u => u.isBannedFromLeaderboard)
        }
        
        if (adminFilter === "admin") {
            result = result.filter(u => u.isAdmin)
        } else if (adminFilter === "user") {
            result = result.filter(u => !u.isAdmin)
        }
        
        if (sortOrder === "stats-desc") {
            result.sort((a, b) => (b.totalMoviesWatched || 0) - (a.totalMoviesWatched || 0))
        } else if (sortOrder === "stats-asc") {
            result.sort((a, b) => (a.totalMoviesWatched || 0) - (b.totalMoviesWatched || 0))
        }
        
        return result
    }, [users, sortOrder, statusFilter, adminFilter])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    if (!userProfile?.isAdmin) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
                        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                            {users.length} users
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredAndSortedUsers.length} of {users.length}
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        {error}
                    </div>
                )}

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <div className="flex items-center gap-2">
                                        User
                                        <select
                                            className="h-6 rounded border-none bg-muted/50 px-1 py-0 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={adminFilter}
                                            onChange={(e) => setAdminFilter(e.target.value)}
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="user">Users</option>
                                            <option value="admin">Admins</option>
                                        </select>
                                    </div>
                                </TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Date Joined</TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-2">
                                        Stats
                                        <select
                                            className="h-6 rounded border-none bg-muted/50 px-1 py-0 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                        >
                                            <option value="default">Sort</option>
                                            <option value="stats-desc">Most Watched</option>
                                            <option value="stats-asc">Least Watched</option>
                                        </select>
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-2">
                                        Status
                                        <select
                                            className="h-6 rounded border-none bg-muted/50 px-1 py-0 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All</option>
                                            <option value="active">Active</option>
                                            <option value="banned">Banned</option>
                                        </select>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedUsers.map((u) => (
                                    <TableRow key={u._id || u.firebaseUid}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {u.photoURL && <img src={u.photoURL} alt="" className="h-6 w-6 rounded-full" />}
                                                <span className="font-medium">{u.displayName || "Anonymous"}</span>
                                                {u.isAdmin && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatJoinedDate(u)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {u.totalMoviesWatched || 0} movies
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {u.isBannedFromLeaderboard ? (
                                                <span className="text-destructive flex items-center gap-1 text-xs font-medium">
                                                    <Ban className="h-3 w-3" /> Banned
                                                </span>
                                            ) : (
                                                <span className="text-green-600 flex items-center gap-1 text-xs font-medium">
                                                    <CheckCircle className="h-3 w-3" /> Active
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleBanToggle(u.firebaseUid)}
                                                    className={u.isBannedFromLeaderboard ? "text-green-600" : "text-destructive"}
                                                >
                                                    {u.isBannedFromLeaderboard ? "Unban" : "Ban"}
                                                </Button>
                                                <Link href={`/admin/users/${u.firebaseUid}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4 mr-1" /> View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    )
}