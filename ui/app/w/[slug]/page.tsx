"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getWatchOrderBySlug, enrichWatchOrderItems } from "@/services/watch-order-service"
import { getSeriesProgress } from "@/services/series-service"
import { formatRuntimeMinutes, resolveApiUrl } from "@/lib/types"
import type { EnrichedWatchOrderItem, SeriesProgress, WatchOrder } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Film,
  Link2,
  Loader2,
  ListOrdered,
  Tv,
} from "lucide-react"

type LoadedOrder = Omit<WatchOrder, "items"> & { items: EnrichedWatchOrderItem[] }

/** Adds `.is-visible` to every `.reveal` element once it scrolls into view. */
function useScrollReveal(ready: boolean) {
  useEffect(() => {
    if (!ready || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    )

    const nodes = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)")
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [ready])
}

/** Fraction of the timeline scrolled through, 0 → 1. */
function useTimelineProgress(ref: React.RefObject<HTMLElement | null>, ready: boolean) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!ready) return

    let frame = 0
    const update = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.5
      if (total <= 0) return setProgress(rect.bottom < window.innerHeight ? 1 : 0)
      const scrolled = window.innerHeight * 0.5 - rect.top
      setProgress(Math.min(1, Math.max(0, scrolled / total)))
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [ref, ready])

  return progress
}

export default function WatchOrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { user, userProfile, loading: authLoading } = useAuth()

  const [order, setOrder] = useState<LoadedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [seriesProgressList, setSeriesProgressList] = useState<SeriesProgress[]>([])
  const [copied, setCopied] = useState(false)

  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await getWatchOrderBySlug(slug)
        const items = await enrichWatchOrderItems(data.items || [])
        if (!cancelled) setOrder({ ...data, items } as LoadedOrder)
      } catch (err) {
        console.error("Failed to load watch order", err)
        if (!cancelled) setMissing(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (authLoading || !user) return
    getSeriesProgress(user.uid)
      .then((progress) => setSeriesProgressList(progress || []))
      .catch((err) => {
        console.error("Failed to load series progress", err)
        setSeriesProgressList([])
      })
  }, [authLoading, user])

  useScrollReveal(!loading && !!order)
  const timelineProgress = useTimelineProgress(timelineRef, !loading && !!order)

  const hasWatchedMovie = useCallback(
    (imdbId?: string) => {
      if (!imdbId || !userProfile?.watchHistory) return false
      return userProfile.watchHistory.some((entry: any) => entry.imdbId === imdbId)
    },
    [userProfile]
  )

  const isSeriesComplete = useCallback(
    (item: EnrichedWatchOrderItem) => {
      const progress = seriesProgressList.find((p) => p.imdbId === item.itemId)
      const total = item.totalSeasons || 0
      return total > 0 && (progress?.watchedSeasons?.length || 0) >= total
    },
    [seriesProgressList]
  )

  const items = useMemo(
    () => [...(order?.items || [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [order]
  )

  const stats = useMemo(() => {
    const movies = items.filter((i) => i.type?.toLowerCase() === "movie")
    const series = items.filter((i) => i.type?.toLowerCase() !== "movie")
    const minutes = items.reduce((sum, item) => {
      if (item.type?.toLowerCase() === "movie") {
        const parsed = parseInt(String(item.runtime || "").replace(/[^0-9]/g, ""), 10)
        return sum + (Number.isNaN(parsed) ? 0 : parsed)
      }
      return sum + (item.totalRuntimeMinutes || 0)
    }, 0)
    const completed = items.filter((item) =>
      item.type?.toLowerCase() === "movie" ? hasWatchedMovie(item.itemId) : isSeriesComplete(item)
    ).length

    return { movies: movies.length, series: series.length, minutes, completed }
  }, [items, hasWatchedMovie, isSeriesComplete])

  const posterWall = useMemo(
    () => items.map((i) => i.posterUrl).filter(Boolean).slice(0, 12) as string[],
    [items]
  )

  const copyShortLink = async () => {
    if (!order) return
    const url = `${window.location.origin}/w/${order.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy this link", url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (missing || !order) return notFound()

  const completionPct = items.length ? Math.round((stats.completed / items.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Scroll progress rail */}
      <div className="sticky top-0 z-40 h-1 w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-blue-500 transition-[width] duration-150 ease-out"
          style={{ width: `${timelineProgress * 100}%` }}
        />
      </div>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10">
            <div className="grid h-full w-full grid-cols-4 sm:grid-cols-6 opacity-25 blur-[2px] scale-110">
              {posterWall.map((poster, i) => (
                <img
                  key={`${poster}-${i}`}
                  src={resolveApiUrl(poster)}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
          </div>

          <div className="container mx-auto max-w-5xl px-4 py-20 sm:py-28">
            <Link
              href="/watch-orders"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All watch orders
            </Link>

            <h1 className="animate-fade-in mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              {order.name}
            </h1>

            {order.description && (
              <p className="animate-slide-up mt-4 max-w-2xl text-lg text-muted-foreground">
                {order.description}
              </p>
            )}

            <div className="animate-slide-up mt-8 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <ListOrdered className="h-3.5 w-3.5" />
                {items.length} titles
              </Badge>
              {stats.movies > 0 && (
                <Badge variant="outline" className="gap-1.5 border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-500">
                  <Film className="h-3.5 w-3.5" />
                  {stats.movies} {stats.movies === 1 ? "movie" : "movies"}
                </Badge>
              )}
              {stats.series > 0 && (
                <Badge variant="outline" className="gap-1.5 border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-500">
                  <Tv className="h-3.5 w-3.5" />
                  {stats.series} series
                </Badge>
              )}
              {stats.minutes > 0 && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRuntimeMinutes(stats.minutes)} total
                </Badge>
              )}
            </div>

            {user && items.length > 0 && (
              <div className="animate-slide-up mt-8 max-w-md">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your progress</span>
                  <span className="font-medium">
                    {stats.completed} / {items.length} · {completionPct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-700"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="animate-slide-up mt-8 flex flex-wrap items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={copyShortLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
                {copied ? "Link copied" : `Copy /w/${order.slug}`}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <ChevronDown className="h-4 w-4 animate-bounce" />
                Scroll to begin the timeline
              </span>
            </div>
          </div>
        </section>

        {/* ---------- Timeline ---------- */}
        <section ref={timelineRef} className="container mx-auto max-w-4xl px-4 py-16 sm:py-24">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-20 text-center">
              <ListOrdered className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">Nothing in this order yet</h3>
              <p className="text-muted-foreground">Titles will appear here once they are added.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Spine */}
              <div className="absolute bottom-0 left-4 top-0 w-px bg-border sm:left-6" aria-hidden />
              <div
                className="absolute left-4 top-0 w-px bg-gradient-to-b from-primary to-purple-500 transition-[height] duration-150 ease-out sm:left-6"
                style={{ height: `${timelineProgress * 100}%` }}
                aria-hidden
              />

              <ol className="space-y-10 sm:space-y-14">
                {items.map((item, index) => {
                  const isMovie = item.type?.toLowerCase() === "movie"
                  const progress = !isMovie
                    ? seriesProgressList.find((p) => p.imdbId === item.itemId)
                    : null
                  const watchedSeasons = progress?.watchedSeasons?.length || 0
                  const totalSeasons = item.totalSeasons || 0
                  const done = isMovie ? hasWatchedMovie(item.itemId) : isSeriesComplete(item)

                  return (
                    <li
                      key={item.id || index}
                      className="reveal relative pl-12 sm:pl-20"
                      style={{ transitionDelay: `${Math.min(index, 4) * 60}ms` }}
                    >
                      {/* Node */}
                      <div
                        className={`absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold sm:h-12 sm:w-12 sm:text-sm ${
                          done
                            ? "border-green-500 bg-green-500/10 text-green-500"
                            : "border-primary/40 bg-background text-muted-foreground"
                        }`}
                      >
                        {done ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                      </div>

                      <div className="group rounded-xl border bg-card/60 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg sm:p-6">
                        <div className="flex gap-4 sm:gap-6">
                          {item.posterUrl && (
                            <Link
                              href={isMovie ? `/movie/${item.itemId}` : `/series/${item.itemId}`}
                              className="flex-shrink-0"
                            >
                              <img
                                src={resolveApiUrl(item.posterUrl)}
                                alt={item.title || "Poster"}
                                className="h-28 w-20 rounded-lg bg-muted object-cover shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-36 sm:w-24"
                                loading="lazy"
                              />
                            </Link>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                              <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                                <Link
                                  href={isMovie ? `/movie/${item.itemId}` : `/series/${item.itemId}`}
                                  className="transition-colors hover:text-primary hover:underline"
                                >
                                  {item.title || "Unknown"}
                                </Link>
                                {user && done && (
                                  <span title="Watched">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </span>
                                )}
                              </h2>
                              <Badge
                                variant="outline"
                                className={
                                  isMovie
                                    ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                    : "border-purple-500/20 bg-purple-500/10 text-purple-500"
                                }
                              >
                                {isMovie ? <Film className="mr-1 h-3 w-3" /> : <Tv className="mr-1 h-3 w-3" />}
                                {isMovie ? "Movie" : "Series"}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="rounded bg-muted px-2 py-0.5 font-medium">
                                {isMovie
                                  ? item.year
                                  : `${item.year}${
                                      item.endYear ? `–${item.endYear}` : item.isOngoing ? "–present" : ""
                                    }`}
                              </span>
                              {isMovie && item.runtime && <span>{item.runtime}</span>}
                              {!isMovie && totalSeasons > 0 && (
                                <span>
                                  {totalSeasons} season{totalSeasons !== 1 ? "s" : ""}
                                </span>
                              )}
                              {!isMovie && item.totalRuntimeMinutes ? (
                                <span>{formatRuntimeMinutes(item.totalRuntimeMinutes)}</span>
                              ) : null}
                            </div>

                            {user && !isMovie && totalSeasons > 0 && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{
                                      width: `${Math.min(100, (watchedSeasons / totalSeasons) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span>
                                  {watchedSeasons} / {totalSeasons} seasons
                                </span>
                              </div>
                            )}

                            {item.notes && (
                              <p className="mt-3 border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* ---------- Outro ---------- */}
          {items.length > 0 && (
            <div className="reveal mt-20 rounded-xl border bg-card/60 p-8 text-center">
              <h3 className="text-2xl font-semibold">That&apos;s the full order</h3>
              <p className="mt-2 text-muted-foreground">
                {items.length} titles
                {stats.minutes > 0 ? ` · ${formatRuntimeMinutes(stats.minutes)} of watching` : ""}.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="outline" className="gap-2" onClick={copyShortLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "Link copied" : "Share this order"}
                </Button>
                <Link href="/watch-orders">
                  <Button variant="ghost" className="gap-2">
                    <ListOrdered className="h-4 w-4" />
                    Browse other orders
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
