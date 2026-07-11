"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Film,
  MapPin,
  Calendar,
  Ticket,
  Trash2,
  Edit2,
  ExternalLink,
  IndianRupee,
  DollarSign,
} from "lucide-react"
import { Header } from "@/components/header"
import { AddWatchDialog } from "@/components/add-watch-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { type WatchHistoryEntry, resolveApiUrl } from "@/lib/types"
import { deleteWatchHistory } from "@/services/api"
import { getMySettings } from "@/services/user-service"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState<WatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  const fetchHistory = async () => {
    if (!user) return

    try {
      const data = await getMySettings()
      if (data.watchHistory) {
        setHistory(data.watchHistory)
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const handleDelete = async (entryId: string) => {
    if (!user) return
    try {
      await deleteWatchHistory(user.uid, entryId)
      setHistory((prev) => prev.filter((entry) => entry._id !== entryId))
    } catch (error) {
      console.error("Failed to delete entry:", error)
    }
  }

  // Calculate totals
  const totalINR = history
    .filter((e) => e.currency === "INR")
    .reduce((sum, e) => sum + e.ticketCost, 0)
  const totalUSD = history
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + e.ticketCost, 0)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Dashboard</h1>
            <p className="text-muted-foreground">
              Track your movie watches and spending
            </p>
          </div>
          <AddWatchDialog uid={user.uid} onWatchAdded={fetchHistory} />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Movies Watched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{history.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent (INR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">
                  {totalINR.toLocaleString("en-IN")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">
                  {totalUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Watch History */}
        <h2 className="text-xl font-semibold mb-4">Watch History</h2>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-medium">No watches logged yet</h3>
              <p className="text-muted-foreground mt-1">
                Start tracking your movie experiences!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((entry, idx) => (
              <Card key={entry._id || idx}>
                <CardContent className="py-4">
                  <div className="flex gap-4">
                    {/* Poster thumbnail */}
                    <div className="w-16 shrink-0">
                      <div className="aspect-[2/3] overflow-hidden rounded-md bg-muted">
                        {entry.moviePosterUrl ? (
                          <img
                            src={entry.moviePosterUrl || "/placeholder.svg"}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">
                            🎬
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/movie/${entry.movieId}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {entry.movieTitle}
                      </Link>

                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{entry.theaterName}</span>
                          {entry.theaterLocation && !entry.theaterLocation.startsWith("http") && (
                            <span className="text-muted-foreground">({entry.theaterLocation})</span>
                          )}
                          {(entry.theaterGmapsLink || entry.theaterLocation) && (
                            <a
                              href={
                                entry.theaterGmapsLink
                                  ? entry.theaterGmapsLink
                                  : entry.theaterLocation?.startsWith("http")
                                  ? entry.theaterLocation
                                  : `https://maps.google.com/?q=${encodeURIComponent(
                                      `${entry.theaterName || ""} ${entry.theaterLocation || ""}`.trim()
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center"
                              title="View on Google Maps"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(entry.timestamp || entry.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-3.5 w-3.5" />
                            <span>
                              {entry.currency === "INR" ? "₹" : "$"}
                              {entry.ticketCost.toLocaleString()}
                            </span>
                          </div>
                          {entry.ticketStubUrl && (
                            <a 
                              href={resolveApiUrl(entry.ticketStubUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              🎟️ View Ticket
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete watch entry?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this watch entry from your
                              history. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => entry._id && handleDelete(entry._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
