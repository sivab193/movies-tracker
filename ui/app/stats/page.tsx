"use client"

import { useEffect, useState } from "react"
import { BarChart3, Building2, Clock3, Film, MapPin, Sparkles, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStatsSummary } from "@/services/api"

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStatsSummary()
        setStats(data)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Failed to load stats")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <BarChart3 className="h-4 w-4" />
            Community stats
          </div>
          <h1 className="text-4xl font-bold tracking-tight">What the community is watching</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A quick pulse on adoption, engagement, and the movie habits that keep the tracker lively.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
            Loading community insights…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" /> Total users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Film className="h-4 w-4" /> Movies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMovies ?? 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" /> Theaters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTheaters ?? 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock3 className="h-4 w-4" /> Watch entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalWatchEntries ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Most watched movie
                  </CardTitle>
                  <CardDescription>Current crowd favorite based on logged watches.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">{stats?.mostWatchedMovie?.title || "No watches yet"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {stats?.mostWatchedMovie?.count ?? 0} watches
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Top location
                  </CardTitle>
                  <CardDescription>The place most frequently associated with watch entries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">{stats?.topLocation?.name || "No data"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {stats?.topLocation?.count ?? 0} watch entries
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Insightful takeaways</CardTitle>
                <CardDescription>Quick signals to help users discover momentum and keep returning.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-foreground">
                  {stats?.insights?.map((insight: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                      <span>{insight}</span>
                    </li>
                  ))}
                  {!stats?.insights?.length && <li>No insights available yet.</li>}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
