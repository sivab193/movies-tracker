"use client"

import React, { useState, useEffect } from "react"
import { Plus, Loader2, Film, MapPin, Ticket, Clock, UtensilsCrossed } from "lucide-react"
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
import { DatePicker } from "@/components/ui/date-picker"

interface AddWatchDialogProps {
  uid: string
  onWatchAdded: () => void
  /** Edit an existing log. The movie is fixed and the entry is updated in place. */
  initialData?: WatchHistoryEntry
  /** Log a *new* watch of a movie already in the history. Only the movie carries over. */
  rewatchData?: WatchHistoryEntry
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

// Movies are searched server-side, so the picker is never limited to a first page.
const MIN_SEARCH_CHARS = 2
const RECENT_MOVIE_COUNT = 8
const SEARCH_RESULT_COUNT = 20
const SEARCH_DEBOUNCE_MS = 300

export function AddWatchDialog({
  uid,
  onWatchAdded,
  initialData,
  rewatchData,
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

  // In edit and rewatch mode the movie is fixed, so the picker is not shown.
  const isEdit = !!initialData
  const lockedMovie = initialData || rewatchData

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [movies, setMovies] = useState<any[]>([])
  const [searchingMovies, setSearchingMovies] = useState(false)
  const [theaters, setTheaters] = useState<any[]>([])

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState<string>("")
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null)
  const [selectedTheaterId, setSelectedTheaterId] = useState<string>("")
  const [theaterName, setTheaterName] = useState("")
  const [theaterLocation, setTheaterLocation] = useState("")
  const [theaterGmapsLink, setTheaterGmapsLink] = useState("")
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0])
  const [showTime, setShowTime] = useState("")
  const [ticketCost, setTicketCost] = useState("")
  const [foodCost, setFoodCost] = useState("")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [hasScreenshot, setHasScreenshot] = useState(false)
  const [ticketStubFile, setTicketStubFile] = useState<File | null>(null)

  const [movieSearch, setMovieSearch] = useState("")
  const [isMovieDropdownOpen, setIsMovieDropdownOpen] = useState(false)
  const [theaterSearch, setTheaterSearch] = useState("")
  const [isTheaterDropdownOpen, setIsTheaterDropdownOpen] = useState(false)
  const [cityFilter, setCityFilter] = useState("All")

  const uniqueCities = Array.from(new Set(
    theaters.map(t => {
      const loc = t.location?.trim() || ""
      return loc.split(",")[0].replace(/\s+(Indiana|Illinois|IN|IL)$/i, "").trim()
    }).filter(Boolean)
  )).sort()

  const filteredTheaters = theaters.filter(t => {
    const locCity = (t.location?.trim() || "").split(",")[0].replace(/\s+(Indiana|Illinois|IN|IL)$/i, "").trim()
    const matchesCity = cityFilter === "All" || (locCity === cityFilter)
    const matchesSearch = !theaterSearch || 
      (t.name || "").toLowerCase().includes(theaterSearch.toLowerCase()) ||
      (t.location || "").toLowerCase().includes(theaterSearch.toLowerCase())
    return matchesCity && matchesSearch
  })

  useEffect(() => {
    if (open) {
      getTheaters().then(setTheaters).catch(() => setTheaters([]))
    }
  }, [open])

  // Movie options come from the server: the newest few by default, and a global
  // title search once enough characters are typed.
  useEffect(() => {
    if (!open || lockedMovie) return

    const query = movieSearch.trim()
    const isSearch = query.length >= MIN_SEARCH_CHARS

    // A single character matches nearly everything, so wait for more.
    if (query.length > 0 && !isSearch) {
      // Clears the spinner if a longer query was cancelled on its way down to 1 char.
      setSearchingMovies(false)
      return
    }

    let cancelled = false
    setSearchingMovies(true)

    const timer = setTimeout(async () => {
      try {
        const res = await getMovies(
          0,
          isSearch ? SEARCH_RESULT_COUNT : RECENT_MOVIE_COUNT,
          "",
          isSearch ? query : "",
          "",
          false,
          "",
          // Default list shows recently released titles first (and undated ones
          // after); a title search stays unrestricted so any movie is findable.
          isSearch ? "" : "latest"
        )
        if (!cancelled) setMovies(res?.movies || [])
      } catch {
        if (!cancelled) setMovies([])
      } finally {
        if (!cancelled) setSearchingMovies(false)
      }
    }, isSearch ? SEARCH_DEBOUNCE_MS : 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, movieSearch, lockedMovie])

  // Initialize form if editing or rewatching
  useEffect(() => {
    if (open && initialData) {
      setSelectedMovieId(initialData.movieId)
      setSelectedTheaterId(initialData.theaterId || "")
      setTheaterName(initialData.theaterName || "")
      setTheaterLocation(initialData.theaterLocation || "")
      setTheaterGmapsLink(initialData.theaterGmapsLink || "")
      setTicketCost(initialData.ticketCost?.toString() || "")
      setFoodCost(initialData.foodCost?.toString() || "")
      setShowTime(initialData.showTime || "")
      setCurrency(initialData.currency || "INR")
      if (initialData.timestamp) {
        try {
          setWatchDate(new Date(initialData.timestamp).toISOString().split('T')[0])
        } catch (e) {
          setWatchDate(new Date().toISOString().split('T')[0])
        }
      }
    } else if (open && rewatchData) {
      // Only the movie carries over; everything else is a fresh visit.
      setSelectedMovieId(rewatchData.movieId)
    } else if (!open) {
      resetForm()
    }
  }, [initialData, rewatchData, open])

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
    setSelectedMovie(null)
    setSelectedTheaterId("")
    setTheaterName("")
    setTheaterLocation("")
    setTheaterGmapsLink("")
    setMovieSearch("")
    setTheaterSearch("")
    setIsMovieDropdownOpen(false)
    setIsTheaterDropdownOpen(false)
    setSearchingMovies(false)
    setWatchDate(new Date().toISOString().split('T')[0])
    setShowTime("")
    setTicketCost("")
    setFoodCost("")
    setCurrency("INR")
    setHasScreenshot(false)
    setTicketStubFile(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const movieId = selectedMovieId || lockedMovie?.movieId
    if (!movieId) {
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
        movieId,
        theaterId: selectedTheaterId || initialData?.theaterId,
        theaterName: theaterName.trim() || undefined,
        theaterLocation: theaterLocation.trim() || undefined,
        theaterGmapsLink: theaterGmapsLink.trim() || undefined,
        timestamp: new Date(watchDate).toISOString(),
        showTime: showTime.trim() || null,
        ticketCost: ticketCost ? parseFloat(ticketCost) : 0,
        foodCost: foodCost ? parseFloat(foodCost) : 0,
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

      if (isEdit && initialData?._id) {
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
            {isEdit ? "Edit Watch Log" : rewatchData ? "Log Rewatch" : "Log Movie Watch"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details for this movie."
              : rewatchData
              ? "Log another visit for this movie. Enter the new theater, date and costs."
              : "Record a movie you watched in theaters."}
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
            {lockedMovie ? (
              <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/50">
                {lockedMovie.moviePosterUrl && <img src={lockedMovie.moviePosterUrl} alt="Poster" className="h-10 w-auto rounded" />}
                <span className="font-medium">{lockedMovie.movieTitle}</span>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Input
                    id="movie-search"
                    type="text"
                    placeholder={selectedMovie?.title || "Type to search movie (title or IMDb ID)..."}
                    value={movieSearch}
                    onChange={(e) => {
                      setMovieSearch(e.target.value)
                      setIsMovieDropdownOpen(true)
                    }}
                    onFocus={() => setIsMovieDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsMovieDropdownOpen(false), 200)}
                    className="pr-8"
                  />
                  {searchingMovies ? (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (selectedMovieId || movieSearch) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMovieId("")
                        setSelectedMovie(null)
                        setMovieSearch("")
                        setIsMovieDropdownOpen(false)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                {selectedMovie && !isMovieDropdownOpen && (
                  <div className="mt-1.5 flex items-center gap-2 p-2 border rounded-md bg-primary/5 border-primary/20 text-sm">
                    <Film className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium truncate">{selectedMovie.title} ({selectedMovie.year})</span>
                  </div>
                )}
                {isMovieDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1 space-y-1">
                    {movieSearch.trim() && movieSearch.trim().length < MIN_SEARCH_CHARS ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Keep typing to search all movies...
                      </div>
                    ) : movies.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {searchingMovies ? "Searching..." : "No movies found."}
                      </div>
                    ) : (
                      <>
                        {!movieSearch.trim() && (
                          <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Recently added
                          </div>
                        )}
                        {movies.map((movie) => (
                          <div
                            key={movie.id}
                            onClick={() => {
                              setSelectedMovieId(movie.id)
                              setSelectedMovie(movie)
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
                        ))}
                      </>
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
            <DatePicker
              value={watchDate}
              onChange={setWatchDate}
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
              placeholder="Select date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="show-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Show Time <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="show-time"
              type="time"
              value={showTime}
              onChange={(e) => setShowTime(e.target.value)}
              disabled={loading}
              className="[color-scheme:dark] dark:[color-scheme:dark] [color-scheme:light]"
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
              <Label htmlFor="food-cost" className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Food Cost <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="food-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={foodCost}
                onChange={(e) => setFoodCost(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
