"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar, Timer, Check, Loader2, ListOrdered, ArrowRight, ChevronDown, ChevronUp, CheckCircle2, Circle, MoreVertical, Plus, RotateCcw, Trash2, CheckCheck, History } from "lucide-react"
import { Header } from "@/components/header"
import {
  getSeries,
  getSeriesProgress,
  watchSeason,
  rewatchSeason,
  unwatchSeason,
  setSeasonWatchCount,
  watchEntireSeries,
  rewatchEntireSeries,
  unwatchEntireSeries,
} from "@/services/series-service"
import { getWatchOrdersForMovie } from "@/services/watch-order-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type Series, type SeriesProgress, formatRuntimeMinutes, resolveApiUrl } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { PersonLink } from "@/components/person-link"
import { creditNames } from "@/lib/people"
import { WatchOnlineSection } from "@/components/watch-online-section"

export default function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { userProfile, user } = useAuth()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [seriesWatchOrders, setSeriesWatchOrders] = useState<any[]>([])
  
  // Progress state
  const [seasonCounts, setSeasonCounts] = useState<Record<string, number>>({})
  const [progressLoading, setProgressLoading] = useState(false)
  const [togglingSeason, setTogglingSeason] = useState<number | null>(null)
  const [bulkPending, setBulkPending] = useState(false)
  const [progressError, setProgressError] = useState<string | null>(null)
  const [countEditor, setCountEditor] = useState<{ season: number; value: string } | null>(null)

  const watchedSeasons = Object.keys(seasonCounts).map(Number).sort((a, b) => a - b)
  const totalWatchCount = Object.values(seasonCounts).reduce((sum, n) => sum + n, 0)
  const isCompleted =
    !!series && (series.totalSeasons ?? 0) > 0 && watchedSeasons.length >= (series.totalSeasons ?? 0)

  // Accordion state
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const seriesData = await getSeries(id)
        setSeries(seriesData)
        
        try {
          const orders = await getWatchOrdersForMovie(seriesData.imdbId)
          setSeriesWatchOrders(orders)
        } catch (e) {
          console.error("Error fetching watch orders:", e)
        }
      } catch (error) {
        console.error("Error fetching series data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  useEffect(() => {
    const fetchProgress = async () => {
      if (user && series) {
        setProgressLoading(true)
        try {
          const progressList = await getSeriesProgress(user.uid)
          const currentSeriesProgress = progressList.find(p => p.imdbId === series.imdbId)
          setSeasonCounts(currentSeriesProgress?.seasonCounts || {})
        } catch (error) {
          console.error("Error fetching progress:", error)
        } finally {
          setProgressLoading(false)
        }
      }
    }

    fetchProgress()
  }, [user, series])

  // Every progress mutation funnels through here so the server response is the
  // single source of truth for what the user has watched.
  const runSeasonAction = async (
    seasonNumber: number,
    action: () => Promise<{ seasonCounts: Record<string, number> }>,
  ) => {
    if (!series || !user) return
    setProgressError(null)
    setTogglingSeason(seasonNumber)
    try {
      const res = await action()
      setSeasonCounts(res.seasonCounts || {})
    } catch (error) {
      console.error("Error updating season progress:", error)
      setProgressError(error instanceof Error ? error.message : "Could not update progress")
    } finally {
      setTogglingSeason(null)
    }
  }

  // Primary click: first press marks it watched, every press after logs a rewatch.
  const handleSeasonPrimary = (e: React.MouseEvent, seasonNumber: number) => {
    e.stopPropagation() // Prevent accordion expansion
    if (!series) return
    const alreadyWatched = seasonCounts[String(seasonNumber)] > 0
    runSeasonAction(seasonNumber, () =>
      alreadyWatched
        ? rewatchSeason(series.imdbId, seasonNumber)
        : watchSeason(series.imdbId, seasonNumber),
    )
  }

  const handleSeasonUnwatch = (seasonNumber: number) => {
    if (!series) return
    runSeasonAction(seasonNumber, () => unwatchSeason(series.imdbId, seasonNumber))
  }

  const handleSaveCount = async () => {
    if (!series || !countEditor) return
    const parsed = Number.parseInt(countEditor.value, 10)
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 999) {
      setProgressError("Watch count must be between 0 and 999")
      return
    }
    const season = countEditor.season
    setCountEditor(null)
    await runSeasonAction(season, () => setSeasonWatchCount(series.imdbId, season, parsed))
  }

  const runBulkAction = async (action: () => Promise<{ seasonCounts: Record<string, number> }>) => {
    if (!series || !user) return
    setProgressError(null)
    setBulkPending(true)
    try {
      const res = await action()
      setSeasonCounts(res.seasonCounts || {})
    } catch (error) {
      console.error("Error updating series progress:", error)
      setProgressError(error instanceof Error ? error.message : "Could not update progress")
    } finally {
      setBulkPending(false)
    }
  }

  const toggleSeasonAccordion = (seasonNumber: number) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [seasonNumber]: !prev[seasonNumber]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 md:grid-cols-[300px_1fr]">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full mt-8" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold">Series not found</h1>
            <p className="mt-2 text-muted-foreground">
              This series doesn't exist or has been removed.
            </p>
            <Link href="/series">
              <Button className="mt-4">Go back to series</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const yearRange = series.endYear 
    ? `${series.year}–${series.endYear}`
    : `${series.year}–present`

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/series"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to series
          </Link>
        </div>

        {seriesWatchOrders.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {seriesWatchOrders.map((order) => (
              <Link href={`/w/${order.slug || order.id}`} key={order.id}>
                <div className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 text-amber-500 hover:text-amber-400 hover:border-amber-500/40 rounded-lg p-4 flex items-center justify-between transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <ListOrdered className="w-5 h-5" />
                    <span className="font-semibold text-sm md:text-base">Part of: {order.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    View Timeline <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          {/* Poster */}
          <div className="relative">
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-muted">
              {series.posterUrl ? (
                <img
                  src={resolveApiUrl(series.posterUrl)}
                  alt={`${series.title} poster`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-6xl">📺</span>
                </div>
              )}
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/15 shadow-lg">
              <Timer className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>Runtime: {formatRuntimeMinutes(series.totalRuntimeMinutes)}</span>
            </div>
          </div>

          {/* Series Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">
                {series.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-muted-foreground text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{yearRange}</span>
                </div>
                <span>•</span>
                <div>
                  {series.totalSeasons} Season{series.totalSeasons !== 1 ? 's' : ''}
                </div>
                <span>•</span>
                <div>
                  {series.totalEpisodes} Episode{series.totalEpisodes !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {series.genre?.split(',').map((g) => (
                  <Badge key={g.trim()} variant="secondary" className="font-normal">{g.trim()}</Badge>
                ))}
              </div>

              {series.plot && series.plot !== "N/A" && (
                <div className="mt-6 text-sm text-foreground/90 leading-relaxed">
                  <h3 className="font-semibold text-foreground mb-2 text-base">Plot</h3>
                  <p>{series.plot}</p>
                </div>
              )}

              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                {(series.director && series.director !== "N/A") && (
                  <div>
                    <span className="font-medium text-foreground">Director:</span>{" "}
                    {creditNames(series.directors || series.director).map((name, index) => (
                      <span key={name}>{index > 0 && ", "}<PersonLink name={name} /></span>
                    ))}
                  </div>
                )}
                {creditNames(series.actors).length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Cast:</span>{" "}
                    {creditNames(series.actors).map((name, index) => (
                      <span key={name}>{index > 0 && ", "}<PersonLink name={name} /></span>
                    ))}
                  </div>
                )}
                {(series.language && series.language !== "N/A") && (
                  <div>
                    <span className="font-medium text-foreground">Language:</span> {series.language}
                  </div>
                )}
                {(series.country && series.country !== "N/A") && (
                  <div>
                    <span className="font-medium text-foreground">Country:</span> {series.country}
                  </div>
                )}
              </div>

              <WatchOnlineSection providers={series.watchProviders} className="mt-6" />
            </div>
            
            {user && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold mb-1">Your Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        {watchedSeasons.length} / {series.totalSeasons} seasons watched
                        {totalWatchCount > watchedSeasons.length && (
                          <> · {totalWatchCount} total views</>
                        )}
                      </p>
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30 border-green-500/30">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${series.totalSeasons ? Math.min(100, (watchedSeasons.length / series.totalSeasons) * 100) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        disabled={bulkPending || progressLoading}
                        onClick={() => runBulkAction(() => rewatchEntireSeries(series.imdbId))}
                      >
                        {bulkPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Log full rewatch
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-2"
                        disabled={bulkPending || progressLoading}
                        onClick={() => runBulkAction(() => watchEntireSeries(series.imdbId))}
                      >
                        {bulkPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                        Mark entire series watched
                      </Button>
                    )}
                    {watchedSeasons.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 text-muted-foreground"
                        disabled={bulkPending || progressLoading}
                        onClick={() => runBulkAction(() => unwatchEntireSeries(series.imdbId))}
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {progressError && (
                    <p className="text-sm text-destructive">{progressError}</p>
                  )}

                  <Link
                    href="/series-history"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <History className="w-4 h-4" />
                    View your series history
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Seasons Section */}
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Seasons</h2>
          
          {series.seasons && series.seasons.length > 0 ? (
            <div className="space-y-3">
              {series.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber).map((season) => {
                const isExpanded = expandedSeasons[season.seasonNumber] || false
                const watchCount = seasonCounts[String(season.seasonNumber)] || 0
                const isWatched = watchCount > 0
                const isToggling = togglingSeason === season.seasonNumber
                
                return (
                  <Card 
                    key={season.seasonNumber} 
                    className={`overflow-hidden transition-colors ${isWatched ? 'border-green-500/30 bg-green-500/5' : ''}`}
                  >
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSeasonAccordion(season.seasonNumber)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">Season {season.seasonNumber}</h3>
                          {isWatched && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="hidden sm:flex text-sm text-muted-foreground items-center gap-3">
                          <span>{season.episodeCount} episodes</span>
                          <span>•</span>
                          <span>{formatRuntimeMinutes(season.seasonRuntimeMinutes)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {user && (
                          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant={isWatched ? "outline" : "secondary"}
                              size="sm"
                              className={`gap-2 ${isWatched ? 'rounded-r-none border-r-0 text-green-600 border-green-500/30 hover:bg-green-500/10' : ''}`}
                              onClick={(e) => handleSeasonPrimary(e, season.seasonNumber)}
                              disabled={isToggling || progressLoading}
                              title={isWatched ? "Log another watch" : "Mark this season watched"}
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isWatched ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Watched
                                  {watchCount > 1 && (
                                    <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-xs font-semibold">
                                      ×{watchCount}
                                    </span>
                                  )}
                                  <Plus className="w-3.5 h-3.5 opacity-60" />
                                </>
                              ) : (
                                <>
                                  <Circle className="w-4 h-4" />
                                  Mark Watched
                                </>
                              )}
                            </Button>
                            {isWatched && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-l-none px-2 text-green-600 border-green-500/30 hover:bg-green-500/10"
                                    aria-label={`Season ${season.seasonNumber} watch options`}
                                    disabled={isToggling || progressLoading}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setCountEditor({
                                        season: season.seasonNumber,
                                        value: String(watchCount),
                                      })
                                    }
                                  >
                                    Edit watch count
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleSeasonUnwatch(season.seasonNumber)}
                                  >
                                    Mark unwatched
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t bg-muted/20">
                        {season.episodes && season.episodes.length > 0 ? (
                          <div className="divide-y">
                            {season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber).map((ep) => (
                              <div key={ep.imdbId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                  <span className="font-mono text-muted-foreground min-w-[2rem]">
                                    {ep.episodeNumber}.
                                  </span>
                                  <span className="font-medium text-foreground">{ep.title}</span>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {ep.airDate && ep.airDate !== "N/A" && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {ep.airDate}
                                    </div>
                                  )}
                                  {ep.runtimeMinutes > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {ep.runtimeMinutes} min
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-sm text-muted-foreground">
                            No episode data available.
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No seasons data available for this series.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={!!countEditor} onOpenChange={(open) => !open && setCountEditor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Season {countEditor?.season} watch count</DialogTitle>
            <DialogDescription>
              How many times have you watched this season? Set it to 0 to mark it unwatched.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={0}
            max={999}
            value={countEditor?.value ?? ""}
            autoFocus
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
