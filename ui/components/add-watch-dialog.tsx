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
  const [theaterGmapsLink, setTheaterGmapsLink] = useState("")
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0])
  const [ticketCost, setTicketCost] = useState("")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [hasScreenshot, setHasScreenshot] = useState(false)
  const [ticketStubFile, setTicketStubFile] = useState<File | null>(null)

  const [movieSearch, setMovieSearch] = useState("")
  const [isMovieDropdownOpen, setIsMovieDropdownOpen] = useState(false)
  const [theaterSearch, setTheaterSearch] = useState("")
  const [isTheaterDropdownOpen, setIsTheaterDropdownOpen] = useState(false)
  const [cityFilter, setCityFilter] = useState("All")

  const uniqueCities = Array.from(new Set(theaters.map(t => t.location?.trim()).filter(Boolean))).sort()

  const filteredMovies = movies.filter(m => 
    (m.title || "").toLowerCase().includes(movieSearch.toLowerCase()) ||
    (m.year || "").toString().includes(movieSearch)
  )

  const filteredTheaters = theaters.filter(t => {
    const matchesCity = cityFilter === "All" || (t.location?.trim() === cityFilter)
    const matchesSearch = !theaterSearch || 
      (t.name || "").toLowerCase().includes(theaterSearch.toLowerCase()) ||
      (t.location || "").toLowerCase().includes(theaterSearch.toLowerCase())
    return matchesCity && matchesSearch
  })

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
      setTheaterGmapsLink(initialData.theaterGmapsLink || "")
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
      setTheaterGmapsLink(selected.gmapsLink || "")
    }
  }

  const resetForm = () => {
    setSelectedMovieId("")
    setSelectedTheaterId("")
    setTheaterName("")
    setTheaterLocation("")
    setTheaterGmapsLink("")
    setMovieSearch("")
    setTheaterSearch("")
    setIsMovieDropdownOpen(false)
    setIsTheaterDropdownOpen(false)
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
        theaterGmapsLink: theaterGmapsLink.trim() || undefined,
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

          {/* Movie Search & Select */}
          <div className="relative space-y-2">
            <Label htmlFor="movie-search">Movie</Label>
            {initialData ? (
              <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/50">
                {initialData.moviePosterUrl && <img src={initialData.moviePosterUrl} alt="Poster" className="h-10 w-auto rounded" />}
                <span className="font-medium">{initialData.movieTitle}</span>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Input
                    id="movie-search"
                    type="text"
                    placeholder={selectedMovieId ? (movies.find(m => m.id === selectedMovieId)?.title || "Selected movie") : "Type to search movie (title or year)..."}
                    value={movieSearch}
                    onChange={(e) => {
                      setMovieSearch(e.target.value)
                      setIsMovieDropdownOpen(true)
                    }}
                    onFocus={() => setIsMovieDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsMovieDropdownOpen(false), 200)}
                    className="pr-8"
                  />
                  {(selectedMovieId || movieSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMovieId("")
                        setMovieSearch("")
                        setIsMovieDropdownOpen(false)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {selectedMovieId && !isMovieDropdownOpen && (
                  <div className="mt-1.5 flex items-center gap-2 p-2 border rounded-md bg-primary/5 border-primary/20 text-sm">
                    <Film className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium truncate">{movies.find(m => m.id === selectedMovieId)?.title} ({movies.find(m => m.id === selectedMovieId)?.year})</span>
                  </div>
                )}
                {isMovieDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1 space-y-1">
                    {filteredMovies.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No movies found.</div>
                    ) : (
                      filteredMovies.map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => {
                            setSelectedMovieId(movie.id)
                            setMovieSearch("")
                            setIsMovieDropdownOpen(false)
                          }}
                          className={`flex items-center gap-2 px-2.5 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${selectedMovieId === movie.id ? "bg-accent font-medium" : ""}`}
                        >
                          {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt="" className="h-8 w-6 object-cover rounded shrink-0" />
                          ) : (
                            <div className="h-8 w-6 bg-muted rounded flex items-center justify-center shrink-0"><Film className="h-3 w-3 text-muted-foreground" /></div>
                          )}
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate">{movie.title}</span>
                            <span className="text-xs text-muted-foreground">{movie.year}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theater Search & City Filter */}
          <div className="relative space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="theater-search" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Theater
              </Label>
              {uniqueCities.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">City:</span>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value)
                      setIsTheaterDropdownOpen(true)
                    }}
                    className="h-7 text-xs rounded border bg-background px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="All">All Cities ({theaters.length})</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {theaters.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No theaters available. Ask your admin to add one.</p>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Input
                    id="theater-search"
                    type="text"
                    placeholder={selectedTheaterId ? (theaters.find(t => t.id === selectedTheaterId)?.name || "Selected theater") : "Type to search theater name or city..."}
                    value={theaterSearch}
                    onChange={(e) => {
                      setTheaterSearch(e.target.value)
                      setIsTheaterDropdownOpen(true)
                    }}
                    onFocus={() => setIsTheaterDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsTheaterDropdownOpen(false), 200)}
                    className="pr-8"
                  />
                  {(selectedTheaterId || theaterSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheaterId("")
                        setTheaterName("")
                        setTheaterLocation("")
                        setTheaterGmapsLink("")
                        setTheaterSearch("")
                        setIsTheaterDropdownOpen(false)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {selectedTheaterId && !isTheaterDropdownOpen && (
                  <div className="mt-1.5 flex items-center justify-between p-2 border rounded-md bg-primary/5 border-primary/20 text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium truncate">{theaterName} {theaterLocation ? `(${theaterLocation})` : ""}</span>
                    </div>
                  </div>
                )}
                {isTheaterDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1 space-y-1">
                    {filteredTheaters.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No theaters matched your search.</div>
                    ) : (
                      filteredTheaters.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            handleTheaterChange(t.id)
                            setTheaterSearch("")
                            setIsTheaterDropdownOpen(false)
                          }}
                          className={`flex items-center justify-between px-2.5 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${selectedTheaterId === t.id ? "bg-accent font-medium" : ""}`}
                        >
                          <span className="truncate">{t.name}</span>
                          {t.location && <span className="text-xs text-muted-foreground shrink-0 ml-2">{t.location}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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
