"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Plus, Loader2, Film, MapPin, Calendar, Ticket } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Movie } from "@/lib/types"

interface AddWatchDialogProps {
  uid: string
  onWatchAdded: () => void
}

export function AddWatchDialog({ uid, onWatchAdded }: AddWatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedMovie, setSelectedMovie] = useState<string>("")
  const [theaterName, setTheaterName] = useState("")
  const [theaterLocation, setTheaterLocation] = useState("")
  const [showTime, setShowTime] = useState("")
  const [ticketCost, setTicketCost] = useState("")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")

  useEffect(() => {
    const fetchMovies = async () => {
      const moviesRef = collection(db, "movies")
      const q = query(moviesRef, orderBy("title"))
      const snapshot = await getDocs(q)
      const movieList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Movie[]
      setMovies(movieList)
    }

    if (open) {
      fetchMovies()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const movie = movies.find((m) => m.id === selectedMovie)
    if (!movie) {
      setError("Please select a movie")
      return
    }

    if (!theaterName.trim()) {
      setError("Please enter the theater name")
      return
    }

    if (!showTime) {
      setError("Please enter the show date and time")
      return
    }

    if (!ticketCost || parseFloat(ticketCost) < 0) {
      setError("Please enter a valid ticket cost")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/watch-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          movieId: movie.id,
          movieTitle: movie.title,
          moviePosterUrl: movie.posterUrl,
          theaterName: theaterName.trim(),
          theaterLocation: theaterLocation.trim() || null,
          showTime,
          ticketCost: parseFloat(ticketCost),
          currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add watch")
      }

      // Reset form
      setSelectedMovie("")
      setTheaterName("")
      setTheaterLocation("")
      setShowTime("")
      setTicketCost("")
      setCurrency("INR")
      setOpen(false)
      onWatchAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add watch")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Watch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Log Movie Watch
          </DialogTitle>
          <DialogDescription>
            Record a movie you watched in theaters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movie-select">Movie</Label>
            <Select value={selectedMovie} onValueChange={setSelectedMovie}>
              <SelectTrigger id="movie-select">
                <SelectValue placeholder="Select a movie" />
              </SelectTrigger>
              <SelectContent>
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.title} ({movie.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theater-name" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Theater Name
            </Label>
            <Input
              id="theater-name"
              placeholder="e.g., PVR Cinemas"
              value={theaterName}
              onChange={(e) => setTheaterName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theater-location">Location (optional)</Label>
            <Input
              id="theater-location"
              placeholder="Google Maps link or address"
              value={theaterLocation}
              onChange={(e) => setTheaterLocation(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="show-time" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Show Date & Time
            </Label>
            <Input
              id="show-time"
              type="datetime-local"
              value={showTime}
              onChange={(e) => setShowTime(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-cost" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Ticket Cost
              </Label>
              <Input
                id="ticket-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={ticketCost}
                onChange={(e) => setTicketCost(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "INR" | "USD")}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Watch"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
