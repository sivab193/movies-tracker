"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Check, Clock, Copy, ListOrdered, Loader2, MessageSquare, Share2, Timer, Users } from "lucide-react"
import { Header } from "@/components/header"
import { getMovie, getSubmissions, createShortUrl, updateMovie } from "@/services/api"
import { getWatchOrdersForMovie } from "@/services/watch-order-service"
import { SubmissionForm } from "@/components/submission-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatTimeDisplay, formatRuntimeToHHMM, type Movie, type TitleCardSubmission } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { PersonLink } from "@/components/person-link"
import { creditNames } from "@/lib/people"
import { WatchOnlineSection } from "@/components/watch-online-section"

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, userProfile } = useAuth()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [submissions, setSubmissions] = useState<TitleCardSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [shortUrl, setShortUrl] = useState("")
  const [shortUrlLoading, setShortUrlLoading] = useState(false)
  const [shortUrlDialogOpen, setShortUrlDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [movieWatchOrders, setMovieWatchOrders] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [movieData, submissionsData, orders] = await Promise.all([
          getMovie(id),
          getSubmissions(id),
          getWatchOrdersForMovie(id).catch(() => []),
        ])
        setMovie(movieData ? { ...movieData, createdAt: new Date(movieData.createdAt) } : null)
        setSubmissions(submissionsData.submissions || [])
        setMovieWatchOrders(orders)
      } catch (error) {
        console.error("Error fetching movie data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const refreshSubmissions = async () => {
    const data = await getSubmissions(id)
    if (data.submissions) {
      setSubmissions(data.submissions)
      const times = data.submissions.map((submission: TitleCardSubmission) => submission.timeInSeconds)
      setMovie((current) => current ? {
        ...current,
        submissionCount: times.length,
        averageTimeSeconds: times.length ? times.reduce((sum: number, time: number) => sum + time, 0) / times.length : null,
      } : current)
    }
  }

  const handleShare = async () => {
    if (!movie) return
    setShortUrlLoading(true)
    setShortUrlDialogOpen(true)
    setCopied(false)
    try {
      const data = await createShortUrl(movie.id || id)
      const fullUrl = window.location.origin + data.shortUrl
      setShortUrl(fullUrl)
      if (navigator.share) {
        try {
          await navigator.share({ title: movie.title, text: `View ${movie.title} on MediaVerse`, url: fullUrl })
          setShortUrlDialogOpen(false)
        } catch {
          // Keep the copy dialog open when native sharing is cancelled.
        }
      }
    } catch {
      setShortUrl(window.location.href)
    } finally {
      setShortUrlLoading(false)
    }
  }

  const handleCopyShortUrl = () => {
    navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <MoviePageSkeleton />

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Movie not found</h1>
          <p className="mt-2 text-muted-foreground">This movie does not exist or has been removed.</p>
          <Button asChild className="mt-4"><Link href="/">Go back home</Link></Button>
        </main>
      </div>
    )
  }

  const directors = creditNames(movie.directors || movie.director)
  const actors = creditNames(movie.actors)
  const times = submissions.map((submission) => submission.timeInSeconds)
  const minTime = times.length ? Math.min(...times) : null
  const maxTime = times.length ? Math.max(...times) : null
  const recentSubmissions = submissions.slice(0, 2)
  const hasTitleTime = Boolean(movie.submissionCount && movie.averageTimeSeconds && movie.averageTimeSeconds > 0)

  return (
    <div className="min-h-screen bg-background md:h-screen md:overflow-hidden">
      <Header />
      <main className="relative isolate mx-auto w-full max-w-7xl overflow-hidden px-3 py-3 sm:px-4 md:flex md:h-[calc(100dvh-4rem)] md:flex-col md:overflow-hidden">\n        {movie.posterUrl && <img src={movie.posterUrl} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-20 blur-3xl" />}\n        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-background/45 via-background/85 to-background" />
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground">
              <Link href="/"><ArrowLeft className="h-4 w-4" />Movies</Link>
            </Button>
            {movieWatchOrders.slice(0, 2).map((order) => (
              <Button key={order.id} asChild variant="outline" size="sm" className="hidden h-8 max-w-52 gap-1.5 md:inline-flex">
                <Link href={`/w/${order.slug || order.id}`}><ListOrdered className="h-3.5 w-3.5" /><span className="truncate">{order.name}</span></Link>
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={shortUrlLoading} className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs">
            {shortUrlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}Share
          </Button>
        </div>

        <div className="relative mt-3 grid gap-4 overflow-hidden rounded-2xl border border-white/10 bg-background/55 p-3 shadow-2xl shadow-black/20 backdrop-blur-md md:min-h-0 md:flex-1 md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-6 xl:p-5">
          <aside className="mx-auto w-full max-w-[220px] self-start md:mx-0 md:max-w-none">
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted shadow-xl shadow-black/30 md:aspect-[2/3]">
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl">🎬</div>
              )}
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/15 bg-black/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                <Timer className="h-3 w-3 text-sky-400" />{formatRuntimeToHHMM(movie.runtime)}
              </div>
              <div className="absolute inset-x-2 bottom-2 rounded-lg border border-white/10 bg-black/80 px-2.5 py-2 text-center text-xs font-semibold text-white backdrop-blur">
                {hasTitleTime ? <>Title at <span className="text-amber-400">{formatTimeDisplay(movie.averageTimeSeconds!)}</span></> : "Title time not reported"}
              </div>
            </div>
          </aside>

          <section className="min-w-0 md:flex md:min-h-0 md:flex-col">
            <div className="shrink-0 px-1 py-2 sm:px-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl">{movie.title}</h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{movie.released || movie.releaseDate || movie.year}</span>
                    {(movie.language || movie.Language) && <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">{movie.language || movie.Language}</span>}
                    <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{formatRuntimeToHHMM(movie.runtime)}</span>
                  </div>
                </div>
                <div className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Title card</p>
                  <p className="text-xl font-black text-primary">{hasTitleTime ? formatTimeDisplay(movie.averageTimeSeconds!) : "Not reported"}</p>
                  {hasTitleTime && <p className="text-[10px] text-muted-foreground">{movie.submissionCount} submission{movie.submissionCount !== 1 ? "s" : ""}{minTime !== maxTime && minTime !== null ? ` · ${formatTimeDisplay(minTime)}–${formatTimeDisplay(maxTime!)}` : ""}</p>}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.82fr)] xl:grid-cols-[minmax(0,1.15fr)_300px]">
              <div className="flex min-w-0 flex-col gap-3">
                {(directors.length > 0 || actors.length > 0) && (
                  <Card className="gap-0 py-3">
                    <CardContent className="px-3">
                      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" />People</h2>
                      <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                        {directors.length > 0 && <p><span className="font-medium text-foreground">Director:</span> {directors.slice(0, 2).map((name, index) => <span key={name}>{index > 0 && ", "}<PersonLink name={name} /></span>)}</p>}
                        {actors.length > 0 && <p><span className="font-medium text-foreground">Cast:</span> {actors.slice(0, 5).map((name, index) => <span key={name}>{index > 0 && ", "}<PersonLink name={name} /></span>)}{actors.length > 5 && <span> +{actors.length - 5} more</span>}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <WatchOnlineSection
                  compact
                  providers={movie.watchProviders}
                  movieId={id}
                  canReport={Boolean(user)}
                  isAdmin={Boolean(userProfile?.isAdmin)}
                  onSaveProviders={userProfile?.isAdmin ? async (watchProviders) => {
                    const updated = await updateMovie(id, { watchProviders })
                    setMovie((current) => current ? { ...current, ...updated } : current)
                  } : undefined}
                />
              </div>

              <Card className="gap-0 py-3 md:min-h-0">
                <CardContent className="px-3">
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" />Add title-card time</h2>
                  <SubmissionForm
                    compact
                    movieId={id}
                    runtimeMinutes={movie.runtime ? parseInt(movie.runtime) : undefined}
                    onSubmitted={refreshSubmissions}
                  />

                  <div className="mt-3 border-t pt-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent submissions</h3>
                    {recentSubmissions.length ? (
                      <div className="space-y-1.5">
                        {recentSubmissions.map((submission) => (
                          <div key={submission.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-primary">{formatTimeDisplay(submission.timeInSeconds)}</span>
                              {submission.comment && <span className="ml-2 inline-flex max-w-40 items-center gap-1 truncate text-muted-foreground"><MessageSquare className="h-3 w-3 shrink-0" />{submission.comment}</span>}
                            </div>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(submission.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">No submissions yet.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <Dialog open={shortUrlDialogOpen} onOpenChange={setShortUrlDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" />Share movie</DialogTitle>
            <DialogDescription>Copy this short link. It automatically expires after 30 days.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-2">
            <input readOnly value={shortUrl} className="min-w-0 flex-1 bg-transparent px-2 text-sm font-mono outline-none" />
            <Button size="sm" onClick={handleCopyShortUrl} className="shrink-0 gap-1.5">
              {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MoviePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-4">
        <Skeleton className="mb-3 h-8 w-24" />
        <div className="grid gap-4 md:grid-cols-[180px_1fr] xl:grid-cols-[220px_1fr]">
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /><div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div></div>
        </div>
      </main>
    </div>
  )
}
