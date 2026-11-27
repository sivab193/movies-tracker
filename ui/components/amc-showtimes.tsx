"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, LocateFixed, MapPin, RefreshCw, Ticket } from "lucide-react"
import { addDays, format, formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ShowtimeCells,
  ShowtimesBrowser,
  applyShowtimeFilters,
  badges,
  languageLine,
  type ShowtimeFilters,
  type ShowtimesPlace,
} from "@/components/showtimes-browser"
import { useAuth } from "@/contexts/auth-context"
import { getAMCShowtimes, type AMCShowtimesResponse } from "@/services/amc-service"

const WEST_LAFAYETTE: ShowtimesPlace = { lat: 40.4259, lon: -86.9081, label: "West Lafayette, IN" }
const PLACE_STORAGE_KEY = "mv-showtimes-place"

export function AMCShowtimes({ movieId, compact = false }: { movieId?: string; compact?: boolean }) {
  const { user, loading: authLoading } = useAuth()
  const [coordinates, setCoordinates] = useState<ShowtimesPlace>(WEST_LAFAYETTE)
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [formatFilter, setFormatFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [movieFilter, setMovieFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [theatreQuery, setTheatreQuery] = useState("")
  const [pageFilters, setPageFilters] = useState<ShowtimeFilters>({
    format: "all",
    language: "all",
    time: "all",
    captions: false,
    audioDesc: false,
  })
  const [data, setData] = useState<AMCShowtimesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [locationMessage, setLocationMessage] = useState(`Showing distances from ${WEST_LAFAYETTE.label}`)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData(await getAMCShowtimes({ lat: coordinates.lat, lon: coordinates.lon, date, movieId }))
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : "AMC showtimes are unavailable")
    } finally {
      setLoading(false)
    }
  }, [coordinates.lat, coordinates.lon, date, movieId])

  useEffect(() => { if (user) void load() }, [load, user])

  // Restore the last place picked on the showtimes page, if any.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLACE_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<ShowtimesPlace>
      if (typeof parsed.lat === "number" && typeof parsed.lon === "number" && typeof parsed.label === "string" && parsed.label) {
        setCoordinates({ lat: parsed.lat, lon: parsed.lon, label: parsed.label })
        setLocationMessage(`Showing distances from ${parsed.label}`)
      }
    } catch {
      // A malformed stored place just falls back to the default.
    }
  }, [])

  function selectPlace(place: ShowtimesPlace) {
    setCoordinates(place)
    setLocationMessage(`Showing distances from ${place.label}`)
    try {
      window.localStorage.setItem(PLACE_STORAGE_KEY, JSON.stringify(place))
    } catch {
      // Persistence is a convenience; ignore storage failures.
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser")
      return
    }
    setLocationMessage("Finding your location…")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ lat: coords.latitude, lon: coords.longitude, label: "your current location" })
        setLocationMessage("Showing distances from your current location")
      },
      () => setLocationMessage(`Location permission was not granted. Using ${WEST_LAFAYETTE.label}.`),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  // Discovery options come from the theatres and showtimes actually
  // returned, so the filters never offer a city, state, or movie with
  // nothing playing.
  const movieOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const group of data?.groups || []) {
      for (const showtime of group.showtimes) {
        if (showtime.movieId != null && showtime.movieName && !byId.has(String(showtime.movieId))) {
          byId.set(String(showtime.movieId), showtime.movieName)
        }
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  const stateOptions = useMemo(() => [...new Set(
    (data?.groups || []).map((group) => group.theatre.location?.state).filter(Boolean) as string[],
  )].sort(), [data])

  const cityOptions = useMemo(() => [...new Set(
    (data?.groups || [])
      .filter((group) => stateFilter === "all" || group.theatre.location?.state === stateFilter)
      .map((group) => group.theatre.location?.city)
      .filter(Boolean) as string[],
  )].sort(), [data, stateFilter])

  // A selected city or movie can disappear when the underlying results
  // change (new date, new location, narrower state); fall back to "all"
  // instead of filtering everything out.
  const effectiveCityFilter = cityFilter !== "all" && cityOptions.includes(cityFilter) ? cityFilter : "all"
  const effectiveMovieFilter = movieFilter !== "all" && movieOptions.some((movie) => movie.id === movieFilter) ? movieFilter : "all"

  const groups = useMemo(() => (data?.groups || [])
    .filter((group) => (stateFilter === "all" || group.theatre.location?.state === stateFilter)
      && (effectiveCityFilter === "all" || group.theatre.location?.city === effectiveCityFilter)
      && (theatreQuery.trim() === "" || (group.theatre.name || "").toLowerCase().includes(theatreQuery.trim().toLowerCase())))
    .map((group) => ({
      ...group,
      showtimes: group.showtimes.filter((showtime) => {
        const showtimeBadges = badges(showtime).join(" ").toLowerCase()
        const showtimeLanguages = languageLine(showtime).toLowerCase()
        const hour = showtime.showDateTimeLocal ? new Date(showtime.showDateTimeLocal).getHours() : 0
        return (effectiveMovieFilter === "all" || String(showtime.movieId) === effectiveMovieFilter)
          && (formatFilter === "all" || showtimeBadges.includes(formatFilter))
          && (languageFilter === "all" || showtimeLanguages.includes(languageFilter))
          && (timeFilter === "all" || (timeFilter === "matinee" ? hour < 17 : hour >= 17))
      }),
    })).filter((group) => group.showtimes.length > 0),
  [data, effectiveMovieFilter, stateFilter, effectiveCityFilter, theatreQuery, formatFilter, languageFilter, timeFilter])

  const pageGroups = useMemo(
    () => applyShowtimeFilters(data?.groups || [], pageFilters),
    [data, pageFilters],
  )

  if (authLoading) {
    return (
      <section aria-labelledby={movieId ? "movie-showtimes-heading" : "showtimes-heading"}>
        <h2 id={movieId ? "movie-showtimes-heading" : "showtimes-heading"} className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>
          {movieId ? "Now showing" : "Showtimes near me"}
        </h2>
        <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading AMC showtimes…</div>
      </section>
    )
  }

  if (!user) {
    return (
      <section aria-labelledby={movieId ? "movie-showtimes-heading" : "showtimes-heading"}>
        <h2 id={movieId ? "movie-showtimes-heading" : "showtimes-heading"} className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>
          {movieId ? "Now showing" : "Showtimes near me"}
        </h2>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-start gap-3 py-5">
            <p className="flex items-center gap-2 font-medium"><Ticket className="h-5 w-5 text-muted-foreground" />Sign in to see AMC showtimes</p>
            <p className="text-sm text-muted-foreground">AMC showtimes are available to signed-in MediaVerse users.</p>
            <Button asChild size="sm"><Link href="/auth">Sign in</Link></Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!movieId && !compact) {
    return (
      <section aria-labelledby="showtimes-heading">
        <ShowtimesBrowser
          groups={pageGroups}
          loading={loading}
          error={error}
          hasData={data != null}
          place={coordinates}
          locationMessage={locationMessage}
          onSelectPlace={selectPlace}
          onUseMyLocation={useMyLocation}
          date={date}
          onDateChange={setDate}
          filters={pageFilters}
          onFiltersChange={setPageFilters}
          onRefresh={() => void load()}
          attribution={data?.attribution}
          fetchedAtUtc={data?.fetchedAtUtc}
          stale={data?.stale}
        />
      </section>
    )
  }

  return (
    <section aria-labelledby={movieId ? "movie-showtimes-heading" : "showtimes-heading"}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={movieId ? "movie-showtimes-heading" : "showtimes-heading"} className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>
            {movieId ? "Now showing" : "Showtimes near me"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{locationMessage}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`showtime-date-${movieId || "all"}`} className="text-xs">Date</Label>
            <Input
              id={`showtime-date-${movieId || "all"}`}
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
              onChange={(event) => setDate(event.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button variant="outline" size="sm" onClick={useMyLocation} className="gap-1.5"><LocateFixed className="h-4 w-4" />Use my location</Button>
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Refresh showtimes"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {!compact && !movieId && (
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Filter label="Movie" value={effectiveMovieFilter} onChange={setMovieFilter} options={[["all", "All movies"], ...movieOptions.map((movie) => [movie.id, movie.name])]} />
          <Filter label="State" value={stateFilter} onChange={setStateFilter} options={[["all", "All states"], ...stateOptions.map((state) => [state, state])]} />
          <Filter label="City" value={effectiveCityFilter} onChange={setCityFilter} options={[["all", "All cities"], ...cityOptions.map((city) => [city, city])]} />
          <div className="space-y-1">
            <Label htmlFor="showtime-theatre-search" className="text-xs">Theatre</Label>
            <Input
              id="showtime-theatre-search"
              type="search"
              value={theatreQuery}
              onChange={(event) => setTheatreQuery(event.target.value)}
              placeholder="Search theatres"
              className="h-9"
            />
          </div>
        </div>
      )}

      {!compact && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Filter label="Format" value={formatFilter} onChange={setFormatFilter} options={[["all", "All formats"], ["imax", "IMAX"], ["dolby", "Dolby Cinema"], ["3d", "3D"]]} />
          <Filter label="Language" value={languageFilter} onChange={setLanguageFilter} options={[["all", "All languages"], ["tamil", "Tamil"], ["telugu", "Telugu"], ["hindi", "Hindi"], ["malayalam", "Malayalam"]]} />
          <Filter label="Time" value={timeFilter} onChange={setTimeFilter} options={[["all", "Any time"], ["matinee", "Before 5 PM"], ["evening", "5 PM or later"]]} />
        </div>
      )}

      {loading && <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading AMC showtimes…</div>}
      {!loading && error && (
        <Card><CardContent className="flex items-start gap-3 py-5"><AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Showtimes are unavailable</p><p className="text-sm text-muted-foreground">{error}. The rest of MediaVerse is still available.</p></div></CardContent></Card>
      )}
      {!loading && !error && data && groups.length === 0 && (
        <Card><CardContent className="py-7 text-center"><Ticket className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="font-medium">No matching AMC showtimes</p><p className="mt-1 text-sm text-muted-foreground">Try another day or broaden the filters. AMC theatres may be a substantial drive from your location.</p></CardContent></Card>
      )}
      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={String(group.theatre.id)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-col justify-between gap-1 text-base sm:flex-row sm:items-center">
                <span>{group.theatre.name || `AMC Theatre ${group.theatre.id}`}</span>
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{group.distanceMiles == null ? "Distance unavailable" : `${group.distanceMiles.toFixed(1)} mi away`}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{[group.theatre.location?.address, group.theatre.location?.city, group.theatre.location?.state].filter(Boolean).join(", ")}</p>
            </CardHeader>
            <CardContent>
              <ShowtimeCells showtimes={group.showtimes} showMovieName={!movieId} />
            </CardContent>
          </Card>
        ))}
      </div>
      {data && !loading && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{data.attribution}. Prices and availability are confirmed on AMC at purchase.</span>
          {data.fetchedAtUtc && <span>{data.stale ? "Cached data · " : "Updated "}{formatDistanceToNow(new Date(data.fetchedAtUtc), { addSuffix: true })}</span>}
        </div>
      )}
      {!movieId && <p className="mt-3 text-xs text-muted-foreground">Looking for a title first? <Link href="/movies" className="underline underline-offset-4">Browse the MediaVerse catalog</Link>.</p>}
    </section>
  )
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([optionValue, text]) => <SelectItem key={optionValue} value={optionValue}>{text}</SelectItem>)}</SelectContent></Select></div>
}
