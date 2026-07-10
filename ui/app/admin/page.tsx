"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, ShieldAlert, Trash2, Search, Users, MapPin, ExternalLink, Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getAdminRequests, resolveAdminRequest } from "@/services/user-service"
import { getMovies, deleteMovie, getTheaters, addTheater, updateTheater, deleteTheater } from "@/services/api"
import { formatTimeDisplay } from "@/lib/types"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    const [newTheaterGmapsLink, setNewTheaterGmapsLink] = useState("")
    const [addingTheater, setAddingTheater] = useState(false)
    const [localLoading, setLocalLoading] = useState(true)
    const [titleFilter, setTitleFilter] = useState("")
    const [yearFilter, setYearFilter] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [movieSkip, setMovieSkip] = useState(0)
    const [movieTotal, setMovieTotal] = useState(0)

    // Theater edit & delete confirmation states
    const [editingTheater, setEditingTheater] = useState<any | null>(null)
    const [editTheaterName, setEditTheaterName] = useState("")
    const [editTheaterLoc, setEditTheaterLoc] = useState("")
    const [editTheaterGmapsLink, setEditTheaterGmapsLink] = useState("")
    const [showEditConfirm, setShowEditConfirm] = useState(false)
    const [updatingTheater, setUpdatingTheater] = useState(false)
    const [deleteTheaterTarget, setDeleteTheaterTarget] = useState<any | null>(null)
    const [deletingTheater, setDeletingTheater] = useState(false)

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
            const [reqs, moviesRes, theatersData] = await Promise.all([
                getAdminRequests(),
                getMovies(0, 20),
                getTheaters()
            ])
            const moviesList = moviesRes?.movies || moviesRes || []
            setRequests(reqs || [])
            setMovies(moviesList)
            setFilteredMovies(moviesList)
            setMovieTotal(moviesRes?.total || moviesList.length)
            setTheaters(theatersData || [])
        } catch (err) {
            console.error("Failed to load admin data", err)
        } finally {
            setLocalLoading(false)
        }
    }

    const handleMoviePageChange = async (newSkip: number) => {
        setLocalLoading(true)
        try {
            const res = await getMovies(newSkip, 20)
            const list = res?.movies || res || []
            setMovies(list)
            setFilteredMovies(list)
            setMovieSkip(newSkip)
            setMovieTotal(res?.total || list.length)
        } catch (err) {
            console.error("Failed to load page", err)
        } finally {
            setLocalLoading(false)
        }
    }

    const handleAddTheater = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTheaterName.trim()) return
        setAddingTheater(true)
        try {
            const newT = await addTheater(newTheaterName.trim(), newTheaterLoc.trim() || undefined, newTheaterGmapsLink.trim() || undefined)
            setTheaters([...theaters, newT])
            setNewTheaterName("")
            setNewTheaterLoc("")
            setNewTheaterGmapsLink("")
        } catch (err) {
            console.error("Failed to add theater", err)
            alert(err instanceof Error ? err.message : "Failed to add theater")
        } finally {
            setAddingTheater(false)
        }
    }

    const openEditTheater = (t: any) => {
        setEditingTheater(t)
        setEditTheaterName(t.name || "")
        setEditTheaterLoc(t.location || "")
        setEditTheaterGmapsLink(t.gmapsLink || "")
        setShowEditConfirm(false)
    }

    const confirmUpdateTheater = async () => {
        if (!editingTheater || !editTheaterName.trim()) return
        setUpdatingTheater(true)
        try {
            const updated = await updateTheater(
                editingTheater.id,
                editTheaterName.trim(),
                editTheaterLoc.trim() || undefined,
                editTheaterGmapsLink.trim() || undefined
            )
            setTheaters(theaters.map(t => t.id === editingTheater.id ? updated : t))
            setEditingTheater(null)
            setShowEditConfirm(false)
        } catch (err) {
            console.error("Failed to update theater", err)
            alert(err instanceof Error ? err.message : "Failed to update theater")
        } finally {
            setUpdatingTheater(false)
        }
    }

    const confirmDeleteTheater = async () => {
        if (!deleteTheaterTarget) return
        setDeletingTheater(true)
        try {
            await deleteTheater(deleteTheaterTarget.id)
            setTheaters(theaters.filter(t => t.id !== deleteTheaterTarget.id))
            setDeleteTheaterTarget(null)
        } catch (err) {
            console.error("Failed to delete theater", err)
            alert(err instanceof Error ? err.message : "Failed to delete theater")
        } finally {
            setDeletingTheater(false)
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
                        {/* <AddMovieDialog onMovieAdded={loadData} /> */}
                        {/* Movie addition disabled - use bulk_import.py instead */}
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
                            <div className="flex items-center justify-between mt-4 border-t pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {movies.length > 0 ? movieSkip + 1 : 0} - {Math.min(movieSkip + 20, movieTotal)} of {movieTotal} movies
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={movieSkip === 0 || localLoading}
                                        onClick={() => handleMoviePageChange(Math.max(0, movieSkip - 20))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={movieSkip + 20 >= movieTotal || localLoading}
                                        onClick={() => handleMoviePageChange(movieSkip + 20)}
                                    >
                                        Next
                                    </Button>
                                </div>
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
                            <form onSubmit={handleAddTheater} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-muted/20">
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
                                        placeholder="City / Location (e.g. Hosur, Bangalore)"
                                        value={newTheaterLoc}
                                        onChange={(e) => setNewTheaterLoc(e.target.value)}
                                        disabled={addingTheater}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder="Google Maps Link (https://maps.google.com/...)"
                                        value={newTheaterGmapsLink}
                                        onChange={(e) => setNewTheaterGmapsLink(e.target.value)}
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
                                            <th className="text-left py-3 px-2 font-medium">Maps Link</th>
                                            <th className="text-center py-3 px-2 font-medium w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {theaters.map((t) => (
                                            <tr key={t.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-2 font-medium">{t.name}</td>
                                                <td className="py-3 px-2 text-muted-foreground">{t.location || "N/A"}</td>
                                                <td className="py-3 px-2">
                                                    {t.gmapsLink ? (
                                                        <a
                                                            href={t.gmapsLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-xs bg-primary/10 px-2.5 py-1 rounded-full"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            View Map
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">N/A</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                            onClick={() => openEditTheater(t)}
                                                            title="Edit Theater"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteTheaterTarget(t)}
                                                            title="Delete Theater"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {theaters.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-muted-foreground">
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

            {/* Delete Movie Confirmation Dialog */}
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

            {/* Edit Theater Modal */}
            <Dialog open={!!editingTheater} onOpenChange={(open) => !open && setEditingTheater(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Theater</DialogTitle>
                        <DialogDescription>Update the name, location, or Google Maps link for this theater.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Theater Name *</label>
                            <Input
                                placeholder="e.g. PVR Cinemas"
                                value={editTheaterName}
                                onChange={(e) => setEditTheaterName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location / City</label>
                            <Input
                                placeholder="e.g. Chennai"
                                value={editTheaterLoc}
                                onChange={(e) => setEditTheaterLoc(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Google Maps Link</label>
                            <Input
                                placeholder="https://maps.google.com/..."
                                value={editTheaterGmapsLink}
                                onChange={(e) => setEditTheaterGmapsLink(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTheater(null)}>Cancel</Button>
                        <Button
                            onClick={() => setShowEditConfirm(true)}
                            disabled={!editTheaterName.trim() || updatingTheater}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Confirmation Box */}
            <AlertDialog open={showEditConfirm} onOpenChange={(open) => !open && setShowEditConfirm(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Theater Update</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to update <strong>{editingTheater?.name}</strong> to <strong>{editTheaterName}</strong>?
                            Any watch history entries associated with this theater may reflect updated location information.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={updatingTheater}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUpdateTheater}
                            disabled={updatingTheater}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {updatingTheater ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Update"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Theater Confirmation Box */}
            <AlertDialog open={!!deleteTheaterTarget} onOpenChange={() => setDeleteTheaterTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Theater</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTheaterTarget?.name}</strong> ({deleteTheaterTarget?.location || "N/A"})?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingTheater}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteTheater}
                            disabled={deletingTheater}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletingTheater ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Theater"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
