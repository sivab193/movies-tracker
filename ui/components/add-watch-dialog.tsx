"use client"

import React, { useState, useEffect } from "react"
import { Plus, Loader2, Film, MapPin, Calendar as CalendarIcon, Ticket } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { addWatchHistory, updateWatchHistory, getMovies } from "@/services/api"

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

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState<string>("")
  const [theaterName, setTheaterName] = useState("")
  const [theaterLocation, setTheaterLocation] = useState("")
  const [date, setDate] = useState<Date>()
  const [ticketCost, setTicketCost] = useState("")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [hasScreenshot, setHasScreenshot] = useState(false)

  // Load movies when dialog opens
  useEffect(() => {
    if (open && !initialData) {
      getMovies().then(setMovies).catch(() => setMovies([]))
    }
  }, [open, initialData])

  // Initialize form if initialData provided
  useEffect(() => {
    if (open && initialData) {
      setSelectedMovieId(initialData.movieId)
      setTheaterName(initialData.theaterName || "")
      setTheaterLocation(initialData.theaterLocation || "")
      setTicketCost(initialData.ticketCost?.toString() || "")
      setCurrency(initialData.currency || "INR")
      if (initialData.timestamp) setDate(new Date(initialData.timestamp))
    } else if (!open) {
      resetForm()
    }
  }, [initialData, open])

  const resetForm = () => {
    setSelectedMovieId("")
    setTheaterName("")
    setTheaterLocation("")
    setDate(undefined)
    setTicketCost("")
    setCurrency("INR")
    setHasScreenshot(false)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedMovieId && !initialData) {
      setError("Please select a movie")
      return
    }

    setLoading(true)

    try {
      const payload = {
        movieId: selectedMovieId || initialData?.movieId,
        theaterName: theaterName.trim() || undefined,
        theaterLocation: theaterLocation.trim() || undefined,
        timestamp: date ? date.toISOString() : undefined,
        ticketCost: ticketCost ? parseFloat(ticketCost) : 0,
        currency,
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

          <div className="space-y-2">
            <Label htmlFor="theater-name" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Theater Name <span className="text-xs text-muted-foreground">(Optional)</span>
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

          <div className="space-y-2 flex flex-col">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date of Watch <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
