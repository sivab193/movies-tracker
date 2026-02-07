"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Search, Loader2, Plus, CheckCircle2, Film, Filter, ChevronLeft, CalendarClock, Ban, Globe2, AlertCircle, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchMovies, bulkAddMovies, searchMoviesByImdb } from "@/services/api"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export default function BulkAddPage() {
    const { user, userProfile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [searchMode, setSearchMode] = useState<"title" | "imdb">("title")

    // Title search states
    const [query, setQuery] = useState("")
    const [year, setYear] = useState("")
    const [language, setLanguage] = useState("all")
    const [upcoming, setUpcoming] = useState("all")

    // IMDb search states
    const [imdbIds, setImdbIds] = useState("")

    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [adding, setAdding] = useState(false)
    const [success, setSuccess] = useState<{ added: number; skipped: number } | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Redirect non-admins
    useEffect(() => {
        if (!authLoading && (!user || !userProfile?.isAdmin)) {
            router.push("/")
        }
    }, [user, userProfile, authLoading, router])

    async function handleTitleSearch(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // Send language and upcoming params to backend
            const data = await searchMovies(query, year, language, upcoming)

            if (data.Response === "True") {
                setResults(data.Search || [])
            } else {
                setResults([])
                setError(data.Error || "No results found")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleImdbSearch(e: React.FormEvent) {
        e.preventDefault()

        const ids = imdbIds
            .split(/[,\n\s]+/)
            .map(id => id.trim())
            .filter(id => id.startsWith('tt'))

        if (ids.length === 0) {
            setError("Please enter valid IMDb IDs (e.g., tt1234567)")
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const data = await searchMoviesByImdb(ids)
            if (data.Search) {
                setResults(data.Search)
            } else {
                setResults([])
                setError("No movies found for the provided IDs")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelect = (imdbId: string, exists: boolean) => {
        if (exists) return
        if (selectedIds.includes(imdbId)) {
            setSelectedIds(selectedIds.filter(id => id !== imdbId))
        } else {
            setSelectedIds([...selectedIds, imdbId])
        }
    }

    const selectAll = () => {
        if (selectedIds.length === results.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(results.filter(r => !r.exists).map(r => r.imdbID))
        }
    }

    const clearFilters = () => {
        setQuery("")
        setYear("")
        setLanguage("all")
        setUpcoming("all")
        setImdbIds("")
        setResults([])
        setError(null)
        setSuccess(null)
    }

    async function handleBulkAdd() {
        if (selectedIds.length === 0) return

        setAdding(true)
        setError(null)
        setSuccess(null)
        try {
            const result = await bulkAddMovies(selectedIds)
            setSuccess({ added: result.added.length, skipped: result.skipped.length })
            setSelectedIds([])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAdding(false)
        }
    }

    // Title search can work without query if language/upcoming is selected
    const canTitleSearch = query.trim().length > 0 || language !== "all" || upcoming !== "all"
    const canImdbSearch = imdbIds.trim().length > 0

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
                <div className="mb-8">
                    <Link href="/admin" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mb-4">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight">Bulk Add Movies</h1>
                    <p className="text-muted-foreground mt-2">Find and add multiple movies from OMDb at once.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 space-y-2">
                        {success.added > 0 && (
                            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-600 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                <p className="text-sm font-medium">Successfully added {success.added} movies.</p>
                            </div>
                        )}
                        {success.skipped > 0 && (
                            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-blue-600 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                <p className="text-sm font-medium">{success.skipped} movies were already in the database.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
                    {/* Search Panel */}
                    <aside className="space-y-6">
                        <Tabs value={searchMode} onValueChange={(v) => { setSearchMode(v as any); clearFilters(); }}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="title">
                                    <Search className="h-4 w-4 mr-2" />
                                    Title Search
                                </TabsTrigger>
                                <TabsTrigger value="imdb">
                                    <Hash className="h-4 w-4 mr-2" />
                                    IMDb IDs
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="title">
                                <form onSubmit={handleTitleSearch} className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Search className="h-3.5 w-3.5" />
                                            Movie Title (Optional)
                                        </label>
                                        <Input
                                            placeholder="e.g. Interstellar"
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Leave blank to search by filters only</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Filter className="h-3.5 w-3.5" />
                                            Filter by Year
                                        </label>
                                        <Input
                                            placeholder="e.g. 2024"
                                            value={year}
                                            onChange={e => setYear(e.target.value)}
                                            maxLength={4}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Globe2 className="h-3.5 w-3.5" />
                                            Filter by Language
                                        </label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Languages</SelectItem>
                                                <SelectItem value="English">English</SelectItem>
                                                <SelectItem value="Hindi">Hindi</SelectItem>
                                                <SelectItem value="Tamil">Tamil</SelectItem>
                                                <SelectItem value="Telugu">Telugu</SelectItem>
                                                <SelectItem value="Kannada">Kannada</SelectItem>
                                                <SelectItem value="Malayalam">Malayalam</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <CalendarClock className="h-3.5 w-3.5" />
                                            Upcoming Releases
                                        </label>
                                        <Select value={upcoming} onValueChange={setUpcoming}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any Time</SelectItem>
                                                <SelectItem value="3">Next 3 Months</SelectItem>
                                                <SelectItem value="6">Next 6 Months</SelectItem>
                                                <SelectItem value="12">Next 12 Months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-1 rounded-full" disabled={loading || !canTitleSearch}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={clearFilters} className="rounded-full" disabled={loading}>
                                            Clear
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="imdb">
                                <form onSubmit={handleImdbSearch} className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Hash className="h-3.5 w-3.5" />
                                            IMDb IDs
                                        </label>
                                        <Textarea
                                            placeholder="tt1234567, tt7654321, tt9876543"
                                            value={imdbIds}
                                            onChange={e => setImdbIds(e.target.value)}
                                            rows={6}
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter IMDb IDs separated by commas, spaces, or new lines
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-1 rounded-full" disabled={loading || !canImdbSearch}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search IMDb"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={clearFilters} className="rounded-full" disabled={loading}>
                                            Clear
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>
                        </Tabs>

                        {results.length > 0 && (
                            <div className="rounded-2xl border bg-muted/30 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{selectedIds.length} selected</span>
                                    <Button variant="ghost" size="sm" onClick={selectAll}>
                                        {selectedIds.length === results.length ? "Deselect All" : "Select All"}
                                    </Button>
                                </div>
                                <Button
                                    className="w-full rounded-full gap-2"
                                    onClick={handleBulkAdd}
                                    disabled={adding || selectedIds.length === 0}
                                >
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Add {selectedIds.length} Movies
                                </Button>
                            </div>
                        )}
                    </aside>

                    {/* Results Area */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex h-[400px] flex-col items-center justify-center text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                                <p>Searching OMDb...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {results.map((movie, idx) => (
                                    <div
                                        key={`${movie.imdbID}-${idx}`}
                                        className={`group relative flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedIds.includes(movie.imdbID)
                                            ? "bg-primary/10 border-primary ring-1 ring-primary/50 shadow-md"
                                            : movie.exists
                                                ? "bg-muted/50 opacity-60 cursor-not-allowed border-transparent"
                                                : "bg-card hover:border-primary/50"
                                            }`}
                                        onClick={() => toggleSelect(movie.imdbID, movie.exists)}
                                    >
                                        <div className="h-24 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm border">
                                            {movie.Poster !== "N/A" ? (
                                                <img src={movie.Poster} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Film className="h-8 w-8 opacity-20" />
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-between py-1 flex-1">
                                            <div>
                                                <h3 className="font-bold line-clamp-2 leading-tight">{movie.Title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{movie.Year}</p>
                                            </div>
                                            <div className={`mt-2 text-xs font-bold uppercase tracking-wider ${selectedIds.includes(movie.imdbID) ? "text-primary" : "text-muted-foreground/30"
                                                }`}>
                                                {movie.exists ? (
                                                    <span className="flex items-center gap-1 text-destructive/70">
                                                        <Ban className="h-3 w-3" /> Already Added
                                                    </span>
                                                ) : selectedIds.includes(movie.imdbID) ? "Selected" : "Click to select"}
                                            </div>
                                        </div>
                                        {selectedIds.includes(movie.imdbID) && (
                                            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[400px] flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl">
                                <Search className="h-16 w-16 mb-4 opacity-10" />
                                <p className="text-xl font-medium">Search for movies to add in bulk</p>
                                <p className="text-sm opacity-60">Choose a search mode above to begin</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
