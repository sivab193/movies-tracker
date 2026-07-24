"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, ShieldAlert, Trash2, Search, Users, MapPin, ExternalLink, Pencil, Check, X, ChevronLeft, ChevronRight, BadgeCheck, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getAdminRequests, resolveAdminRequest } from "@/services/user-service"
import { getMovies, deleteMovie, clearMovieSubmissions, getTheaters, addTheater, updateTheater, deleteTheater, updateMovie, addMovie, fetchOmdbPreview, getTheaterDuplicates, mergeTheaterDuplicates, getMovieDuplicates, mergeMovieDuplicates, verifyTheater, verifyMovie, getMovieDataQuality } from "@/services/api"
import { formatTimeDisplay, resolveApiUrl } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    
    // Global movie filter states
    const [titleFilter, setTitleFilter] = useState("")
    const [yearFilter, setYearFilter] = useState("")
    const [languageFilter, setLanguageFilter] = useState("All")
    const [missingPosterFilter, setMissingPosterFilter] = useState(false)
    const [avgTimeFilter, setAvgTimeFilter] = useState("All")
    const [fetchingMovies, setFetchingMovies] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [movieSkip, setMovieSkip] = useState(0)
    const [movieTotal, setMovieTotal] = useState(0)

    // Inline Movie Editing states
    const [editingMovieId, setEditingMovieId] = useState<string | null>(null)
    const [inlineMovieTitle, setInlineMovieTitle] = useState("")
    const [inlineMovieYear, setInlineMovieYear] = useState("")
    const [inlineMovieLanguage, setInlineMovieLanguage] = useState("")
    const [inlineMovieReleaseDate, setInlineMovieReleaseDate] = useState("")
    const [inlineMovieRuntime, setInlineMovieRuntime] = useState("")
    const [inlineMoviePosterUrl, setInlineMoviePosterUrl] = useState("")
    const [savingMovieId, setSavingMovieId] = useState<string | null>(null)

    // Add & Edit Movie Modal states
    const [isMovieModalOpen, setIsMovieModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<"add" | "edit">("add")
    const [modalStep, setModalStep] = useState<1 | 2>(1)
    const [modalMovieId, setModalMovieId] = useState<string | null>(null)
    const [modalImdbId, setModalImdbId] = useState("")
    const [fetchingOmdb, setFetchingOmdb] = useState(false)
    const [modalTitle, setModalTitle] = useState("")
    const [modalYear, setModalYear] = useState("")
    const [modalLanguage, setModalLanguage] = useState("English")
    const [modalReleaseDate, setModalReleaseDate] = useState("")
    const [modalRuntime, setModalRuntime] = useState("")
    const [modalImdbRating, setModalImdbRating] = useState("")
    const [modalPosterUrl, setModalPosterUrl] = useState("")
    const [modalPosterFile, setModalPosterFile] = useState<File | null>(null)
    const [modalPosterPreview, setModalPosterPreview] = useState<string>("")
    const [modalPosterType, setModalPosterType] = useState<"url" | "file">("url")
    const [savingModalMovie, setSavingModalMovie] = useState(false)
    const [clearingSubmissions, setClearingSubmissions] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)

    // Theater search & pagination states
    const [theaterSearch, setTheaterSearch] = useState("")
    const [theaterCityFilter, setTheaterCityFilter] = useState("All")
    const [theaterSkip, setTheaterSkip] = useState(0)

    // Theater edit & delete confirmation states
    const [editingTheater, setEditingTheater] = useState<any | null>(null)
    const [editTheaterName, setEditTheaterName] = useState("")
    const [editTheaterLoc, setEditTheaterLoc] = useState("")
    const [editTheaterGmapsLink, setEditTheaterGmapsLink] = useState("")
    const [showEditConfirm, setShowEditConfirm] = useState(false)
    const [updatingTheater, setUpdatingTheater] = useState(false)
    const [deleteTheaterTarget, setDeleteTheaterTarget] = useState<any | null>(null)
    const [deletingTheater, setDeletingTheater] = useState(false)

    // Deduplication states
    const [theaterDups, setTheaterDups] = useState<any[]>([])
    const [theaterDupsCount, setTheaterDupsCount] = useState(0)
    const [movieDups, setMovieDups] = useState<any[]>([])
    const [movieDupsCount, setMovieDupsCount] = useState(0)
    const [scanningDups, setScanningDups] = useState(false)
    const [mergingTheaterDups, setMergingTheaterDups] = useState(false)
    const [mergingMovieDups, setMergingMovieDups] = useState(false)

    // Verification + data quality states
    const [verifyingTheaterId, setVerifyingTheaterId] = useState<string | null>(null)
    const [verifyingMovieId, setVerifyingMovieId] = useState<string | null>(null)
    const [showUnverifiedTheatersOnly, setShowUnverifiedTheatersOnly] = useState(false)
    const [dataQuality, setDataQuality] = useState<any | null>(null)
    const [scanningDataQuality, setScanningDataQuality] = useState(false)

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

    const handleScanDuplicates = async () => {
        setScanningDups(true)
        try {
            const [tRes, mRes] = await Promise.all([
                getTheaterDuplicates(),
                getMovieDuplicates()
            ])
            setTheaterDups(tRes.duplicateGroups || [])
            setTheaterDupsCount(tRes.totalDuplicatesCount || 0)
            setMovieDups(mRes.duplicateGroups || [])
            setMovieDupsCount(mRes.totalDuplicatesCount || 0)
        } catch (err) {
            console.error("Failed to scan duplicates", err)
            alert(err instanceof Error ? err.message : "Failed to scan duplicates")
        } finally {
            setScanningDups(false)
        }
    }

    const handleMergeTheaterDups = async () => {
        if (!confirm(`Are you sure you want to automatically merge all ${theaterDupsCount} duplicate theaters? This will update user watch histories to point to the preserved documents.`)) return
        setMergingTheaterDups(true)
        try {
            const res = await mergeTheaterDuplicates()
            alert(res.message || "Theaters merged successfully")
            await Promise.all([loadData(), handleScanDuplicates()])
        } catch (err) {
            console.error("Failed to merge theaters", err)
            alert(err instanceof Error ? err.message : "Failed to merge theaters")
        } finally {
            setMergingTheaterDups(false)
        }
    }

    const handleMergeMovieDups = async () => {
        if (!confirm(`Are you sure you want to automatically merge all ${movieDupsCount} duplicate movies? This will update user watch histories to point to the preserved documents.`)) return
        setMergingMovieDups(true)
        try {
            const res = await mergeMovieDuplicates()
            alert(res.message || "Movies merged successfully")
            await Promise.all([loadData(), handleScanDuplicates()])
        } catch (err) {
            console.error("Failed to merge movies", err)
            alert(err instanceof Error ? err.message : "Failed to merge movies")
        } finally {
            setMergingMovieDups(false)
        }
    }

    const handleVerifyTheater = async (t: any) => {
        setVerifyingTheaterId(t.id)
        try {
            const res = await verifyTheater(t.id, !t.verified)
            setTheaters(prev => prev.map(item => item.id === t.id ? { ...item, verified: res.verified } : item))
        } catch (err) {
            console.error("Failed to verify theater", err)
            alert(err instanceof Error ? err.message : "Failed to verify theater")
        } finally {
            setVerifyingTheaterId(null)
        }
    }

    const handleVerifyMovie = async (m: any) => {
        const id = m.id || m.imdbId
        setVerifyingMovieId(id)
        try {
            const res = await verifyMovie(id, !m.verified)
            setMovies(prev => prev.map(item => (item.id || item.imdbId) === id ? { ...item, verified: res.verified } : item))
            setFilteredMovies(prev => prev.map(item => (item.id || item.imdbId) === id ? { ...item, verified: res.verified } : item))
        } catch (err) {
            console.error("Failed to verify movie", err)
            alert(err instanceof Error ? err.message : "Failed to verify movie")
        } finally {
            setVerifyingMovieId(null)
        }
    }

    const handleScanDataQuality = async () => {
        setScanningDataQuality(true)
        try {
            const res = await getMovieDataQuality()
            setDataQuality(res)
        } catch (err) {
            console.error("Failed to scan data quality", err)
            alert(err instanceof Error ? err.message : "Failed to scan data quality")
        } finally {
            setScanningDataQuality(false)
        }
    }

    const fetchMoviesGlobal = async (skipNum = 0) => {
        setFetchingMovies(true)
        try {
            const res = await getMovies(
                skipNum,
                20,
                languageFilter,
                titleFilter,
                yearFilter,
                missingPosterFilter,
                avgTimeFilter
            )
            const list = res?.movies || res || []
            setMovies(list)
            setFilteredMovies(list)
            setMovieSkip(skipNum)
            setMovieTotal(res?.total || list.length)
        } catch (err) {
            console.error("Failed to fetch movies globally", err)
        } finally {
            setFetchingMovies(false)
        }
    }

    const handleMoviePageChange = (newSkip: number) => {
        fetchMoviesGlobal(newSkip)
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    const openAddMovieModal = () => {
        setModalMode("add")
        setModalMovieId(null)
        setModalImdbId("")
        setModalTitle("")
        setModalYear("")
        setModalLanguage("English")
        setModalReleaseDate("")
        setModalRuntime("")
        setModalImdbRating("")
        setModalPosterUrl("")
        setModalPosterFile(null)
        setModalPosterPreview("")
        setModalPosterType("url")
        setModalStep(1)
        setModalError(null)
        setIsMovieModalOpen(true)
    }

    const handleFetchOmdb = async () => {
        if (!modalImdbId.trim() || !modalImdbId.trim().startsWith("tt")) {
            setModalError("Please enter a valid IMDb ID (e.g. tt1375666)")
            return
        }
        setFetchingOmdb(true)
        setModalError(null)
        try {
            const data = await fetchOmdbPreview(modalImdbId.trim())
            if (data.exists && data.movie) {
                setModalMode("edit")
                setModalMovieId(data.movie.id || data.movie.imdbId)
                setModalTitle(data.movie.title || "")
                setModalYear(String(data.movie.year || ""))
                setModalLanguage(data.movie.language || data.movie.Language || "")
                setModalReleaseDate(data.movie.releaseDate ? data.movie.releaseDate.split("T")[0] : "")
                setModalRuntime(data.movie.runtime || "")
                setModalImdbRating(data.movie.imdbRating != null ? String(data.movie.imdbRating) : "")
                setModalPosterUrl(data.movie.posterUrl || "")
                setModalPosterType("url")
                setModalStep(2)
            } else if (data.movie) {
                setModalTitle(data.movie.title || "")
                setModalYear(String(data.movie.year || ""))
                setModalLanguage(data.movie.language || data.movie.Language || "English")
                setModalReleaseDate(data.movie.releaseDate ? data.movie.releaseDate.split("T")[0] : "")
                setModalRuntime(data.movie.runtime || "")
                setModalImdbRating(data.movie.imdbRating != null ? String(data.movie.imdbRating) : "")
                setModalPosterUrl(data.movie.posterUrl || "")
                setModalPosterType("url")
                setModalStep(2)
            }
        } catch (err) {
            setModalError(err instanceof Error ? err.message : "Failed to fetch OMDB details")
        } finally {
            setFetchingOmdb(false)
        }
    }

    const handleClearSubmissions = async () => {
        if (!modalMovieId) return
        if (!window.confirm("Are you sure you want to clear all title card submissions for this movie? This action cannot be undone.")) return

        setClearingSubmissions(true)
        setModalError(null)
        try {
            await clearMovieSubmissions(modalMovieId)

            // Update local state
            const updatedMovie = { submissionCount: 0, averageTimeSeconds: null }
            setMovies(movies.map(item => (item.id || item.imdbId) === modalMovieId ? { ...item, ...updatedMovie } : item))
            setFilteredMovies(filteredMovies.map(item => (item.id || item.imdbId) === modalMovieId ? { ...item, ...updatedMovie } : item))

            alert("Submissions cleared successfully.")
            setIsMovieModalOpen(false)
        } catch (err) {
            setModalError(err instanceof Error ? err.message : "Failed to clear submissions")
        } finally {
            setClearingSubmissions(false)
        }
    }

    const handleSaveModalMovie = async () => {
        setSavingModalMovie(true)
        setModalError(null)
        try {
            let base64Image: string | undefined = undefined
            if (modalPosterType === "file" && modalPosterFile) {
                base64Image = await fileToBase64(modalPosterFile)
            }

            const payload: any = {
                title: modalTitle,
                year: modalYear ? Number(modalYear) : undefined,
                language: modalLanguage,
                releaseDate: modalReleaseDate || undefined,
                runtime: modalRuntime,
                imdbRating: modalImdbRating ? Number(modalImdbRating) : null,
                posterUrl: modalPosterType === "url" ? modalPosterUrl : undefined,
                posterImage: base64Image
            }

            if (modalMode === "add") {
                payload.imdbId = modalImdbId.trim()
                const added = await addMovie(payload)
                const newMovie = added.movie || added
                setMovies([newMovie, ...movies])
                setFilteredMovies([newMovie, ...filteredMovies])
            } else if (modalMovieId) {
                const updated = await updateMovie(modalMovieId, payload)
                setMovies(movies.map(item => (item.id || item.imdbId) === modalMovieId ? { ...item, ...updated } : item))
                setFilteredMovies(filteredMovies.map(item => (item.id || item.imdbId) === modalMovieId ? { ...item, ...updated } : item))
            }
            setIsMovieModalOpen(false)
        } catch (err) {
            setModalError(err instanceof Error ? err.message : "Failed to save movie")
        } finally {
            setSavingModalMovie(false)
        }
    }

    const startEditingMovie = (m: any) => {
        setModalMode("edit")
        setModalMovieId(m.id || m.imdbId)
        setModalImdbId(m.imdbId || "")
        setModalTitle(m.title || "")
        setModalYear(String(m.year || ""))
        setModalLanguage(m.language || m.Language || "")
        setModalReleaseDate(m.releaseDate ? m.releaseDate.split("T")[0] : "")
        setModalRuntime(m.runtime || "")
        setModalImdbRating(m.imdbRating != null ? String(m.imdbRating) : "")
        setModalPosterUrl(m.posterUrl || "")
        setModalPosterFile(null)
        setModalPosterPreview("")
        setModalPosterType("url")
        setModalStep(2)
        setModalError(null)
        setIsMovieModalOpen(true)
    }

    const saveInlineMovie = async (m: any) => {
        const id = m.id || m.imdbId
        setSavingMovieId(id)
        try {
            const updated = await updateMovie(id, {
                title: inlineMovieTitle,
                year: inlineMovieYear ? Number(inlineMovieYear) : undefined,
                language: inlineMovieLanguage,
                releaseDate: inlineMovieReleaseDate || undefined,
                runtime: inlineMovieRuntime,
                posterUrl: inlineMoviePosterUrl
            })
            setMovies(movies.map(item => (item.id || item.imdbId) === id ? { ...item, ...updated } : item))
            setFilteredMovies(filteredMovies.map(item => (item.id || item.imdbId) === id ? { ...item, ...updated } : item))
            setEditingMovieId(null)
        } catch (err) {
            console.error("Failed to update movie inline", err)
            alert(err instanceof Error ? err.message : "Failed to update movie")
        } finally {
            setSavingMovieId(null)
        }
    }

    const filteredTheaters = theaters.filter(t => {
        const matchesSearch = !theaterSearch ||
            t.name?.toLowerCase().includes(theaterSearch.toLowerCase()) ||
            t.location?.toLowerCase().includes(theaterSearch.toLowerCase())
        const matchesCity = theaterCityFilter === "All" || t.location === theaterCityFilter
        const matchesVerified = !showUnverifiedTheatersOnly || !t.verified
        return matchesSearch && matchesCity && matchesVerified
    })
    const unverifiedTheaterCount = theaters.filter(t => !t.verified).length

    const paginatedTheaters = filteredTheaters.slice(theaterSkip, theaterSkip + 20)
    const uniqueTheaterCities = Array.from(new Set(theaters.map(t => t.location).filter(Boolean))) as string[]

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
        if (localLoading) return
        const timer = setTimeout(() => {
            fetchMoviesGlobal(0)
        }, 300)
        return () => clearTimeout(timer)
    }, [titleFilter, yearFilter, languageFilter, missingPosterFilter, avgTimeFilter])

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
                    <div className="space-y-6">
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
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle>Movies ({filteredMovies.length})</CardTitle>
                                <CardDescription>All movies in the database</CardDescription>
                            </div>
                            <Button
                                onClick={openAddMovieModal}
                                className="flex items-center gap-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                            >
                                <Plus className="h-4 w-4" />
                                Add Movie
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {/* Global Filters */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/20 border rounded-lg">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search globally by title or IMDb ID..."
                                        value={titleFilter}
                                        onChange={(e) => setTitleFilter(e.target.value)}
                                        className="pl-9 h-9 text-sm"
                                    />
                                </div>
                                <Input
                                    placeholder="Year"
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="w-20 h-9 text-sm"
                                    maxLength={4}
                                />
                                <Input
                                    placeholder="Lang (e.g. Tamil)"
                                    value={languageFilter === "All" ? "" : languageFilter}
                                    onChange={(e) => setLanguageFilter(e.target.value || "All")}
                                    className="w-28 h-9 text-sm"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={missingPosterFilter ? "default" : "outline"}
                                    onClick={() => setMissingPosterFilter(!missingPosterFilter)}
                                    className="h-9 text-xs font-medium"
                                >
                                    No Poster
                                </Button>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={avgTimeFilter}
                                    onChange={(e) => setAvgTimeFilter(e.target.value)}
                                >
                                    <option value="All">All Title Card Times</option>
                                    <option value="missing">Missing Title Card Time</option>
                                    <option value="has">Has Title Card Time</option>
                                </select>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 font-medium">Title</th>
                                            <th className="text-left py-3 px-2 font-medium w-20">Year</th>
                                            <th className="text-left py-3 px-2 font-medium w-24">Language</th>
                                            <th className="text-left py-3 px-2 font-medium w-28">Release Date</th>
                                            <th className="text-left py-3 px-2 font-medium w-24">Runtime</th>
                                            <th className="text-right py-3 px-2 font-medium">Title Card Time</th>
                                            <th className="text-center py-3 px-2 font-medium w-20">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMovies.map((movie) => {
                                            const isEditing = editingMovieId === (movie.id || movie.imdbId);
                                            return (
                                                <tr key={movie.id || movie.imdbId} className="border-b hover:bg-muted/50">
                                                    {isEditing ? (
                                                        <>
                                                            <td className="py-2 px-2">
                                                                <Input
                                                                    value={inlineMovieTitle}
                                                                    onChange={(e) => setInlineMovieTitle(e.target.value)}
                                                                    placeholder="Movie Title"
                                                                    className="h-8 text-xs font-medium min-w-[150px]"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <Input
                                                                    type="number"
                                                                    value={inlineMovieYear}
                                                                    onChange={(e) => setInlineMovieYear(e.target.value)}
                                                                    placeholder="Year"
                                                                    className="h-8 text-xs w-20"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <Input
                                                                    value={inlineMovieLanguage}
                                                                    onChange={(e) => setInlineMovieLanguage(e.target.value)}
                                                                    placeholder="Language"
                                                                    className="h-8 text-xs w-24"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <Input
                                                                    type="date"
                                                                    value={inlineMovieReleaseDate}
                                                                    onChange={(e) => setInlineMovieReleaseDate(e.target.value)}
                                                                    className="h-8 text-xs w-32"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <Input
                                                                    value={inlineMovieRuntime}
                                                                    onChange={(e) => setInlineMovieRuntime(e.target.value)}
                                                                    placeholder="e.g. 148 min"
                                                                    className="h-8 text-xs w-24"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2 text-right text-xs text-muted-foreground">
                                                                {movie.averageTimeSeconds ? formatTimeDisplay(movie.averageTimeSeconds) : "N/A"}
                                                            </td>
                                                            <td className="py-2 px-2 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                                                        disabled={savingMovieId === (movie.id || movie.imdbId)}
                                                                        onClick={() => saveInlineMovie(movie)}
                                                                        title="Save Changes"
                                                                    >
                                                                        {savingMovieId === (movie.id || movie.imdbId) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                        disabled={savingMovieId === (movie.id || movie.imdbId)}
                                                                        onClick={() => setEditingMovieId(null)}
                                                                        title="Cancel Editing"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="py-3 px-2 font-medium">
                                                                <a
                                                                    href={`/movie/${movie.id || movie.imdbId}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline flex items-center gap-1.5 font-semibold"
                                                                    title="Open Movie Page"
                                                                >
                                                                    {movie.title}
                                                                    <ExternalLink className="h-3 w-3 opacity-70 shrink-0" />
                                                                </a>
                                                                {movie.verified && (
                                                                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 align-middle" title="Verified">
                                                                        <BadgeCheck className="h-3 w-3" />
                                                                        Verified
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-muted-foreground">{movie.year || "N/A"}</td>
                                                            <td className="py-3 px-2">
                                                                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                                                    {movie.language || movie.Language || "N/A"}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-2 text-muted-foreground text-xs">
                                                                {movie.releaseDate ? movie.releaseDate.split("T")[0] : "N/A"}
                                                            </td>
                                                            <td className="py-3 px-2 text-muted-foreground">{movie.runtime || "N/A"}</td>
                                                            <td className="py-3 px-2 text-right font-medium">
                                                                {movie.averageTimeSeconds ? (
                                                                    <span className="text-primary">{formatTimeDisplay(movie.averageTimeSeconds)}</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={verifyingMovieId === (movie.id || movie.imdbId)}
                                                                        className={`h-8 w-8 p-0 hover:bg-green-500/10 ${movie.verified ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-green-600"}`}
                                                                        onClick={() => handleVerifyMovie(movie)}
                                                                        title={movie.verified ? "Verified — click to unverify" : "Mark as verified (all details correct)"}
                                                                    >
                                                                        {verifyingMovieId === (movie.id || movie.imdbId) ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                        onClick={() => startEditingMovie(movie)}
                                                                        title="Edit Movie"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => setDeleteTarget(movie)}
                                                                        title="Delete Movie"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {filteredMovies.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                                    No movies found matching your filters.
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

                            {/* Theater Filters */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search theaters by name or location..."
                                        value={theaterSearch}
                                        onChange={(e) => {
                                            setTheaterSearch(e.target.value)
                                            setTheaterSkip(0)
                                        }}
                                        className="pl-9 h-9 text-sm"
                                    />
                                </div>
                                <select
                                    className="h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={theaterCityFilter}
                                    onChange={(e) => {
                                        setTheaterCityFilter(e.target.value)
                                        setTheaterSkip(0)
                                    }}
                                >
                                    <option value="All">All Cities ({theaters.length})</option>
                                    {uniqueTheaterCities.map((city: string) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <Button
                                    type="button"
                                    variant={showUnverifiedTheatersOnly ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 gap-1.5 shrink-0"
                                    onClick={() => {
                                        setShowUnverifiedTheatersOnly(v => !v)
                                        setTheaterSkip(0)
                                    }}
                                    title="Show only theaters that still need verifying"
                                >
                                    <BadgeCheck className="h-4 w-4" />
                                    Unverified ({unverifiedTheaterCount})
                                </Button>
                            </div>

                            {/* Theaters List */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 font-medium">Name</th>
                                            <th className="text-left py-3 px-2 font-medium">Location</th>
                                            <th className="text-left py-3 px-2 font-medium">Maps Link</th>
                                            <th className="text-center py-3 px-2 font-medium w-24">Status</th>
                                            <th className="text-center py-3 px-2 font-medium w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedTheaters.map((t) => (
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
                                                    <Button
                                                        variant={t.verified ? "ghost" : "outline"}
                                                        size="sm"
                                                        disabled={verifyingTheaterId === t.id}
                                                        onClick={() => handleVerifyTheater(t)}
                                                        title={t.verified ? "Verified — click to unverify" : "Mark as verified (name & maps link correct)"}
                                                        className={`h-7 gap-1 text-xs ${t.verified ? "text-green-600 hover:text-green-700" : "text-muted-foreground"}`}
                                                    >
                                                        {verifyingTheaterId === t.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <BadgeCheck className={`h-3.5 w-3.5 ${t.verified ? "text-green-600" : ""}`} />
                                                        )}
                                                        {t.verified ? "Verified" : "Verify"}
                                                    </Button>
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
                                        {filteredTheaters.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No theaters found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between border-t pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {filteredTheaters.length > 0 ? theaterSkip + 1 : 0} - {Math.min(theaterSkip + 20, filteredTheaters.length)} of {filteredTheaters.length} theaters
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={theaterSkip === 0 || localLoading}
                                        onClick={() => setTheaterSkip(Math.max(0, theaterSkip - 20))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={theaterSkip + 20 >= filteredTheaters.length || localLoading}
                                        onClick={() => setTheaterSkip(theaterSkip + 20)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                            </Card>

                            {/* Deduplication Card */}
                            <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                                            Database Deduplication & Cleanup
                                        </CardTitle>
                                        <CardDescription>
                                            Scan MongoDB for duplicate theaters and movies, and auto-merge them safely while updating user watch histories.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={handleScanDuplicates}
                                        disabled={scanningDups}
                                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        {scanningDups ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        Scan For Duplicates
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 border rounded-lg bg-background flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center justify-between mb-1">
                                                    <span>Duplicate Theaters</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${theaterDupsCount > 0 ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>
                                                        {theaterDupsCount} found
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    Groups theaters sharing identical/similar names and locations.
                                                </p>
                                                {theaterDups.length > 0 && (
                                                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3 pr-1">
                                                        {theaterDups.map((g, idx) => (
                                                            <div key={idx} className="p-2 bg-muted/40 rounded text-xs">
                                                                <div className="font-medium text-foreground">Keep: {g.kept.name} ({g.kept.location})</div>
                                                                <div className="text-muted-foreground mt-1">
                                                                    Merge {g.duplicates.length} copy: {g.duplicates.map((d: any) => d.name).join(", ")}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={theaterDupsCount > 0 ? "default" : "outline"}
                                                disabled={theaterDupsCount === 0 || mergingTheaterDups}
                                                onClick={handleMergeTheaterDups}
                                                className="w-full mt-2"
                                            >
                                                {mergingTheaterDups ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Auto-Merge {theaterDupsCount} Theaters
                                            </Button>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-background flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center justify-between mb-1">
                                                    <span>Duplicate Movies</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${movieDupsCount > 0 ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>
                                                        {movieDupsCount} found
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    Groups movies by matching IMDb IDs or exact Title & Year.
                                                </p>
                                                {movieDups.length > 0 && (
                                                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3 pr-1">
                                                        {movieDups.map((g, idx) => (
                                                            <div key={idx} className="p-2 bg-muted/40 rounded text-xs">
                                                                <div className="font-medium text-foreground">Keep: {g.kept.title} ({g.kept.year})</div>
                                                                <div className="text-muted-foreground mt-1">
                                                                    Merge {g.duplicates.length} copy: {g.duplicates.map((d: any) => d.title).join(", ")}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={movieDupsCount > 0 ? "default" : "outline"}
                                                disabled={movieDupsCount === 0 || mergingMovieDups}
                                                onClick={handleMergeMovieDups}
                                                className="w-full mt-2"
                                            >
                                                {mergingMovieDups ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Auto-Merge {movieDupsCount} Movies
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Data Quality Card */}
                            <Card className="border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5 text-sky-500" />
                                            Data Quality
                                        </CardTitle>
                                        <CardDescription>
                                            Find movies missing key data — runtime, cover art, or a reported title-card time — so they can be fixed.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={handleScanDataQuality}
                                        disabled={scanningDataQuality}
                                        className="gap-2 bg-sky-600 hover:bg-sky-700 text-white"
                                    >
                                        {scanningDataQuality ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        Scan Data Quality
                                    </Button>
                                </CardHeader>
                                {dataQuality && (
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        {([
                                            { key: "noRuntime", label: "No Runtime", items: dataQuality.noRuntime || [] },
                                            { key: "noPoster", label: "No Cover Art", items: dataQuality.noPoster || [] },
                                            { key: "noTitleCard", label: "No Title-Card Time", items: dataQuality.noTitleCard || [] },
                                        ] as { key: string; label: string; items: any[] }[]).map(col => (
                                            <div key={col.key} className="p-4 border rounded-lg bg-background">
                                                <h4 className="font-semibold text-sm flex items-center justify-between mb-2">
                                                    <span>{col.label}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${col.items.length > 0 ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}`}>
                                                        {col.items.length}
                                                    </span>
                                                </h4>
                                                {col.items.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground">All good here. 🎉</p>
                                                ) : (
                                                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                                                        {col.items.map((m: any) => (
                                                            <Link
                                                                key={m.id}
                                                                href={`/movie/${m.id}`}
                                                                target="_blank"
                                                                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
                                                            >
                                                                <span className="truncate">
                                                                    {m.title} {m.year ? <span className="text-muted-foreground">({m.year})</span> : null}
                                                                </span>
                                                                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                )}
                            </Card>
                    </div>
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

            {/* Add & Edit Movie Modal */}
            <Dialog open={isMovieModalOpen} onOpenChange={setIsMovieModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {modalMode === "add" ? (
                                <>
                                    <Plus className="h-5 w-5 text-primary" />
                                    <span>Add New Movie via IMDb</span>
                                </>
                            ) : (
                                <>
                                    <Pencil className="h-5 w-5 text-primary" />
                                    <span>Edit Movie Details & Cover</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {modalMode === "add" && modalStep === 1
                                ? "Enter the IMDb ID (e.g. tt1375666) to perform a single fetch from OMDB."
                                : "Review and edit movie details before submitting. You can also upload a custom cover image or provide an image URL."}
                        </DialogDescription>
                    </DialogHeader>

                    {modalError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                            {modalError}
                        </div>
                    )}

                    {modalMode === "add" && modalStep === 1 ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="imdbIdInput">IMDb ID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="imdbIdInput"
                                        placeholder="e.g. tt1375666"
                                        value={modalImdbId}
                                        onChange={(e) => setModalImdbId(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleFetchOmdb()}
                                    />
                                    <Button
                                        onClick={handleFetchOmdb}
                                        disabled={fetchingOmdb || !modalImdbId.trim()}
                                        className="shrink-0"
                                    >
                                        {fetchingOmdb ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                                        Fetch Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="modalImdbId">IMDb ID</Label>
                                    <Input
                                        id="modalImdbId"
                                        value={modalImdbId}
                                        disabled={modalMode === "edit"}
                                        onChange={(e) => setModalImdbId(e.target.value)}
                                        placeholder="tt1234567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modalTitle">Title</Label>
                                    <Input
                                        id="modalTitle"
                                        value={modalTitle}
                                        onChange={(e) => setModalTitle(e.target.value)}
                                        placeholder="Movie Title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modalYear">Year</Label>
                                    <Input
                                        id="modalYear"
                                        type="number"
                                        value={modalYear}
                                        onChange={(e) => setModalYear(e.target.value)}
                                        placeholder="2024"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modalLanguage">Language</Label>
                                    <Input
                                        id="modalLanguage"
                                        value={modalLanguage}
                                        onChange={(e) => setModalLanguage(e.target.value)}
                                        placeholder="English, Tamil, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modalReleaseDate">Release Date</Label>
                                    <Input
                                        id="modalReleaseDate"
                                        type="date"
                                        value={modalReleaseDate}
                                        onChange={(e) => setModalReleaseDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modalRuntime">Runtime</Label>
                                    <Input
                                        id="modalRuntime"
                                        value={modalRuntime}
                                        onChange={(e) => setModalRuntime(e.target.value)}
                                        placeholder="148 min"
                                    />
                                </div>
                            </div>

                            {/* Cover Image Upload & URL Section */}
                            <div className="space-y-3 pt-2 border-t border-border/40">
                                <Label className="text-base font-semibold">Cover Image / Poster</Label>
                                <Tabs value={modalPosterType} onValueChange={(v) => setModalPosterType(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="url">Image URL</TabsTrigger>
                                        <TabsTrigger value="file">Upload File</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="url" className="space-y-3 mt-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="modalPosterUrl" className="text-xs text-muted-foreground">Direct Image URL</Label>
                                            <Input
                                                id="modalPosterUrl"
                                                value={modalPosterUrl}
                                                onChange={(e) => setModalPosterUrl(e.target.value)}
                                                placeholder="https://example.com/poster.jpg"
                                            />
                                        </div>
                                        {modalPosterUrl && (
                                            <div className="mt-2 flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                                                <img
                                                    src={resolveApiUrl(modalPosterUrl)}
                                                    alt="Poster preview"
                                                    className="h-20 w-14 object-cover rounded shadow border"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                                <span className="text-xs text-muted-foreground">Preview of URL image</span>
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="file" className="space-y-3 mt-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="modalPosterFile" className="text-xs text-muted-foreground">Select Image File (PNG/JPG/WEBP)</Label>
                                            <Input
                                                id="modalPosterFile"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] || null
                                                    setModalPosterFile(f)
                                                    if (f) {
                                                        const url = URL.createObjectURL(f)
                                                        setModalPosterPreview(url)
                                                    } else {
                                                        setModalPosterPreview("")
                                                    }
                                                }}
                                            />
                                        </div>
                                        {modalPosterPreview && (
                                            <div className="mt-2 flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                                                <img
                                                    src={modalPosterPreview}
                                                    alt="Upload preview"
                                                    className="h-20 w-14 object-cover rounded shadow border"
                                                />
                                                <div className="text-xs">
                                                    <p className="font-medium">{modalPosterFile?.name}</p>
                                                    <p className="text-muted-foreground">{((modalPosterFile?.size || 0) / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-row justify-between sm:justify-between pt-2 border-t">
                        {modalMode === "add" && modalStep === 2 ? (
                            <Button variant="outline" onClick={() => setModalStep(1)} disabled={savingModalMovie || clearingSubmissions}>
                                Back to Search
                            </Button>
                        ) : modalMode === "edit" ? (
                            <Button variant="destructive" onClick={handleClearSubmissions} disabled={savingModalMovie || clearingSubmissions} type="button">
                                {clearingSubmissions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Reset Title Cards
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsMovieModalOpen(false)} disabled={savingModalMovie || clearingSubmissions}>
                                Cancel
                            </Button>
                            {!(modalMode === "add" && modalStep === 1) && (
                                <Button onClick={handleSaveModalMovie} disabled={savingModalMovie || clearingSubmissions || !modalTitle.trim()}>
                                    {savingModalMovie ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {modalMode === "add" ? "Submit Movie" : "Save Changes"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
