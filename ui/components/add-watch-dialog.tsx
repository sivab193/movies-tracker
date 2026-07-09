"use client"

import React, { useState, useEffect } from "react"
import { Plus, Loader2, Film, MapPin, Ticket } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type WatchHistoryEntry } from "@/lib/types"
import { addWatchHistory, updateWatchHistory, getMovies, getTheaters } from "@/services/api"
// Standard date input used instead of MUI DatePicker

interface AddWatchDialogProps {
  uid: string
  onWatchAdded: () => void
  initialData?: WatchHistoryEntry
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function AddWatchDialog({
  uid,
  onWatchAdded,
  initialData,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  hideTrigger = false
}: AddWatchDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      setControlledOpen?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [movies, setMovies] = useState<any[]>([])
  const [theaters, setTheaters] = useState<any[]>([])

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState<string>("")
  const [selectedTheaterId, setSelectedTheaterId] = useState<string>("")
  const [theaterName, setTheaterName] = useState("")
  const [theaterLocation, setTheaterLocation] = useState("")
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0])
  const [ticketCost, setTicketCost] = useState("")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [hasScreenshot, setHasScreenshot] = useState(false)
  const [ticketStubFile, setTicketStubFile] = useState<File | null>(null)

  // Load movies and theaters when dialog opens
  useEffect(() => {
    if (open) {
      getMovies().then(res => setMovies(res?.movies || res || [])).catch(() => setMovies([]))
      getTheaters().then(setTheaters).catch(() => setTheaters([]))
    }
  }, [open])

  // Initialize form if initialData provided
  useEffect(() => {
    if (open && initialData) {
      setSelectedMovieId(initialData.movieId)
      setTheaterName(initialData.theaterName || "")
      setTheaterLocation(initialData.theaterLocation || "")
      setTicketCost(initialData.ticketCost?.toString() || "")
      setCurrency(initialData.currency || "INR")
      if (initialData.timestamp) {
        try {
          setWatchDate(new Date(initialData.timestamp).toISOString().split('T')[0])
        } catch (e) {
          setWatchDate(new Date().toISOString().split('T')[0])
        }
      }
    } else if (!open) {
      resetForm()
    }
  }, [initialData, open])

  // Match loaded theaters with initialData.theaterName
  useEffect(() => {
    if (theaters.length > 0 && theaterName) {
      const match = theaters.find(t => t.name === theaterName)
      if (match) {
        setSelectedTheaterId(match.id)
      }
    }
  }, [theaters, theaterName])

  const handleTheaterChange = (theaterId: string) => {
    setSelectedTheaterId(theaterId)
    const selected = theaters.find(t => t.id === theaterId)
    if (selected) {
      setTheaterName(selected.name)
      setTheaterLocation(selected.location || "")
    }
  }

  const resetForm = () => {
    setSelectedMovieId("")
    setSelectedTheaterId("")
    setTheaterName("")
    setTheaterLocation("")
    setWatchDate(new Date().toISOString().split('T')[0])
    setTicketCost("")
    setCurrency("INR")
    setHasScreenshot(false)
    setTicketStubFile(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedMovieId && !initialData) {
      setError("Please select a movie")
      return
    }

    if (theaters.length > 0 && !selectedTheaterId) {
      setError("Please select a theater from the approved list")
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        movieId: selectedMovieId || initialData?.movieId,
        theaterName: theaterName.trim() || undefined,
        theaterLocation: theaterLocation.trim() || undefined,
        timestamp: new Date(watchDate).toISOString(),
        ticketCost: ticketCost ? parseFloat(ticketCost) : 0,
        currency,
      }

      // Convert ticket stub file to Base64 if uploaded
      if (hasScreenshot && ticketStubFile) {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (err) => reject(err)
          reader.readAsDataURL(ticketStubFile)
        })
        payload.ticketStubImage = base64Image
      }

      if (initialData && initialData._id) {
        await updateWatchHistory(uid, initialData._id, payload)
      } else {
        await addWatchHistory(payload)
      }

      resetForm()
      setOpen(false)
      onWatchAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Movie Watch
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            {initialData ? "Edit Watch Log" : "Log Movie Watch"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Update details for this movie." : "Record a movie you watched in theaters."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Movie Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="movie-select">Movie</Label>
            {initialData ? (
              <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/50">
                {initialData.moviePosterUrl && <img src={initialData.moviePosterUrl} alt="Poster" className="h-10 w-auto rounded" />}
                <span className="font-medium">{initialData.movieTitle}</span>
              </div>
            ) : (
              <Select value={selectedMovieId} onValueChange={setSelectedMovieId}>
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
            )}
          </div>

          {/* Theater Dropdown Selection */}
          <div className="space-y-2">
            <Label htmlFor="theater-select" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select Theater
            </Label>
            {theaters.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No theaters available. Ask your admin to add one.</p>
            ) : (
              <Select value={selectedTheaterId} onValueChange={handleTheaterChange}>
                <SelectTrigger id="theater-select">
                  <SelectValue placeholder="Select a theater" />
                </SelectTrigger>
                <SelectContent>
                  {theaters.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.location ? `(${t.location})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date of Watch</Label>
            <input
              type="date"
              value={watchDate}
              onChange={(e) => setWatchDate(e.target.value)}
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-cost" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Ticket Cost <span className="text-xs text-muted-foreground">(Optional)</span>
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="screenshot"
              checked={hasScreenshot}
              onCheckedChange={(c) => setHasScreenshot(c === true)}
            />
            <Label htmlFor="screenshot" className="cursor-pointer">
              Do you want to upload ticket screenshot?
            </Label>
          </div>

          {hasScreenshot && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload Ticket (Image/PDF)</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,application/pdf"
                disabled={loading}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setTicketStubFile(e.target.files[0])
                  }
                }}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Updating..." : "Adding..."}
              </>
            ) : (
              initialData ? "Update Watch" : "Add Watch"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
