"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CollapsibleSection } from "@/components/collapsible-section"
import {
    AlertTriangle,
    BadgeCheck,
    Check,
    ExternalLink,
    KeyRound,
    Loader2,
    Plus,
    RefreshCw,
    Pencil,
    Search,
    Trash2,
    Tv,
} from "lucide-react"
import {
    getSeriesPage,
    deleteSeries,
    refreshSeriesFromOmdb,
    verifySeries,
    previewSeries,
    importSeriesStart,
    importSeriesSeason,
    importSeriesFinish,
    updateSeries,
    type SeriesPreview,
} from "@/services/series-service"
import { formatRuntimeMinutes } from "@/lib/types"
import type { WatchProvider } from "@/lib/types"
import { WatchProviderEditor } from "@/components/watch-provider-editor"

// OMDb's free tier allows 1000 requests per day
const DAILY_CALL_LIMIT = 1000
const API_KEY_STORAGE = "omdbApiKeyOverride"

type SeasonState = "pending" | "importing" | "done" | "error"

export function AdminSeries({ standalone = false }: { standalone?: boolean } = {}) {
    const [seriesList, setSeriesList] = useState<any[]>([])
    const [seriesTotal, setSeriesTotal] = useState(0)
    const [seriesSkip, setSeriesSkip] = useState(0)
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [refreshingId, setRefreshingId] = useState<string | null>(null)
    const [verifyingId, setVerifyingId] = useState<string | null>(null)

    // Add flow
    const [imdbId, setImdbId] = useState("")
    const [apiKey, setApiKey] = useState("")
    const [previewing, setPreviewing] = useState(false)
    const [preview, setPreview] = useState<SeriesPreview | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [precise, setPrecise] = useState(false)
    const [importing, setImporting] = useState(false)
    const [seasonState, setSeasonState] = useState<Record<number, SeasonState>>({})
    const [callsSpent, setCallsSpent] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [editingProviders, setEditingProviders] = useState<any | null>(null)
    const [editingProviderValues, setEditingProviderValues] = useState<WatchProvider[]>([])
    const [savingProviders, setSavingProviders] = useState(false)

    // The override key lives in sessionStorage only - it is a stopgap for days
    // when the primary key is rate limited, not a stored credential.
    useEffect(() => {
        const saved = sessionStorage.getItem(API_KEY_STORAGE)
        if (saved) setApiKey(saved)
    }, [])

    useEffect(() => {
        if (apiKey.trim()) sessionStorage.setItem(API_KEY_STORAGE, apiKey.trim())
        else sessionStorage.removeItem(API_KEY_STORAGE)
    }, [apiKey])

    const load = async (skip = seriesSkip) => {
        setLoading(true)
        try {
            const data = await getSeriesPage(skip, 20)
            setSeriesList(data.series)
            setSeriesTotal(data.total)
            setSeriesSkip(skip)
        } catch (err) {
            console.error("Failed to load series", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        const handleOpenAddSeries = (e: CustomEvent) => {
            if (e.detail && e.detail.imdbId) {
                setImdbId(e.detail.imdbId)
                // Optionally trigger the form submit programmatically
            }
        }
        window.addEventListener('open-add-series-modal', handleOpenAddSeries as EventListener)
        return () => window.removeEventListener('open-add-series-modal', handleOpenAddSeries as EventListener)
    }, [])

    const keyOpt = () => (apiKey.trim() ? { apiKey: apiKey.trim() } : {})

    const selectedSeasons = useMemo(
        () => Array.from(selected).sort((a, b) => a - b),
        [selected]
    )

    const selectedEpisodes = useMemo(() => {
        if (!preview) return 0
        return preview.seasons
            .filter((s) => selected.has(s.seasonNumber))
            .reduce((sum, s) => sum + s.episodeCount, 0)
    }, [preview, selected])

    // In fast mode the preview already cached every season payload, so the
    // import spends nothing extra. Precise mode costs one call per episode.
    const importCalls = precise ? selectedEpisodes : 0
    const overLimit = importCalls > DAILY_CALL_LIMIT

    const handlePreview = async (e: React.FormEvent) => {
        e.preventDefault()
        let id = imdbId.trim()
        const match = id.match(/tt\d+/)
        if (match) {
            id = match[0]
            setImdbId(id)
        }
        if (!id || !id.startsWith("tt")) return
        setPreviewing(true)
        setError(null)
        try {
            const data = await previewSeries(id, apiKey.trim() || undefined)
            setPreview(data)
            setSelected(new Set(data.seasons.filter((s) => s.available).map((s) => s.seasonNumber)))
            setSeasonState({})
            setCallsSpent(data.previewCallsUsed)
            setPrecise(false)
            setModalOpen(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load series")
        } finally {
            setPreviewing(false)
        }
    }

    const toggleSeason = (n: number) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(n)) next.delete(n)
            else next.add(n)
            return next
        })
    }

    const handleImport = async () => {
        if (!preview || selectedSeasons.length === 0) return
        setImporting(true)
        setError(null)
        let spent = 0
        try {
            // No `replace`: unselected seasons on an existing series stay put
            const start = await importSeriesStart(preview.imdbId, keyOpt())
            spent += start.callsUsed
            setCallsSpent((c) => c + start.callsUsed)

            for (const n of selectedSeasons) {
                setSeasonState((s) => ({ ...s, [n]: "importing" }))
                try {
                    const res = await importSeriesSeason(preview.imdbId, n, {
                        ...keyOpt(),
                        precise,
                    })
                    spent += res.callsUsed
                    setCallsSpent((c) => c + res.callsUsed)
                    setSeasonState((s) => ({ ...s, [n]: "done" }))
                } catch (err) {
                    setSeasonState((s) => ({ ...s, [n]: "error" }))
                    // Stop on the first failure so a dead key does not burn
                    // through the rest of the seasons
                    throw err
                }
            }

            await importSeriesFinish(preview.imdbId)
            await load(0)
            setModalOpen(false)
            setImdbId("")
            setPreview(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed")
        } finally {
            setImporting(false)
        }
    }

    const handleRefresh = async (id: string) => {
        setRefreshingId(id)
        try {
            await refreshSeriesFromOmdb(id, keyOpt())
            await load()
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to refresh series")
        } finally {
            setRefreshingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this series?")) return
        setDeletingId(id)
        try {
            await deleteSeries(id)
            await load(seriesList.length === 1 && seriesSkip > 0 ? seriesSkip - 20 : seriesSkip)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete series")
        } finally {
            setDeletingId(null)
        }
    }

    const handleVerifySeries = async (s: any) => {
        setVerifyingId(s.id)
        try {
            const res = await verifySeries(s.id, !s.verified)
            setSeriesList((list) => list.map((item) => item.id === s.id ? { ...item, verified: res.verified } : item))
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to verify series")
        } finally {
            setVerifyingId(null)
        }
    }

    const saveProviders = async () => {
        if (!editingProviders) return
        setSavingProviders(true)
        try {
            const updated = await updateSeries(editingProviders.id, { watchProviders: editingProviderValues })
            setSeriesList((list) => list.map((item) => item.id === updated.id ? { ...item, watchProviders: updated.watchProviders } : item))
            setEditingProviders(null)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Could not save watch providers")
        } finally {
            setSavingProviders(false)
        }
    }

    const doneCount = selectedSeasons.filter((n) => seasonState[n] === "done").length
    const progressPct = selectedSeasons.length
        ? Math.round((doneCount / selectedSeasons.length) * 100)
        : 0

    return (
        <>
            <CollapsibleSection
                defaultOpen={standalone}
                title={
                    <>
                        <Tv className="h-5 w-5 text-primary" />
                        Series ({seriesTotal})
                    </>
                }
                description="Manage TV Series in the database"
                headerActions={
                    <form onSubmit={handlePreview} className="flex items-center gap-2">
                        <Input
                            placeholder="IMDb ID or Link (e.g. tt0903747)"
                            value={imdbId}
                            onChange={(e) => setImdbId(e.target.value)}
                            className="w-48 h-9 text-sm"
                            disabled={previewing}
                        />
                        <Button
                            type="submit"
                            disabled={previewing || !imdbId.trim()}
                            className="h-9 flex items-center gap-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                        >
                            {previewing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Add Series
                        </Button>
                    </form>
                }
            >
                {!modalOpen && error && (
                    <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3">
                    <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Label htmlFor="omdb-key" className="text-xs text-muted-foreground">
                        OMDb key override
                    </Label>
                    <Input
                        id="omdb-key"
                        type="password"
                        placeholder="Uses the server key when empty"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="h-8 w-56 text-sm font-mono"
                    />
                    <span className="text-xs text-muted-foreground">
                        Kept for this browser session only — use a spare key when the daily limit is hit.
                    </span>
                    {apiKey && (
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setApiKey("")}>
                            Clear
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-2 font-medium">Title</th>
                                <th className="text-left py-3 px-2 font-medium w-32">Years</th>
                                <th className="text-left py-3 px-2 font-medium w-24">Seasons</th>
                                <th className="text-left py-3 px-2 font-medium w-24">Episodes</th>
                                <th className="text-left py-3 px-2 font-medium w-24">Runtime</th>
                                <th className="text-center py-3 px-2 font-medium w-20">IMDb</th>
                                <th className="text-center py-3 px-2 font-medium w-28">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seriesList.map((series) => (
                                <tr key={series.id} className="border-b hover:bg-muted/50">
                                    <td className="py-3 px-2 font-medium">
                                        <div className="flex items-center gap-2">
                                            {series.posterUrl && (
                                                <img
                                                    src={series.posterUrl}
                                                    alt={series.title}
                                                    className="w-8 h-12 object-cover rounded"
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <a
                                                    href={`/series/${series.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1.5"
                                                    title="Open Series Page"
                                                >
                                                    {series.title}
                                                    <ExternalLink className="h-3 w-3 opacity-70 shrink-0" />
                                                </a>
                                                {series.verified && (
                                                    <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600" title="Verified">
                                                        <BadgeCheck className="h-3 w-3" />
                                                        Verified
                                                    </span>
                                                )}
                                                {series.importStatus === "partial" && (
                                                    <span className="text-xs text-amber-600">
                                                        Partial import ·{" "}
                                                        {(series.importedSeasons || []).length} of{" "}
                                                        {series.totalSeasons} seasons
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-muted-foreground">
                                        {series.year} - {series.endYear || "Present"}
                                    </td>
                                    <td className="py-3 px-2">{series.totalSeasons}</td>
                                    <td className="py-3 px-2">{series.totalEpisodes}</td>
                                    <td className="py-3 px-2 text-muted-foreground">
                                        {formatRuntimeMinutes(series.totalRuntimeMinutes)}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        {series.imdbId ? (
                                            <a
                                                href={`https://www.imdb.com/title/${series.imdbId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs bg-primary/10 px-2 py-1 rounded-full"
                                                title="Open IMDb Page"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                IMDb
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
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={() => {
                                                    setEditingProviders(series)
                                                    setEditingProviderValues(series.watchProviders || [])
                                                }}
                                                title="Edit watch-online providers"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={verifyingId === series.id}
                                                className={`h-8 w-8 p-0 hover:bg-green-500/10 ${series.verified ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-green-600"}`}
                                                onClick={() => handleVerifySeries(series)}
                                                title={series.verified ? "Verified — click to unverify" : "Mark as verified (all details correct)"}
                                            >
                                                {verifyingId === series.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={() => handleRefresh(series.id)}
                                                disabled={refreshingId === series.id}
                                                title="Refresh from OMDB"
                                            >
                                                {refreshingId === series.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(series.id)}
                                                disabled={deletingId === series.id}
                                                title="Delete Series"
                                            >
                                                {deletingId === series.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {seriesList.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                        {loading
                                            ? "Loading series…"
                                            : "No series in the database. Add one using its IMDb ID."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">
                        Showing {seriesList.length ? seriesSkip + 1 : 0} - {Math.min(seriesSkip + 20, seriesTotal)} of {seriesTotal} series
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={seriesSkip === 0 || loading} onClick={() => load(Math.max(0, seriesSkip - 20))}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={seriesSkip + 20 >= seriesTotal || loading} onClick={() => load(seriesSkip + 20)}>Next</Button>
                    </div>
                </div>
            </CollapsibleSection>

            <Dialog
                open={modalOpen}
                onOpenChange={(open) => {
                    if (!importing) setModalOpen(open)
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-primary" />
                            Import {preview?.title}
                            {preview && (
                                <span className="text-muted-foreground font-normal">
                                    ({preview.year}
                                    {preview.isOngoing ? "–" : preview.endYear ? `–${preview.endYear}` : ""})
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {preview?.totalSeasons} seasons · {preview?.totalEpisodes} episodes ·
                            preview used {preview?.previewCallsUsed} OMDb calls
                        </DialogDescription>
                    </DialogHeader>

                    {preview && (
                        <div className="space-y-4">
                            {preview.exists && (
                                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                                    <span>
                                        Already in the database with{" "}
                                        {preview.existingSeasons.length} season(s). Selected seasons
                                        will be re-imported and overwritten; unselected seasons are
                                        left untouched.
                                    </span>
                                </div>
                            )}

                            <div className="max-h-72 overflow-y-auto rounded-md border">
                                <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {selectedSeasons.length} of {preview.seasons.length} seasons ·{" "}
                                        {selectedEpisodes} episodes
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            disabled={importing}
                                            onClick={() =>
                                                setSelected(
                                                    new Set(
                                                        preview.seasons
                                                            .filter((s) => s.available)
                                                            .map((s) => s.seasonNumber)
                                                    )
                                                )
                                            }
                                        >
                                            All
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            disabled={importing}
                                            onClick={() => setSelected(new Set())}
                                        >
                                            None
                                        </Button>
                                    </div>
                                </div>

                                {preview.seasons.map((s) => {
                                    const state = seasonState[s.seasonNumber]
                                    return (
                                        <label
                                            key={s.seasonNumber}
                                            className="flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/40"
                                        >
                                            <Checkbox
                                                checked={selected.has(s.seasonNumber)}
                                                disabled={!s.available || importing}
                                                onCheckedChange={() => toggleSeason(s.seasonNumber)}
                                            />
                                            <span className="w-24 font-medium">
                                                Season {s.seasonNumber}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {s.available
                                                    ? `${s.episodeCount} episodes`
                                                    : `unavailable — ${s.error || "not on OMDb"}`}
                                            </span>
                                            {preview.existingSeasons.includes(s.seasonNumber) && (
                                                <span className="text-xs text-muted-foreground">
                                                    already imported
                                                </span>
                                            )}
                                            <span className="ml-auto">
                                                {state === "importing" && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                )}
                                                {state === "done" && (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                )}
                                                {state === "error" && (
                                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                                )}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>

                            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="precise" className="text-sm">
                                        Exact episode runtimes
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Off: every episode uses the series runtime — no extra API
                                        calls. On: one call per episode.
                                    </p>
                                </div>
                                <Switch
                                    id="precise"
                                    checked={precise}
                                    onCheckedChange={setPrecise}
                                    disabled={importing}
                                />
                            </div>

                            <div
                                className={`rounded-md border p-3 text-sm ${
                                    overLimit
                                        ? "border-destructive/40 bg-destructive/10"
                                        : "bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        API calls this import will make
                                    </span>
                                    <span className="font-semibold">{importCalls}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Spent so far in this session (incl. preview)</span>
                                    <span>{callsSpent}</span>
                                </div>
                                {overLimit && (
                                    <p className="mt-2 flex items-start gap-2 text-xs text-destructive">
                                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        Over the {DAILY_CALL_LIMIT}/day free-tier limit. Deselect
                                        seasons, turn off exact runtimes, or use a different key.
                                    </p>
                                )}
                            </div>

                            {importing && (
                                <div>
                                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                        <span>
                                            Importing season {doneCount + 1} of{" "}
                                            {selectedSeasons.length}
                                        </span>
                                        <span>{progressPct}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Keep this tab open until the import finishes. Completed
                                        seasons are saved as they go, so you can re-run this to
                                        resume.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            disabled={importing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={importing || selectedSeasons.length === 0 || overLimit}
                            className="flex items-center gap-2"
                        >
                            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                            Import {selectedSeasons.length} season
                            {selectedSeasons.length === 1 ? "" : "s"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingProviders} onOpenChange={(open) => !open && setEditingProviders(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Watch online — {editingProviders?.title}</DialogTitle>
                        <DialogDescription>Add each OTT’s direct title link and the regions where it is available.</DialogDescription>
                    </DialogHeader>
                    <WatchProviderEditor key={editingProviders?.id} providers={editingProviderValues} onChange={setEditingProviderValues} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingProviders(null)} disabled={savingProviders}>Cancel</Button>
                        <Button onClick={saveProviders} disabled={savingProviders}>{savingProviders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save providers</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
