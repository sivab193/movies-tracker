"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Tv,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  Trash2,
  RotateCcw,
  Pencil,
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import {
  getSeriesProgressWithSummary,
  rewatchEntireSeries,
  rewatchSeason,
  removeSeriesProgress,
  setSeasonWatchCount,
} from "@/services/series-service"
import {
  formatRuntimeMinutes,
  resolveApiUrl,
  type SeriesProgress,
  type SeriesProgressSummary,
} from "@/lib/types"

type CountEditor = { imdbId: string; title: string; season: number; value: string }

const EMPTY_SUMMARY: SeriesProgressSummary = {
  seriesTracked: 0,
  seriesCompleted: 0,
  seasonsWatched: 0,
  runtimeWatchedMinutes: 0,
}

export default function SeriesHistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [progress, setProgress] = useState<SeriesProgress[]>([])
  const [summary, setSummary] = useState<SeriesProgressSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [countEditor, setCountEditor] = useState<CountEditor | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getSeriesProgressWithSummary(user.uid)
      setProgress(data.seriesProgress)
      setSummary(data.summary)
      setError(null)
    } catch (e) {
      console.error("Error loading series history:", e)
      setError(e instanceof Error ? e.message : "Could not load your series history")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) setLoading(false)
    if (user) load()
  }, [user, authLoading, load])

  // Every mutation refetches so the summary totals stay in step with the rows.
  const mutate = async (imdbId: string, action: () => Promise<unknown>) => {
    setPendingId(imdbId)
    setError(null)
    try {
      await action()
      await load()
    } catch (e) {
      console.error("Error updating series history:", e)
      setError(e instanceof Error ? e.message : "Could not update this series")
    } finally {
      setPendingId(null)
    }
  }

  const handleSaveCount = async () => {
    if (!countEditor) return
    const parsed = Number.parseInt(countEditor.value, 10)
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 999) {
      setError("Watch count must be between 0 and 999")
      return
    }
    const { imdbId, season } = countEditor
    setCountEditor(null)
    await mutate(imdbId, () => setSeasonWatchCount(imdbId, season, parsed))
  }

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Tv className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Series History</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to track the seasons you have watched and how many times.
          </p>
          <Link href="/auth" className="mt-6 inline-block">
            <Button size="lg">Sign in</Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <Tv className="h-8 w-8 text-primary" />
              Series History
            </h1>
            <p className="mt-1 text-muted-foreground">
              Every series you are tracking, season by season.
            </p>
          </div>
          <Link href="/series">
            <Button variant="outline">Browse series</Button>
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Tv} label="Series tracked" value={summary.seriesTracked} />
          <StatTile icon={CheckCircle2} label="Completed" value={summary.seriesCompleted} />
          <StatTile icon={Layers} label="Seasons watched" value={summary.seasonsWatched} />
          <StatTile
            icon={Clock}
            label="Runtime watched"
            value={formatRuntimeMinutes(summary.runtimeWatchedMinutes)}
          />
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : progress.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Tv className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No series tracked yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a series and mark a season watched to start your history.
              </p>
              <Link href="/series" className="mt-6 inline-block">
                <Button>Browse series</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {progress.map((entry) => {
              const busy = pendingId === entry.imdbId
              const seasons = Object.entries(entry.seasonCounts || {})
                .map(([season, count]) => ({ season: Number(season), count }))
                .sort((a, b) => a.season - b.season)
              const href = entry.seriesId ? `/series/${entry.seriesId}` : "/series"

              return (
                <Card key={entry.imdbId} className={busy ? "opacity-60" : ""}>
                  <CardContent className="flex gap-4 p-4">
                    <Link href={href} className="shrink-0">
                      {entry.posterUrl && entry.posterUrl !== "N/A" ? (
                        <img
                          src={resolveApiUrl(entry.posterUrl)}
                          alt=""
                          className="h-32 w-[86px] rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-[86px] items-center justify-center rounded-md bg-muted">
                          <Tv className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={href} className="font-semibold hover:underline">
                            {entry.title || entry.imdbId}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {entry.year ? `${entry.year} · ` : ""}
                            {entry.watchedSeasons.length}/{entry.totalSeasons ?? "?"} seasons
                            {entry.totalWatchCount > entry.watchedSeasons.length && (
                              <> · {entry.totalWatchCount} total views</>
                            )}
                            {entry.runtimeWatchedMinutes > 0 && (
                              <> · {formatRuntimeMinutes(entry.runtimeWatchedMinutes)}</>
                            )}
                          </p>
                        </div>
                        {entry.isCompleted && (
                          <Badge className="border-green-500/30 bg-green-500/20 text-green-600 hover:bg-green-500/30">
                            Completed
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {seasons.map(({ season, count }) => (
                          <button
                            key={season}
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setCountEditor({
                                imdbId: entry.imdbId,
                                title: entry.title || entry.imdbId,
                                season,
                                value: String(count),
                              })
                            }
                            title={`Edit watch count for season ${season}`}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/10"
                          >
                            S{season}
                            {count > 1 && (
                              <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                                ×{count}
                              </span>
                            )}
                            <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          disabled={busy}
                          onClick={() => mutate(entry.imdbId, () => rewatchEntireSeries(entry.imdbId))}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Log full rewatch
                        </Button>
                        {seasons.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={busy}
                            onClick={() =>
                              mutate(entry.imdbId, () =>
                                rewatchSeason(entry.imdbId, seasons[seasons.length - 1].season),
                              )
                            }
                            title={`Log another watch of season ${seasons[seasons.length - 1].season}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            S{seasons[seasons.length - 1].season}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive"
                          disabled={busy}
                          onClick={() => mutate(entry.imdbId, () => removeSeriesProgress(entry.imdbId))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Dialog open={!!countEditor} onOpenChange={(open) => !open && setCountEditor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {countEditor?.title} — season {countEditor?.season}
            </DialogTitle>
            <DialogDescription>
              How many times have you watched this season? Set it to 0 to remove it.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={0}
            max={999}
            autoFocus
            value={countEditor?.value ?? ""}
            onChange={(e) =>
              setCountEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveCount()
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCountEditor(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCount}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="mb-2 h-4 w-4 text-muted-foreground" />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
