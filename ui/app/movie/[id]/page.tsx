"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Star, Calendar, Timer, MessageSquare } from "lucide-react"
import { Header } from "@/components/header"
import { getMovie, getSubmissions } from "@/services/api"
import { SubmissionForm } from "@/components/submission-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTimeDisplay, type Movie, type TitleCardSubmission } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { userProfile } = useAuth()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [submissions, setSubmissions] = useState<TitleCardSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieData, submissionsData] = await Promise.all([
          getMovie(id),
          getSubmissions(id)
        ])

        if (movieData) {
          setMovie({
            ...movieData,
            createdAt: new Date(movieData.createdAt)
          })
        }

        if (submissionsData.submissions) {
          setSubmissions(submissionsData.submissions)
        }
      } catch (error) {
        console.error("Error fetching movie data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  // Calculate stats
  const times = submissions.map((s) => s.timeInSeconds)
  const minTime = times.length > 0 ? Math.min(...times) : null
  const maxTime = times.length > 0 ? Math.max(...times) : null

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
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold">Movie not found</h1>
            <p className="mt-2 text-muted-foreground">
              This movie doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button className="mt-4">Go back home</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to movies
        </Link>

        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          {/* Movie Poster */}
          <div className="relative">
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-muted">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl || "/placeholder.svg"}
                  alt={`${movie.title} poster`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-6xl">🎬</span>
                </div>
              )}
            </div>

            {/* Title card time badge */}
            {movie.averageTimeSeconds !== null && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">
                    {formatTimeDisplay(movie.averageTimeSeconds)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">
                {movie.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.released || movie.releaseDate || movie.year}</span>
                </div>
                {((movie.language || movie.Language) && (movie.language || movie.Language) !== "N/A") && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground border border-border">
                    {movie.language || movie.Language}
                  </span>
                )}
                {movie.imdbRating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{movie.imdbRating}/10</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4" />
                    <span>{movie.runtime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Title Card Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movie.submissionCount > 0 ? (
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-primary">
                      ≈ {formatTimeDisplay(movie.averageTimeSeconds!)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Based on {movie.submissionCount} submission
                      {movie.submissionCount !== 1 ? "s" : ""}
                    </div>
                    {minTime !== null && maxTime !== null && minTime !== maxTime && (
                      <div className="text-sm text-muted-foreground">
                        Range: {formatTimeDisplay(minTime)} - {formatTimeDisplay(maxTime)}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No submissions yet. Be the first to add one!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submission Form */}
            {userProfile?.isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Submit Title Card Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionForm
                    movieId={id}
                    runtimeMinutes={movie.runtime ? parseInt(movie.runtime) : undefined}
                    onSubmitted={async () => {
                      const data = await getSubmissions(id)
                      if (data.submissions) setSubmissions(data.submissions)
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4">
              All Submissions ({submissions.length})
            </h2>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                          <Clock className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatTimeDisplay(submission.timeInSeconds)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {submission.comment && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{submission.comment}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
