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
            // Update local state
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
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-3xl font-bold">User Management</h1>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 p-4 border rounded-md bg-muted/20">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Sort By Stats</label>
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="default">Default</option>
                            <option value="stats-desc">Most Movies Watched</option>
                            <option value="stats-asc">Least Movies Watched</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Account Status</label>
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="active">Active Only</option>
                            <option value="banned">Banned Only</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Role</label>
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={adminFilter}
                            onChange={(e) => setAdminFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Users Only</option>
                            <option value="admin">Admins Only</option>
                        </select>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Stats</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
