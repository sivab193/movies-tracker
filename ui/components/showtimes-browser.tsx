"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  Clapperboard,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react"
import { addDays, format, formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  getAMCTheatres,
  type AMCShowtime,
  type AMCShowtimeGroup,
  type AMCTheatre,
} from "@/services/amc-service"

export type ShowtimesPlace = { lat: number; lon: number; label: string }

export type ShowtimeFilters = {
  format: string
  language: string
  time: string
  captions: boolean
  audioDesc: boolean
}

export function languageLine(showtime: AMCShowtime) {
  const values = []
  if (showtime.languages.spoken) values.push(`${showtime.languages.spoken} audio`)
  if (showtime.languages.dubbedOver) values.push(`dubbed in ${showtime.languages.dubbedOver}`)
  if (showtime.languages.subtitle) values.push(`${showtime.languages.subtitle} subtitles`)
  return values.join(" · ")
}

export function priceLine(showtime: AMCShowtime) {
  const adult = showtime.ticketPrices.find((price) => price.type?.toUpperCase() === "ADULT") || showtime.ticketPrices[0]
  if (!adult) return null
  const fees = showtime.estimatedFees.reduce((sum, fee) => sum + fee.priceCents, 0)
  return `from $${((adult.priceCents + fees) / 100).toFixed(2)}`
}

export function badges(showtime: AMCShowtime) {
  const values = [showtime.premiumFormat, ...showtime.attributes.map((attribute) => attribute.name || attribute.code)]
  return [...new Set(values.filter(Boolean))] as string[]
}

function hasAttribute(showtime: AMCShowtime, code: string) {
  return showtime.attributes.some((attribute) => (attribute.code || "").toUpperCase() === code)
}

export function matchesShowtimeFilters(showtime: AMCShowtime, filters: ShowtimeFilters) {
  const badgeText = badges(showtime).join(" ").toLowerCase()
  if (filters.format === "imax" && !badgeText.includes("imax")) return false
  if (filters.format === "dolby" && !badgeText.includes("dolby")) return false
  if (filters.format === "prime" && !badgeText.includes("prime")) return false
  if (filters.format === "3d" && !badgeText.includes("3d")) return false
  if (filters.format === "standard") {
    if (showtime.premiumFormat) return false
    if (["imax", "dolby", "prime", "3d"].some((key) => badgeText.includes(key))) return false
  }
  if (filters.language !== "all" && !languageLine(showtime).toLowerCase().includes(filters.language)) return false
  if (filters.time !== "all") {
    const hour = showtime.showDateTimeLocal ? new Date(showtime.showDateTimeLocal).getHours() : 0
    if (filters.time === "matinee" && hour >= 17) return false
    if (filters.time === "evening" && hour < 17) return false
  }
  if (filters.captions && !hasAttribute(showtime, "CLOSEDCAPTION")) return false
  if (filters.audioDesc && !hasAttribute(showtime, "DESCRIPTIVEVIDEO")) return false
  return true
}

export function applyShowtimeFilters(groups: AMCShowtimeGroup[], filters: ShowtimeFilters): AMCShowtimeGroup[] {
  return groups
    .map((group) => ({ ...group, showtimes: group.showtimes.filter((showtime) => matchesShowtimeFilters(showtime, filters)) }))
    .filter((group) => group.showtimes.length > 0)
}

const FORMAT_COLORS: Array<[string, string]> = [
  ["imax", "#0072CE"],
  ["dolby", "#E5A00D"],
  ["prime", "#A855F7"],
  ["3d", "#22D3EE"],
]

function formatColor(label: string): string | undefined {
  const text = label.toLowerCase()
  return FORMAT_COLORS.find(([key]) => text.includes(key))?.[1]
}

function formatLabel(showtime: AMCShowtime) {
  if (showtime.premiumFormat) return showtime.premiumFormat
  const formatBadge = badges(showtime).find((badge) => /imax|dolby|prime|3d|laser/i.test(badge))
  return formatBadge || "Standard"
}

function runtimeLabel(minutes?: number | null) {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

function statusOf(showtime: AMCShowtime) {
  if (showtime.isCanceled) return { label: "Canceled", dot: "bg-red-500" }
  if (showtime.isSoldOut) return { label: "Sold out", dot: "bg-red-500" }
  if (showtime.isAlmostSoldOut) return { label: "Filling fast", dot: "bg-amber-500" }
  return { label: "Available", dot: "bg-emerald-500" }
}

export function ShowtimeCell({ showtime, movieName }: { showtime: AMCShowtime; movieName?: string }) {
  const disabled = showtime.isSoldOut || showtime.isCanceled || !showtime.purchaseUrl
  const status = statusOf(showtime)
  const label = formatLabel(showtime)
  const color = formatColor(label)
  const amenities = showtime.attributes
    .map((attribute) => attribute.name || attribute.code)
    .filter((name): name is string => Boolean(name) && name !== label)
    .slice(0, 2)
  const price = priceLine(showtime)
  const title = [languageLine(showtime), price].filter(Boolean).join(" · ")

  return (
    <div
      title={title || undefined}
      className="flex min-w-[9.5rem] shrink-0 snap-start flex-col gap-1 rounded-lg border bg-muted/20 p-2.5 sm:shrink"
    >
      {movieName && <p className="truncate text-xs font-semibold">{movieName}</p>}
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", status.dot)} aria-hidden="true" />
        <span className="text-lg font-bold leading-none">
          {showtime.showDateTimeLocal ? format(new Date(showtime.showDateTimeLocal), "h:mm a") : "Time unavailable"}
        </span>
      </div>
      <span
        className={cn("text-[10px] font-semibold uppercase tracking-wide", !color && "text-muted-foreground")}
        style={color ? { color } : undefined}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[11px] text-muted-foreground">{status.label}</span>
        {showtime.isDiscountMatineePriced && (
          <Badge className="text-[10px]">{showtime.discountMatineeMessage || "Matinee"}</Badge>
        )}
      </div>
      {amenities.length > 0 && (
        <span className="truncate text-[10px] text-muted-foreground">{amenities.join(" · ")}</span>
      )}
      {price && <span className="text-xs text-muted-foreground">{price}</span>}
      <Button asChild={!disabled} disabled={disabled} size="sm" className="mt-auto h-7 gap-1 text-xs">
        {disabled ? (
          <span>{showtime.isSoldOut ? "Sold out" : showtime.isCanceled ? "Canceled" : "Unavailable"}</span>
        ) : (
          <a href={showtime.purchaseUrl} target="_blank" rel="noreferrer">
            Book<ExternalLink className="h-3 w-3" />
          </a>
        )}
      </Button>
    </div>
  )
}

export function ShowtimeCells({ showtimes, showMovieName = false }: { showtimes: AMCShowtime[]; showMovieName?: boolean }) {
  return (
    <div className="flex snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      {showtimes.map((showtime) => (
        <ShowtimeCell
          key={showtime.id}
          showtime={showtime}
          movieName={showMovieName ? showtime.movieName : undefined}
        />
      ))}
    </div>
  )
}

type ShowtimesMovie = {
  key: string
  name: string
  posterUrl: string | null
  mpaaRating?: string | null
  runTime?: number | null
  genre?: string | null
  formats: string[]
  languageNote: string | null
  fillingFast: boolean
  theatres: AMCShowtimeGroup[]
  nearestDistance: number | null
  earliest: string | null
}

function movieKey(showtime: AMCShowtime) {
  return showtime.movieId != null ? String(showtime.movieId) : showtime.movieName || "unknown"
}

export function deriveMovies(groups: AMCShowtimeGroup[]): ShowtimesMovie[] {
  const byKey = new Map<string, ShowtimesMovie>()
  for (const group of groups) {
    const byMovie = new Map<string, AMCShowtime[]>()
    for (const showtime of group.showtimes) {
      const key = movieKey(showtime)
      byMovie.set(key, [...(byMovie.get(key) || []), showtime])
    }
    for (const [key, showtimes] of byMovie) {
      let movie = byKey.get(key)
      if (!movie) {
        movie = {
          key,
          name: showtimes[0].movieName || "Untitled",
          posterUrl: null,
          formats: [],
          languageNote: null,
          fillingFast: false,
          theatres: [],
          nearestDistance: null,
          earliest: null,
        }
        byKey.set(key, movie)
      }
      movie.theatres.push({ ...group, showtimes })
      if (movie.nearestDistance == null || (group.distanceMiles != null && group.distanceMiles < movie.nearestDistance)) {
        movie.nearestDistance = group.distanceMiles
      }
      for (const showtime of showtimes) {
        if (!movie.posterUrl && showtime.moviePosterUrl) movie.posterUrl = showtime.moviePosterUrl
        if (movie.mpaaRating == null && showtime.mpaaRating) movie.mpaaRating = showtime.mpaaRating
        if (movie.runTime == null && showtime.runTime) movie.runTime = showtime.runTime
        if (movie.genre == null && showtime.genre) movie.genre = showtime.genre
        const label = formatLabel(showtime)
        if (!movie.formats.includes(label)) movie.formats.push(label)
        if (!movie.languageNote) {
          const spoken = showtime.languages.spoken
          if (spoken && spoken.toLowerCase() !== "english") movie.languageNote = languageLine(showtime)
        }
        if (showtime.isAlmostSoldOut && !showtime.isSoldOut) movie.fillingFast = true
        if (showtime.showDateTimeLocal && (movie.earliest == null || showtime.showDateTimeLocal < movie.earliest)) {
          movie.earliest = showtime.showDateTimeLocal
        }
      }
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const distanceA = a.nearestDistance ?? Number.POSITIVE_INFINITY
    const distanceB = b.nearestDistance ?? Number.POSITIVE_INFINITY
    if (distanceA !== distanceB) return distanceA - distanceB
    return (a.earliest || "9999").localeCompare(b.earliest || "9999")
  })
}

const POPULAR_PLACES: ShowtimesPlace[] = [
  { label: "New York, NY", lat: 40.7128, lon: -74.006 },
  { label: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
  { label: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
  { label: "Dallas, TX", lat: 32.7767, lon: -96.797 },
  { label: "Atlanta, GA", lat: 33.749, lon: -84.388 },
  { label: "Indianapolis, IN", lat: 39.7684, lon: -86.1581 },
]

type PlaceOption = ShowtimesPlace & { theatreCount: number }

function groupPlaces(theatres: AMCTheatre[]): PlaceOption[] {
  const byPlace = new Map<string, AMCTheatre[]>()
  for (const theatre of theatres) {
    const city = theatre.location?.city
    const state = theatre.location?.state
    if (!city || !state) continue
    const key = `${city}, ${state}`
    byPlace.set(key, [...(byPlace.get(key) || []), theatre])
  }
  const options: PlaceOption[] = []
  for (const [label, group] of byPlace) {
    const withCoords = group.filter(
      (theatre) => typeof theatre.location?.lat === "number" && typeof theatre.location?.lon === "number",
    )
    if (withCoords.length === 0) continue
    const lat = withCoords.reduce((sum, theatre) => sum + (theatre.location?.lat || 0), 0) / withCoords.length
    const lon = withCoords.reduce((sum, theatre) => sum + (theatre.location?.lon || 0), 0) / withCoords.length
    options.push({ label, lat, lon, theatreCount: group.length })
  }
  return options.sort((a, b) => b.theatreCount - a.theatreCount || a.label.localeCompare(b.label))
}

function PlacePicker({
  place,
  onSelectPlace,
  onUseMyLocation,
}: {
  place: ShowtimesPlace
  onSelectPlace: (place: ShowtimesPlace) => void
  onUseMyLocation: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState<{ forQuery: string; results: PlaceOption[] } | null>(null)
  const [searchingFor, setSearchingFor] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocumentClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocumentClick)
    return () => document.removeEventListener("mousedown", onDocumentClick)
  }, [open ])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    const timer = setTimeout(() => {
      setSearchingFor(trimmed)
      Promise.all([
        getAMCTheatres({ city: trimmed }).catch(() => [] as AMCTheatre[]),
        getAMCTheatres({ state: trimmed }).catch(() => [] as AMCTheatre[]),
      ]).then(([byCity, byState]) => {
        const unique = new Map<string, AMCTheatre>()
        for (const theatre of [...byCity, ...byState]) unique.set(String(theatre.id), theatre)
        setSearch({ forQuery: trimmed, results: groupPlaces([...unique.values()]) })
        setSearchingFor((current) => (current === trimmed ? null : current))
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const trimmedQuery = query.trim()
  const results = search && search.forQuery === trimmedQuery ? search.results : null
  const searching = searchingFor === trimmedQuery && trimmedQuery.length >= 2

  function choose(next: ShowtimesPlace) {
    onSelectPlace(next)
    setOpen(false)
    setQuery("")
    setSearch(null)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)} className="gap-1.5" aria-expanded={open}>
        <MapPin className="h-4 w-4" />
        <span className="font-medium">{place.label}</span>
        <span className="hidden text-muted-foreground underline underline-offset-4 sm:inline">Change location</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border bg-card p-2 shadow-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a city or state"
              className="h-9 pl-8"
              aria-label="Search a city or state"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start gap-2"
            onClick={() => {
              onUseMyLocation()
              setOpen(false)
            }}
          >
            <LocateFixed className="h-4 w-4" />Use my location
          </Button>
          {query.trim().length < 2 && (
            <div className="mt-1">
              <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Popular</p>
              {POPULAR_PLACES.map((popular) => (
                <Button
                  key={popular.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => choose(popular)}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />{popular.label}
                </Button>
              ))}
            </div>
          )}
          {query.trim().length >= 2 && searching && (
            <p className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Searching theatres…
            </p>
          )}
          {query.trim().length >= 2 && !searching && results && results.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No AMC theatres found for &ldquo;{query.trim()}&rdquo;</p>
          )}
          {query.trim().length >= 2 && !searching && results && results.length > 0 && (
            <div className="mt-1 max-h-64 overflow-y-auto">
              {results.map((option) => (
                <Button
                  key={option.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between gap-2"
                  onClick={() => choose(option)}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />{option.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.theatreCount} {option.theatreCount === 1 ? "theatre" : "theatres"}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DateStrip({ date, onDateChange }: { date: string; onDateChange: (date: string) => void }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(new Date(), index)), [])
  const inputRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-stretch gap-1.5 overflow-x-auto pb-1">
      {days.map((day, index) => {
        const value = format(day, "yyyy-MM-dd")
        const selected = value === date
        return (
          <button
            key={value}
            onClick={() => onDateChange(value)}
            aria-pressed={selected}
            className={cn(
              "flex shrink-0 flex-col items-center rounded-lg border px-3 py-1.5 leading-tight transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {index === 0 ? "Today" : index === 1 ? "Tomorrow" : format(day, "EEE")}
            </span>
            <span className="text-xs font-medium uppercase">{format(day, "MMM d")}</span>
          </button>
        )
      })}
      <div className="relative shrink-0">
        <Button variant="outline" size="icon" className="h-full w-9" onClick={openPicker} aria-label="Pick another date">
          <Calendar className="h-4 w-4" />
        </Button>
        <input
          ref={inputRef}
          type="date"
          value={date}
          min={format(new Date(), "yyyy-MM-dd")}
          max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
          onChange={(event) => {
            if (event.target.value) onDateChange(event.target.value)
          }}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

function Pill({
  selected,
  onClick,
  dot,
  children,
  pressed,
}: {
  selected: boolean
  onClick: () => void
  dot?: string
  children: React.ReactNode
  pressed?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed ?? selected}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} aria-hidden="true" />}
      {children}
    </button>
  )
}

const FORMAT_PILLS: Array<{ value: string; label: string; dot?: string }> = [
  { value: "all", label: "All Formats" },
  { value: "imax", label: "IMAX Laser", dot: "#0072CE" },
  { value: "dolby", label: "Dolby Cinema", dot: "#E5A00D" },
  { value: "prime", label: "PRIME", dot: "#A855F7" },
  { value: "3d", label: "RealD 3D", dot: "#22D3EE" },
]

const LANGUAGE_PILLS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All languages" },
  { value: "english", label: "English" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "hindi", label: "Hindi" },
  { value: "malayalam", label: "Malayalam" },
]

const TIME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Any time" },
  { value: "matinee", label: "Matinee" },
  { value: "evening", label: "Evening" },
]

function TheatreHeader({ group }: { group: AMCShowtimeGroup }) {
  const location = [group.theatre.location?.city, group.theatre.location?.state].filter(Boolean).join(", ")
  return (
    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{group.theatre.name || `AMC Theatre ${group.theatre.id}`}</p>
        <p className="text-xs text-muted-foreground">
          {[group.theatre.location?.address, location].filter(Boolean).join(" · ")}
        </p>
      </div>
      {group.distanceMiles != null ? (
        <Badge variant="outline" className="gap-1 text-xs">
          <MapPin className="h-3 w-3" />
          {group.distanceMiles.toFixed(1)} mi
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Distance unavailable</span>
      )}
    </div>
  )
}

function MovieCard({ movie }: { movie: ShowtimesMovie }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [nearest, ...others] = movie.theatres
  const meta = [movie.mpaaRating, runtimeLabel(movie.runTime), movie.genre].filter(Boolean).join(" · ")

  function toggle(key: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:h-36 sm:w-24">
            {movie.posterUrl ? (
              <Image src={movie.posterUrl} alt={`${movie.name} poster`} fill sizes="96px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center text-muted-foreground">
                <Clapperboard className="h-5 w-5" />
                <span className="line-clamp-3 text-[10px] font-medium leading-tight">{movie.name}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {meta && (
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{meta}</p>
            )}
            <h3 className="mt-0.5 text-xl font-bold leading-tight sm:text-2xl">{movie.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {movie.formats.map((label) => {
                const color = formatColor(label)
                return (
                  <Badge key={label} variant="secondary" className="gap-1.5 text-[10px]">
                    {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
                    {label}
                  </Badge>
                )
              })}
              {movie.fillingFast && (
                <Badge className="border-amber-500/40 bg-amber-500/15 text-[10px] text-amber-600 hover:bg-amber-500/15 dark:text-amber-400">
                  Filling fast
                </Badge>
              )}
            </div>
            {movie.languageNote && <p className="mt-1.5 text-xs text-muted-foreground">{movie.languageNote}</p>}
          </div>
        </div>

        {nearest && (
          <div className="mt-4 border-t pt-3">
            <TheatreHeader group={nearest} />
            <ShowtimeCells showtimes={nearest.showtimes} />
          </div>
        )}

        {others.map((group) => {
          const key = `${movie.key}:${String(group.theatre.id)}`
          const isOpen = expanded.has(key)
          const location = [group.theatre.location?.city, group.theatre.location?.state].filter(Boolean).join(", ")
          return (
            <div key={key} className="border-t">
              <button
                onClick={() => toggle(key)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
              >
                <span className="min-w-0 text-sm">
                  <span className="font-medium">{group.theatre.name || `AMC Theatre ${group.theatre.id}`}</span>
                  <span className="text-muted-foreground">
                    {location ? ` · ${location}` : ""} · {group.showtimes.length}{" "}
                    {group.showtimes.length === 1 ? "showtime" : "showtimes"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {group.distanceMiles != null && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {group.distanceMiles.toFixed(1)} mi
                    </Badge>
                  )}
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </span>
              </button>
              {isOpen && (
                <div className="pb-3">
                  <ShowtimeCells showtimes={group.showtimes} />
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

const FORMAT_SPECS: Array<{ label: string; dot: string; text: string }> = [
  {
    label: "IMAX with Laser",
    dot: "#0072CE",
    text: "Expanded aspect ratio up to 1.43:1, dual laser projection, 12-channel sound.",
  },
  {
    label: "Dolby Cinema",
    dot: "#E5A00D",
    text: "Dolby Vision HDR with high contrast, Dolby Atmos spatial sound.",
  },
  {
    label: "PRIME at AMC",
    dot: "#A855F7",
    text: "Premium screen with immersive sound and recliner seating.",
  },
  { label: "RealD 3D", dot: "#22D3EE", text: "Circular-polarized 3D." },
]

function SpecsLegend() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6 rounded-xl border">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
      >
        Specs &amp; legend
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t px-4 py-3">
          <ul className="space-y-2">
            {FORMAT_SPECS.map((spec) => (
              <li key={spec.label} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: spec.dot }} aria-hidden="true" />
                <span>
                  <span className="font-medium">{spec.label}:</span>{" "}
                  <span className="text-muted-foreground">{spec.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />Available
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />Filling fast (almost sold out)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />Sold out
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export type ShowtimesBrowserProps = {
  groups: AMCShowtimeGroup[]
  loading: boolean
  error: string
  hasData: boolean
  place: ShowtimesPlace
  locationMessage: string
  onSelectPlace: (place: ShowtimesPlace) => void
  onUseMyLocation: () => void
  date: string
  onDateChange: (date: string) => void
  filters: ShowtimeFilters
  onFiltersChange: (filters: ShowtimeFilters) => void
  onRefresh: () => void
  attribution?: string
  fetchedAtUtc?: string
  stale?: boolean
}

export function ShowtimesBrowser({
  groups,
  loading,
  error,
  hasData,
  place,
  locationMessage,
  onSelectPlace,
  onUseMyLocation,
  date,
  onDateChange,
  filters,
  onFiltersChange,
  onRefresh,
  attribution,
  fetchedAtUtc,
  stale,
}: ShowtimesBrowserProps) {
  const movies = useMemo(() => deriveMovies(groups), [groups])

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 space-y-2.5 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-start gap-2">
          <PlacePicker place={place} onSelectPlace={onSelectPlace} onUseMyLocation={onUseMyLocation} />
          <DateStrip date={date} onDateChange={onDateChange} />
          <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Refresh showtimes" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Format filters">
          {FORMAT_PILLS.map((pill) => (
            <Pill
              key={pill.value}
              dot={pill.dot}
              selected={filters.format === pill.value}
              onClick={() => onFiltersChange({ ...filters, format: pill.value })}
            >
              {pill.label}
            </Pill>
          ))}
          <Pill
            selected={filters.captions}
            pressed={filters.captions}
            onClick={() => onFiltersChange({ ...filters, captions: !filters.captions })}
          >
            {filters.captions && <Check className="h-3 w-3" />}Captions
          </Pill>
          <Pill
            selected={filters.audioDesc}
            pressed={filters.audioDesc}
            onClick={() => onFiltersChange({ ...filters, audioDesc: !filters.audioDesc })}
          >
            {filters.audioDesc && <Check className="h-3 w-3" />}Audio Desc.
          </Pill>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Language filters">
            {LANGUAGE_PILLS.map((pill) => (
              <Pill
                key={pill.value}
                selected={filters.language === pill.value}
                onClick={() => onFiltersChange({ ...filters, language: pill.value })}
              >
                {pill.label}
              </Pill>
            ))}
          </div>
          <div className="inline-flex rounded-full border bg-muted/40 p-0.5" role="group" aria-label="Time filters">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, time: option.value })}
                aria-pressed={filters.time === option.value}
                title={option.value === "matinee" ? "Before 5 PM" : option.value === "evening" ? "5 PM or later" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors",
                  filters.time === option.value ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{locationMessage}</p>
      </div>

      <div className="mb-1 mt-5 flex items-center justify-between gap-2">
        <h2 id="showtimes-heading" className="flex flex-wrap items-center gap-2 text-2xl font-bold">
          Showtimes near me
          {!loading && !error && (
            <Badge variant="secondary">
              {movies.length} {movies.length === 1 ? "movie" : "movies"}
            </Badge>
          )}
        </h2>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpDown className="h-3.5 w-3.5" />By distance
        </span>
      </div>
      {!loading && !error && hasData && (
        <p className="mb-4 text-xs text-muted-foreground">
          {groups.length} AMC {groups.length === 1 ? "theatre" : "theatres"} near {place.label} · Sorted by distance
        </p>
      )}

      {loading && (
        <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading AMC showtimes…
        </div>
      )}
      {!loading && error && (
        <Card>
          <CardContent className="flex items-start gap-3 py-5">
            <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Showtimes are unavailable</p>
              <p className="text-sm text-muted-foreground">{error}. The rest of MediaVerse is still available.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {!loading && !error && hasData && groups.length === 0 && (
        <Card>
          <CardContent className="py-7 text-center">
            <Ticket className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="font-medium">No matching AMC showtimes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another day, broaden the filters, or change location. AMC theatres may be a substantial drive from your location.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && movies.length > 0 && (
        <div className="space-y-4">
          {movies.map((movie) => (
            <MovieCard key={movie.key} movie={movie} />
          ))}
        </div>
      )}

      {!loading && !error && hasData && <SpecsLegend />}

      {hasData && !loading && attribution && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{attribution}. Prices and availability are confirmed on AMC at purchase.</span>
          {fetchedAtUtc && (
            <span>
              {stale ? "Cached data · " : "Updated "}
              {formatDistanceToNow(new Date(fetchedAtUtc), { addSuffix: true })}
            </span>
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Looking for a title first?{" "}
        <Link href="/movies" className="underline underline-offset-4">
          Browse the MediaVerse catalog
        </Link>
        .
      </p>
    </div>
  )
}
