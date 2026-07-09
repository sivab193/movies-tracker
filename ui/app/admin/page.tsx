"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, ShieldAlert, Trash2, Search, Users, MapPin } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getAdminRequests, resolveAdminRequest } from "@/services/user-service"
import { getMovies, deleteMovie, getTheaters, addTheater, deleteTheater } from "@/services/api"
import { formatTimeDisplay } from "@/lib/types"
import { AddMovieDialog } from "@/components/add-movie-dialog"
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

export default function AdminPage() {
    const { user, userProfile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [requests, setRequests] = useState<any[]>([])
    const [movies, setMovies] = useState<any[]>([])
    const [filteredMovies, setFilteredMovies] = useState<any[]>([])
    const [theaters, setTheaters] = useState<any[]>([])
    const [newTheaterName, setNewTheaterName] = useState("")
    const [newTheaterLoc, setNewTheaterLoc] = useState("")
    const [addingTheater, setAddingTheater] = useState(false)
    const [localLoading, setLocalLoading] = useState(true)
    const [titleFilter, setTitleFilter] = useState("")
    const [yearFilter, setYearFilter] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/auth")
            } else if (!userProfile?.isAdmin) {
                router.push("/")
            } else {
                loadData()
            }
        }
    }, [user, userProfile, authLoading, router])

    const loadData = async () => {
        try {
            const [reqs, moviesData, theatersData] = await Promise.all([
                getAdminRequests(),
                getMovies(),
                getTheaters()
            ])
            setRequests(reqs || [])
            setMovies(moviesData || [])
            setFilteredMovies(moviesData || [])
            setTheaters(theatersData || [])
        } catch (err) {
            console.error("Failed to load admin data", err)
        } finally {
            setLocalLoading(false)
        }
    }

    const handleAddTheater = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTheaterName.trim()) return
        setAddingTheater(true)
        try {
            const newT = await addTheater(newTheaterName.trim(), newTheaterLoc.trim() || undefined)
            setTheaters([...theaters, newT])
            setNewTheaterName("")
            setNewTheaterLoc("")
        } catch (err) {
            console.error("Failed to add theater", err)
            alert(err instanceof Error ? err.message : "Failed to add theater")
        } finally {
            setAddingTheater(false)
        }
    }

    const handleDeleteTheater = async (id: string) => {
        if (!confirm("Are you sure you want to delete this theater?")) return
        try {
            await deleteTheater(id)
            setTheaters(theaters.filter(t => t.id !== id))
        } catch (err) {
            console.error("Failed to delete theater", err)
            alert(err instanceof Error ? err.message : "Failed to delete theater")
        }
    }

    useEffect(() => {
        let filtered = movies
        if (titleFilter) {
            filtered = filtered.filter(m =>
                m.title?.toLowerCase().includes(titleFilter.toLowerCase())
            )
        }
        if (yearFilter) {
            filtered = filtered.filter(m =>
                String(m.year).includes(yearFilter)
            )
        }
        setFilteredMovies(filtered)
    }, [titleFilter, yearFilter, movies])

    const handleResolve = async (userId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            await resolveAdminRequest(userId, action)
            setRequests(requests.filter(r => r.id !== userId))
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteMovie(deleteTarget.id)
            setMovies(movies.filter(m => m.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err) {
            console.error("Failed to delete movie", err)
        } finally {
            setDeleting(false)
        }
    }

    if (authLoading || localLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                    <div className="flex gap-4">
                        <Link href="/admin/users">
                            <Button variant="outline" className="gap-2">
                                <Users className="h-4 w-4" />
                                Users
                            </Button>
                        </Link>
                        <AddMovieDialog onMovieAdded={loadData} />
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Access Requests */}
                    {requests.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-yellow-500" />
                                    Access Requests
                                </CardTitle>
                                <CardDescription>Manage user requests for admin access</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {requests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{request.email}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Requested: {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString() : "Unknown"}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleResolve(request.id, 'REJECT')}>
                                                    Reject
                                                </Button>
                                                <Button size="sm" onClick={() => handleResolve(request.id, 'APPROVE')}>
                                                    Approve
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Movies List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Movies ({filteredMovies.length})</CardTitle>
                            <CardDescription>All movies in the database</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Filters */}
                            <div className="flex gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by title..."
                                        value={titleFilter}
                                        onChange={(e) => setTitleFilter(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Input
                                    placeholder="Year"
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="w-24"
                                    maxLength={4}
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 font-medium">Title</th>
                                            <th className="text-left py-3 px-2 font-medium">Year</th>
                                            <th className="text-left py-3 px-2 font-medium">Runtime</th>
                                            <th className="text-center py-3 px-2 font-medium">Submissions</th>
                                            <th className="text-right py-3 px-2 font-medium">Avg Time</th>
                                            <th className="text-center py-3 px-2 font-medium w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMovies.map((movie) => (
                                            <tr key={movie.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-2 font-medium">{movie.title}</td>
                                                <td className="py-3 px-2">{movie.year}</td>
                                                <td className="py-3 px-2">{movie.runtime || "N/A"}</td>
                                                <td className="py-3 px-2 text-center">{movie.submissionCount || 0}</td>
                                                <td className="py-3 px-2 text-right">
                                                    {movie.averageTimeSeconds ? formatTimeDisplay(movie.averageTimeSeconds) : "N/A"}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setDeleteTarget(movie)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredMovies.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No movies found. Use the Add Movie button to add a movie.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Theaters Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Theaters ({theaters.length})
                            </CardTitle>
                            <CardDescription>Manage the approved list of theaters for users to log watches</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Theater Form */}
                            <form onSubmit={handleAddTheater} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/20">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder="Theater Name (e.g. IMAX Cinemas)"
                                        value={newTheaterName}
                                        onChange={(e) => setNewTheaterName(e.target.value)}
                                        required
                                        disabled={addingTheater}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder="Location (e.g. Forum Mall, Bangalore)"
                                        value={newTheaterLoc}
                                        onChange={(e) => setNewTheaterLoc(e.target.value)}
                                        disabled={addingTheater}
                                    />
                                </div>
                                <Button type="submit" disabled={addingTheater || !newTheaterName.trim()} className="shrink-0">
                                    {addingTheater ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Theater"}
                                </Button>
                            </form>

                            {/* Theaters List */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 font-medium">Name</th>
                                            <th className="text-left py-3 px-2 font-medium">Location</th>
                                            <th className="text-center py-3 px-2 font-medium w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {theaters.map((t) => (
                                            <tr key={t.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-2 font-medium">{t.name}</td>
                                                <td className="py-3 px-2 text-muted-foreground">{t.location || "N/A"}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteTheater(t.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {theaters.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No theaters added yet. Add a theater above to populate the list.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
                            This will also delete all related submissions. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
